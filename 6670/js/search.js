// Search Functionality
(function () {
    const SEARCH_INDEX = [];
    let searchModal = null;

    // Build search index from page content
    function buildIndex() {
        const sections = document.querySelectorAll('.paper-card, .analysis-section, .persian-section');
        sections.forEach((section, idx) => {
            const title = section.querySelector('h2, h3, h4, .analysis-label')?.textContent || '';
            const content = section.textContent || '';
            SEARCH_INDEX.push({
                id: `section-${idx}`,
                title: title.trim(),
                content: content.trim().substring(0, 500),
                element: section
            });
        });
    }

    // Search function
    function search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return SEARCH_INDEX.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q)
        ).slice(0, 10);
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
                <div class="result-title">${highlightMatch(match.title, document.getElementById('search-input').value)}</div>
                <div class="result-preview">${highlightMatch(match.content.substring(0, 100), document.getElementById('search-input').value)}...</div>
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

    // Navigate to result
    function goToResult(match) {
        closeSearch();
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.element.classList.add('highlight-search');
        setTimeout(() => match.element.classList.remove('highlight-search'), 2000);
    }

    // Open search
    function openSearch() {
        if (!searchModal) {
            searchModal = createSearchModal();
        }
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
