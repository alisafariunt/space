// Text-to-Speech Feature - Using Microsoft Edge TTS (Free & Natural)
(function () {
    let isPlaying = false;
    let isPaused = false;
    let ttsPanel = null;
    let voices = [];
    let currentParagraphIndex = 0;
    let paragraphs = [];
    let audioElement = null;
    let audioQueue = [];
    let isGenerating = false;
    const STORAGE_KEY = 'studyGuide_tts_preferences';

    // Edge TTS voices - natural sounding, free
    const EDGE_VOICES = [
        { id: 'en-US-AriaNeural', name: 'Aria (US Female)', lang: 'en-US', gender: 'Female' },
        { id: 'en-US-GuyNeural', name: 'Guy (US Male)', lang: 'en-US', gender: 'Male' },
        { id: 'en-US-JennyNeural', name: 'Jenny (US Female)', lang: 'en-US', gender: 'Female' },
        { id: 'en-US-ChristopherNeural', name: 'Christopher (US Male)', lang: 'en-US', gender: 'Male' },
        { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', lang: 'en-GB', gender: 'Female' },
        { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', lang: 'en-GB', gender: 'Male' },
        { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)', lang: 'en-AU', gender: 'Female' },
    ];

    // Default settings
    let settings = {
        speed: 1.0,
        volume: 0.8,
        voiceId: 'en-US-AriaNeural',
        autoScroll: true,
        useEdgeTTS: true // Use Edge TTS by default
    };

    // Fallback to browser TTS
    let browserVoices = [];

    // Load settings
    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            settings = { ...settings, ...saved };
        } catch (e) { }
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
        queueSync('preferences', 'update', prefs);
    }

    // Load browser voices as fallback
    function loadBrowserVoices() {
        browserVoices = speechSynthesis.getVoices();
        if (browserVoices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                browserVoices = speechSynthesis.getVoices();
                updateVoiceSelect();
            };
        }
    }

    // Update voice dropdown
    function updateVoiceSelect() {
        const select = document.getElementById('tts-voice-select');
        if (!select) return;

        // Add Edge TTS voices first (marked as recommended)
        let html = '<optgroup label="🌟 Natural Voices (Recommended)">';
        EDGE_VOICES.forEach(voice => {
            const selected = voice.id === settings.voiceId ? 'selected' : '';
            html += `<option value="${voice.id}" ${selected}>${voice.name}</option>`;
        });
        html += '</optgroup>';

        // Add browser voices as fallback
        if (browserVoices.length > 0) {
            const englishVoices = browserVoices.filter(v => v.lang.startsWith('en'));
            if (englishVoices.length > 0) {
                html += '<optgroup label="📱 Browser Voices (Fallback)">';
                englishVoices.forEach((voice, i) => {
                    const selected = `browser-${i}` === settings.voiceId ? 'selected' : '';
                    html += `<option value="browser-${i}" ${selected}>${voice.name}</option>`;
                });
                html += '</optgroup>';
            }
        }

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

    // Generate speech using Edge TTS API
    async function generateEdgeTTS(text, voiceId, rate = 1.0) {
        const apiUrl = '/api/tts';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: voiceId,
                    rate: rate
                })
            });

            if (!response.ok) {
                throw new Error('TTS API error');
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Edge TTS error:', error);
            return null;
        }
    }

    // Speak using browser TTS (fallback)
    function speakBrowser(text, onEnd) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.speed;
        utterance.volume = settings.volume;

        if (settings.voiceId.startsWith('browser-')) {
            const index = parseInt(settings.voiceId.replace('browser-', ''));
            if (browserVoices[index]) {
                utterance.voice = browserVoices[index];
            }
        }

        utterance.onend = onEnd;
        utterance.onerror = (e) => {
            console.error('Browser TTS Error:', e);
            if (onEnd) onEnd();
        };

        speechSynthesis.speak(utterance);
    }

    // Play audio from URL
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

        audioElement.onerror = (e) => {
            console.error('Audio playback error:', e);
            URL.revokeObjectURL(url);
            if (onEnd) onEnd();
        };

        audioElement.play().catch(e => {
            console.error('Play error:', e);
            if (onEnd) onEnd();
        });
    }

    // Toggle play/pause
    function togglePlay() {
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
            showToast('No readable content found on this page.', 'warning');
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

        // Check if using Edge TTS or browser TTS
        const isEdgeVoice = EDGE_VOICES.some(v => v.id === settings.voiceId);

        if (isEdgeVoice) {
            // Use Edge TTS
            isGenerating = true;
            updatePlayButton();

            const audioUrl = await generateEdgeTTS(para.text, settings.voiceId, settings.speed);
            isGenerating = false;
            updatePlayButton();

            if (audioUrl && isPlaying) {
                playAudio(audioUrl, () => {
                    highlightParagraph(para.element, false);
                    currentParagraphIndex++;
                    speakNextParagraph();
                });
            } else {
                // Fallback to browser TTS
                console.warn('Edge TTS failed, using browser TTS fallback');
                speakBrowser(para.text, () => {
                    highlightParagraph(para.element, false);
                    currentParagraphIndex++;
                    speakNextParagraph();
                });
            }
        } else {
            // Use browser TTS
            speakBrowser(para.text, () => {
                highlightParagraph(para.element, false);
                currentParagraphIndex++;
                speakNextParagraph();
            });
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[TTS] ${message}`);
        }
    }

    // Highlight paragraph being read
    function highlightParagraph(element, active) {
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

    // Update progress display
    function updateProgress() {
        const progress = document.getElementById('tts-progress');
        if (progress && paragraphs.length > 0) {
            progress.textContent = `${currentParagraphIndex + 1} / ${paragraphs.length}`;
        }
    }

    // Pause speaking
    function pauseSpeaking() {
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
        }
        speechSynthesis.pause();
        isPlaying = false;
        isPaused = true;
        updatePlayButton();
    }

    // Resume speaking
    function resumeSpeaking() {
        if (audioElement && audioElement.paused && audioElement.src) {
            audioElement.play();
        }
        speechSynthesis.resume();
        isPlaying = true;
        isPaused = false;
        updatePlayButton();
    }

    // Stop speaking
    function stopSpeaking() {
        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
        }
        speechSynthesis.cancel();
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
            if (audioElement) audioElement.pause();
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
            if (isGenerating) {
                btn.innerHTML = '⏳ Loading...';
                btn.disabled = true;
            } else if (isPlaying) {
                btn.innerHTML = '⏸️ Pause';
                btn.disabled = false;
            } else if (isPaused) {
                btn.innerHTML = '▶️ Resume';
                btn.disabled = false;
            } else {
                btn.innerHTML = '▶️ Play';
                btn.disabled = false;
            }
        }
    }

    // Set speed
    function setSpeed(speed) {
        settings.speed = parseFloat(speed);
        saveSettings();

        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === settings.speed);
        });

        // Update audio playback rate if playing
        if (audioElement && !audioElement.paused) {
            audioElement.playbackRate = settings.speed;
        }
    }

    // Set volume
    function setVolume(volume) {
        settings.volume = parseFloat(volume);
        saveSettings();

        if (audioElement) {
            audioElement.volume = settings.volume;
        }
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
                <span>🎙️ Text-to-Speech</span>
                <span id="tts-progress" class="tts-progress">0 / 0</span>
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
                <button class="speed-btn ${settings.speed === 0.75 ? 'active' : ''}" data-speed="0.75">0.75x</button>
                <button class="speed-btn ${settings.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
                <button class="speed-btn ${settings.speed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
                <button class="speed-btn ${settings.speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
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
            <div class="tts-info">
                ✨ Using Microsoft Edge Neural Voices - Natural & Free!
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
            getPageContent();
            updateProgress();
        }
    }

    // Create TTS button
    function createTTSButton() {
        const btn = document.createElement('button');
        btn.id = 'tts-btn';
        btn.className = 'tts-btn';
        btn.innerHTML = '🎙️';
        btn.title = 'Text-to-Speech (Natural Voices)';
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
                font-size: 16px;
                transition: all 0.2s;
            }
            .tts-play-btn {
                padding: 12px 30px;
                font-size: 18px;
                min-width: 140px;
            }
            .tts-play-btn:disabled {
                background: #94a3b8;
                cursor: not-allowed;
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
                transition: all 0.2s;
            }
            .speed-btn.active {
                background: #1e40af;
                color: white;
                border-color: #1e40af;
            }
            .speed-btn:hover {
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

    // Listen for sync updates
    window.addEventListener('syncComplete', (e) => {
        const serverData = e.detail;
        if (serverData.preferences) {
            const p = serverData.preferences;
            settings.speed = p.tts_speed || 1.0;
            settings.volume = p.tts_volume || 0.8;
            settings.autoScroll = !!p.tts_autoscroll;
            if (p.tts_voice) settings.voiceId = p.tts_voice;

            const volSlider = document.getElementById('tts-volume');
            if (volSlider) volSlider.value = settings.volume;

            const autoBox = document.getElementById('tts-autoscroll');
            if (autoBox) autoBox.checked = settings.autoScroll;

            document.querySelectorAll('.speed-btn').forEach(btn => {
                btn.classList.toggle('active', parseFloat(btn.dataset.speed) === settings.speed);
            });

            updateVoiceSelect();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    });

    // Initialize
    function init() {
        loadSettings();
        loadBrowserVoices();
        injectStyles();
        createTTSButton();
        setupKeyboardShortcuts();
        console.log('[TTS] Natural voices loaded (Microsoft Edge Neural)');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
