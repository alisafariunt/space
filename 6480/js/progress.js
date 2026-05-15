/**
 * Reading Progress Tracker for BCIS 6670 Study Guide
 * Tracks scroll progress and displays reading percentage
 */

(function() {
    'use strict';

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

})();
