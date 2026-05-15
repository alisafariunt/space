// Flashcards Mode
(function () {
    let flashcards = [];
    let currentIndex = 0;
    let flashcardModal = null;
    let isFlipped = false;
    let currentMode = 'page';

    // Extract Q&A from page
    function extractFlashcards() {
        const cards = [];

        // Find all Q&A pairs
        const sections = document.querySelectorAll('.analysis-section');
        sections.forEach(section => {
            const label = section.querySelector('.analysis-label');
            if (label && (label.textContent.includes('Q') || label.textContent.includes('SC'))) {
                const question = label.textContent.trim();
                const answerBox = section.querySelector('.success-box, .info-box');
                if (answerBox) {
                    const answer = answerBox.textContent.trim();
                    cards.push({ question, answer });
                }
            }
        });

        return cards;
    }

    function getCourseId() {
        const segments = (window.location.pathname || '').split('/').filter(Boolean);
        const course = segments[0];
        if (course === '6480' || course === '6670') return course;
        return 'general';
    }

    function getPageId() {
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

    function buildPageUrl(courseId, pageId, highlightId = '') {
        const file = pageId === 'index' ? 'index.html' : `${pageId}.html`;
        if (courseId && courseId !== 'general') {
            return `/${courseId}/${file}${highlightId ? `#hl=${highlightId}` : ''}`;
        }
        return `/${file}${highlightId ? `#hl=${highlightId}` : ''}`;
    }

    function loadHighlightStore() {
        try {
            const data = JSON.parse(localStorage.getItem('studyGuide_highlights') || '{}');
            return {
                highlights: data.highlights || [],
                notes: data.notes || []
            };
        } catch (e) {
            return { highlights: [], notes: [] };
        }
    }

    function buildHighlightCards({ dueOnly = false } = {}) {
        const { highlights, notes } = loadHighlightStore();
        const courseId = getCourseId();
        const noteMap = new Map();

        notes.forEach(note => {
            if (!note.highlightId) return;
            const existing = noteMap.get(note.highlightId);
            if (!existing || (note.updatedAt || note.createdAt) > (existing.updatedAt || existing.createdAt)) {
                noteMap.set(note.highlightId, note);
            }
        });

        const now = Date.now();
        const cards = highlights
            .filter(h => !courseId || h.courseId === courseId || !h.courseId)
            .map(h => {
                const srDueAt = h.srDueAt || h.sr_due_at || null;
                const dueTime = srDueAt ? Date.parse(srDueAt) : NaN;
                const isDue = !srDueAt || Number.isNaN(dueTime) || dueTime <= now;
                const note = noteMap.get(h.id);

                return {
                    type: 'highlight',
                    highlightId: h.id,
                    pageId: h.pageId,
                    courseId: h.courseId,
                    question: (h.text || '').trim(),
                    answer: note ? note.noteContent : '',
                    noteId: note ? note.id : null,
                    srDueAt: srDueAt,
                    srInterval: h.srInterval,
                    srEase: h.srEase,
                    srReps: h.srReps,
                    srLastReviewed: h.srLastReviewed,
                    isDue
                };
            })
            .filter(card => !dueOnly || card.isDue)
            .sort((a, b) => {
                const aDue = a.srDueAt ? Date.parse(a.srDueAt) : 0;
                const bDue = b.srDueAt ? Date.parse(b.srDueAt) : 0;
                return aDue - bDue;
            });

        return cards;
    }

    function normalizeSr(card) {
        return {
            srInterval: Number.isFinite(card.srInterval) ? Number(card.srInterval) : 1,
            srEase: Number.isFinite(card.srEase) ? Number(card.srEase) : 2.5,
            srReps: Number.isFinite(card.srReps) ? Number(card.srReps) : 0
        };
    }

    function computeNextSchedule(card, rating) {
        const now = new Date();
        const { srInterval, srEase, srReps } = normalizeSr(card);
        let interval = srInterval;
        let ease = srEase;
        let reps = srReps;

        if (rating === 'again') {
            reps = 0;
            interval = 1;
            ease = Math.max(1.3, ease - 0.2);
            const retryAt = new Date(now.getTime() + 10 * 60 * 1000);
            return {
                srInterval: interval,
                srEase: ease,
                srReps: reps,
                srLastReviewed: now.toISOString(),
                srDueAt: retryAt.toISOString()
            };
        }

        reps += 1;
        if (reps === 1) {
            interval = 1;
        } else if (reps === 2) {
            interval = 6;
        } else {
            const multiplier = rating === 'hard' ? 1.2 : rating === 'easy' ? 3.0 : 2.5;
            interval = Math.max(1, Math.round(interval * multiplier));
        }

        if (rating === 'hard') {
            ease = Math.max(1.3, ease - 0.15);
        } else if (rating === 'easy') {
            ease = Math.min(3.5, ease + 0.15);
        }

        const dueAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
        return {
            srInterval: interval,
            srEase: ease,
            srReps: reps,
            srLastReviewed: now.toISOString(),
            srDueAt: dueAt.toISOString()
        };
    }

    // Create flashcard modal
    function createFlashcardModal() {
        const modal = document.createElement('div');
        modal.id = 'flashcard-modal';
        modal.className = 'flashcard-modal';
        modal.innerHTML = `
            <div class="flashcard-container">
                <div class="flashcard-header">
                    <div class="flashcard-header-left">
                        <div class="flashcard-title">Flashcards</div>
                        <div class="flashcard-mode-toggle" role="tablist">
                            <button class="flashcard-mode-btn active" data-mode="page" aria-pressed="true">Page Q&amp;A</button>
                            <button class="flashcard-mode-btn" data-mode="highlights" aria-pressed="false">Highlights</button>
                            <button class="flashcard-mode-btn" data-mode="due" aria-pressed="false">Due Now</button>
                        </div>
                    </div>
                    <div class="flashcard-header-right">
                        <span id="flashcard-counter">1 / 1</span>
                        <button id="flashcard-close" aria-label="Close">✕</button>
                    </div>
                </div>
                <div class="flashcard-wrapper">
                    <div id="flashcard" class="flashcard">
                        <div class="flashcard-front">
                            <div class="flashcard-content" id="flashcard-question"></div>
                        </div>
                        <div class="flashcard-back">
                            <div class="flashcard-content" id="flashcard-answer"></div>
                        </div>
                    </div>
                </div>
                <div class="flashcard-controls">
                    <button id="flashcard-prev" class="flashcard-nav">← Previous</button>
                    <button id="flashcard-flip" class="flashcard-flip">Flip Card</button>
                    <button id="flashcard-next" class="flashcard-nav">Next →</button>
                </div>
                <div class="flashcard-review-controls" id="flashcard-review-controls">
                    <button class="flashcard-review-btn" data-rating="again">Again</button>
                    <button class="flashcard-review-btn" data-rating="hard">Hard</button>
                    <button class="flashcard-review-btn" data-rating="good">Good</button>
                    <button class="flashcard-review-btn" data-rating="easy">Easy</button>
                </div>
                <div class="flashcard-extra" id="flashcard-extra">
                    <button id="flashcard-open-note">Add/Edit Note</button>
                    <button id="flashcard-open-page">Open Page</button>
                </div>
                <div class="flashcard-hint" id="flashcard-hint">Click card or press Space to flip, ← → to navigate</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('flashcard-close').addEventListener('click', closeFlashcards);
        document.getElementById('flashcard-prev').addEventListener('click', prevCard);
        document.getElementById('flashcard-next').addEventListener('click', nextCard);
        document.getElementById('flashcard-flip').addEventListener('click', flipCard);
        document.getElementById('flashcard').addEventListener('click', flipCard);
        document.querySelectorAll('.flashcard-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setMode(btn.dataset.mode);
            });
        });
        document.querySelectorAll('.flashcard-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                rateCard(btn.dataset.rating);
            });
        });
        document.getElementById('flashcard-open-note').addEventListener('click', () => {
            openCurrentNote();
        });
        document.getElementById('flashcard-open-page').addEventListener('click', () => {
            openCurrentPage();
        });
        modal.addEventListener('click', e => {
            if (e.target === modal) closeFlashcards();
        });

        return modal;
    }

    // Show current flashcard
    function showCard() {
        const questionEl = document.getElementById('flashcard-question');
        const answerEl = document.getElementById('flashcard-answer');
        const counterEl = document.getElementById('flashcard-counter');
        const reviewControls = document.getElementById('flashcard-review-controls');
        const extraControls = document.getElementById('flashcard-extra');
        const hintEl = document.getElementById('flashcard-hint');
        const openNoteBtn = document.getElementById('flashcard-open-note');
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');

        if (flashcards.length === 0) {
            questionEl.textContent = 'No cards found';
            answerEl.textContent = currentMode === 'page'
                ? 'No Q&A sections were detected on this page.'
                : 'Create highlights (and notes) to build your study deck.';
            counterEl.textContent = '0 / 0';
            reviewControls.style.display = 'none';
            extraControls.style.display = 'none';
            hintEl.textContent = currentMode === 'page'
                ? 'Try another page or switch decks.'
                : 'Highlights automatically turn into flashcards.';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            isFlipped = false;
            document.getElementById('flashcard').classList.remove('flipped');
            return;
        }

        const card = flashcards[currentIndex];
        const answerText = card.answer
            ? card.answer
            : 'No note yet. Add a note to make this flashcard stronger.';

        questionEl.textContent = card.question || 'Untitled highlight';
        answerEl.textContent = answerText.substring(0, 500) + (answerText.length > 500 ? '...' : '');
        counterEl.textContent = `${currentIndex + 1} / ${flashcards.length}`;

        const isHighlightMode = currentMode !== 'page';
        reviewControls.style.display = isHighlightMode ? 'flex' : 'none';
        extraControls.style.display = isHighlightMode ? 'flex' : 'none';
        hintEl.textContent = isHighlightMode
            ? 'Rate your recall to schedule the next review.'
            : 'Click card or press Space to flip, ← → to navigate';
        if (openNoteBtn) {
            openNoteBtn.textContent = card.answer ? 'Edit Note' : 'Add Note';
        }
        prevBtn.disabled = flashcards.length <= 1;
        nextBtn.disabled = flashcards.length <= 1;

        // Reset flip state
        isFlipped = false;
        document.getElementById('flashcard').classList.remove('flipped');
    }

    // Flip card
    function flipCard() {
        isFlipped = !isFlipped;
        document.getElementById('flashcard').classList.toggle('flipped', isFlipped);
    }

    // Navigate cards
    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            showCard();
        }
    }

    function nextCard() {
        if (currentIndex < flashcards.length - 1) {
            currentIndex++;
            showCard();
        }
    }

    // Open flashcards
    function openFlashcards() {
        if (!flashcardModal) {
            flashcardModal = createFlashcardModal();
        }

        setMode('page');
        if (flashcards.length === 0) {
            setMode('highlights');
        }
        flashcardModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close flashcards
    function closeFlashcards() {
        if (flashcardModal) {
            flashcardModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function setMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.flashcard-mode-btn').forEach(btn => {
            const active = btn.dataset.mode === mode;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (mode === 'page') {
            flashcards = extractFlashcards().map(card => ({
                type: 'page',
                question: card.question,
                answer: card.answer
            }));
        } else {
            flashcards = buildHighlightCards({ dueOnly: mode === 'due' });
        }
        currentIndex = 0;
        showCard();
    }

    function updateLocalHighlight(id, updates) {
        const data = loadHighlightStore();
        const index = data.highlights.findIndex(h => h.id === id);
        if (index < 0) return;
        data.highlights[index] = { ...data.highlights[index], ...updates };
        localStorage.setItem('studyGuide_highlights', JSON.stringify(data));
    }

    function rateCard(rating) {
        const card = flashcards[currentIndex];
        if (!card || card.type !== 'highlight') return;

        const updates = computeNextSchedule(card, rating);
        if (window.StudyGuideHighlights?.updateHighlightMeta) {
            window.StudyGuideHighlights.updateHighlightMeta(card.highlightId, updates);
        } else {
            updateLocalHighlight(card.highlightId, updates);
        }

        Object.assign(card, updates);

        if (currentMode === 'due') {
            flashcards.splice(currentIndex, 1);
            if (currentIndex >= flashcards.length) {
                currentIndex = Math.max(0, flashcards.length - 1);
            }
            showCard();
            return;
        }

        nextCard();
    }

    function openCurrentNote() {
        const card = flashcards[currentIndex];
        if (!card || card.type !== 'highlight') return;
        if (window.StudyGuideHighlights?.openNoteForHighlight) {
            window.StudyGuideHighlights.openNoteForHighlight(card.highlightId);
            return;
        }
        window.location.href = buildPageUrl(card.courseId, card.pageId, card.highlightId);
    }

    function openCurrentPage() {
        const card = flashcards[currentIndex];
        if (!card || card.type !== 'highlight') return;
        const url = buildPageUrl(card.courseId, card.pageId, card.highlightId);
        window.location.href = url;
    }

    // Create flashcard button
    function createFlashcardButton() {
        const btn = document.createElement('button');
        btn.id = 'flashcard-btn';
        btn.className = 'flashcard-btn';
        btn.innerHTML = '🎴';
        btn.setAttribute('aria-label', 'Flashcards');
        btn.addEventListener('click', openFlashcards);

        const nav = document.querySelector('.nav-actions') || document.querySelector('.navbar-content') || document.querySelector('nav');
        if (nav) {
            nav.appendChild(btn);
        } else {
            btn.style.position = 'fixed';
            btn.style.top = '1rem';
            btn.style.right = '7rem';
            btn.style.zIndex = '1000';
            document.body.appendChild(btn);
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (!flashcardModal?.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                prevCard();
                break;
            case 'ArrowRight':
                nextCard();
                break;
            case ' ':
                e.preventDefault();
                flipCard();
                break;
            case '1':
                if (currentMode !== 'page') rateCard('again');
                break;
            case '2':
                if (currentMode !== 'page') rateCard('hard');
                break;
            case '3':
                if (currentMode !== 'page') rateCard('good');
                break;
            case '4':
                if (currentMode !== 'page') rateCard('easy');
                break;
            case 'Escape':
                closeFlashcards();
                break;
        }
    });

    // Initialize
    document.addEventListener('DOMContentLoaded', createFlashcardButton);
})();
