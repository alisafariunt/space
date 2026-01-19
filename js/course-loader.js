// Course Session Loader - Auto-generates session navigation from JSON
(function() {
    'use strict';

    /**
     * Load and render course sessions from JSON file
     * @param {string} jsonPath - Path to sessions.json file
     * @param {string} containerSelector - CSS selector for container element
     */
    async function loadCourseSessions(jsonPath, containerSelector) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${jsonPath}: ${response.statusText}`);
            }

            const data = await response.json();
            const container = document.querySelector(containerSelector);
            
            if (!container) {
                console.warn(`Container not found: ${containerSelector}`);
                return;
            }

            // Clear existing content
            container.innerHTML = '';

            // Render each session
            data.sessions.forEach(session => {
                const sessionCard = createSessionCard(session);
                container.appendChild(sessionCard);
            });

            // Update course info if needed
            if (data.course) {
                updateCourseInfo(data.course);
            }

        } catch (error) {
            console.error('Error loading course sessions:', error);
            // Fallback: show error message
            const container = document.querySelector(containerSelector);
            if (container) {
                container.innerHTML = `
                    <div class="error-box" style="padding: 1rem; background: #fee2e2; border-radius: 8px; color: #dc2626;">
                        <p>⚠️ Unable to load sessions. Please check the console for details.</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Create a session card element
     */
    function createSessionCard(session) {
        const card = document.createElement('a');
        card.href = session.file;
        card.className = 'session-link-card';
        
        const weekText = session.week !== undefined ? `Week ${session.week}: ` : '';
        
        card.innerHTML = `
            <h3>${weekText}${session.title}</h3>
            <p>${session.description || ''}</p>
        `;

        return card;
    }

    /**
     * Update course information in the page
     */
    function updateCourseInfo(course) {
        // Update page title if element exists
        const titleElement = document.querySelector('.session-header h1');
        if (titleElement && course.code && course.title) {
            titleElement.textContent = `${course.code}: ${course.title}`;
        }

        // Update meta info if element exists
        const metaElement = document.querySelector('.session-meta');
        if (metaElement && course.semester && course.instructor && course.university) {
            metaElement.textContent = `${course.semester} | ${course.instructor} | ${course.university}`;
        }
    }

    // Auto-detect and load sessions.json
    function autoLoadSessions() {
        // Try to find sessions.json in the current directory
        const currentPath = window.location.pathname;
        const courseDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const jsonPath = `${courseDir}/sessions.json`;
        
        // Look for session grid container
        const container = document.querySelector('.session-grid');
        if (container) {
            loadCourseSessions(jsonPath, '.session-grid');
        }
    }

    // Expose API globally
    window.CourseLoader = {
        load: loadCourseSessions,
        autoLoad: autoLoadSessions
    };

    // Auto-load on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoLoadSessions);
    } else {
        autoLoadSessions();
    }
})();
