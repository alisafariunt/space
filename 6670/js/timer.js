// Pomodoro Study Timer
(function () {
    const WORK_TIME = 25 * 60; // 25 minutes
    const SHORT_BREAK = 5 * 60; // 5 minutes
    const LONG_BREAK = 15 * 60; // 15 minutes

    let timeLeft = WORK_TIME;
    let isRunning = false;
    let isWorkSession = true;
    let sessionsCompleted = 0;
    let timerInterval = null;
    let timerWidget = null;

    // Format time as MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Create timer widget
    function createTimerWidget() {
        const widget = document.createElement('div');
        widget.id = 'timer-widget';
        widget.className = 'timer-widget';
        widget.innerHTML = `
            <div class="timer-header">
                <span id="timer-mode">📚 Focus Time</span>
                <button id="timer-minimize" aria-label="Minimize">−</button>
            </div>
            <div class="timer-body">
                <div id="timer-display" class="timer-display">${formatTime(WORK_TIME)}</div>
                <div class="timer-controls">
                    <button id="timer-start" class="timer-btn primary">▶ Start</button>
                    <button id="timer-reset" class="timer-btn">↺ Reset</button>
                </div>
                <div id="timer-sessions" class="timer-sessions">Sessions: 0</div>
            </div>
        `;
        document.body.appendChild(widget);

        // Event listeners
        document.getElementById('timer-start').addEventListener('click', toggleTimer);
        document.getElementById('timer-reset').addEventListener('click', resetTimer);
        document.getElementById('timer-minimize').addEventListener('click', toggleMinimize);

        return widget;
    }

    // Toggle timer
    function toggleTimer() {
        isRunning = !isRunning;
        const btn = document.getElementById('timer-start');

        if (isRunning) {
            btn.textContent = '⏸ Pause';
            timerInterval = setInterval(tick, 1000);
        } else {
            btn.textContent = '▶ Start';
            clearInterval(timerInterval);
        }
    }

    // Timer tick
    function tick() {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            completeSession();
        }
    }

    // Update display
    function updateDisplay() {
        document.getElementById('timer-display').textContent = formatTime(timeLeft);
    }

    // Complete session
    function completeSession() {
        clearInterval(timerInterval);
        isRunning = false;
        playNotification();

        if (isWorkSession) {
            sessionsCompleted++;
            document.getElementById('timer-sessions').textContent = `Sessions: ${sessionsCompleted}`;

            // Long break every 4 sessions
            if (sessionsCompleted % 4 === 0) {
                timeLeft = LONG_BREAK;
                document.getElementById('timer-mode').textContent = '☕ Long Break';
            } else {
                timeLeft = SHORT_BREAK;
                document.getElementById('timer-mode').textContent = '☕ Short Break';
            }
            showNotification('Focus session complete! Take a break.');
        } else {
            timeLeft = WORK_TIME;
            document.getElementById('timer-mode').textContent = '📚 Focus Time';
            showNotification('Break over! Ready to focus?');
        }

        isWorkSession = !isWorkSession;
        updateDisplay();
        document.getElementById('timer-start').textContent = '▶ Start';
    }

    // Reset timer
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        isWorkSession = true;
        timeLeft = WORK_TIME;
        document.getElementById('timer-mode').textContent = '📚 Focus Time';
        document.getElementById('timer-start').textContent = '▶ Start';
        updateDisplay();
    }

    // Toggle minimize
    function toggleMinimize() {
        timerWidget.classList.toggle('minimized');
        const btn = document.getElementById('timer-minimize');
        btn.textContent = timerWidget.classList.contains('minimized') ? '+' : '−';
    }

    // Play notification sound
    function playNotification() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio notification not supported');
        }
    }

    // Browser notification
    function showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Study Timer', { body: message, icon: 'images/icon-192.png' });
        }
    }

    // Request notification permission
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Create timer button
    function createTimerButton() {
        const btn = document.createElement('button');
        btn.id = 'timer-btn';
        btn.className = 'timer-toggle-btn';
        btn.innerHTML = '⏱️';
        btn.setAttribute('aria-label', 'Study Timer');
        btn.addEventListener('click', () => {
            if (!timerWidget) {
                timerWidget = createTimerWidget();
                requestNotificationPermission();
            }
            timerWidget.classList.toggle('hidden');
        });

        const nav = document.querySelector('.main-nav') || document.querySelector('nav');
        if (nav) {
            nav.appendChild(btn);
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', createTimerButton);
})();
