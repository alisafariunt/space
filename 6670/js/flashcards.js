// Flashcards Mode
(function () {
    let flashcards = [];
    let currentIndex = 0;
    let flashcardModal = null;
    let isFlipped = false;

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

    // Create flashcard modal
    function createFlashcardModal() {
        const modal = document.createElement('div');
        modal.id = 'flashcard-modal';
        modal.className = 'flashcard-modal';
        modal.innerHTML = `
            <div class="flashcard-container">
                <div class="flashcard-header">
                    <span id="flashcard-counter">1 / 1</span>
                    <button id="flashcard-close" aria-label="Close">✕</button>
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
                <div class="flashcard-hint">Click card or press Space to flip, ← → to navigate</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('flashcard-close').addEventListener('click', closeFlashcards);
        document.getElementById('flashcard-prev').addEventListener('click', prevCard);
        document.getElementById('flashcard-next').addEventListener('click', nextCard);
        document.getElementById('flashcard-flip').addEventListener('click', flipCard);
        document.getElementById('flashcard').addEventListener('click', flipCard);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeFlashcards();
        });

        return modal;
    }

    // Show current flashcard
    function showCard() {
        if (flashcards.length === 0) return;

        const card = flashcards[currentIndex];
        document.getElementById('flashcard-question').textContent = card.question;
        document.getElementById('flashcard-answer').textContent = card.answer.substring(0, 500) + (card.answer.length > 500 ? '...' : '');
        document.getElementById('flashcard-counter').textContent = `${currentIndex + 1} / ${flashcards.length}`;

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
        flashcards = extractFlashcards();
        if (flashcards.length === 0) {
            alert('No flashcards found on this page!');
            return;
        }

        if (!flashcardModal) {
            flashcardModal = createFlashcardModal();
        }

        currentIndex = 0;
        showCard();
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

    // Create flashcard button
    function createFlashcardButton() {
        const btn = document.createElement('button');
        btn.id = 'flashcard-btn';
        btn.className = 'flashcard-btn';
        btn.innerHTML = '🎴';
        btn.setAttribute('aria-label', 'Flashcards');
        btn.addEventListener('click', openFlashcards);

        const nav = document.querySelector('.main-nav') || document.querySelector('nav');
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
            case 'Escape':
                closeFlashcards();
                break;
        }
    });

    // Initialize
    document.addEventListener('DOMContentLoaded', createFlashcardButton);
})();
