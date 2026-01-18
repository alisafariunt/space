// Theme Toggle - Dark/Light Mode
(function () {
    const STORAGE_KEY = 'study-guide-theme';

    // Get saved theme or default to system preference
    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme to document
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleButton(theme);
    }

    // Update toggle button icon
    function updateToggleButton(theme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    // Toggle between themes
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    }

    // Create toggle button
    function createToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'theme-toggle';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.addEventListener('click', toggleTheme);

        // Find nav or create fixed position
        const nav = document.querySelector('.main-nav') || document.querySelector('nav');
        if (nav) {
            nav.appendChild(btn);
        } else {
            btn.style.position = 'fixed';
            btn.style.top = '1rem';
            btn.style.right = '1rem';
            btn.style.zIndex = '1000';
            document.body.appendChild(btn);
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        createToggleButton();
        applyTheme(getPreferredTheme());
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
})();
