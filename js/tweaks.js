/* Field Notes — Tweaks panel (paper / dark) */
(function () {
  const DEFAULTS = { palette: 'paper' };
  const STORAGE_KEY = 'fn-tweaks';

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { return Object.assign({}, DEFAULTS); }
  }

  function save(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
  }

  function apply(prefs) {
    const html = document.documentElement;
    html.setAttribute('data-palette', prefs.palette);
  }

  function buildPanel(prefs) {
    const panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.innerHTML = `
      <button class="tweaks-trigger" aria-label="Toggle theme" title="Theme">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      </button>
      <div class="tweaks-popup" role="dialog" aria-label="Theme">
        <div class="tweaks-section">
          <span class="tweaks-label">// Theme</span>
          <button class="tweak-opt" data-palette="paper">Paper</button>
          <button class="tweak-opt" data-palette="dark">Dark</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const trigger = panel.querySelector('.tweaks-trigger');
    const popup = panel.querySelector('.tweaks-popup');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) popup.classList.remove('open');
    });

    function refresh() {
      panel.querySelectorAll('[data-palette]').forEach(b => {
        b.classList.toggle('on', b.dataset.palette === prefs.palette);
      });
    }
    refresh();

    panel.querySelectorAll('[data-palette]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        prefs.palette = b.dataset.palette;
        apply(prefs); save(prefs); refresh();
      });
    });
  }

  const prefs = load();
  apply(prefs);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => buildPanel(prefs));
  } else {
    buildPanel(prefs);
  }
})();
