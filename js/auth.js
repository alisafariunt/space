// Authentication Manager
// Handles JWT token-based authentication, session management, and login UI

(function () {
    const AUTH_API_URL = '/api/auth';
    const ACCESS_TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 min before expiry
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const SESSION_WARNING_MS = 5 * 60 * 1000; // Warning 5 min before timeout

    // ==========================================
    // AuthManager Class
    // ==========================================
    class AuthManager {
        constructor() {
            this.accessToken = null;
            this.refreshTimer = null;
            this.onAuthStateChanged = null;
            this.username = localStorage.getItem('studyGuide_username') || null;
        }

        // Login with username and password
        async login(username, password) {
            try {
                const response = await fetch(`${AUTH_API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Important: Include cookies
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Handle specific error cases
                    if (data.error === 'PASSWORD_RESET_REQUIRED') {
                        throw new Error('This account requires a password reset. Please create a new password.');
                    }
                    throw new Error(data.message || 'Login failed');
                }

                // Store access token in memory (NOT localStorage for security)
                this.accessToken = data.accessToken;
                this.username = data.user.username;

                // Store username in localStorage for convenience (non-sensitive)
                localStorage.setItem('studyGuide_username', data.user.username);

                // Remove old password from localStorage if it exists
                localStorage.removeItem('studyGuide_password');

                // Schedule token refresh
                this.scheduleTokenRefresh();

                // Notify listeners
                if (this.onAuthStateChanged) {
                    this.onAuthStateChanged(true, data.user);
                }

                return data.user;
            } catch (error) {
                console.error('[Auth] Login error:', error);
                throw error;
            }
        }

        // Refresh access token using refresh token cookie
        async refreshAccessToken() {
            try {
                const response = await fetch(`${AUTH_API_URL}/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include' // Send refresh token cookie
                });

                if (!response.ok) {
                    throw new Error('Token refresh failed');
                }

                const data = await response.json();
                this.accessToken = data.accessToken;

                // Schedule next refresh
                this.scheduleTokenRefresh();

                console.log('[Auth] Access token refreshed');
                return data.accessToken;
            } catch (error) {
                console.error('[Auth] Token refresh error:', error);
                // Clear session and require re-login
                await this.logout();
                throw error;
            }
        }

        // Schedule automatic token refresh
        scheduleTokenRefresh() {
            // Clear existing timer
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
            }

            // Decode token to get expiry (simple JWT decode without verification)
            const payload = this.decodeJWT(this.accessToken);
            if (!payload || !payload.exp) {
                console.warn('[Auth] Could not decode token expiry');
                return;
            }

            // Calculate time until refresh (5 min before expiry)
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilRefresh = expiryTime - now - ACCESS_TOKEN_REFRESH_BUFFER;

            console.log(`[Auth] Token expires in ${Math.round((expiryTime - now) / 1000)}s, refreshing in ${Math.round(timeUntilRefresh / 1000)}s`);

            // Schedule refresh
            if (timeUntilRefresh > 0) {
                this.refreshTimer = setTimeout(() => {
                    this.refreshAccessToken().catch(console.error);
                }, timeUntilRefresh);
            } else {
                // Token already expired or about to expire, refresh immediately
                this.refreshAccessToken().catch(console.error);
            }
        }

        // Decode JWT payload (client-side, no verification)
        decodeJWT(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) return null;

                const payload = parts[1];
                const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
                return JSON.parse(decoded);
            } catch (error) {
                console.error('[Auth] JWT decode error:', error);
                return null;
            }
        }

        // Logout
        async logout() {
            try {
                // Call logout endpoint to clear refresh token
                await fetch(`${AUTH_API_URL}/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('[Auth] Logout error:', error);
            }

            // Clear local state
            this.accessToken = null;
            this.username = null;
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }

            // Keep username in localStorage for convenience
            // (User can see their last username when logging in again)

            // Notify listeners
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(false, null);
            }
        }

        // Get current access token
        getAccessToken() {
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }
            return this.accessToken;
        }

        // Check if authenticated
        isAuthenticated() {
            return this.accessToken !== null;
        }

        // Try silent authentication (using refresh token)
        async tryRefreshAuth() {
            try {
                await this.refreshAccessToken();
                return true;
            } catch (error) {
                return false;
            }
        }

        // Get username
        getUsername() {
            return this.username;
        }
    }

    // ==========================================
    // SessionManager Class
    // ==========================================
    class SessionManager {
        constructor(authManager) {
            this.authManager = authManager;
            this.lastActivity = Date.now();
            this.timeoutDuration = SESSION_TIMEOUT_MS;
            this.warningDuration = SESSION_WARNING_MS;
            this.timeoutTimer = null;
            this.warningTimer = null;
            this.active = false;
        }

        // Start session monitoring
        start() {
            this.active = true;
            this.setupActivityListeners();
            this.resetTimers();
        }

        // Stop session monitoring
        stop() {
            this.active = false;
            this.clearTimers();
            this.removeActivityListeners();
        }

        // Setup activity listeners
        setupActivityListeners() {
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
            events.forEach(event => {
                document.addEventListener(event, this.handleActivity, { passive: true });
            });
        }

        // Remove activity listeners
        removeActivityListeners() {
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
            events.forEach(event => {
                document.removeEventListener(event, this.handleActivity);
            });
        }

        // Handle activity
        handleActivity = () => {
            if (!this.active) return;
            this.lastActivity = Date.now();
            this.resetTimers();
        }

        // Reset timers
        resetTimers() {
            this.clearTimers();

            // Set warning timer
            this.warningTimer = setTimeout(() => {
                this.showTimeoutWarning();
            }, this.timeoutDuration - this.warningDuration);

            // Set timeout timer
            this.timeoutTimer = setTimeout(() => {
                this.handleTimeout();
            }, this.timeoutDuration);
        }

        // Clear timers
        clearTimers() {
            if (this.timeoutTimer) {
                clearTimeout(this.timeoutTimer);
                this.timeoutTimer = null;
            }
            if (this.warningTimer) {
                clearTimeout(this.warningTimer);
                this.warningTimer = null;
            }
        }

        // Show timeout warning
        showTimeoutWarning() {
            if (window.showToast) {
                window.showToast('You will be logged out in 5 minutes due to inactivity', 'warning', 8000);
            } else {
                console.warn('[Session] You will be logged out in 5 minutes due to inactivity');
            }
        }

        // Handle timeout
        async handleTimeout() {
            console.log('[Session] Session timeout');
            await this.authManager.logout();

            if (window.showToast) {
                window.showToast('Logged out due to inactivity', 'info');
            }

            // Show login modal
            if (window.showLoginModal) {
                window.showLoginModal('Session expired due to inactivity');
            }
        }
    }

    // ==========================================
    // UI Functions
    // ==========================================

    // Show login modal
    function showLoginModal(message = null) {
        // Remove existing modal
        const existing = document.querySelector('.login-modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'login-modal-overlay';
        modal.innerHTML = `
            <div class="login-modal">
                <h2>🔐 Welcome!</h2>
                ${message ? `<p class="error-message">${message}</p>` : ''}
                <p class="instructions">Enter your username and password to continue.</p>

                <div class="form-group">
                    <input type="text" id="login-username" placeholder="Username" autocomplete="username" autofocus>
                </div>

                <div class="form-group">
                    <input type="password" id="login-password" placeholder="Password" autocomplete="current-password">
                </div>

                <div class="password-requirements">
                    <small>
                        <strong>Password requirements:</strong><br>
                        • At least 8 characters<br>
                        • Contains uppercase and lowercase letters<br>
                        • Contains at least one number
                    </small>
                </div>

                <button id="login-btn" class="primary-btn">
                    <span class="btn-text">Login / Register</span>
                    <span class="btn-spinner" style="display:none;">⏳</span>
                </button>

                <div id="login-error" class="error-message" style="display:none;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Inject styles if not already present
        if (!document.getElementById('auth-modal-styles')) {
            injectModalStyles();
        }

        // Setup event listeners
        const usernameInput = modal.querySelector('#login-username');
        const passwordInput = modal.querySelector('#login-password');
        const loginBtn = modal.querySelector('#login-btn');
        const errorDiv = modal.querySelector('#login-error');

        // Pre-fill username if available
        if (authManager.username) {
            usernameInput.value = authManager.username;
            passwordInput.focus();
        }

        const handleLogin = async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            // Clear previous error
            errorDiv.style.display = 'none';

            // Validation
            if (!username || !password) {
                showError('Please enter both username and password');
                return;
            }

            // Show loading state
            loginBtn.disabled = true;
            loginBtn.querySelector('.btn-text').style.display = 'none';
            loginBtn.querySelector('.btn-spinner').style.display = 'inline';

            try {
                // Attempt login
                await authManager.login(username, password);

                // Success - modal will be removed by auth state change handler
                modal.remove();

                if (window.showToast) {
                    window.showToast('Login successful!', 'success', 2000);
                }

                // Trigger sync if available
                if (window.StudyGuideSync && window.StudyGuideSync.sync) {
                    window.StudyGuideSync.sync();
                }

            } catch (error) {
                // Show error
                showError(error.message || 'Login failed. Please try again.');

                // Reset button state
                loginBtn.disabled = false;
                loginBtn.querySelector('.btn-text').style.display = 'inline';
                loginBtn.querySelector('.btn-spinner').style.display = 'none';
            }
        };

        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        // Event listeners
        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') passwordInput.focus();
        });
    }

    // Inject modal styles
    function injectModalStyles() {
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .login-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .login-modal {
                background: white;
                padding: 2.5rem;
                border-radius: 16px;
                text-align: center;
                max-width: 440px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .login-modal h2 {
                margin-top: 0;
                margin-bottom: 0.5rem;
                color: #1f2937;
                font-size: 1.75rem;
            }

            .login-modal .instructions {
                color: #6b7280;
                margin-bottom: 1.5rem;
                font-size: 0.95rem;
            }

            .login-modal .form-group {
                margin-bottom: 1rem;
            }

            .login-modal input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 1rem;
                box-sizing: border-box;
                transition: border-color 0.2s;
            }

            .login-modal input:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .login-modal .password-requirements {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 1.5rem;
                text-align: left;
            }

            .login-modal .password-requirements small {
                color: #6b7280;
                line-height: 1.6;
            }

            .login-modal .primary-btn {
                width: 100%;
                padding: 14px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .login-modal .primary-btn:hover:not(:disabled) {
                background: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }

            .login-modal .primary-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .login-modal .error-message {
                color: #ef4444;
                font-weight: 600;
                margin: 1rem 0;
                padding: 10px;
                background: #fee2e2;
                border-radius: 8px;
            }

            /* Dark mode support */
            body.dark-mode .login-modal {
                background: #1f2937;
            }

            body.dark-mode .login-modal h2 {
                color: white;
            }

            body.dark-mode .login-modal .instructions {
                color: #9ca3af;
            }

            body.dark-mode .login-modal input {
                background: #374151;
                border-color: #4b5563;
                color: white;
            }

            body.dark-mode .login-modal input:focus {
                border-color: #60a5fa;
            }

            body.dark-mode .login-modal .password-requirements {
                background: #374151;
                border-color: #4b5563;
            }

            body.dark-mode .login-modal .password-requirements small {
                color: #d1d5db;
            }

            body.dark-mode .login-modal .error-message {
                background: #7f1d1d;
                color: #fca5a5;
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // Initialize and Export
    // ==========================================

    // Create global instances
    const authManager = new AuthManager();
    const sessionManager = new SessionManager(authManager);

    // Setup auth state change handler
    authManager.onAuthStateChanged = (isAuthenticated, user) => {
        if (isAuthenticated) {
            console.log('[Auth] User authenticated:', user.username);
            sessionManager.start();

            // Trigger custom event for other components
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, user }
            }));
        } else {
            console.log('[Auth] User logged out');
            sessionManager.stop();

            // Trigger custom event
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: false, user: null }
            }));
        }
    };

    // Try silent authentication on page load
    (async function tryInitialAuth() {
        if (!authManager.isAuthenticated()) {
            const success = await authManager.tryRefreshAuth();
            if (success) {
                console.log('[Auth] Silent authentication successful');
            } else {
                console.log('[Auth] No valid session, login required');
            }
        }
    })();

    // Export to global scope
    window.AuthManager = authManager;
    window.SessionManager = sessionManager;
    window.showLoginModal = showLoginModal;

    console.log('[Auth] Authentication module loaded');
})();
