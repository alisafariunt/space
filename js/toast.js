// Toast Notification System
// Provides user-friendly notifications for success, error, warning, and info messages

(function () {
    // Toast configuration
    const DEFAULT_DURATION = 5000; // 5 seconds
    const TOAST_CONTAINER_ID = 'toast-container';

    // Create toast container
    function createToastContainer() {
        let container = document.getElementById(TOAST_CONTAINER_ID);

        if (!container) {
            container = document.createElement('div');
            container.id = TOAST_CONTAINER_ID;
            document.body.appendChild(container);

            // Inject styles
            injectToastStyles();
        }

        return container;
    }

    // Inject toast styles
    function injectToastStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100000;
                pointer-events: none;
            }

            .toast {
                min-width: 250px;
                max-width: 400px;
                margin-bottom: 12px;
                padding: 14px 20px 14px 18px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
                opacity: 0;
                transform: translateX(calc(100% + 20px));
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.95rem;
                line-height: 1.5;
                backdrop-filter: blur(10px);
            }

            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            .toast.hiding {
                opacity: 0;
                transform: translateX(calc(100% + 20px));
            }

            .toast-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }

            .toast-message {
                flex: 1;
                word-break: break-word;
            }

            .toast-close {
                background: none;
                border: none;
                color: inherit;
                opacity: 0.7;
                cursor: pointer;
                padding: 0;
                font-size: 1.2rem;
                line-height: 1;
                flex-shrink: 0;
                transition: opacity 0.2s;
            }

            .toast-close:hover {
                opacity: 1;
            }

            /* Toast types */
            .toast-info {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border-left: 4px solid #1d4ed8;
            }

            .toast-success {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                border-left: 4px solid #15803d;
            }

            .toast-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border-left: 4px solid #b45309;
            }

            .toast-error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border-left: 4px solid #b91c1c;
            }

            /* Mobile responsiveness */
            @media (max-width: 640px) {
                #toast-container {
                    right: 10px;
                    left: 10px;
                    top: 10px;
                }

                .toast {
                    max-width: none;
                    min-width: 0;
                }
            }

            /* Dark mode adjustments */
            body.dark-mode .toast {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            /* Animation keyframes */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(calc(100% + 20px));
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(calc(100% + 20px));
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Get icon for toast type
    function getToastIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    // Show toast notification
    function showToast(message, type = 'info', duration = DEFAULT_DURATION) {
        // Validate type
        const validTypes = ['info', 'success', 'warning', 'error'];
        if (!validTypes.includes(type)) {
            console.warn(`[Toast] Invalid type "${type}", defaulting to "info"`);
            type = 'info';
        }

        // Create container if needed
        const container = createToastContainer();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = getToastIcon(type);

        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', () => removeToast(toast));

        toast.appendChild(icon);
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);

        // Add to container
        container.appendChild(toast);

        // Trigger show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(toast);
            }, duration);
        }

        return toast;
    }

    // Remove toast
    function removeToast(toast) {
        toast.classList.add('hiding');
        toast.classList.remove('show');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }

            // Remove container if empty
            const container = document.getElementById(TOAST_CONTAINER_ID);
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300); // Match transition duration
    }

    // Clear all toasts
    function clearAllToasts() {
        const container = document.getElementById(TOAST_CONTAINER_ID);
        if (container) {
            Array.from(container.children).forEach(toast => {
                removeToast(toast);
            });
        }
    }

    // Convenience methods
    function showSuccess(message, duration = DEFAULT_DURATION) {
        return showToast(message, 'success', duration);
    }

    function showError(message, duration = DEFAULT_DURATION) {
        return showToast(message, 'error', duration);
    }

    function showWarning(message, duration = DEFAULT_DURATION) {
        return showToast(message, 'warning', duration);
    }

    function showInfo(message, duration = DEFAULT_DURATION) {
        return showToast(message, 'info', duration);
    }

    // Export to global scope
    window.showToast = showToast;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
    window.clearAllToasts = clearAllToasts;

    console.log('[Toast] Notification system loaded');
})();
