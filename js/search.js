// Search Functionality
(function () {
    const PAGE_INDEX = [];
    let HIGHLIGHT_INDEX = [];
    let NOTE_INDEX = [];
    let searchModal = null;
    let currentFilter = 'all';

    // Build search index from page content
    function buildIndex() {
        const sections = document.querySelectorAll('.paper-card, .analysis-section, .persian-section');
        sections.forEach((section, idx) => {
            const title = section.querySelector('h2, h3, h4, .analysis-label')?.textContent || '';
            const content = section.textContent || '';
            PAGE_INDEX.push({
                id: `section-${idx}`,
                type: 'page',
                title: title.trim(),
                content: content.trim().substring(0, 500),
                element: section
            });
        });
    }

    function buildHighlightIndex() {
        try {
            const data = JSON.parse(localStorage.getItem('studyGuide_highlights') || '{}');
            const highlights = data.highlights || [];
            const notes = data.notes || [];
            const noteMap = new Map();

            notes.forEach(note => {
                if (!note.highlightId) return;
                const existing = noteMap.get(note.highlightId);
                if (!existing || (note.updatedAt || note.createdAt) > (existing.updatedAt || existing.createdAt)) {
                    noteMap.set(note.highlightId, note);
                }
            });

            HIGHLIGHT_INDEX = highlights.map(h => {
                const note = noteMap.get(h.id);
                return {
                    id: h.id,
                    type: 'highlight',
                    title: (h.text || '').trim(),
                    content: note ? note.noteContent : (h.text || '').trim(),
                    pageId: h.pageId,
                    courseId: h.courseId,
                    highlightId: h.id
                };
            });

            NOTE_INDEX = notes.map(n => ({
                id: n.id,
                type: 'note',
                title: (n.selectedText || 'Note').trim(),
                content: (n.noteContent || '').trim(),
                pageId: n.pageId,
                courseId: n.courseId,
                highlightId: n.highlightId
            }));
        } catch (e) {
            HIGHLIGHT_INDEX = [];
            NOTE_INDEX = [];
        }
    }

    // Search function
    function search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        const index = getActiveIndex();
        return index.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q)
        ).slice(0, 15);
    }

    function getActiveIndex() {
        switch (currentFilter) {
            case 'page':
                return PAGE_INDEX;
            case 'highlights':
                return HIGHLIGHT_INDEX;
            case 'notes':
                return NOTE_INDEX;
            default:
                return PAGE_INDEX.concat(HIGHLIGHT_INDEX, NOTE_INDEX);
        }
    }

    // Create search modal
    function createSearchModal() {
        const modal = document.createElement('div');
        modal.id = 'search-modal';
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-container">
                <div class="search-header">
                    <input type="text" id="search-input" placeholder="Search concepts, terms, papers..." autocomplete="off">
                    <button id="search-close" aria-label="Close search">✕</button>
                </div>
                <div class="search-filters">
                    <button class="search-filter active" data-filter="all">All</button>
                    <button class="search-filter" data-filter="page">Page</button>
                    <button class="search-filter" data-filter="highlights">Highlights</button>
                    <button class="search-filter" data-filter="notes">Notes</button>
                </div>
                <div id="search-results" class="search-results"></div>
                <div class="search-hint">Press ESC to close, ↑↓ to navigate, Enter to select</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');
        const closeBtn = document.getElementById('search-close');

        input.addEventListener('input', () => {
            const matches = search(input.value);
            renderResults(matches, results);
        });

        modal.querySelectorAll('.search-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.search-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                const matches = search(input.value);
                renderResults(matches, results);
            });
        });

        closeBtn.addEventListener('click', closeSearch);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeSearch();
        });

        return modal;
    }

    // Render search results
    function renderResults(matches, container) {
        if (matches.length === 0) {
            container.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        container.innerHTML = matches.map((match, i) => `
            <div class="search-result ${i === 0 ? 'active' : ''}" data-index="${i}">
                <div class="result-title">
                    <span class="result-tag result-tag-${match.type || 'page'}">${getTypeLabel(match.type)}</span>
                    ${highlightMatch(match.title, document.getElementById('search-input').value)}
                </div>
                <div class="result-preview">${highlightMatch(match.content.substring(0, 100), document.getElementById('search-input').value)}${match.content.length > 100 ? '...' : ''}</div>
                ${match.pageId ? `<div class="result-meta">${match.pageId}</div>` : ''}
            </div>
        `).join('');

        // Click handlers
        container.querySelectorAll('.search-result').forEach((el, i) => {
            el.addEventListener('click', () => goToResult(matches[i]));
        });
    }

    // Highlight matching text
    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function getTypeLabel(type) {
        switch (type) {
            case 'highlight':
                return 'Highlight';
            case 'note':
                return 'Note';
            default:
                return 'Page';
        }
    }

    function getCourseId() {
        const segments = (window.location.pathname || '').split('/').filter(Boolean);
        const course = segments[0];
        if (course === '6480' || course === '6670') return course;
        return 'general';
    }

    function buildPageUrl(courseId, pageId, highlightId = '') {
        const file = pageId === 'index' ? 'index.html' : `${pageId}.html`;
        if (courseId && courseId !== 'general') {
            return `/${courseId}/${file}${highlightId ? `#hl=${highlightId}` : ''}`;
        }
        return `/${file}${highlightId ? `#hl=${highlightId}` : ''}`;
    }

    // Navigate to result
    function goToResult(match) {
        closeSearch();
        if (match.element) {
            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            match.element.classList.add('highlight-search');
            setTimeout(() => match.element.classList.remove('highlight-search'), 2000);
            return;
        }

        if (match.highlightId) {
            const existing = document.querySelector(`[data-highlight-id="${match.highlightId}"]`);
            if (existing) {
                existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
                existing.classList.add('highlight-search');
                setTimeout(() => existing.classList.remove('highlight-search'), 2000);
                return;
            }
        }

        const targetCourse = match.courseId || getCourseId();
        const targetPage = match.pageId || getPageIdFromLocation();
        if (targetPage) {
            window.location.href = buildPageUrl(targetCourse, targetPage, match.highlightId);
        }
    }

    function getPageIdFromLocation() {
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

    // Open search
    function openSearch() {
        if (!searchModal) {
            searchModal = createSearchModal();
        }
        buildHighlightIndex();
        currentFilter = 'all';
        searchModal.querySelectorAll('.search-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
        searchModal.classList.add('active');
        document.getElementById('search-input').focus();
        document.body.style.overflow = 'hidden';
    }

    // Close search
    function closeSearch() {
        if (searchModal) {
            searchModal.classList.remove('active');
            document.getElementById('search-input').value = '';
            document.getElementById('search-results').innerHTML = '';
            document.body.style.overflow = '';
        }
    }

    // Create search button
    function createSearchButton() {
        const btn = document.createElement('button');
        btn.id = 'search-btn';
        btn.className = 'search-btn';
        btn.innerHTML = '🔍';
        btn.setAttribute('aria-label', 'Search');
        btn.addEventListener('click', openSearch);

        const nav = document.querySelector('.main-nav') || document.querySelector('nav');
        if (nav) {
            nav.appendChild(btn);
        } else {
            btn.style.position = 'fixed';
            btn.style.top = '1rem';
            btn.style.right = '4rem';
            btn.style.zIndex = '1000';
            document.body.appendChild(btn);
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        // Cmd/Ctrl + K to open search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        // ESC to close
        if (e.key === 'Escape') {
            closeSearch();
        }
    });

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        buildIndex();
        createSearchButton();
    });
})();
