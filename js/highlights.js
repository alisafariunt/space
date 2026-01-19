// Bookmarks & Highlights Feature
(function () {
    let highlights = [];
    let bookmarks = [];
    let notes = [];
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
            notes = data.notes || [];
        } catch (e) {
            highlights = [];
            bookmarks = [];
            notes = [];
        }
    }

    // Save to localStorage
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            highlights,
            bookmarks,
            notes,
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

        // Note button click
        const noteBtn = toolbar.querySelector('[data-action="note"]');
        if (noteBtn) {
            noteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Create highlight first with yellow color
                const highlightId = applyHighlight('yellow', true);
                hideToolbar();

                // Then open note modal after a brief delay to ensure highlight is created
                setTimeout(() => {
                    const highlight = highlights.find(h => h.id === highlightId);
                    const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
                    if (highlight && highlightElement) {
                        showNoteModal(highlight, highlightElement);
                    }
                }, 100);
            });
        }

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
    function applyHighlight(color, returnId = false) {
        const selInfo = getSelectionInfo();
        if (!selInfo) return returnId ? null : undefined;

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

        // Return ID if requested
        return returnId ? id : undefined;
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
            const highlight = highlights.find(h => h.id === id);
            if (highlight) {
                showNoteModal(highlight, element);
            }
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

        // Also remove associated notes
        const associatedNotes = notes.filter(n => n.highlightId === id);
        associatedNotes.forEach(note => {
            queueSync('notes', 'delete', note.id);
        });
        notes = notes.filter(n => n.highlightId !== id);

        saveData();
        updateHighlightPanel();

        // Queue for cloud sync
        queueSync('highlights', 'delete', id);
    }

    // Show Note Modal
    function showNoteModal(highlight, highlightElement) {
        // Check if note already exists for this highlight
        const existingNote = notes.find(n => n.highlightId === highlight.id);

        const modal = document.createElement('div');
        modal.className = 'note-modal-overlay';
        modal.innerHTML = `
            <div class="note-modal">
                <div class="note-modal-header">
                    <h3>📝 ${existingNote ? 'Edit' : 'Add'} Note</h3>
                    <button class="note-modal-close">×</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-selected-text">
                        <strong>Highlighted text:</strong>
                        <p>"${highlight.text}"</p>
                    </div>
                    <textarea
                        id="note-content"
                        placeholder="Type your note here..."
                        rows="8"
                    >${existingNote ? existingNote.noteContent : ''}</textarea>
                </div>
                <div class="note-modal-footer">
                    ${existingNote ? '<button class="note-delete-btn">🗑️ Delete Note</button>' : ''}
                    <button class="note-cancel-btn">Cancel</button>
                    <button class="note-save-btn">💾 Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const textarea = modal.querySelector('#note-content');
        const saveBtn = modal.querySelector('.note-save-btn');
        const cancelBtn = modal.querySelector('.note-cancel-btn');
        const closeBtn = modal.querySelector('.note-modal-close');
        const deleteBtn = modal.querySelector('.note-delete-btn');

        // Focus textarea
        textarea.focus();

        // Save note
        const saveNote = () => {
            const content = textarea.value.trim();
            if (!content) {
                alert('Please enter some note content');
                return;
            }

            if (existingNote) {
                // Update existing note
                existingNote.noteContent = content;
                existingNote.updatedAt = new Date().toISOString();
                queueSync('notes', 'upsert', existingNote);
            } else {
                // Create new note
                const note = {
                    id: generateId().replace('hl_', 'note_'),
                    highlightId: highlight.id,
                    userId: window.StudyGuideSync?.getUserId(),
                    courseId: getCourseId(),
                    pageId: getPageId(),
                    elementPath: highlight.elementPath,
                    selectedText: highlight.text,
                    noteContent: content,
                    color: highlight.color,
                    createdAt: new Date().toISOString()
                };
                notes.push(note);
                queueSync('notes', 'upsert', note);

                // Add note indicator to highlight
                addNoteIndicator(highlightElement, note);
            }

            saveData();
            updateHighlightPanel();
            modal.remove();
        };

        // Delete note
        const deleteNote = () => {
            if (existingNote && confirm('Delete this note?')) {
                notes = notes.filter(n => n.id !== existingNote.id);
                queueSync('notes', 'delete', existingNote.id);
                saveData();
                updateHighlightPanel();

                // Remove note indicator from highlight
                const indicator = highlightElement?.querySelector('.note-indicator');
                if (indicator) indicator.remove();

                modal.remove();
            }
        };

        // Close modal
        const closeModal = () => modal.remove();

        // Event listeners
        saveBtn.addEventListener('click', saveNote);
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        if (deleteBtn) deleteBtn.addEventListener('click', deleteNote);

        // Save on Ctrl/Cmd + Enter
        textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                saveNote();
            }
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Add note indicator to highlight element
    function addNoteIndicator(highlightElement, note) {
        if (!highlightElement) return;

        // Check if indicator already exists
        if (highlightElement.querySelector('.note-indicator')) return;

        const indicator = document.createElement('span');
        indicator.className = 'note-indicator';
        indicator.innerHTML = '📝';
        indicator.title = 'Has note - Click to view';
        indicator.style.cssText = 'margin-left: 4px; cursor: pointer; font-size: 0.8em;';

        indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showNoteViewModal(note);
        });

        highlightElement.appendChild(indicator);
    }

    // Show note view modal (read-only initially)
    function showNoteViewModal(note) {
        const highlight = highlights.find(h => h.id === note.highlightId);
        const highlightElement = document.querySelector(`[data-highlight-id="${note.highlightId}"]`);

        const modal = document.createElement('div');
        modal.className = 'note-modal-overlay';
        modal.innerHTML = `
            <div class="note-modal">
                <div class="note-modal-header">
                    <h3>📝 Note</h3>
                    <button class="note-modal-close">×</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-selected-text">
                        <strong>Highlighted text:</strong>
                        <p>"${note.selectedText}"</p>
                    </div>
                    <div class="note-content-display">
                        ${note.noteContent.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <div class="note-modal-footer">
                    <button class="note-edit-btn">✏️ Edit</button>
                    <button class="note-close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const editBtn = modal.querySelector('.note-edit-btn');
        const closeBtn = modal.querySelector('.note-close-btn');
        const closeXBtn = modal.querySelector('.note-modal-close');

        const closeModal = () => modal.remove();

        editBtn.addEventListener('click', () => {
            modal.remove();
            if (highlight && highlightElement) {
                showNoteModal(highlight, highlightElement);
            }
        });

        closeBtn.addEventListener('click', closeModal);
        closeXBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Restore notes from storage
    function restoreNotes() {
        const pageId = getPageId();
        notes.forEach(note => {
            if (note.pageId !== pageId) return;

            const highlightElement = document.querySelector(`[data-highlight-id="${note.highlightId}"]`);
            if (highlightElement) {
                addNoteIndicator(highlightElement, note);
            }
        });
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
                <button class="filter-btn" data-filter="notes">📝</button>
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
                    // Check if this highlight has a note
                    const hasNote = notes.some(n => n.highlightId === h.id);
                    items.push({
                        type: 'highlight',
                        hasNote,
                        ...h
                    });
                });
        }

        // Add notes
        if (filter === 'all' || filter === 'notes') {
            notes
                .filter(n => n.pageId === pageId)
                .forEach(n => {
                    items.push({
                        type: 'note',
                        ...n
                    });
                });
        }

        if (items.length === 0) {
            list.innerHTML = '<p class="empty-message">No items on this page.</p>';
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
            } else if (item.type === 'note') {
                return `
                    <div class="highlight-item note-item" data-id="${item.id}" data-note-id="${item.id}">
                        <span class="item-icon">📝</span>
                        <div class="item-content">
                            <div class="item-text"><em>"${item.selectedText.substring(0, 50)}${item.selectedText.length > 50 ? '...' : ''}"</em></div>
                            <div class="note-preview">${item.noteContent.substring(0, 100)}${item.noteContent.length > 100 ? '...' : ''}</div>
                        </div>
                        <button class="item-delete" data-id="${item.id}" data-type="note">×</button>
                    </div>
                `;
            } else {
                return `
                    <div class="highlight-item" data-id="${item.id}">
                        <span class="item-icon" style="background: ${COLORS[item.color].bg}">${item.color === 'yellow' ? '🟡' : item.color === 'green' ? '🟢' : item.color === 'red' ? '🔴' : '🔵'}</span>
                        <span class="item-text">${item.text}${item.hasNote ? ' 📝' : ''}</span>
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
                } else if (type === 'note') {
                    if (confirm('Delete this note?')) {
                        const note = notes.find(n => n.id === id);
                        if (note) {
                            // Remove note indicator from highlight if it exists
                            const highlightElement = document.querySelector(`[data-highlight-id="${note.highlightId}"]`);
                            if (highlightElement) {
                                const indicator = highlightElement.querySelector('.note-indicator');
                                if (indicator) indicator.remove();
                            }
                        }
                        notes = notes.filter(n => n.id !== id);
                        saveData();
                        queueSync('notes', 'delete', id);
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

        // Add click handlers for note items to view them
        list.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('item-delete')) return;
                const noteId = item.dataset.noteId;
                const note = notes.find(n => n.id === noteId);
                if (note) {
                    showNoteViewModal(note);
                }
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

            /* Note Modal Styles */
            .note-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10002;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(3px);
            }
            .note-modal {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            .note-modal-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .note-modal-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            .note-modal-close {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #9ca3af;
                line-height: 1;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            .note-modal-close:hover {
                color: #374151;
            }
            .note-modal-body {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
            }
            .note-selected-text {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            .note-selected-text strong {
                display: block;
                margin-bottom: 8px;
                color: #6b7280;
                font-size: 0.875rem;
            }
            .note-selected-text p {
                margin: 0;
                font-style: italic;
                color: #374151;
            }
            .note-modal-body textarea {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 1rem;
                font-family: inherit;
                resize: vertical;
                box-sizing: border-box;
            }
            .note-modal-body textarea:focus {
                outline: none;
                border-color: #3b82f6;
            }
            .note-content-display {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                line-height: 1.6;
                color: #374151;
                white-space: pre-wrap;
            }
            .note-modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .note-modal-footer button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .note-save-btn {
                background: #3b82f6;
                color: white;
            }
            .note-save-btn:hover {
                background: #2563eb;
            }
            .note-cancel-btn, .note-close-btn {
                background: #f3f4f6;
                color: #374151;
            }
            .note-cancel-btn:hover, .note-close-btn:hover {
                background: #e5e7eb;
            }
            .note-edit-btn {
                background: #10b981;
                color: white;
            }
            .note-edit-btn:hover {
                background: #059669;
            }
            .note-delete-btn {
                background: #ef4444;
                color: white;
                margin-right: auto;
            }
            .note-delete-btn:hover {
                background: #dc2626;
            }

            /* Note indicator styles */
            .note-indicator {
                animation: noteAppear 0.3s ease;
            }
            @keyframes noteAppear {
                from {
                    opacity: 0;
                    transform: scale(0.5);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            /* Note item in panel */
            .note-item {
                cursor: pointer;
            }
            .note-item .item-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .note-item .note-preview {
                font-size: 0.875rem;
                color: #6b7280;
                line-height: 1.4;
            }
            .note-item:hover .note-preview {
                color: #374151;
            }

            /* Dark mode for note modal */
            [data-theme="dark"] .note-modal {
                background: #1e293b;
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-modal-header,
            [data-theme="dark"] .note-modal-footer {
                border-color: #334155;
            }
            [data-theme="dark"] .note-modal-close {
                color: #9ca3af;
            }
            [data-theme="dark"] .note-modal-close:hover {
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-selected-text {
                background: #334155;
            }
            [data-theme="dark"] .note-selected-text strong {
                color: #9ca3af;
            }
            [data-theme="dark"] .note-selected-text p {
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-modal-body textarea {
                background: #334155;
                border-color: #475569;
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-content-display {
                background: #334155;
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-cancel-btn,
            [data-theme="dark"] .note-close-btn {
                background: #334155;
                color: #e5e7eb;
            }
            [data-theme="dark"] .note-cancel-btn:hover,
            [data-theme="dark"] .note-close-btn:hover {
                background: #475569;
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
        restoreNotes(); // Restore note indicators

        // Listen for sync updates
        window.addEventListener('syncComplete', (e) => {
            loadData();
            restoreHighlights(); // Re-apply highlights after sync
            restoreNotes(); // Re-apply note indicators after sync
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
