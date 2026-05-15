/**
 * Shared Navbar for BCIS 6670 Study Guide
 * Injects the same navbar into every page automatically.
 * To update the navbar for ALL pages, edit only this file.
 */

(function () {
    'use strict';

    var NAV_LINKS = [
        { href: 'index.html', label: 'Home' },
        { href: 'exam_guide.html', label: '🎯 Exam Guide' },
        { href: 'exam_answers.html', label: '📝 Exam Answers' },
        { href: 'frameworks.html', label: '📐 Frameworks' },
        { href: 'session1.html', label: 'Wk 1' },
        { href: 'session2.html', label: 'Wk 2' },
        { href: 'session3.html', label: 'Wk 3+4' },
        { href: 'session5.html', label: 'Wk 5' },
        { href: 'session6.html', label: 'Wk 6' },
        { href: 'session7.html', label: 'Wk 7' },
    ];

    function getCurrentPage() {
        var path = window.location.pathname;
        var parts = path.split('/');
        var page = parts[parts.length - 1] || 'index.html';
        // Handle trailing slash (root)
        if (page === '' || page === '6670') return 'index.html';
        return page;
    }

    function buildNavHTML() {
        var current = getCurrentPage();

        var linksHTML = NAV_LINKS.map(function (link) {
            var isActive = (link.href === current);
            return '<li><a href="' + link.href + '"' + (isActive ? ' class="active"' : '') + '>' + link.label + '</a></li>';
        }).join('\n                ');

        return '<nav class="navbar">\n' +
            '        <div class="navbar-content">\n' +
            '            <a href="index.html" class="navbar-brand">BCIS 6670 Study Guide</a>\n' +
            '            <ul class="navbar-links">\n' +
            '                ' + linksHTML + '\n' +
            '            </ul>\n' +
            '        </div>\n' +
            '        <div class="progress-container">\n' +
            '            <div class="progress-bar-wrapper">\n' +
            '                <div class="progress-bar">\n' +
            '                    <div class="progress-fill"></div>\n' +
            '                </div>\n' +
            '                <span class="progress-text">Reading Progress: 0%</span>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </nav>';
    }

    function injectNavbar() {
        var existing = document.querySelector('nav.navbar');
        var newNav = document.createElement('div');
        newNav.innerHTML = buildNavHTML();
        var navEl = newNav.firstElementChild;

        if (existing) {
            existing.parentNode.replaceChild(navEl, existing);
        } else {
            var body = document.body;
            var main = document.querySelector('main');
            if (main) {
                body.insertBefore(navEl, main);
            } else {
                body.insertBefore(navEl, body.firstChild);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavbar);
    } else {
        injectNavbar();
    }

})();
