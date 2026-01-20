// Course Dashboard Stats for Courses Index
console.log('🚀 Course Dashboard Script Loading...');

(function () {
    console.log('✅ Course Dashboard IIFE Started');
    const PROGRESS_KEY = 'studyGuide_progress';
    const HIGHLIGHT_KEY = 'studyGuide_highlights';

    function loadProgress() {
        try {
            return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { pages: {}, dailyTotalsByCourse: {} };
        } catch (e) {
            return { pages: {}, dailyTotalsByCourse: {} };
        }
    }

    function loadHighlights() {
        try {
            const data = JSON.parse(localStorage.getItem(HIGHLIGHT_KEY)) || {};
            return {
                highlights: data.highlights || [],
                notes: data.notes || []
            };
        } catch (e) {
            return { highlights: [], notes: [] };
        }
    }

    function formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '0m';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    }

    function getCourseStats(courseId) {
        const progress = loadProgress();
        const { highlights } = loadHighlights();
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10);

        const pageEntries = Object.entries(progress.pages || {}).filter(([key]) => key.startsWith(`${courseId}/`));
        const totalTime = pageEntries.reduce((sum, [, page]) => sum + (page.timeSpentSec || 0), 0);
        const completedPages = pageEntries.filter(([, page]) => page.completed).length;
        const pagesVisited = pageEntries.filter(([, page]) => page.lastVisitedAt).length;

        let lastVisitedPage = null;
        let lastVisitedAt = 0;
        pageEntries.forEach(([key, page]) => {
            const ts = page.lastVisitedAt ? Date.parse(page.lastVisitedAt) : 0;
            if (ts > lastVisitedAt) {
                lastVisitedAt = ts;
                lastVisitedPage = key.split('/')[1] || 'index';
            }
        });

        const courseHighlights = highlights.filter(h => h.courseId === courseId || (!h.courseId && courseId === 'general'));
        const dueCount = courseHighlights.filter(h => {
            if (!h.srDueAt) return true;
            const due = Date.parse(h.srDueAt);
            return Number.isNaN(due) || due <= now;
        }).length;

        const dailyKey = `${courseId}|${today}`;
        const dailyEntry = progress.dailyTotalsByCourse?.[dailyKey];
        const todayTime = dailyEntry?.seconds || dailyEntry?.timeSpentSec || progress.dailyTotals?.[today] || 0;

        return {
            totalTime,
            todayTime,
            completedPages,
            pagesVisited,
            highlights: courseHighlights.length,
            due: dueCount,
            lastVisitedPage
        };
    }

    function updateCourseCards() {
        document.querySelectorAll('[data-course-id]').forEach(card => {
            const courseId = card.dataset.courseId;
            const stats = getCourseStats(courseId);

            const statsContainer = card.querySelector('[data-course-stats]');
            if (!statsContainer) return;

            const setStat = (key, value) => {
                const el = statsContainer.querySelector(`[data-stat="${key}"]`);
                if (el) el.textContent = value;
            };

            setStat('time', formatDuration(stats.totalTime));
            setStat('today', formatDuration(stats.todayTime));
            setStat('pages', `${stats.completedPages}/${stats.pagesVisited}`);
            setStat('highlights', stats.highlights);
            setStat('due', stats.due);

            const dueEl = statsContainer.querySelector('[data-stat="due"]');
            if (dueEl) {
                dueEl.classList.toggle('stat-alert', stats.due > 0);
            }

            const lastEl = card.querySelector('[data-course-last]');
            if (lastEl) {
                lastEl.textContent = stats.lastVisitedPage
                    ? `Last: ${stats.lastVisitedPage}`
                    : 'Last: --';
            }

            if (stats.lastVisitedPage) {
                const file = stats.lastVisitedPage === 'index' ? 'index.html' : `${stats.lastVisitedPage}.html`;
                card.href = `../${courseId}/${file}`;
                const linkText = card.querySelector('.course-link');
                if (linkText) {
                    linkText.innerHTML = 'Resume <i class="fas fa-arrow-right"></i>';
                }
            }
        });
    }

    // Dashboard-specific functions
    function populateDashboard() {
        populateOverviewStats();
        populateActivityChart();
        populateRecentHighlights();
        populateReminders();
        updateEnhancedCourseCards();
        updateGreeting();
    }

    function updateGreeting() {
        const greetingEl = document.getElementById('dashboardGreeting');
        if (!greetingEl) return;

        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';

        const user = window.AuthManager?.getUser?.();
        const name = user?.email?.split('@')[0] || 'there';
        greetingEl.textContent = `${greeting}, ${name}!`;
    }

    function populateOverviewStats() {
        const progress = loadProgress();
        const { highlights, notes } = loadHighlights();

        console.log('Dashboard Debug - Progress:', progress);
        console.log('Dashboard Debug - Highlights:', highlights);
        console.log('Dashboard Debug - Notes:', notes);

        // Total time across all courses
        const totalSeconds = Object.values(progress.pages || {}).reduce((sum, page) => sum + (page.timeSpentSec || 0), 0);
        console.log('Dashboard Debug - Total seconds:', totalSeconds);

        const totalEl = document.getElementById('totalTimeValue');
        if (totalEl) {
            const hrs = Math.floor(totalSeconds / 3600);
            const displayValue = hrs > 0 ? `${hrs}h` : formatDuration(totalSeconds);
            console.log('Dashboard Debug - Setting total time to:', displayValue);
            totalEl.textContent = displayValue;
        } else {
            console.error('Dashboard Debug - totalTimeValue element not found!');
        }

        // Total highlights
        const highlightsEl = document.getElementById('totalHighlightsValue');
        if (highlightsEl) {
            console.log('Dashboard Debug - Setting highlights to:', highlights.length);
            highlightsEl.textContent = highlights.length;
        } else {
            console.error('Dashboard Debug - totalHighlightsValue element not found!');
        }

        // Total notes
        const notesEl = document.getElementById('totalNotesValue');
        if (notesEl) {
            console.log('Dashboard Debug - Setting notes to:', notes.length);
            notesEl.textContent = notes.length;
        } else {
            console.error('Dashboard Debug - totalNotesValue element not found!');
        }

        // Calculate streak (simple version - days with activity)
        const streakEl = document.getElementById('streakValue');
        if (streakEl) {
            const days = calculateStreak(progress);
            console.log('Dashboard Debug - Setting streak to:', days);
            streakEl.textContent = days;
        } else {
            console.error('Dashboard Debug - streakValue element not found!');
        }
    }

    function calculateStreak(progress) {
        const dailyData = progress.dailyTotalsByCourse || {};
        const dates = Object.keys(dailyData).map(key => key.split('|')[1]).filter(Boolean);
        if (dates.length === 0) return 0;

        // Sort dates and check consecutive days
        const sortedDates = [...new Set(dates)].sort().reverse();
        const today = new Date().toISOString().slice(0, 10);

        let streak = 0;
        let currentDate = new Date(today);

        for (let i = 0; i < sortedDates.length; i++) {
            const checkDate = currentDate.toISOString().slice(0, 10);
            if (sortedDates.includes(checkDate)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    function populateActivityChart() {
        const chartEl = document.getElementById('studyChart');
        if (!chartEl) return;

        const progress = loadProgress();
        const dailyData = progress.dailyTotalsByCourse || {};

        // Get last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().slice(0, 10));
        }

        // Calculate daily totals
        const dailyMinutes = days.map(day => {
            const dayTotal = Object.entries(dailyData)
                .filter(([key]) => key.endsWith(`|${day}`))
                .reduce((sum, [, data]) => sum + (data.seconds || data.timeSpentSec || 0), 0);
            return Math.round(dayTotal / 60);
        });

        const maxMinutes = Math.max(...dailyMinutes, 1);

        chartEl.innerHTML = days.map((day, i) => {
            const minutes = dailyMinutes[i];
            const height = (minutes / maxMinutes) * 100;
            const label = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });

            return `<div class="chart-bar" 
                style="height: ${height}%;" 
                data-label="${label}"
                title="${label}: ${minutes}min"></div>`;
        }).join('');
    }

    function populateRecentHighlights() {
        const feedEl = document.getElementById('recentHighlights');
        if (!feedEl) return;

        const { highlights } = loadHighlights();
        const recent = highlights
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        if (recent.length === 0) {
            feedEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pen"></i>
                    <p>No highlights yet</p>
                </div>`;
            return;
        }

        feedEl.innerHTML = recent.map(h => `
            <div class="highlight-item" onclick="navigateToHighlight('${h.pageId}', '${h.id}')">
                <div class="highlight-text">${escapeHtml(h.text || '')}</div>
                <div class="highlight-meta">
                    <span><i class="fas fa-book"></i> ${h.courseId || 'General'}</span>
                    <span>${timeAgo(h.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    function populateReminders() {
        const remindersEl = document.getElementById('remindersList');
        if (!remindersEl) return;

        const { highlights } = loadHighlights();
        const now = Date.now();

        const due = highlights.filter(h => {
            if (!h.srDueAt) return false;
            const dueDate = Date.parse(h.srDueAt);
            return !Number.isNaN(dueDate) && dueDate <= now;
        });

        if (due.length === 0) {
            remindersEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No reviews due today!</p>
                </div>`;
            return;
        }

        remindersEl.innerHTML = due.slice(0, 5).map(h => `
            <div class="reminder-item" onclick="navigateToHighlight('${h.pageId}', '${h.id}')">
                <div class="highlight-text">${escapeHtml(h.text || '')}</div>
                <div class="highlight-meta">
                    <span><i class="fas fa-book"></i> ${h.courseId || 'General'}</span>
                </div>
            </div>
        `).join('');
    }

    function updateEnhancedCourseCards() {
        document.querySelectorAll('[data-course-id]').forEach(card => {
            const courseId = card.dataset.courseId;
            const stats = getCourseStats(courseId);

            // Update progress bar
            const progressFill = card.querySelector('.progress-fill');
            if (progressFill && stats.pagesVisited > 0) {
                const percentage = (stats.completedPages / stats.pagesVisited) * 100;
                progressFill.style.width = `${percentage}%`;
                progressFill.dataset.progress = Math.round(percentage);
            }

            // Update mini stats
            const setStat = (key, value) => {
                const el = card.querySelector(`[data-stat="${key}"]`);
                if (el) el.textContent = value;
            };

            setStat('time', formatDuration(stats.totalTime));
            setStat('highlights', stats.highlights);
            setStat('due', `${stats.due} due`);
        });
    }

    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function timeAgo(dateString) {
        if (!dateString) return 'recently';
        const seconds = Math.floor((Date.now() - Date.parse(dateString)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    window.navigateToHighlight = function (pageId, highlightId) {
        // Find which course this page belongs to
        const progress = loadProgress();
        const courseEntry = Object.keys(progress.pages || {}).find(key => key.includes(pageId));
        if (courseEntry) {
            const [courseId, page] = courseEntry.split('/');
            const file = page === 'index' ? 'index.html' : `${page}.html`;
            window.location.href = `../${courseId}/${file}#hl=${highlightId}`;
        }
    };

    // Quick Review button
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOMContentLoaded fired for dashboard');

        const reviewBtn = document.getElementById('quickReviewBtn');
        if (reviewBtn) {
            console.log('✅ Quick Review button found');
            reviewBtn.addEventListener('click', () => {
                const { highlights } = loadHighlights();
                const due = highlights.filter(h => {
                    if (!h.srDueAt) return false;
                    const dueDate = Date.parse(h.srDueAt);
                    return !Number.isNaN(dueDate) && dueDate <= Date.now();
                });

                if (due.length === 0) {
                    if (window.showToast) {
                        window.showToast('No items due for review!', 'info', 2000);
                    } else {
                        alert('No items due for review!');
                    }
                } else {
                    // Navigate to first due item
                    const first = due[0];
                    navigateToHighlight(first.pageId, first.id);
                }
            });
        } else {
            console.warn('⚠️ Quick Review button NOT found');
        }

        console.log('🎯 Calling populateDashboard()...');
        populateDashboard();
        console.log('✅ populateDashboard() completed');
    });

    document.addEventListener('DOMContentLoaded', updateCourseCards);
    window.addEventListener('syncComplete', () => {
        updateCourseCards();
        populateDashboard();
    });
})();
console.log('✅ Course Dashboard Script Loaded');
