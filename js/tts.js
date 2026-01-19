// Text-to-Speech Feature - Using Browser Speech Synthesis with Better Voice Selection
// Falls back to best available voices on each platform
(function () {
    let isPlaying = false;
    let isPaused = false;
    let ttsPanel = null;
    let voices = [];
    let currentParagraphIndex = 0;
    let paragraphs = [];
    let currentUtterance = null;
    const STORAGE_KEY = 'studyGuide_tts_preferences';

    // Preferred natural voices (ranked by quality)
    const PREFERRED_VOICES = [
        // macOS high-quality voices
        'Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa',
        // Windows Neural voices
        'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Zira', 'Microsoft David',
        // Chrome/Edge voices
        'Google US English', 'Google UK English Female', 'Google UK English Male',
        // Generic good voices
        'Alex', 'Victoria', 'Fiona'
    ];

    // Default settings
    let settings = {
        speed: 1.0,
        volume: 0.8,
        voiceIndex: 0,
        autoScroll: true,
        preferredVoiceName: null
    };

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
            ttsVoice: settings.preferredVoiceName,
            ttsAutoscroll: settings.autoScroll,
            theme: document.documentElement.getAttribute('data-theme') || 'light'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        queueSync('preferences', 'update', prefs);
    }

    // Get available voices with quality scoring
    function loadVoices() {
        voices = speechSynthesis.getVoices();

        if (voices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
                sortVoicesByQuality();
                updateVoiceSelect();
                selectBestVoice();
            };
        } else {
            sortVoicesByQuality();
            selectBestVoice();
        }
    }

    // Sort voices by quality (preferred voices first)
    function sortVoicesByQuality() {
        voices.sort((a, b) => {
            const aScore = getVoiceQualityScore(a);
            const bScore = getVoiceQualityScore(b);
            return bScore - aScore;
        });
    }

    // Get quality score for a voice
    function getVoiceQualityScore(voice) {
        let score = 0;

        // Prefer English voices
        if (voice.lang.startsWith('en')) score += 100;

        // Check if it's a preferred voice
        for (let i = 0; i < PREFERRED_VOICES.length; i++) {
            if (voice.name.includes(PREFERRED_VOICES[i])) {
                score += (PREFERRED_VOICES.length - i) * 10;
                break;
            }
        }

        // Prefer local voices (usually higher quality)
        if (voice.localService) score += 50;

        // Neural/Premium voices get bonus
        if (voice.name.includes('Neural') || voice.name.includes('Premium')) score += 30;

        // Microsoft and Google voices are usually good
        if (voice.name.includes('Microsoft') || voice.name.includes('Google')) score += 25;

        return score;
    }

    // Automatically select the best available voice
    function selectBestVoice() {
        if (settings.preferredVoiceName) {
            const savedVoice = voices.findIndex(v => v.name === settings.preferredVoiceName);
            if (savedVoice !== -1) {
                settings.voiceIndex = savedVoice;
                return;
            }
        }

        // Select best English voice
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        if (englishVoices.length > 0) {
            const bestVoice = englishVoices[0];
            settings.voiceIndex = voices.indexOf(bestVoice);
            settings.preferredVoiceName = bestVoice.name;
        }
    }

    // Update voice dropdown with quality badges
    function updateVoiceSelect() {
        const select = document.getElementById('tts-voice-select');
        if (!select || voices.length === 0) return;

        // Group voices by quality
        const premium = [];
        const good = [];
        const other = [];

        voices.forEach((voice, i) => {
            if (!voice.lang.startsWith('en')) return;

            const score = getVoiceQualityScore(voice);
            const option = {
                index: i,
                name: voice.name,
                lang: voice.lang,
                score: score
            };

            if (score >= 150) {
                premium.push(option);
            } else if (score >= 100) {
                good.push(option);
            } else {
                other.push(option);
            }
        });

        let html = '';

        if (premium.length > 0) {
            html += '<optgroup label="⭐ Premium Voices">';
            premium.forEach(v => {
                const selected = v.index === settings.voiceIndex ? 'selected' : '';
                html += `<option value="${v.index}" ${selected}>${v.name}</option>`;
            });
            html += '</optgroup>';
        }

        if (good.length > 0) {
            html += '<optgroup label="✓ Good Voices">';
            good.forEach(v => {
                const selected = v.index === settings.voiceIndex ? 'selected' : '';
                html += `<option value="${v.index}" ${selected}>${v.name}</option>`;
            });
            html += '</optgroup>';
        }

        if (other.length > 0) {
            html += '<optgroup label="Other Voices">';
            other.forEach(v => {
                const selected = v.index === settings.voiceIndex ? 'selected' : '';
                html += `<option value="${v.index}" ${selected}>${v.name}</option>`;
            });
            html += '</optgroup>';
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

    // Speak text
    function speak(text, onEnd) {
        if (!text) return;

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.rate = settings.speed;
        currentUtterance.volume = settings.volume;
        currentUtterance.pitch = 1.0;

        if (voices.length > 0 && settings.voiceIndex < voices.length) {
            currentUtterance.voice = voices[settings.voiceIndex];
        }

        currentUtterance.onend = () => {
            if (onEnd) onEnd();
        };

        currentUtterance.onerror = (e) => {
            console.error('TTS Error:', e);
            if (onEnd) onEnd();
        };

        // Chrome bug fix - speech stops after ~15 seconds
        // Keep-alive hack
        const resumeInterval = setInterval(() => {
            if (!speechSynthesis.speaking) {
                clearInterval(resumeInterval);
            } else {
                speechSynthesis.pause();
                speechSynthesis.resume();
            }
        }, 10000);

        currentUtterance.onend = () => {
            clearInterval(resumeInterval);
            if (onEnd) onEnd();
        };

        speechSynthesis.speak(currentUtterance);
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
    function startSpeaking() {
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
        updateProgress();

        speak(para.text, () => {
            highlightParagraph(para.element, false);
            currentParagraphIndex++;
            if (isPlaying) {
                speakNextParagraph();
            }
        });
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
        speechSynthesis.pause();
        isPlaying = false;
        isPaused = true;
        updatePlayButton();
    }

    // Resume speaking
    function resumeSpeaking() {
        speechSynthesis.resume();
        isPlaying = true;
        isPaused = false;
        updatePlayButton();
    }

    // Stop speaking
    function stopSpeaking() {
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
            speechSynthesis.cancel();
            currentParagraphIndex++;
            if (isPlaying) {
                speakNextParagraph();
            } else {
                updateProgress();
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
            } else {
                updateProgress();
            }
        }
    }

    // Update play button
    function updatePlayButton() {
        const btn = document.getElementById('tts-play-btn');
        if (btn) {
            if (isPlaying) {
                btn.innerHTML = '⏸️ Pause';
            } else if (isPaused) {
                btn.innerHTML = '▶️ Resume';
            } else {
                btn.innerHTML = '▶️ Play';
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
        settings.preferredVoiceName = voices[settings.voiceIndex]?.name;
        saveSettings();

        // Show selected voice info
        const selectedVoice = voices[settings.voiceIndex];
        if (selectedVoice) {
            const info = document.getElementById('tts-voice-info');
            if (info) {
                info.textContent = selectedVoice.localService ? '✓ Local (faster)' : '☁️ Cloud';
            }
        }
    }

    // Toggle auto-scroll
    function toggleAutoScroll() {
        settings.autoScroll = !settings.autoScroll;
        saveSettings();
        const checkbox = document.getElementById('tts-autoscroll');
        if (checkbox) checkbox.checked = settings.autoScroll;
    }

    // Get current voice quality label
    function getCurrentVoiceLabel() {
        const voice = voices[settings.voiceIndex];
        if (!voice) return 'Select a voice';

        const score = getVoiceQualityScore(voice);
        if (score >= 150) return '⭐ Premium voice selected';
        if (score >= 100) return '✓ Good voice selected';
        return 'Standard voice selected';
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
                <span id="tts-voice-info" class="tts-voice-info"></span>
                <label class="tts-checkbox">
                    <input type="checkbox" id="tts-autoscroll" ${settings.autoScroll ? 'checked' : ''}>
                    Auto-scroll
                </label>
            </div>
            <div class="tts-tip">
                💡 Tip: For best quality, use Safari on Mac or Edge on Windows
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
            updateVoiceSelect();
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
            .tts-nav-btn:hover, .tts-play-btn:hover {
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
                gap: 10px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            .tts-options select {
                flex: 1;
                min-width: 200px;
                padding: 8px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
            }
            .tts-voice-info {
                font-size: 12px;
                color: #059669;
            }
            .tts-checkbox {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                cursor: pointer;
            }
            .tts-tip {
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                padding: 8px;
                background: #f9fafb;
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
            [data-theme="dark"] .tts-tip {
                background: #334155;
                color: #94a3b8;
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
            if (p.tts_voice) {
                settings.preferredVoiceName = p.tts_voice;
                const voiceIdx = voices.findIndex(v => v.name === p.tts_voice);
                if (voiceIdx !== -1) settings.voiceIndex = voiceIdx;
            }

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
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-Speech is not supported in this browser.');
            return;
        }

        loadSettings();
        loadVoices();
        injectStyles();
        createTTSButton();
        setupKeyboardShortcuts();
        console.log('[TTS] Initialized with best available voices');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
