// Cloud Sync Manager (JWT-Authenticated)
(function () {
    const API_URL = '/api/sync';
    const SYNC_QUEUE_KEY = 'studyGuide_syncQueue';
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const DEBOUNCE_DELAY = 2000; // 2 seconds
    const LAST_SYNC_KEY = 'studyGuide_lastSync';

    let userId = null; // Will be set after authentication
    let authManager = null; // Reference to AuthManager from auth.js
    let syncQueue = {
        highlights: { upsert: [], deleted: [] },
        progress: { upsert: [], deleted: [] },
        dailyStats: { upsert: [], deleted: [] },
        bookmarks: { upsert: [], deleted: [] },
        notes: { upsert: [], deleted: [] },
        preferences: null
    };
    let syncStatus = 'idle'; // 'idle', 'syncing', 'synced', 'error', 'offline'
    let syncTimeout = null;
    let syncIntervalId = null;
    let visibilityHandler = null;

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
        // Get reference to AuthManager (from auth.js)
        authManager = window.AuthManager;

        if (!authManager) {
            console.warn('[Sync] AuthManager not found. Make sure auth.js is loaded first.');
            return;
        }

        // Load sync queue
        const savedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
        if (savedQueue) {
            try {
                const parsedQueue = JSON.parse(savedQueue);
                syncQueue = {
                    highlights: parsedQueue.highlights || { upsert: [], deleted: [] },
                    progress: parsedQueue.progress || { upsert: [], deleted: [] },
                    dailyStats: parsedQueue.dailyStats || { upsert: [], deleted: [] },
                    bookmarks: parsedQueue.bookmarks || { upsert: [], deleted: [] },
                    notes: parsedQueue.notes || { upsert: [], deleted: [] },
                    preferences: parsedQueue.preferences || null
                };
            } catch (e) {
                console.error("Error parsing sync queue from localStorage, resetting.", e);
                clearSyncQueue();
            }
        }

        // Listen for authentication state changes
        window.addEventListener('authStateChanged', (event) => {
            const { isAuthenticated, user } = event.detail;

            if (isAuthenticated) {
                userId = user.username;
                setupSync();
                createUserInfo();

                // Trigger initial sync with preferences
                window.StudyGuideSync.queueChange('preferences', 'upsert', null);
                debouncedSync();
            } else {
                userId = null;
                teardownSync();
                createUserInfo();
            }
        });

        // Check initial authentication state
        if (authManager.isAuthenticated()) {
            userId = authManager.getUsername();
            setupSync();
            createUserInfo();
        } else {
            createUserInfo();
            const initialAuthPromise = authManager.initialAuthPromise;
            if (initialAuthPromise && typeof initialAuthPromise.then === 'function') {
                initialAuthPromise.then((success) => {
                    if (!success && !authManager.isAuthenticated() && window.showLoginModal) {
                        window.showLoginModal();
                    }
                });
            } else if (window.showLoginModal) {
                window.showLoginModal();
            }
        }
    }

    // User Info UI is now handled by auth.js (updateUserMenu function)
    // This function is kept as a stub for compatibility
    function createUserInfo() {
        // Auth.js handles the user menu now
    }

    function setupSync() {
        injectStyles();
        createSyncIndicator();

        // Initial sync
        sync();

        // Listen for online/offline
        window.addEventListener('online', sync);

        if (!visibilityHandler) {
            visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    sync();
                }
            };
        }
        document.addEventListener('visibilitychange', visibilityHandler);
        window.addEventListener('focus', sync);

        // Periodic sync
        if (syncIntervalId) {
            clearInterval(syncIntervalId);
        }
        syncIntervalId = setInterval(sync, SYNC_INTERVAL);

        // Expose queue function globally
        window.StudyGuideSync = Object.assign(window.StudyGuideSync || {}, {
            queueChange: queueChange,
            sync: sync,
            forceFullSync: forceFullSync
        });
    }

    // Teardown sync (called on logout)
    function teardownSync() {
        // Remove event listeners
        window.removeEventListener('online', sync);
        window.removeEventListener('focus', sync);
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
        }
        if (syncIntervalId) {
            clearInterval(syncIntervalId);
            syncIntervalId = null;
        }

        // Clear sync indicator
        const indicator = document.getElementById('sync-status');
        if (indicator) {
            indicator.remove();
        }

        // Reset sync status
        syncStatus = 'idle';
    }

    // Get course ID from URL
    function getCourseId() {
        const segments = (window.location.pathname || '').split('/').filter(Boolean);
        const course = segments[0];
        if (course === '6480' || course === '6670') return course;
        return 'general';
    }

    // Get page ID from URL
    function getPageId() {
        let path = window.location.pathname || '';
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const segment = path.split('/').pop() || 'index';
        if (!segment || segment === 'index' || segment === 'index.html') {
            return 'index';
        }
        return segment.replace(/\.html$/i, '');
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

            const nav = document.querySelector('.navbar-content') || document.querySelector('.nav-container') || document.querySelector('nav');
            if (nav) {
                nav.appendChild(indicator);
            }
        }

        updateSyncStatusUI();
    }

    // Update sync status UI
    function updateSyncStatusUI() {
        const indicator = document.getElementById('sync-status');
        if (!indicator) return;

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
        } else {
            indicator.querySelector('span:first-child')?.classList.remove('spin');
        }
    }

    // Check if online
    function isOnline() {
        return navigator.onLine;
    }

    // Queue a change for sync
    function queueChange(type, action, data) {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '{"highlights":{},"progress":{},"dailyStats":{},"bookmarks":{},"notes":{},"preferences":null}');

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
            progress: { upsert: [], deleted: [] },
            dailyStats: { upsert: [], deleted: [] },
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
            (queue.progress?.upsert?.length > 0) ||
            (queue.progress?.deleted?.length > 0) ||
            (queue.dailyStats?.upsert?.length > 0) ||
            (queue.dailyStats?.deleted?.length > 0) ||
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
        }, DEBOUNCE_DELAY);
    }

    // Main sync function
    async function sync(options = {}) {
        const forceFull = options.forceFull === true;
        if (!isOnline()) {
            syncStatus = 'offline';
            updateSyncStatusUI();
            if (window.showToast) {
                window.showToast('Offline - sync will resume when online', 'warning', 3000);
            }
            return { success: false, reason: 'offline' };
        }

        if (syncStatus === 'syncing') {
            return { success: false, reason: 'already syncing' };
        }

        // Check authentication
        if (!authManager || !authManager.isAuthenticated()) {
            console.log('[Sync] Not authenticated');
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            return { success: false, reason: 'not authenticated' };
        }

        syncStatus = 'syncing';
        updateSyncStatusUI();

        try {
            const courseId = getCourseId();

            // Get JWT token
            let accessToken;
            try {
                accessToken = authManager.getAccessToken();
            } catch (error) {
                throw new Error('AUTH_FAILED');
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            };

            // Push local changes first
            if (hasQueuedChanges()) {
                const queue = getSyncQueue();

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: headers,
                    credentials: 'include',
                    body: JSON.stringify({
                        changes: queue
                    })
                });

                if (response.status === 401) {
                    // Token expired, try refresh
                    try {
                        await authManager.refreshAccessToken();
                        // Retry sync with new token
                        return await sync(options);
                    } catch (refreshError) {
                        throw new Error('AUTH_FAILED');
                    }
                }

                if (response.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Push failed: ${response.status}`);
                }

                // Clear queue after successful push
                clearSyncQueue();
            }

            // Pull latest from server
            const params = new URLSearchParams();
            if (courseId) {
                params.set('courseId', courseId);
            }
            if (forceFull) {
                params.set('since', '1970-01-01T00:00:00.000Z');
            } else {
                const lastSync = getLastSync();
                if (lastSync) {
                    const parsed = Date.parse(lastSync);
                    if (!Number.isNaN(parsed)) {
                        params.set('since', new Date(parsed).toISOString());
                    }
                }
            }
            const pullUrl = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
            const pullResponse = await fetch(pullUrl, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (pullResponse.status === 401) {
                // Token expired, try refresh
                try {
                    await authManager.refreshAccessToken();
                    // Retry sync with new token
                    return await sync(options);
                } catch (refreshError) {
                    throw new Error('AUTH_FAILED');
                }
            }

            if (pullResponse.status === 429) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }

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

            if (error.message === 'AUTH_FAILED') {
                syncStatus = 'error';
                updateSyncStatusUI();
                if (window.showToast) {
                    window.showToast('Please log in to sync your data', 'warning');
                }
                if (window.showLoginModal) {
                    window.showLoginModal('Session expired. Please login again.');
                }
                return { success: false, error: 'auth_failed' };
            }

            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                syncStatus = 'error';
                updateSyncStatusUI();
                if (window.showToast) {
                    window.showToast('Too many requests. Please wait a moment.', 'error');
                }
                setTimeout(() => {
                    syncStatus = 'idle';
                    updateSyncStatusUI();
                }, 10000);
                return { success: false, error: 'rate_limit' };
            }

            syncStatus = 'error';
            updateSyncStatusUI();

            if (window.showToast) {
                window.showToast('Sync failed. Will retry automatically.', 'error');
            }

            // Reset to idle after 5 seconds
            setTimeout(() => {
                syncStatus = 'idle';
                updateSyncStatusUI();
            }, 5000);

            return { success: false, error: error.message };
        }
    }

    async function forceFullSync(options = {}) {
        const skipConfirm = options.skipConfirm === true;
        if (!skipConfirm && typeof window !== 'undefined') {
            const confirmSync = window.confirm('Force full sync? This will re-download all your data.');
            if (!confirmSync) {
                return { success: false, reason: 'cancelled' };
            }
        }

        if (window.showToast) {
            window.showToast('Forcing full sync...', 'info', 2000);
        }

        return await sync({ forceFull: true });
    }

    // Merge server data with local storage
    function mergeServerData(serverData) {
        // Main storage key used by highlights.js
        const localKey = 'studyGuide_highlights';
        const localData = JSON.parse(localStorage.getItem(localKey) || '{"highlights":[],"bookmarks":[],"notes":[]}');

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
                        startOffset: h.start_offset,
                        endOffset: h.end_offset,
                        srDueAt: h.sr_due_at,
                        srInterval: h.sr_interval,
                        srEase: h.sr_ease,
                        srReps: h.sr_reps,
                        srLastReviewed: h.sr_last_reviewed,
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

        // Merge notes
        if (serverData.notes?.length > 0) {
            const localMap = new Map((localData.notes || []).map(n => [n.id, n]));

            serverData.notes.forEach(n => {
                if (n.deleted_at) {
                    localMap.delete(n.id);
                } else {
                    localMap.set(n.id, {
                        id: n.id,
                        highlightId: n.highlight_id,
                        userId: n.user_id,
                        courseId: n.course_id,
                        pageId: n.page_id,
                        elementPath: n.element_path,
                        selectedText: n.selected_text,
                        noteContent: n.note_content,
                        color: n.color,
                        createdAt: n.created_at,
                        updatedAt: n.updated_at
                    });
                }
            });

            localData.notes = Array.from(localMap.values());
        }

        // Merge progress
        if (serverData.progress?.length > 0) {
            const progressKey = 'studyGuide_progress';
            const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{"pages":{},"dailyTotals":{},"dailyTotalsByCourse":{},"streak":{}}');
            localProgress.pages = localProgress.pages || {};
            localProgress.dailyTotals = localProgress.dailyTotals || {};
            localProgress.dailyTotalsByCourse = localProgress.dailyTotalsByCourse || {};

            serverData.progress.forEach(p => {
                const pageKey = `${p.course_id}/${p.page_id}`;
                if (p.deleted_at) {
                    delete localProgress.pages[pageKey];
                    return;
                }

                const existing = localProgress.pages[pageKey] || {};
                const incomingUpdatedAt = p.updated_at || p.created_at;
                const existingUpdatedAt = existing.updatedAt || existing.createdAt;
                if (existingUpdatedAt && incomingUpdatedAt) {
                    const incomingTs = Date.parse(incomingUpdatedAt);
                    const existingTs = Date.parse(existingUpdatedAt);
                    if (!Number.isNaN(incomingTs) && !Number.isNaN(existingTs) && incomingTs < existingTs) {
                        return;
                    }
                }

                localProgress.pages[pageKey] = {
                    ...existing,
                    lastPercent: p.last_percent,
                    timeSpentSec: p.time_spent_sec,
                    completed: !!p.completed,
                    lastVisitedAt: p.last_visited_at,
                    updatedAt: incomingUpdatedAt,
                    createdAt: p.created_at || existing.createdAt
                };
            });

            localStorage.setItem(progressKey, JSON.stringify(localProgress));
        }

        // Merge daily stats
        if (serverData.dailyStats?.length > 0) {
            const progressKey = 'studyGuide_progress';
            const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{"pages":{},"dailyTotals":{},"dailyTotalsByCourse":{},"streak":{}}');
            localProgress.dailyTotals = localProgress.dailyTotals || {};
            localProgress.dailyTotalsByCourse = localProgress.dailyTotalsByCourse || {};

            serverData.dailyStats.forEach(d => {
                const statKey = `${d.course_id}|${d.stat_date}`;
                if (d.deleted_at) {
                    delete localProgress.dailyTotalsByCourse[statKey];
                    return;
                }

                const existing = localProgress.dailyTotalsByCourse[statKey] || {};
                const incomingUpdatedAt = d.updated_at || d.created_at;
                const existingUpdatedAt = existing.updatedAt || existing.createdAt;
                if (existingUpdatedAt && incomingUpdatedAt) {
                    const incomingTs = Date.parse(incomingUpdatedAt);
                    const existingTs = Date.parse(existingUpdatedAt);
                    if (!Number.isNaN(incomingTs) && !Number.isNaN(existingTs) && incomingTs < existingTs) {
                        return;
                    }
                }

                localProgress.dailyTotalsByCourse[statKey] = {
                    courseId: d.course_id,
                    statDate: d.stat_date,
                    seconds: d.time_spent_sec || 0,
                    updatedAt: incomingUpdatedAt,
                    createdAt: d.created_at || existing.createdAt
                };
            });

            const aggregate = {};
            Object.values(localProgress.dailyTotalsByCourse).forEach(entry => {
                if (!entry || !entry.statDate) return;
                aggregate[entry.statDate] = (aggregate[entry.statDate] || 0) + (entry.seconds || 0);
            });
            localProgress.dailyTotals = aggregate;

            localStorage.setItem(progressKey, JSON.stringify(localProgress));
        }

        // Save back to local storage
        if (serverData.highlights?.length > 0 || serverData.bookmarks?.length > 0 || serverData.notes?.length > 0) {
            localStorage.setItem(localKey, JSON.stringify(localData));
        }

        // Merge preferences
        if (serverData.preferences) {
            const p = serverData.preferences;
            const prefs = {
                speed: p.tts_speed,
                volume: p.tts_volume,
                voiceId: p.tts_voice || 'en-US-terrell',
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
        forceFullSync,
        queueChange, // Correct name expected by highlights.js and tts.js
        getUserId,
        getCourseId,
        getPageId,
        isOnline,
        getSyncStatus: () => syncStatus
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
