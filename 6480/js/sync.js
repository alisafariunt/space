// Cloud Sync Manager
(function () {
    const API_URL = '/api/sync';
    const SYNC_QUEUE_KEY = 'studyGuide_syncQueue';
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const DEBOUNCE_DELAY = 2000; // 2 seconds
    const LAST_SYNC_KEY = 'studyGuide_lastSync';

    let userId = null; // Will be set after login
    let syncQueue = {
        highlights: { upsert: [], deleted: [] },
        bookmarks: { upsert: [], deleted: [] },
        notes: { upsert: [], deleted: [] },
        preferences: null
    };
    let syncStatus = 'idle'; // 'idle', 'syncing', 'synced', 'error', 'offline'
    let syncTimeout = null;

    // Get last sync time
    function getLastSync() {
        return localStorage.getItem(LAST_SYNC_KEY);
    }

    // Set last sync time
    function setLastSync(time) {
        localStorage.setItem(LAST_SYNC_KEY, time);
    }

    // Get User ID (Username)
    function getUserId() {
        return localStorage.getItem('studyGuide_username');
    }

    // Initialize Sync
    function init() {
        // Load sync queue
        const savedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
        if (savedQueue) {
            try {
                const parsedQueue = JSON.parse(savedQueue);
                // Ensure all expected keys exist in the loaded queue
                syncQueue = {
                    highlights: parsedQueue.highlights || { upsert: [], deleted: [] },
                    bookmarks: parsedQueue.bookmarks || { upsert: [], deleted: [] },
                    notes: parsedQueue.notes || { upsert: [], deleted: [] },
                    preferences: parsedQueue.preferences || null
                };
            } catch (e) {
                console.error("Error parsing sync queue from localStorage, resetting.", e);
                clearSyncQueue(); // Reset if parsing fails
            }
        }

        // Check for login
        const username = getUserId();
        if (username) {
            userId = username;
            setupSync();
            createUserInfo();
        } else {
            showLoginModal();
        }
    }

    // Show Login Modal
    function showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'login-modal-overlay';
        modal.innerHTML = `
            <div class="login-modal">
                <h2>👋 Welcome!</h2>
                <p>Enter your name to sync your progress across devices.</p>
                <input type="text" id="login-name" placeholder="Your Name (e.g. Ali)" autofocus>
                <button id="login-btn">Start Studying 🚀</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .login-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 10000;
                display: flex; justify-content: center; align-items: center;
                backdrop-filter: blur(5px);
            }
            .login-modal {
                background: white; padding: 2rem; border-radius: 12px;
                text-align: center; max-width: 400px; width: 90%;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            .login-modal h2 { margin-top: 0; color: #333; }
            .login-modal p { color: #666; margin-bottom: 1.5rem; }
            .login-modal input {
                width: 100%; padding: 10px; margin-bottom: 1rem;
                border: 2px solid #eee; border-radius: 8px; font-size: 1rem;
            }
            .login-modal button {
                width: 100%; padding: 12px; background: #3b82f6; color: white;
                border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;
                transition: background 0.2s;
            }
            .login-modal button:hover { background: #2563eb; }
            /* Dark mode support */
            body.dark-mode .login-modal { background: #1f2937; color: white; }
            body.dark-mode .login-modal h2 { color: white; }
            body.dark-mode .login-modal p { color: #9ca3af; }
            body.dark-mode .login-modal input { background: #374151; border-color: #4b5563; color: white; }
        `;
        document.head.appendChild(style);

        // Logic
        const input = modal.querySelector('input');
        const btn = modal.querySelector('button');

        const login = () => {
            const name = input.value.trim();
            if (name) {
                localStorage.setItem('studyGuide_username', name);
                userId = name;
                modal.remove();
                setupSync();
                createUserInfo();

                // Trigger initial sync to merge local data to this new user account
                queueChange('preferences', 'upsert', null); // Force a sync check
            }
        };

        btn.addEventListener('click', login);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
    }

    // Create User Info UI (Logout)
    function createUserInfo() {
        const nav = document.querySelector('.nav-links') || document.body;
        const userDiv = document.createElement('div');
        userDiv.className = 'user-info';
        userDiv.innerHTML = `
            <span class="user-badge" title="Click to logout">👤 ${userId}</span>
        `;

        // Insert before sync status if it exists, or append
        const syncStatusElement = document.getElementById('sync-status');
        if (syncStatusElement) {
            syncStatusElement.parentElement.insertBefore(userDiv, syncStatusElement);
        } else {
            // Check if nav exists, else fixed position
            if (document.querySelector('.nav-links')) {
                document.querySelector('.nav-links').appendChild(userDiv);
            } else {
                userDiv.style.cssText = 'position: fixed; top: 10px; right: 60px; z-index: 1000;';
                document.body.appendChild(userDiv);
            }
        }

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .user-badge {
                padding: 6px 12px; background: rgba(0,0,0,0.05);
                border-radius: 20px; font-size: 0.9rem; cursor: pointer;
                margin-right: 10px; display: inline-block; vertical-align: middle;
            }
            .user-badge:hover { background: rgba(255,0,0,0.1); color: red; }
            body.dark-mode .user-badge { background: rgba(255,255,255,0.1); color: #eee; }
            body.dark-mode .user-badge:hover { background: rgba(255,50,50,0.2); color: #ffadad; }
        `;
        document.head.appendChild(style);

        userDiv.addEventListener('click', () => {
            if (confirm(`Logout from "${userId}"?`)) {
                localStorage.removeItem('studyGuide_username');
                location.reload();
            }
        });
    }

    function setupSync() {
        injectStyles();
        createSyncIndicator();

        // Initial sync
        syncData();

        // Listen for online/offline
        window.addEventListener('online', syncData);

        // Periodic sync
        setInterval(syncData, SYNC_INTERVAL);

        // Expose queue function globally
        window.StudyGuideSync = {
            queue: queueChange,
            sync: syncData
        };
    }

    // Get course ID from URL
    function getCourseId() {
        const path = window.location.pathname;
        if (path.includes('/6480/')) return '6480';
        if (path.includes('/6670/')) return '6670';
        return 'general';
    }

    // Get page ID from URL
    function getPageId() {
        return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    }

    // Create sync status UI element
    function createSyncIndicator() {
        let indicator = document.getElementById('sync-status');

        if (!indicator) {
            indicator = document.createElement('span');
            indicator.id = 'sync-status';
            indicator.className = 'sync-status';
            indicator.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                margin-left: 10px;
                cursor: pointer;
            `;
            indicator.addEventListener('click', () => window.StudyGuideSync.sync());

            const nav = document.querySelector('.navbar-content') || document.querySelector('nav');
            if (nav) {
                nav.appendChild(indicator);
            }
        }

        const states = {
            'idle': { icon: '☁️', text: 'Sync', bg: '#e5e7eb', color: '#374151' },
            'syncing': { icon: '⟳', text: 'Syncing...', bg: '#dbeafe', color: '#1e40af' },
            'synced': { icon: '✓', text: 'Synced', bg: '#d1fae5', color: '#059669' },
            'error': { icon: '⚠️', text: 'Sync Error', bg: '#fee2e2', color: '#dc2626' },
            'offline': { icon: '📴', text: 'Offline', bg: '#fef3c7', color: '#d97706' }
        };

        const state = states[syncStatus] || states.idle;
        indicator.innerHTML = `${state.icon} <span>${state.text}</span>`;
        indicator.style.backgroundColor = state.bg;
        indicator.style.color = state.color;

        // Add animation for syncing
        if (syncStatus === 'syncing') {
            indicator.querySelector('span:first-child')?.classList.add('spin');
        }
    }

    // Check if online
    function isOnline() {
        return navigator.onLine;
    }

    // Queue a change for sync
    function queueChange(type, action, data) {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '{"highlights":{},"bookmarks":{},"notes":{},"preferences":null}');

        if (type === 'preferences') {
            queue.preferences = data;
        } else {
            if (!queue[type]) queue[type] = { upsert: [], deleted: [] };

            if (action === 'upsert') {
                // Remove from deleted if was there
                queue[type].deleted = queue[type].deleted.filter(id => id !== data.id);
                // Add/update in upsert
                const existingIndex = queue[type].upsert.findIndex(item => item.id === data.id);
                if (existingIndex >= 0) {
                    queue[type].upsert[existingIndex] = data;
                } else {
                    queue[type].upsert.push(data);
                }
            } else if (action === 'delete') {
                // Remove from upsert if was there
                queue[type].upsert = queue[type].upsert.filter(item => item.id !== data);
                // Add to deleted
                if (!queue[type].deleted.includes(data)) {
                    queue[type].deleted.push(data);
                }
            }
        }

        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

        // Trigger debounced sync
        debouncedSync();
    }

    // Clear sync queue
    function clearSyncQueue() {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify({
            highlights: { upsert: [], deleted: [] },
            bookmarks: { upsert: [], deleted: [] },
            notes: { upsert: [], deleted: [] },
            preferences: null
        }));
    }

    // Get sync queue
    function getSyncQueue() {
        return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '{}');
    }

    // Check if queue has changes
    function hasQueuedChanges() {
        const queue = getSyncQueue();
        return (
            (queue.highlights?.upsert?.length > 0) ||
            (queue.highlights?.deleted?.length > 0) ||
            (queue.bookmarks?.upsert?.length > 0) ||
            (queue.bookmarks?.deleted?.length > 0) ||
            (queue.notes?.upsert?.length > 0) ||
            (queue.notes?.deleted?.length > 0) ||
            (queue.preferences !== null)
        );
    }

    // Debounced sync
    function debouncedSync() {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(() => {
            sync();
        }, SYNC_DEBOUNCE_MS);
    }

    // Main sync function
    async function sync() {
        if (!isOnline()) {
            syncStatus = 'offline';
            updateSyncStatusUI();
            return { success: false, reason: 'offline' };
        }

        if (syncStatus === 'syncing') {
            return { success: false, reason: 'already syncing' };
        }

        syncStatus = 'syncing';
        updateSyncStatusUI();

        try {
            const userId = getDeviceId();
            const courseId = getCourseId();

            // Push local changes first
            if (hasQueuedChanges()) {
                const queue = getSyncQueue();

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        changes: queue
                    })
                });

                if (!response.ok) {
                    throw new Error(`Push failed: ${response.status}`);
                }

                // Clear queue after successful push
                clearSyncQueue();
            }

            // Pull latest from server
            const pullUrl = `${API_URL}?userId=${userId}&courseId=${courseId}`;
            const pullResponse = await fetch(pullUrl);

            if (!pullResponse.ok) {
                throw new Error(`Pull failed: ${pullResponse.status}`);
            }

            const serverData = await pullResponse.json();

            // Merge server data with local (server wins for conflicts)
            mergeServerData(serverData);

            // Update last sync time
            setLastSync(serverData.serverTime);

            syncStatus = 'synced';
            updateSyncStatusUI();

            // Reset to idle after 3 seconds
            setTimeout(() => {
                if (syncStatus === 'synced') {
                    syncStatus = 'idle';
                    updateSyncStatusUI();
                }
            }, 3000);

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('syncComplete', { detail: serverData }));

            return { success: true, data: serverData };

        } catch (error) {
            console.error('Sync error:', error);
            syncStatus = 'error';
            updateSyncStatusUI();

            // Reset to idle after 5 seconds
            setTimeout(() => {
                syncStatus = 'idle';
                updateSyncStatusUI();
            }, 5000);

            return { success: false, error: error.message };
        }
    }

    // Merge server data with local storage
    function mergeServerData(serverData) {
        // Main storage key used by highlights.js
        const localKey = 'studyGuide_highlights';
        const localData = JSON.parse(localStorage.getItem(localKey) || '{"highlights":[],"bookmarks":[]}');

        // Merge highlights
        if (serverData.highlights?.length > 0) {
            // Create map of local items by ID
            const localMap = new Map((localData.highlights || []).map(h => [h.id, h]));

            // Add/update from server
            serverData.highlights.forEach(h => {
                if (h.deleted_at) {
                    localMap.delete(h.id);
                } else {
                    localMap.set(h.id, {
                        id: h.id,
                        pageId: h.page_id,
                        courseId: h.course_id, // Ensure we store courseId
                        text: h.text,
                        color: h.color,
                        elementPath: h.element_path,
                        createdAt: h.created_at
                    });
                }
            });

            localData.highlights = Array.from(localMap.values());
        }

        // Merge bookmarks
        if (serverData.bookmarks?.length > 0) {
            const localMap = new Map((localData.bookmarks || []).map(b => [b.id, b]));

            serverData.bookmarks.forEach(b => {
                if (b.deleted_at) {
                    localMap.delete(b.id);
                } else {
                    localMap.set(b.id, {
                        id: b.id,
                        pageId: b.page_id,
                        courseId: b.course_id,
                        sectionId: b.section_id,
                        title: b.title,
                        createdAt: b.created_at
                    });
                }
            });

            localData.bookmarks = Array.from(localMap.values());
        }

        // Save back to local storage
        if (serverData.highlights?.length > 0 || serverData.bookmarks?.length > 0) {
            localStorage.setItem(localKey, JSON.stringify(localData));
        }

        // Merge preferences
        if (serverData.preferences) {
            const p = serverData.preferences;
            const prefs = {
                speed: p.tts_speed,
                volume: p.tts_volume,
                voiceIndex: 0,
                autoScroll: !!p.tts_autoscroll,
                theme: p.theme
            };
            localStorage.setItem('studyGuide_tts_preferences', JSON.stringify(prefs));

            // Apply theme if different
            if (p.theme) {
                document.documentElement.setAttribute('data-theme', p.theme);
            }
        }
    }

    // Inject CSS for sync status
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .sync-status {
                transition: all 0.3s ease;
            }
            .sync-status:hover {
                opacity: 0.8;
            }
            .sync-status .spin {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Expose API globally
    window.StudyGuideSync = {
        sync,
        queueChange, // Correct name expected by highlights.js and tts.js
        getUserId,
        getCourseId,
        getPageId,
        isOnline,
        getSyncStatus: () => syncStatus
    };

    document.addEventListener('DOMContentLoaded', init);
})();
