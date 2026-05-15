(function () {
    'use strict';

    var FAMILY_LINKS = [
        { key: '6670', href: '/6670/', label: '6670' },
        { key: '6480', href: '/6480/', label: '6480' },
        { key: 'theory', href: '/theory/', label: 'Theory' },
        { key: 'legacy', href: '/theories.html', label: 'Legacy' }
    ];

    var LOCAL_LINKS = {
        '6670': [
            { href: '/6670/', label: 'Guide' },
            { href: '/6670/frameworks.html', label: 'Frameworks' },
            { href: '/6670/session0.html', label: 'W0' },
            { href: '/6670/session1.html', label: 'W1' },
            { href: '/6670/session2.html', label: 'W2' },
            { href: '/6670/session3.html', label: 'W3+4' },
            { href: '/6670/session5.html', label: 'W5' },
            { href: '/6670/session6.html', label: 'W6' },
            { href: '/6670/session7.html', label: 'W7' }
        ],
        '6480': [
            { href: '/6480/', label: 'Guide' },
            { href: '/6480/week1.html', label: 'W1' },
            { href: '/6480/week2.html', label: 'W2' },
            { href: '/6480/week3.html', label: 'W3' },
            { href: '/6480/week4.html', label: 'W4' },
            { href: '/6480/week5.html', label: 'W5' },
            { href: '/6480/exam1.html', label: 'Exam1' }
        ],
        'theory': [
            { href: '/theory/', label: 'Guide' },
            { href: '/theory/#toc', label: 'TOC' },
            { href: '/theory/#priority', label: 'Priority' },
            { href: '/theory/#exam-questions', label: 'Questions' }
        ],
        'legacy': [
            { href: '/theories.html', label: 'All Theories' },
            { href: '/theories.html#toc', label: 'TOC' }
        ]
    };

    function normalizePath(path) {
        var clean = (path || '/').split('?')[0].split('#')[0];
        clean = clean.replace(/\/{2,}/g, '/');

        if (!clean) return '/';
        if (clean === '/6670') return '/6670/';
        if (clean === '/6480') return '/6480/';
        if (clean === '/theory') return '/theory/';
        if (clean === '/comps') return '/comps/';
        if (clean === '/6670/index.html') return '/6670/';
        if (clean === '/6480/index.html') return '/6480/';
        if (clean === '/theory/index.html') return '/theory/';
        if (clean === '/comps/index.html') return '/comps/';
        if (clean === '') return '/';
        return clean;
    }

    function detectFamily(pathname) {
        var path = normalizePath(pathname);

        if (path.indexOf('/6670/') === 0) return '6670';
        if (path.indexOf('/6480/') === 0) return '6480';
        if (path.indexOf('/theory/') === 0) return 'theory';
        if (path === '/theories.html') return 'legacy';
        return null;
    }

    function isLinkActive(linkHref, currentPath, currentHash, currentFamily, linkKey) {
        if (linkKey) {
            return currentFamily === linkKey;
        }

        var hashIndex = linkHref.indexOf('#');
        var hrefPath = hashIndex >= 0 ? linkHref.slice(0, hashIndex) : linkHref;
        var hrefHash = hashIndex >= 0 ? linkHref.slice(hashIndex) : '';
        var normalizedHrefPath = normalizePath(hrefPath);

        if (hrefHash) {
            return normalizedHrefPath === currentPath && hrefHash === currentHash;
        }

        return normalizedHrefPath === currentPath;
    }

    function buildLinkItem(link, options) {
        var active = isLinkActive(
            link.href,
            options.currentPath,
            options.currentHash,
            options.currentFamily,
            options.familyKey || null
        );
        var classes = [options.itemClass];
        if (active) classes.push('study-nav-active');

        return '<li class="' + classes.join(' ') + '">' +
            '<a href="' + link.href + '"' + (active ? ' class="active"' : '') + '>' + link.label + '</a>' +
            '</li>';
    }

    function buildNavbarHtml(currentFamily, currentPath, currentHash) {
        var familyItems = FAMILY_LINKS.map(function (link) {
            return buildLinkItem(link, {
                currentPath: currentPath,
                currentHash: currentHash,
                currentFamily: currentFamily,
                familyKey: link.key,
                itemClass: 'study-nav-family'
            });
        }).join('\n');

        var localLinks = LOCAL_LINKS[currentFamily] || [];
        var localItems = localLinks.map(function (link) {
            return buildLinkItem(link, {
                currentPath: currentPath,
                currentHash: currentHash,
                currentFamily: currentFamily,
                itemClass: 'study-nav-local'
            });
        }).join('\n');

        var divider = localItems ? '<li class="study-nav-divider" aria-hidden="true"></li>' : '';

        return '<nav class="navbar study-navbar" data-study-family="' + currentFamily + '">' +
            '<div class="navbar-content">' +
            '<a href="/" class="navbar-brand">Ali Safari Study Hub</a>' +
            '<ul class="navbar-links study-nav-links">' +
            familyItems +
            divider +
            localItems +
            '</ul>' +
            '<div class="nav-actions">' +
            '<button id="search-btn" class="search-btn" title="Search (Ctrl+K)" aria-label="Search">🔍</button>' +
            '<button id="theme-toggle" class="theme-toggle" title="Toggle theme" aria-label="Toggle theme">🌙</button>' +
            '</div>' +
            '</div>' +
            '<div class="progress-container">' +
            '<div class="progress-bar-wrapper">' +
            '<div class="progress-bar"><div class="progress-fill"></div></div>' +
            '<span class="progress-text">Reading Progress: 0%</span>' +
            '</div>' +
            '</div>' +
            '</nav>';
    }

    function replaceNavbar() {
        var currentFamily = detectFamily(window.location.pathname);
        if (!currentFamily) return;

        var currentPath = normalizePath(window.location.pathname);
        var currentHash = window.location.hash || '';
        var existing = document.querySelector('nav.navbar');
        var wrapper = document.createElement('div');
        wrapper.innerHTML = buildNavbarHtml(currentFamily, currentPath, currentHash);
        var nav = wrapper.firstElementChild;
        if (!nav) return;

        if (existing && existing.parentNode) {
            existing.parentNode.replaceChild(nav, existing);
            return;
        }

        var main = document.querySelector('main');
        if (main && main.parentNode) {
            main.parentNode.insertBefore(nav, main);
            return;
        }

        document.body.insertBefore(nav, document.body.firstChild);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceNavbar);
    } else {
        replaceNavbar();
    }
})();
