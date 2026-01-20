// Course Dashboard Stats for Courses Index
(function () {
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

    document.addEventListener('DOMContentLoaded', updateCourseCards);
    window.addEventListener('syncComplete', updateCourseCards);
})();
