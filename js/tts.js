// Text-to-Speech Feature - Using Murf.ai (Premium Natural Voices)
(function () {
    let isPlaying = false;
    let isPaused = false;
    let ttsPanel = null;
    let currentParagraphIndex = 0;
    let paragraphs = [];
    let audioElement = null;
    let isLoading = false;
    const STORAGE_KEY = 'studyGuide_tts_preferences';

    // Murf.ai Premium Voices (correct IDs from API)
    const VOICES = {
        'en-US-terrell': { name: 'Terrell', flag: 'US' },
        'en-US-ryan': { name: 'Ryan', flag: 'US' },
        'en-US-miles': { name: 'Miles', flag: 'US' },
        'en-US-denzel': { name: 'Denzel', flag: 'US' },
        'en-US-natalie': { name: 'Natalie', flag: 'US' },
        'en-US-samantha': { name: 'Samantha', flag: 'US' },
        'en-US-charlotte': { name: 'Charlotte', flag: 'US' },
        'en-UK-peter': { name: 'Peter', flag: 'UK' },
    };

    // Default settings - Terrell is a good narrator voice
    let settings = {
        speed: 1.0,
        volume: 0.8,
        voiceId: 'en-US-terrell',
        autoScroll: true
    };

    // Load settings
    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            settings = { ...settings, ...saved };
        } catch (e) { }

        if (!VOICES[settings.voiceId]) {
            settings.voiceId = 'en-US-terrell';
        }
    }

    // Queue for cloud sync
    function queueSync(type, action, data) {
        if (window.StudyGuideSync) {
            window.StudyGuideSync.queueChange(type, action, data);
        }
    }

    // Save settings
    function saveSettings() {
        const prefs = {
            ttsSpeed: settings.speed,
            ttsVolume: settings.volume,
            ttsVoice: settings.voiceId,
            ttsAutoscroll: settings.autoScroll,
            theme: document.documentElement.getAttribute('data-theme') || 'light'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        queueSync('preferences', 'upsert', prefs);
    }

    // Update voice dropdown
    function updateVoiceSelect() {
        const select = document.getElementById('tts-voice-select');
        if (!select) return;

        let html = '';
        Object.entries(VOICES).forEach(([id, voice]) => {
            const selected = id === settings.voiceId ? 'selected' : '';
            html += `<option value="${id}" ${selected}>${voice.flag} ${voice.name}</option>`;
        });
        select.innerHTML = html;
    }

    // Get readable content from page
    function getPageContent() {
        const content = document.querySelector('.container') || document.querySelector('main') || document.body;
        const elements = content.querySelectorAll('h1, h2, h3, h4, p, li, td, blockquote');

        paragraphs = [];
        elements.forEach(el => {
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

    // Generate speech from API
    async function generateSpeech(text) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            try {
                const token = window.AuthManager?.getAccessToken?.();
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) { }

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text: text,
                    voice: settings.voiceId,
                    speed: settings.speed
                })
            });

            if (!response.ok) {
                if (response.status === 401 && window.showLoginModal) {
                    window.showLoginModal('Please login to use Text-to-Speech.');
                }
                const err = await response.json();
                throw new Error(err.error || 'TTS failed');
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('TTS error:', error);
            showToast('TTS generation failed: ' + error.message, 'error');
            return null;
        }
    }

    // Play audio
    function playAudio(url, onEnd) {
        if (!audioElement) {
            audioElement = new Audio();
        }

        audioElement.src = url;
        audioElement.volume = settings.volume;
        audioElement.playbackRate = settings.speed;

        audioElement.onended = () => {
            URL.revokeObjectURL(url);
            if (onEnd) onEnd();
        };

        audioElement.onerror = () => {
            URL.revokeObjectURL(url);
            if (onEnd) onEnd();
        };

        audioElement.play().catch(e => {
            console.error('Playback error:', e);
            if (onEnd) onEnd();
        });
    }

    // Toggle play/pause
    function togglePlay() {
        if (isLoading) return;

        if (isPlaying) {
            pauseSpeaking();
        } else if (isPaused) {
            resumeSpeaking();
        } else {
            startSpeaking();
        }
    }

    // Start speaking
    async function startSpeaking() {
        if (paragraphs.length === 0) {
            getPageContent();
        }

        if (paragraphs.length === 0) {
            showToast('No readable content found.', 'warning');
            return;
        }

        isPlaying = true;
        isPaused = false;
        updatePlayButton();
        await speakNextParagraph();
    }

    // Speak next paragraph
    async function speakNextParagraph() {
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
        updateProgress();

        // Show loading state
        isLoading = true;
        updatePlayButton();

        // Generate speech
        const audioUrl = await generateSpeech(para.text);

        isLoading = false;
        updatePlayButton();

        if (audioUrl && isPlaying) {
            playAudio(audioUrl, () => {
                highlightParagraph(para.element, false);
                currentParagraphIndex++;
                if (isPlaying) {
                    speakNextParagraph();
                }
            });
        } else if (!audioUrl) {
            stopSpeaking();
        }
    }

    // Show toast
    function showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[TTS] ${message}`);
        }
    }

    // Highlight paragraph
    function highlightParagraph(element, active) {
        document.querySelectorAll('.tts-reading').forEach(el => {
            el.classList.remove('tts-reading');
        });
        if (active && element) {
            element.classList.add('tts-reading');
        }
    }

    // Update now reading display
    function updateNowReading(text) {
        const display = document.getElementById('tts-now-reading');
        if (display) {
            display.textContent = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }
    }

    // Update progress
    function updateProgress() {
        const progress = document.getElementById('tts-progress');
        if (progress && paragraphs.length > 0) {
            progress.textContent = `${currentParagraphIndex + 1} / ${paragraphs.length}`;
        }
    }

    // Pause
    function pauseSpeaking() {
        if (audioElement) audioElement.pause();
        isPlaying = false;
        isPaused = true;
        updatePlayButton();
    }

    // Resume
    function resumeSpeaking() {
        if (audioElement && audioElement.paused) {
            audioElement.play();
        }
        isPlaying = true;
        isPaused = false;
        updatePlayButton();
    }

    // Stop
    function stopSpeaking() {
        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
        }
        isPlaying = false;
        isPaused = false;
        currentParagraphIndex = 0;
        highlightParagraph(null, false);
        updatePlayButton();
        updateNowReading('Ready to read...');
        updateProgress();
    }

    // Skip forward
    function skipForward() {
        if (currentParagraphIndex < paragraphs.length - 1) {
            if (audioElement) audioElement.pause();
            currentParagraphIndex++;
            if (isPlaying) speakNextParagraph();
            else updateProgress();
        }
    }

    // Skip backward
    function skipBackward() {
        if (currentParagraphIndex > 0) {
            if (audioElement) audioElement.pause();
            currentParagraphIndex--;
            if (isPlaying) speakNextParagraph();
            else updateProgress();
        }
    }

    // Update play button
    function updatePlayButton() {
        const btn = document.getElementById('tts-play-btn');
        if (!btn) return;

        if (isLoading) {
            btn.innerHTML = 'Loading...';
            btn.disabled = true;
        } else if (isPlaying) {
            btn.innerHTML = 'Pause';
            btn.disabled = false;
        } else if (isPaused) {
            btn.innerHTML = 'Resume';
            btn.disabled = false;
        } else {
            btn.innerHTML = 'Play';
            btn.disabled = false;
        }
    }

    // Set speed
    function setSpeed(speed) {
        settings.speed = parseFloat(speed);
        if (audioElement) {
            audioElement.playbackRate = settings.speed;
        }
        saveSettings();
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === settings.speed);
        });
    }

    // Set volume
    function setVolume(volume) {
        settings.volume = parseFloat(volume);
        if (audioElement) audioElement.volume = settings.volume;
        saveSettings();
    }

    // Set voice
    function setVoice(voiceId) {
        settings.voiceId = voiceId;
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
                <span>Natural Voice Reader</span>
                <span id="tts-progress" class="tts-progress">0 / 0</span>
                <button id="tts-close" title="Close">X</button>
            </div>
            <div class="tts-now-reading" id="tts-now-reading">Ready to read...</div>
            <div class="tts-controls">
                <button id="tts-prev" class="tts-nav-btn" title="Previous">Prev</button>
                <button id="tts-play-btn" class="tts-play-btn">Play</button>
                <button id="tts-next" class="tts-nav-btn" title="Next">Next</button>
                <div class="tts-volume">
                    Vol: <input type="range" id="tts-volume" min="0" max="1" step="0.1" value="${settings.volume}">
                </div>
            </div>
            <div class="tts-speed">
                <span>Speed:</span>
                <button class="speed-btn ${settings.speed === 0.75 ? 'active' : ''}" data-speed="0.75">0.75x</button>
                <button class="speed-btn ${settings.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
                <button class="speed-btn ${settings.speed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
                <button class="speed-btn ${settings.speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
            </div>
            <div class="tts-options">
                <select id="tts-voice-select" title="Voice"></select>
                <label class="tts-checkbox">
                    <input type="checkbox" id="tts-autoscroll" ${settings.autoScroll ? 'checked' : ''}>
                    Auto-scroll
                </label>
            </div>
            <div class="tts-info">
                Powered by Murf.ai - Premium Natural Voices
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

        panel.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => setSpeed(btn.dataset.speed));
        });

        updateVoiceSelect();
        return panel;
    }

    // Toggle panel
    function toggleTTSPanel() {
        if (!ttsPanel) {
            ttsPanel = createTTSPanel();
        }
        ttsPanel.classList.toggle('open');

        if (!ttsPanel.classList.contains('open')) {
            stopSpeaking();
        } else {
            getPageContent();
            updateProgress();
        }
    }

    // Create TTS button
    function createTTSButton() {
        const btn = document.createElement('button');
        btn.id = 'tts-btn';
        btn.className = 'tts-btn';
        btn.innerHTML = 'TTS';
        btn.title = 'Natural Voice Reader';
        btn.addEventListener('click', toggleTTSPanel);

        const nav = document.querySelector('.nav-actions') || document.querySelector('.navbar-content') || document.querySelector('nav');
        if (nav) {
            btn.style.cssText = `
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 0.9rem;
                cursor: pointer;
                color: inherit;
            `;
            nav.appendChild(btn);
        }
    }

    // Inject styles
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tts-panel {
                position: fixed;
                bottom: -350px;
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
            .tts-panel.open { bottom: 0; }
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
                font-size: 18px;
                cursor: pointer;
                color: #666;
            }
            .tts-progress {
                font-size: 12px;
                color: #666;
                background: #f3f4f6;
                padding: 4px 8px;
                border-radius: 12px;
            }
            .tts-now-reading {
                background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
                padding: 12px 15px;
                border-radius: 8px;
                font-size: 14px;
                color: #1e40af;
                margin-bottom: 15px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                border-left: 4px solid #3b82f6;
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
                font-size: 14px;
                transition: all 0.2s;
            }
            .tts-play-btn {
                padding: 12px 30px;
                font-size: 16px;
                min-width: 120px;
            }
            .tts-play-btn:disabled {
                background: #94a3b8;
                cursor: wait;
            }
            .tts-nav-btn:hover, .tts-play-btn:hover:not(:disabled) {
                background: #1e3a8a;
                transform: scale(1.05);
            }
            .tts-volume {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .tts-volume input { width: 80px; }
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
                transition: all 0.2s;
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
                margin-bottom: 10px;
            }
            .tts-options select {
                flex: 1;
                padding: 8px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
            }
            .tts-checkbox {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                cursor: pointer;
            }
            .tts-info {
                text-align: center;
                font-size: 12px;
                color: #059669;
                background: #d1fae5;
                padding: 8px;
                border-radius: 8px;
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
                background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
                color: #93c5fd;
            }
            [data-theme="dark"] .tts-progress {
                background: #334155;
                color: #94a3b8;
            }
            [data-theme="dark"] .tts-options select {
                background: #334155;
                color: #e5e7eb;
                border-color: #475569;
            }
            [data-theme="dark"] .tts-info {
                background: #064e3b;
                color: #6ee7b7;
            }
            [data-theme="dark"] .tts-reading {
                background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%) !important;
            }
            [data-theme="dark"] .speed-btn {
                background: #334155;
                color: #e5e7eb;
                border-color: #475569;
            }
        `;
        document.head.appendChild(style);
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
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
                case 'Escape':
                    toggleTTSPanel();
                    break;
            }
        });
    }

    // Initialize
    function init() {
        loadSettings();
        injectStyles();
        createTTSButton();
        setupKeyboardShortcuts();
        console.log('[TTS] Murf.ai premium voices loaded');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
