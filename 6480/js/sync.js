// Cloud Sync Manager
(function () {
    const API_URL = '/api/sync';
    const DEVICE_ID_KEY = 'studyGuide_deviceId';
    const LAST_SYNC_KEY = 'studyGuide_lastSync';
    const SYNC_QUEUE_KEY = 'studyGuide_syncQueue';

    let syncStatus = 'idle'; // 'idle', 'syncing', 'synced', 'error', 'offline'
    let syncTimeout = null;
    const SYNC_DEBOUNCE_MS = 2000;
    const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    // Get or create device ID
    function getDeviceId() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'device_' + crypto.randomUUID();
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
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

    // Get last sync time
    function getLastSync() {
        return localStorage.getItem(LAST_SYNC_KEY);
    }

    // Set last sync time
    function setLastSync(time) {
        localStorage.setItem(LAST_SYNC_KEY, time);
    }

    // Update sync status UI
    function updateSyncStatusUI() {
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

    // Start background sync interval
    function startBackgroundSync() {
        setInterval(() => {
            if (isOnline() && !hasQueuedChanges()) {
                // Just pull latest if no local changes
                sync();
            }
        }, SYNC_INTERVAL_MS);
    }

    // Handle online/offline events
    function setupNetworkListeners() {
        window.addEventListener('online', () => {
            syncStatus = 'idle';
            updateSyncStatusUI();
            // Sync when coming back online
            setTimeout(sync, 1000);
        });

        window.addEventListener('offline', () => {
            syncStatus = 'offline';
            updateSyncStatusUI();
        });

        // Sync when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && isOnline()) {
                sync();
            }
        });
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

    // Initialize
    function init() {
        injectStyles();
        setupNetworkListeners();
        updateSyncStatusUI();

        // Initial sync on page load
        setTimeout(sync, 1000);

        // Start background sync
        startBackgroundSync();
    }

    // Expose API globally
    window.StudyGuideSync = {
        sync,
        queueChange,
        getDeviceId,
        getCourseId,
        getPageId,
        isOnline,
        getSyncStatus: () => syncStatus
    };

    document.addEventListener('DOMContentLoaded', init);
})();
