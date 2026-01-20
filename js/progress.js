/**
 * Reading Progress Tracker for BCIS 6670 Study Guide
 * Tracks scroll progress and displays reading percentage
 */

(function() {
    'use strict';

    const PROGRESS_KEY = 'studyGuide_progress';
    const DAILY_STREAK_THRESHOLD_SEC = 300; // 5 minutes
    const progressQueueState = {};

    // Initialize progress tracking when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initProgressTracker();
    });

    function initProgressTracker() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (!progressFill || !progressText) {
            return; // Progress elements not found on this page
        }

        const pageKey = getPageKey();
        let sessionStart = null;
        let accumulatedMs = 0;

        // Calculate and update progress on scroll
        function updateProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            if (docHeight <= 0) {
                progressFill.style.width = '100%';
                progressText.textContent = 'Reading Complete: 100%';
                return;
            }
            
            const progress = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
            
            progressFill.style.width = progress + '%';
            
            if (progress === 0) {
                progressText.textContent = 'Reading Progress: 0%';
            } else if (progress === 100) {
                progressText.textContent = 'Reading Complete: 100%';
            } else {
                progressText.textContent = 'Reading Progress: ' + progress + '%';
            }

            updatePageProgress(pageKey, progress);
        }

        // Initial update
        updateProgress();

        // Update on scroll with throttling for performance
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Update on resize
        window.addEventListener('resize', updateProgress);

        const startTimer = () => {
            if (sessionStart !== null) return;
            sessionStart = Date.now();
        };

        const stopTimer = () => {
            if (sessionStart === null) return;
            accumulatedMs += Date.now() - sessionStart;
            sessionStart = null;
        };

        const flushTime = () => {
            stopTimer();
            if (accumulatedMs <= 0) return;
            const seconds = Math.round(accumulatedMs / 1000);
            accumulatedMs = 0;
            addStudyTime(pageKey, seconds);
        };

        startTimer();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                startTimer();
            } else {
                flushTime();
            }
        });

        window.addEventListener('beforeunload', flushTime);
        window.addEventListener('pagehide', flushTime);

        const container = document.querySelector('.progress-container');
        if (container) {
            container.addEventListener('click', showProgressModal);
        }
    }

    // Mark current page in navigation
    function markActivePage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.navbar-links a');
        
        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (currentPath.endsWith(href) || 
                (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('/StudyGuide/')))) {
                link.classList.add('active');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', markActivePage);

    function getCourseId() {
        const segments = (window.location.pathname || '').split('/').filter(Boolean);
        const course = segments[0];
        if (course === '6480' || course === '6670') return course;
        return 'general';
    }

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

    function getPageKey() {
        return `${getCourseId()}/${getPageId()}`;
    }

    function loadProgressData() {
        try {
            return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {
                pages: {},
                dailyTotals: {},
                dailyTotalsByCourse: {},
                streak: { count: 0, lastDate: null }
            };
        } catch (e) {
            return { pages: {}, dailyTotals: {}, dailyTotalsByCourse: {}, streak: { count: 0, lastDate: null } };
        }
    }

    function saveProgressData(data) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    }

    function updatePageProgress(pageKey, progress) {
        const data = loadProgressData();
        const page = data.pages[pageKey] || {};
        page.lastPercent = progress;
        page.lastVisitedAt = new Date().toISOString();
        page.updatedAt = page.lastVisitedAt;
        if (!page.createdAt) {
            page.createdAt = page.lastVisitedAt;
        }
        if (progress >= 90) {
            page.completed = true;
        }
        data.pages[pageKey] = page;
        saveProgressData(data);

        if (shouldQueueProgress(pageKey, progress)) {
            queueProgressSync(pageKey, page);
        }
    }

    function addStudyTime(pageKey, seconds) {
        const data = loadProgressData();
        const page = data.pages[pageKey] || {};
        page.timeSpentSec = (page.timeSpentSec || 0) + seconds;
        page.lastVisitedAt = new Date().toISOString();
        page.updatedAt = page.lastVisitedAt;
        if (!page.createdAt) {
            page.createdAt = page.lastVisitedAt;
        }
        data.pages[pageKey] = page;

        const today = new Date().toISOString().slice(0, 10);
        data.dailyTotals[today] = (data.dailyTotals[today] || 0) + seconds;
        data.dailyTotalsByCourse = data.dailyTotalsByCourse || {};
        const [courseId] = pageKey.split('/');
        const dailyKey = `${courseId}|${today}`;
        const existingCourseDaily = data.dailyTotalsByCourse[dailyKey] || { seconds: 0, timeSpentSec: 0, updatedAt: null, createdAt: null };
        const nowIso = new Date().toISOString();
        data.dailyTotalsByCourse[dailyKey] = {
            courseId,
            statDate: today,
            seconds: (existingCourseDaily.seconds || existingCourseDaily.timeSpentSec || 0) + seconds,
            updatedAt: nowIso,
            createdAt: existingCourseDaily.createdAt || nowIso
        };
        updateStreak(data, today);

        saveProgressData(data);

        queueProgressSync(pageKey, page);
        queueDailyStatsSync(courseId, today, data.dailyTotalsByCourse[dailyKey]);
    }

    function updateStreak(data, today) {
        if ((data.dailyTotals[today] || 0) < DAILY_STREAK_THRESHOLD_SEC) {
            return;
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const lastDate = data.streak?.lastDate;
        let count = data.streak?.count || 0;

        if (lastDate === today) {
            data.streak = { count, lastDate };
            return;
        }

        if (lastDate === yesterday) {
            count += 1;
        } else {
            count = 1;
        }

        data.streak = { count, lastDate: today };
    }

    function showProgressModal() {
        const data = loadProgressData();
        const courseId = getCourseId();
        const pageEntries = Object.entries(data.pages || {}).filter(([key]) => key.startsWith(`${courseId}/`));

        const totalTimeSec = pageEntries.reduce((sum, [, page]) => sum + (page.timeSpentSec || 0), 0);
        const completedPages = pageEntries.filter(([, page]) => page.completed).length;
        const pagesVisited = pageEntries.filter(([, page]) => page.lastVisitedAt).length;

        const highlightData = (() => {
            try {
                const raw = JSON.parse(localStorage.getItem('studyGuide_highlights') || '{}');
                const highlights = raw.highlights || [];
                const notes = raw.notes || [];
                return {
                    highlights: highlights.filter(h => h.courseId === courseId).length,
                    notes: notes.filter(n => n.courseId === courseId).length
                };
            } catch (e) {
                return { highlights: 0, notes: 0 };
            }
        })();

        const today = new Date().toISOString().slice(0, 10);
        const todaySeconds = data.dailyTotals?.[today] || 0;
        const streakCount = data.streak?.count || 0;

        const modal = document.createElement('div');
        modal.className = 'progress-modal-overlay';
        modal.innerHTML = `
            <div class="progress-modal">
                <div class="progress-modal-header">
                    <h3>📈 Study Progress</h3>
                    <button class="progress-modal-close">×</button>
                </div>
                <div class="progress-modal-body">
                    <div class="progress-stats">
                        <div class="progress-stat">
                            <span class="stat-label">Total Time</span>
                            <span class="stat-value">${formatDuration(totalTimeSec)}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Today</span>
                            <span class="stat-value">${formatDuration(todaySeconds)}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Streak</span>
                            <span class="stat-value">${streakCount} day${streakCount === 1 ? '' : 's'}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Pages Visited</span>
                            <span class="stat-value">${pagesVisited}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Completed</span>
                            <span class="stat-value">${completedPages}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Highlights</span>
                            <span class="stat-value">${highlightData.highlights}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Notes</span>
                            <span class="stat-value">${highlightData.notes}</span>
                        </div>
                    </div>
                </div>
                <div class="progress-modal-footer">
                    <button class="progress-modal-close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelectorAll('.progress-modal-close, .progress-modal-close-btn').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function shouldQueueProgress(pageKey, progress) {
        const state = progressQueueState[pageKey] || { lastPercent: null, lastQueuedAt: 0 };
        const now = Date.now();
        const percentChanged = state.lastPercent === null || Math.abs(progress - state.lastPercent) >= 2 || progress >= 100;
        const timeElapsed = now - state.lastQueuedAt > 30000;

        if (percentChanged || timeElapsed) {
            progressQueueState[pageKey] = {
                lastPercent: progress,
                lastQueuedAt: now
            };
            return true;
        }
        return false;
    }

    function queueProgressSync(pageKey, page) {
        if (!window.StudyGuideSync || !window.StudyGuideSync.queueChange) return;

        const [courseId, pageId] = pageKey.split('/');
        const payload = {
            id: `${courseId}:${pageId}`,
            courseId,
            pageId,
            lastPercent: page.lastPercent || 0,
            timeSpentSec: page.timeSpentSec || 0,
            completed: !!page.completed,
            lastVisitedAt: page.lastVisitedAt || null,
            updatedAt: page.updatedAt || null,
            createdAt: page.createdAt || null
        };

        window.StudyGuideSync.queueChange('progress', 'upsert', payload);
    }

    function queueDailyStatsSync(courseId, statDate, entry) {
        if (!window.StudyGuideSync || !window.StudyGuideSync.queueChange) return;
        if (!courseId || !statDate || !entry) return;

        const payload = {
            id: `${courseId}:${statDate}`,
            courseId,
            statDate,
            timeSpentSec: entry.seconds || entry.timeSpentSec || 0,
            updatedAt: entry.updatedAt || null,
            createdAt: entry.createdAt || null
        };

        window.StudyGuideSync.queueChange('dailyStats', 'upsert', payload);
    }

    function recomputeDailyTotals(data) {
        data.dailyTotalsByCourse = data.dailyTotalsByCourse || {};
        if (Object.keys(data.dailyTotalsByCourse).length === 0) {
            data.dailyTotals = data.dailyTotals || {};
            return data;
        }
        const aggregate = {};
        Object.entries(data.dailyTotalsByCourse).forEach(([key, entry]) => {
            if (!entry) return;
            const statDate = entry.statDate || key.split('|')[1];
            if (!statDate) return;
            const seconds = entry.seconds || entry.timeSpentSec || 0;
            aggregate[statDate] = (aggregate[statDate] || 0) + seconds;
        });
        data.dailyTotals = aggregate;
        return data;
    }

    function recomputeStreakFromTotals(data) {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const date = new Date(today.getTime() - i * 86400000);
            const key = date.toISOString().slice(0, 10);
            const seconds = data.dailyTotals?.[key] || 0;
            if (seconds >= DAILY_STREAK_THRESHOLD_SEC) {
                streak += 1;
            } else {
                break;
            }
        }
        data.streak = {
            count: streak,
            lastDate: streak > 0 ? today.toISOString().slice(0, 10) : null
        };
        return data;
    }

    window.addEventListener('syncComplete', () => {
        const data = loadProgressData();
        recomputeDailyTotals(data);
        recomputeStreakFromTotals(data);
        saveProgressData(data);
    });

    function formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    }

})();
