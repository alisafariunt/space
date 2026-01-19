// Text-to-Speech Feature
(function () {
    let isPlaying = false;
    let currentUtterance = null;
    let ttsPanel = null;
    let voices = [];
    let currentParagraphIndex = 0;
    let paragraphs = [];
    const STORAGE_KEY = 'studyGuide_tts_preferences';

    // Default settings
    let settings = {
        speed: 1.0,
        volume: 0.8,
        voiceIndex: 0,
        autoScroll: true,
        highlightWords: false
    };

    // Load settings
    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            settings = { ...settings, ...saved };
        } catch (e) { }
    }

    // Save settings
    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // Get available voices
    function loadVoices() {
        voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
                updateVoiceSelect();
            };
        }
    }

    // Update voice dropdown
    function updateVoiceSelect() {
        const select = document.getElementById('tts-voice-select');
        if (!select || voices.length === 0) return;

        // Prefer English voices
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        const otherVoices = voices.filter(v => !v.lang.startsWith('en'));
        const sortedVoices = [...englishVoices, ...otherVoices];

        select.innerHTML = sortedVoices.map((voice, i) => {
            const originalIndex = voices.indexOf(voice);
            return `<option value="${originalIndex}" ${originalIndex === settings.voiceIndex ? 'selected' : ''}>
                ${voice.name} (${voice.lang})
            </option>`;
        }).join('');
    }

    // Get readable content from page
    function getPageContent() {
        const content = document.querySelector('.container') || document.querySelector('main') || document.body;
        const elements = content.querySelectorAll('h1, h2, h3, h4, p, li, td, blockquote');

        paragraphs = [];
        elements.forEach(el => {
            // Skip hidden elements and nav
            if (el.closest('nav') || el.closest('.navbar') || el.closest('.tts-panel')) return;
            if (el.offsetParent === null) return;

            const text = el.textContent.trim();
            if (text && text.length > 2) {
                paragraphs.push({
                    element: el,
                    text: text.replace(/\s+/g, ' ')
                });
            }
        });

        return paragraphs;
    }

    // Speak text
    function speak(text, onEnd) {
        if (!text) return;

        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.rate = settings.speed;
        currentUtterance.volume = settings.volume;

        if (voices.length > 0 && settings.voiceIndex < voices.length) {
            currentUtterance.voice = voices[settings.voiceIndex];
        }

        currentUtterance.onend = () => {
            if (onEnd) onEnd();
        };

        currentUtterance.onerror = (e) => {
            console.error('TTS Error:', e);
            stopSpeaking();
        };

        speechSynthesis.speak(currentUtterance);
    }

    // Play/pause toggle
    function togglePlay() {
        if (isPlaying) {
            pauseSpeaking();
        } else {
            startSpeaking();
        }
    }

    // Start speaking
    function startSpeaking() {
        if (paragraphs.length === 0) {
            getPageContent();
        }

        if (paragraphs.length === 0) {
            alert('No readable content found on this page.');
            return;
        }

        isPlaying = true;
        updatePlayButton();
        speakNextParagraph();
    }

    // Speak next paragraph
    function speakNextParagraph() {
        if (!isPlaying || currentParagraphIndex >= paragraphs.length) {
            stopSpeaking();
            return;
        }

        const para = paragraphs[currentParagraphIndex];

        // Highlight current paragraph
        highlightParagraph(para.element, true);

        // Auto-scroll
        if (settings.autoScroll) {
            para.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update UI
        updateNowReading(para.text);

        speak(para.text, () => {
            highlightParagraph(para.element, false);
            currentParagraphIndex++;
            speakNextParagraph();
        });
    }

    // Highlight paragraph being read
    function highlightParagraph(element, active) {
        // Remove previous highlights
        document.querySelectorAll('.tts-reading').forEach(el => {
            el.classList.remove('tts-reading');
        });

        if (active && element) {
            element.classList.add('tts-reading');
        }
    }

    // Update "Now Reading" display
    function updateNowReading(text) {
        const display = document.getElementById('tts-now-reading');
        if (display) {
            display.textContent = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }
    }

    // Pause speaking
    function pauseSpeaking() {
        speechSynthesis.pause();
        isPlaying = false;
        updatePlayButton();
    }

    // Resume speaking
    function resumeSpeaking() {
        speechSynthesis.resume();
        isPlaying = true;
        updatePlayButton();
    }

    // Stop speaking
    function stopSpeaking() {
        speechSynthesis.cancel();
        isPlaying = false;
        currentParagraphIndex = 0;
        highlightParagraph(null, false);
        updatePlayButton();
        updateNowReading('Ready to read...');
    }

    // Skip forward
    function skipForward() {
        if (currentParagraphIndex < paragraphs.length - 1) {
            speechSynthesis.cancel();
            currentParagraphIndex++;
            if (isPlaying) {
                speakNextParagraph();
            }
        }
    }

    // Skip backward
    function skipBackward() {
        if (currentParagraphIndex > 0) {
            speechSynthesis.cancel();
            currentParagraphIndex--;
            if (isPlaying) {
                speakNextParagraph();
            }
        }
    }

    // Update play button
    function updatePlayButton() {
        const btn = document.getElementById('tts-play-btn');
        if (btn) {
            btn.innerHTML = isPlaying ? '⏸️ Pause' : '▶️ Play';
        }
    }

    // Set speed
    function setSpeed(speed) {
        settings.speed = parseFloat(speed);
        saveSettings();

        // Update active button
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === settings.speed);
        });

        // If currently speaking, restart with new speed
        if (isPlaying) {
            speechSynthesis.cancel();
            speakNextParagraph();
        }
    }

    // Set volume
    function setVolume(volume) {
        settings.volume = parseFloat(volume);
        saveSettings();
    }

    // Set voice
    function setVoice(index) {
        settings.voiceIndex = parseInt(index);
        saveSettings();
    }

    // Toggle auto-scroll
    function toggleAutoScroll() {
        settings.autoScroll = !settings.autoScroll;
        saveSettings();
        const checkbox = document.getElementById('tts-autoscroll');
        if (checkbox) checkbox.checked = settings.autoScroll;
    }

    // Create TTS panel
    function createTTSPanel() {
        const panel = document.createElement('div');
        panel.id = 'tts-panel';
        panel.className = 'tts-panel';
        panel.innerHTML = `
            <div class="tts-header">
                <span>🎙️ Text-to-Speech</span>
                <button id="tts-close" title="Close">×</button>
            </div>
            <div class="tts-now-reading" id="tts-now-reading">Ready to read...</div>
            <div class="tts-controls">
                <button id="tts-prev" class="tts-nav-btn" title="Previous">⏮️</button>
                <button id="tts-play-btn" class="tts-play-btn">▶️ Play</button>
                <button id="tts-next" class="tts-nav-btn" title="Next">⏭️</button>
                <div class="tts-volume">
                    🔊 <input type="range" id="tts-volume" min="0" max="1" step="0.1" value="${settings.volume}">
                </div>
            </div>
            <div class="tts-speed">
                <span>Speed:</span>
                <button class="speed-btn ${settings.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
                <button class="speed-btn ${settings.speed === 0.75 ? 'active' : ''}" data-speed="0.75">0.75x</button>
                <button class="speed-btn ${settings.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
                <button class="speed-btn ${settings.speed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
                <button class="speed-btn ${settings.speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
                <button class="speed-btn ${settings.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            </div>
            <div class="tts-options">
                <select id="tts-voice-select" title="Voice">
                    <option>Loading voices...</option>
                </select>
                <label class="tts-checkbox">
                    <input type="checkbox" id="tts-autoscroll" ${settings.autoScroll ? 'checked' : ''}>
                    Auto-scroll
                </label>
            </div>
        `;
        document.body.appendChild(panel);

        // Event listeners
        panel.querySelector('#tts-close').addEventListener('click', toggleTTSPanel);
        panel.querySelector('#tts-play-btn').addEventListener('click', togglePlay);
        panel.querySelector('#tts-prev').addEventListener('click', skipBackward);
        panel.querySelector('#tts-next').addEventListener('click', skipForward);
        panel.querySelector('#tts-volume').addEventListener('input', (e) => setVolume(e.target.value));
        panel.querySelector('#tts-voice-select').addEventListener('change', (e) => setVoice(e.target.value));
        panel.querySelector('#tts-autoscroll').addEventListener('change', toggleAutoScroll);

        // Speed buttons
        panel.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => setSpeed(btn.dataset.speed));
        });

        // Load voices
        updateVoiceSelect();

        return panel;
    }

    // Toggle TTS panel
    function toggleTTSPanel() {
        if (!ttsPanel) {
            ttsPanel = createTTSPanel();
        }
        ttsPanel.classList.toggle('open');

        if (!ttsPanel.classList.contains('open')) {
            stopSpeaking();
        } else {
            getPageContent(); // Prepare content
        }
    }

    // Create TTS button
    function createTTSButton() {
        const btn = document.createElement('button');
        btn.id = 'tts-btn';
        btn.className = 'tts-btn';
        btn.innerHTML = '🎙️';
        btn.title = 'Text-to-Speech';
        btn.addEventListener('click', toggleTTSPanel);

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

    // Inject CSS
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tts-panel {
                position: fixed;
                bottom: -300px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 600px;
                background: white;
                border-radius: 16px 16px 0 0;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
                z-index: 9999;
                transition: bottom 0.3s ease;
                padding: 15px 20px;
            }
            .tts-panel.open {
                bottom: 0;
            }
            .tts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-weight: 600;
            }
            .tts-header button {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .tts-now-reading {
                background: #f3f4f6;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                color: #666;
                margin-bottom: 15px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .tts-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            .tts-nav-btn, .tts-play-btn {
                background: #1e40af;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 16px;
            }
            .tts-play-btn {
                padding: 12px 30px;
                font-size: 18px;
            }
            .tts-nav-btn:hover, .tts-play-btn:hover {
                background: #1e3a8a;
            }
            .tts-volume {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .tts-volume input {
                width: 80px;
            }
            .tts-speed {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }
            .speed-btn {
                padding: 6px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                background: white;
                cursor: pointer;
                font-size: 13px;
            }
            .speed-btn.active {
                background: #1e40af;
                color: white;
                border-color: #1e40af;
            }
            .tts-options {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .tts-options select {
                flex: 1;
                padding: 8px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }
            .tts-checkbox {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                cursor: pointer;
            }
            .tts-reading {
                background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%) !important;
                border-left: 4px solid #3b82f6 !important;
                padding-left: 10px;
                transition: background 0.3s;
            }
            [data-theme="dark"] .tts-panel {
                background: #1e293b;
                color: #e5e7eb;
            }
            [data-theme="dark"] .tts-now-reading {
                background: #334155;
            }
            [data-theme="dark"] .tts-options select {
                background: #334155;
                color: #e5e7eb;
                border-color: #475569;
            }
            [data-theme="dark"] .tts-reading {
                background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only when TTS panel is open
            if (!ttsPanel?.classList.contains('open')) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    skipBackward();
                    break;
                case 'ArrowRight':
                    skipForward();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSpeed(Math.min(2, settings.speed + 0.25));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSpeed(Math.max(0.5, settings.speed - 0.25));
                    break;
                case 'Escape':
                    toggleTTSPanel();
                    break;
            }
        });
    }

    // Initialize
    function init() {
        // Check if Speech Synthesis is supported
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-Speech is not supported in this browser.');
            return;
        }

        loadSettings();
        loadVoices();
        injectStyles();
        createTTSButton();
        setupKeyboardShortcuts();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
