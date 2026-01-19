// Bookmarks & Highlights Feature
(function () {
    let highlights = [];
    let bookmarks = [];
    let highlightPanel = null;
    let highlightToolbar = null;
    const STORAGE_KEY = 'studyGuide_highlights';

    // Colors for highlighting
    const COLORS = {
        yellow: { bg: '#fef08a', border: '#facc15', label: '🟡 Important' },
        green: { bg: '#bbf7d0', border: '#22c55e', label: '🟢 Definition' },
        red: { bg: '#fecaca', border: '#ef4444', label: '🔴 Critical' },
        blue: { bg: '#bfdbfe', border: '#3b82f6', label: '🔵 Example' }
    };

    // Get current page ID
    function getPageId() {
        return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    }

    // Load from localStorage
    function loadData() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            highlights = data.highlights || [];
            bookmarks = data.bookmarks || [];
        } catch (e) {
            highlights = [];
            bookmarks = [];
        }
    }

    // Save to localStorage
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            highlights,
            bookmarks,
            lastUpdated: new Date().toISOString()
        }));
    }

    // Get course ID from URL
    function getCourseId() {
        const path = window.location.pathname;
        if (path.includes('/6480/')) return '6480';
        if (path.includes('/6670/')) return '6670';
        return 'general';
    }

    // Queue for cloud sync
    function queueSync(type, action, data) {
        if (window.StudyGuideSync) {
            window.StudyGuideSync.queueChange(type, action, data);
        }
    }

    // Create unique ID
    function generateId() {
        return 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get text selection info
    function getSelectionInfo() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            return null;
        }

        const range = selection.getRangeAt(0);
        const text = selection.toString().trim();

        return {
            range,
            text,
            rect: range.getBoundingClientRect()
        };
    }

    // Create highlight toolbar (appears on text selection)
    function createHighlightToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'highlight-toolbar';
        toolbar.className = 'highlight-toolbar';
        toolbar.innerHTML = `
            <button data-color="yellow" title="Important" style="background: ${COLORS.yellow.bg}">🟡</button>
            <button data-color="green" title="Definition" style="background: ${COLORS.green.bg}">🟢</button>
            <button data-color="red" title="Critical" style="background: ${COLORS.red.bg}">🔴</button>
            <button data-color="blue" title="Example" style="background: ${COLORS.blue.bg}">🔵</button>
            <span class="toolbar-divider"></span>
            <button data-action="note" title="Add Note">📝</button>
        `;
        toolbar.style.display = 'none';
        document.body.appendChild(toolbar);

        // Color button clicks
        toolbar.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = btn.dataset.color;
                applyHighlight(color);
                hideToolbar();
            });
        });

        return toolbar;
    }

    // Show toolbar near selection
    function showToolbar(rect) {
        if (!highlightToolbar) {
            highlightToolbar = createHighlightToolbar();
        }

        const toolbarHeight = 40;
        const top = rect.top + window.scrollY - toolbarHeight - 10;
        const left = rect.left + window.scrollX + (rect.width / 2) - 100;

        highlightToolbar.style.top = `${Math.max(10, top)}px`;
        highlightToolbar.style.left = `${Math.max(10, left)}px`;
        highlightToolbar.style.display = 'flex';
    }

    // Hide toolbar
    function hideToolbar() {
        if (highlightToolbar) {
            highlightToolbar.style.display = 'none';
        }
    }

    // Get distinct path to element
    function getElementPath(element) {
        if (element.id) return '#' + element.id;
        if (element === document.body) return 'body';

        const parent = element.parentNode;
        const index = Array.from(parent.children).indexOf(element);
        const tagName = element.tagName.toLowerCase();
        return `${getElementPath(parent)} > ${tagName}:nth-child(${index + 1})`;
    }

    // Apply highlight to selected text
    function applyHighlight(color) {
        const selInfo = getSelectionInfo();
        if (!selInfo) return;

        const { range, text } = selInfo;
        const id = generateId();

        // Create highlight wrapper
        const wrapper = document.createElement('mark');
        wrapper.className = `user-highlight highlight-${color}`;
        wrapper.dataset.highlightId = id;
        wrapper.style.backgroundColor = COLORS[color].bg;
        wrapper.style.borderBottom = `2px solid ${COLORS[color].border}`;
        wrapper.style.padding = '0 2px';
        wrapper.style.borderRadius = '2px';
        wrapper.style.cursor = 'pointer';

        // Capture path before modifying DOM
        let elementPath = '';
        let startOffset = 0;
        try {
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === 1 ? container : container.parentNode;
            elementPath = getElementPath(parentElement);

            // Calculate offset relative to parent text content
            // This is simplified; robust impl requires Rangy or similar.
            // We'll rely on text matching within the parent for restoration fallback.
        } catch (e) { console.error("Path capture failed", e); }

        try {
            range.surroundContents(wrapper);
            // Cleanup empty text nodes that might break restoration logic
            wrapper.normalize();
        } catch (e) {
            // Complex selection fallback
            try {
                const fragment = range.extractContents();
                wrapper.appendChild(fragment);
                range.insertNode(wrapper);
            } catch (ex) {
                console.error("Highlight application failed", ex);
                return;
            }
        }

        // Save highlight data
        const highlight = {
            id,
            pageId: getPageId(),
            courseId: getCourseId(),
            text: text.substring(0, 200),
            color,
            elementPath, // Store path
            createdAt: new Date().toISOString()
        };
        highlights.push(highlight);
        saveData();

        // Queue for cloud sync (use correct queueChange name from sync.js)
        if (window.StudyGuideSync) {
            window.StudyGuideSync.queueChange('highlights', 'upsert', highlight);
        }

        // Add click handler to remove
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            showHighlightOptions(wrapper, id);
        });

        // Clear selection
        window.getSelection().removeAllRanges();

        // Update panel if open
        updateHighlightPanel();
    }

    // Restore Visual Highlights
    function restoreHighlights() {
        const pageId = getPageId();
        const pageHighlights = highlights.filter(h => h.pageId === pageId);

        pageHighlights.forEach(h => {
            // Skip if already exists
            if (document.querySelector(`[data-highlight-id="${h.id}"]`)) return;

            let targetElement = null;
            if (h.elementPath) {
                try {
                    targetElement = document.querySelector(h.elementPath);
                } catch (e) { }
            }

            // If we found the container, try to find the text to wrap
            if (targetElement) {
                // Simplified restoration: Find text in container and wrap first instance
                // This is not perfect for repeated text but better than nothing
                findAndWrapText(targetElement, h.text, h.color, h.id);
            } else {
                // Fallback: search entire body (expensive but necessary)
                findAndWrapText(document.body, h.text, h.color, h.id);
            }
        });
    }

    function findAndWrapText(root, searchText, color, id) {
        if (!searchText) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const index = node.nodeValue.indexOf(searchText);
            if (index >= 0) {
                // Found it! Split and wrap
                try {
                    const range = document.createRange();
                    range.setStart(node, index);
                    range.setEnd(node, index + searchText.length);

                    const wrapper = document.createElement('mark');
                    wrapper.className = `user-highlight highlight-${color}`;
                    wrapper.dataset.highlightId = id;
                    wrapper.style.backgroundColor = COLORS[color].bg;
                    wrapper.style.borderBottom = `2px solid ${COLORS[color].border}`;
                    wrapper.style.padding = '0 2px';
                    wrapper.style.borderRadius = '2px';
                    wrapper.style.cursor = 'pointer';

                    range.surroundContents(wrapper);

                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showHighlightOptions(wrapper, id);
                    });

                    return true; // Done
                } catch (e) {
                    console.error("Restoration wrap failed", e);
                }
            }
        }
        return false;
    }

    // Show options for existing highlight
    function showHighlightOptions(element, id) {
        const existing = document.querySelector('.highlight-options');
        if (existing) existing.remove();

        const rect = element.getBoundingClientRect();
        const options = document.createElement('div');
        options.className = 'highlight-options';
        options.innerHTML = `
            <button data-action="remove">🗑️ Remove</button>
            <button data-action="note">📝 Add Note</button>
        `;
        options.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 5}px;
            left: ${rect.left}px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            display: flex;
            gap: 5px;
        `;

        options.querySelector('[data-action="remove"]').addEventListener('click', () => {
            removeHighlight(id, element);
            options.remove();
        });

        options.querySelector('[data-action="note"]').addEventListener('click', () => {
            alert('📝 Note-taking feature is coming soon!');
            options.remove();
        });

        document.body.appendChild(options);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeOptions(e) {
                if (!options.contains(e.target)) {
                    options.remove();
                    document.removeEventListener('click', closeOptions);
                }
            });
        }, 100);
    }

    // Remove highlight
    function removeHighlight(id, element) {
        // Unwrap the element
        const parent = element.parentNode;
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);

        // Remove from data
        highlights = highlights.filter(h => h.id !== id);
        saveData();
        updateHighlightPanel();

        // Queue for cloud sync
        queueSync('highlights', 'delete', id);
    }

    // Create highlights/bookmarks panel
    function createHighlightPanel() {
        const panel = document.createElement('div');
        panel.id = 'highlight-panel';
        panel.className = 'highlight-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>🔖 Bookmarks & Highlights</h3>
                <button id="close-highlight-panel">×</button>
            </div>
            <div class="panel-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="yellow">🟡</button>
                <button class="filter-btn" data-filter="green">🟢</button>
                <button class="filter-btn" data-filter="red">🔴</button>
                <button class="filter-btn" data-filter="blue">🔵</button>
                <button class="filter-btn" data-filter="bookmarks">📌</button>
            </div>
            <div class="panel-content" id="highlight-list">
                <!-- Populated dynamically -->
            </div>
            <div class="panel-footer">
                <button id="export-highlights">📤 Export</button>
                <button id="clear-highlights">🗑️ Clear All</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Event listeners
        panel.querySelector('#close-highlight-panel').addEventListener('click', togglePanel);
        panel.querySelector('#export-highlights').addEventListener('click', exportHighlights);
        panel.querySelector('#clear-highlights').addEventListener('click', clearAllHighlights);

        // Filter buttons
        panel.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateHighlightPanel(btn.dataset.filter);
            });
        });

        return panel;
    }

    // Update panel content
    function updateHighlightPanel(filter = 'all') {
        if (!highlightPanel) return;

        const list = highlightPanel.querySelector('#highlight-list');
        const pageId = getPageId();

        let items = [];

        // Add bookmarks
        if (filter === 'all' || filter === 'bookmarks') {
            bookmarks.filter(b => b.pageId === pageId).forEach(b => {
                items.push({
                    type: 'bookmark',
                    ...b
                });
            });
        }

        // Add highlights
        if (filter === 'all' || COLORS[filter]) {
            highlights
                .filter(h => h.pageId === pageId && (filter === 'all' || h.color === filter))
                .forEach(h => {
                    items.push({
                        type: 'highlight',
                        ...h
                    });
                });
        }

        if (items.length === 0) {
            list.innerHTML = '<p class="empty-message">No highlights or bookmarks on this page.</p>';
            return;
        }

        list.innerHTML = items.map(item => {
            if (item.type === 'bookmark') {
                return `
                    <div class="highlight-item bookmark-item" data-id="${item.id}">
                        <span class="item-icon">📌</span>
                        <span class="item-text">${item.title}</span>
                        <button class="item-delete" data-id="${item.id}" data-type="bookmark">×</button>
                    </div>
                `;
            } else {
                return `
                    <div class="highlight-item" data-id="${item.id}">
                        <span class="item-icon" style="background: ${COLORS[item.color].bg}">${item.color === 'yellow' ? '🟡' : item.color === 'green' ? '🟢' : item.color === 'red' ? '🔴' : '🔵'}</span>
                        <span class="item-text">${item.text}</span>
                        <button class="item-delete" data-id="${item.id}" data-type="highlight">×</button>
                    </div>
                `;
            }
        }).join('');

        // Add delete handlers
        list.querySelectorAll('.item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                if (type === 'bookmark') {
                    // Find indicator primarily by ID
                    let indicator = document.querySelector(`.bookmark-indicator[data-bookmark-id="${id}"]`);
                    if (indicator) {
                        removeBookmark(id, indicator);
                    } else {
                        // Fallback: just remove data if indicator not found (e.g. different page)
                        bookmarks = bookmarks.filter(b => b.id !== id);
                        saveData();
                        queueSync('bookmarks', 'delete', id);
                    }
                } else {
                    const el = document.querySelector(`[data-highlight-id="${id}"]`);
                    if (el) {
                        removeHighlight(id, el);
                    } else {
                        // Fallback: remove data if element not found (e.g. different page)
                        highlights = highlights.filter(h => h.id !== id);
                        saveData();
                        queueSync('highlights', 'delete', id);
                    }
                }
                updateHighlightPanel(filter);
            });
        });
    }

    // Toggle panel visibility
    function togglePanel() {
        if (!highlightPanel) {
            highlightPanel = createHighlightPanel();
        }
        highlightPanel.classList.toggle('open');
        if (highlightPanel.classList.contains('open')) {
            updateHighlightPanel();
        }
    }

    // Add bookmark to section
    function bookmarkSection(heading) {
        const id = generateId();

        // Sanitize title: remove existing pins and cleanup text
        let clone = heading.cloneNode(true);
        clone.querySelectorAll('.bookmark-indicator').forEach(el => el.remove());
        const title = clone.textContent.replace(/📌/g, '').trim();

        // Add visual indicator
        const indicator = createBookmarkIndicator(id);
        heading.insertBefore(indicator, heading.firstChild);

        // Save bookmark
        const bookmark = {
            id,
            pageId: getPageId(),
            courseId: getCourseId(),
            sectionId: heading.id || '',
            title: title,
            createdAt: new Date().toISOString()
        };
        bookmarks.push(bookmark);
        saveData();
        updateHighlightPanel();

        // Queue for cloud sync
        queueSync('bookmarks', 'upsert', bookmark);
    }

    // Create bookmark indicator element
    function createBookmarkIndicator(id) {
        const indicator = document.createElement('span');
        indicator.className = 'bookmark-indicator';
        indicator.dataset.bookmarkId = id;
        indicator.innerHTML = '📌';
        indicator.style.cssText = 'margin-right: 8px; cursor: pointer;';
        indicator.title = 'Click to remove bookmark';
        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeBookmark(id, indicator);
        });
        return indicator;
    }

    // Restore bookmarks from storage
    function restoreBookmarks() {
        const pageId = getPageId();
        bookmarks.forEach(b => {
            if (b.pageId !== pageId) return;

            // Try to find section by ID first, then by matching text
            let heading = b.sectionId ? document.getElementById(b.sectionId) : null;

            if (!heading) {
                // Fallback: find heading by text content
                const headings = document.querySelectorAll('h1, h2, h3, h4');
                for (let h of headings) {
                    if (h.textContent.trim() === b.title || h.textContent.includes(b.title)) {
                        heading = h;
                        break;
                    }
                }
            }

            if (heading && !heading.querySelector('.bookmark-indicator')) {
                const indicator = createBookmarkIndicator(b.id);
                heading.insertBefore(indicator, heading.firstChild);

                // Keep the add button hidden
                const addBtn = heading.querySelector('.bookmark-btn');
                if (addBtn) addBtn.style.display = 'none';
            }
        });
    }

    // Remove bookmark
    function removeBookmark(id, indicator) {
        if (indicator) {
            const heading = indicator.parentElement;
            indicator.remove();

            // Show the add button again if it exists
            if (heading) {
                const addBtn = heading.querySelector('.bookmark-btn');
                if (addBtn) addBtn.style.display = '';
            }
        }

        bookmarks = bookmarks.filter(b => b.id !== id);
        saveData();
        updateHighlightPanel();

        // Queue for cloud sync
        queueSync('bookmarks', 'delete', id);
    }

    // Export highlights
    function exportHighlights() {
        const pageId = getPageId();
        const pageHighlights = highlights.filter(h => h.pageId === pageId);
        const pageBookmarks = bookmarks.filter(b => b.pageId === pageId);

        let markdown = `# Study Highlights - ${pageId}\n`;
        markdown += `Exported: ${new Date().toLocaleString()}\n\n`;

        if (pageBookmarks.length > 0) {
            markdown += `## 📌 Bookmarks\n\n`;
            pageBookmarks.forEach(b => {
                markdown += `- ${b.title}\n`;
            });
            markdown += '\n';
        }

        if (pageHighlights.length > 0) {
            markdown += `## ✨ Highlights\n\n`;
            pageHighlights.forEach(h => {
                const emoji = h.color === 'yellow' ? '🟡' : h.color === 'green' ? '🟢' : h.color === 'red' ? '🔴' : '🔵';
                markdown += `${emoji} > ${h.text}\n\n`;
            });
        }

        // Download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `highlights_${pageId}_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Clear all highlights
    function clearAllHighlights() {
        if (!confirm('Are you sure you want to clear all highlights and bookmarks on this page?')) return;

        const pageId = getPageId();

        // Remove highlight elements
        document.querySelectorAll('.user-highlight').forEach(el => {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
        });

        // Remove bookmark indicators
        document.querySelectorAll('.bookmark-indicator').forEach(el => el.remove());

        // Clear data for this page
        highlights = highlights.filter(h => h.pageId !== pageId);
        bookmarks = bookmarks.filter(b => b.pageId !== pageId);
        saveData();
        updateHighlightPanel();
    }

    // Create panel toggle button
    function createPanelButton() {
        const btn = document.createElement('button');
        btn.id = 'highlight-panel-btn';
        btn.className = 'highlight-panel-btn';
        btn.innerHTML = '🔖';
        btn.title = 'Bookmarks & Highlights';
        btn.addEventListener('click', togglePanel);

        const nav = document.querySelector('.navbar-content') || document.querySelector('nav');
        if (nav) {
            btn.style.cssText = `
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 10px;
            `;
            nav.appendChild(btn);
        }
    }

    // Add bookmark buttons to headings
    function addBookmarkButtons() {
        document.querySelectorAll('h2, h3').forEach(heading => {
            // Skip if already has bookmark button
            if (heading.querySelector('.bookmark-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'bookmark-btn';
            btn.innerHTML = '📌';
            btn.title = 'Bookmark this section';
            btn.style.cssText = `
                opacity: 0;
                background: none;
                border: none;
                cursor: pointer;
                margin-left: 8px;
                transition: opacity 0.2s;
            `;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                bookmarkSection(heading);
                btn.style.display = 'none';
            });

            heading.appendChild(btn);

            // Show on hover
            heading.addEventListener('mouseenter', () => btn.style.opacity = '1');
            heading.addEventListener('mouseleave', () => btn.style.opacity = '0');
        });
    }

    // Inject CSS
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .highlight-toolbar {
                position: absolute;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 5px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                gap: 5px;
                align-items: center;
            }
            .highlight-toolbar button {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: transform 0.1s;
            }
            .highlight-toolbar button:hover {
                transform: scale(1.1);
            }
            .toolbar-divider {
                width: 1px;
                height: 24px;
                background: #e5e7eb;
                margin: 0 5px;
            }
            .highlight-panel {
                position: fixed;
                top: 0;
                right: -350px;
                width: 350px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 20px rgba(0,0,0,0.1);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                transition: right 0.3s ease;
            }
            .highlight-panel.open {
                right: 0;
            }
            .panel-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .panel-header h3 {
                margin: 0;
                font-size: 1.1rem;
            }
            .panel-header button {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .panel-filters {
                padding: 10px 20px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                border-bottom: 1px solid #e5e7eb;
            }
            .filter-btn {
                padding: 6px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                background: white;
                cursor: pointer;
                font-size: 14px;
            }
            .filter-btn.active {
                background: #1e40af;
                color: white;
                border-color: #1e40af;
            }
            .panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }
            .highlight-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px;
                background: #f9fafb;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .highlight-item:hover {
                background: #f3f4f6;
            }
            .item-icon {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .item-text {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: #374151;
            }
            .item-delete {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 16px;
                padding: 0 5px;
            }
            .item-delete:hover {
                color: #ef4444;
            }
            .empty-message {
                text-align: center;
                color: #9ca3af;
                padding: 40px 20px;
            }
            .panel-footer {
                padding: 15px 20px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 10px;
            }
            .panel-footer button {
                flex: 1;
                padding: 10px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 14px;
            }
            .panel-footer button:hover {
                background: #f3f4f6;
            }
            .user-highlight {
                transition: box-shadow 0.2s;
            }
            .user-highlight:hover {
                box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
            }
            [data-theme="dark"] .highlight-panel {
                background: #1e293b;
                color: #e5e7eb;
            }
            [data-theme="dark"] .panel-header,
            [data-theme="dark"] .panel-filters,
            [data-theme="dark"] .panel-footer {
                border-color: #334155;
            }
            [data-theme="dark"] .highlight-item {
                background: #334155;
            }
            [data-theme="dark"] .item-text {
                color: #e5e7eb;
            }
        `;
        document.head.appendChild(style);
    }

    // Handle text selection
    function handleSelection() {
        const selInfo = getSelectionInfo();
        if (selInfo) {
            showToolbar(selInfo.rect);
        } else {
            hideToolbar();
        }
    }

    // Initialize
    function init() {
        loadData();
        injectStyles();
        createPanelButton();
        addBookmarkButtons();
        restoreBookmarks();
        restoreHighlights(); // Restore visual highlights

        // Listen for sync updates
        window.addEventListener('syncComplete', (e) => {
            loadData();
            restoreHighlights(); // Re-apply highlights after sync
            updateHighlightPanel();
        });

        // Selection handler
        document.addEventListener('mouseup', () => {
            setTimeout(handleSelection, 10);
        });

        // Hide toolbar on scroll
        document.addEventListener('scroll', hideToolbar);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.shiftKey && e.key === 'H') {
                    e.preventDefault();
                    togglePanel();
                }
                if (e.key === '1') { e.preventDefault(); applyHighlight('yellow'); hideToolbar(); }
                if (e.key === '2') { e.preventDefault(); applyHighlight('green'); hideToolbar(); }
                if (e.key === '3') { e.preventDefault(); applyHighlight('red'); hideToolbar(); }
                if (e.key === '4') { e.preventDefault(); applyHighlight('blue'); hideToolbar(); }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
