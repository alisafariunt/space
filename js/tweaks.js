/* Field Notes — Tweaks panel (vanilla JS) */
(function () {
  const DEFAULTS = { palette: 'paper', font: 'nunito', density: 'comfortable' };
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
    html.setAttribute('data-font', prefs.font);
    html.setAttribute('data-density', prefs.density);
  }

  function buildPanel(prefs) {
    const panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.innerHTML = `
      <button class="tweaks-trigger" aria-label="Design tweaks" title="Tweaks">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
      </button>
      <div class="tweaks-popup" role="dialog" aria-label="Design tweaks">
        <div class="tweaks-section">
          <span class="tweaks-label">Color</span>
          <div class="tweaks-palettes">
            <button class="tweak-swatch" data-palette="paper" title="Paper" style="background:#ffffff;border-color:#d4d4d4;"></button>
            <button class="tweak-swatch" data-palette="sage" title="Sage" style="background:#f8f9f5;"></button>
            <button class="tweak-swatch" data-palette="cobalt" title="Cobalt" style="background:#f8faff;"></button>
            <button class="tweak-swatch" data-palette="noir" title="Noir" style="background:#0a0a0a;"></button>
          </div>
        </div>
        <div class="tweaks-section">
          <span class="tweaks-label">Typeface</span>
          <div class="tweaks-fonts">
            <button class="tweak-opt" data-font="nunito">Nunito <span style="opacity:.5;font-size:.8em;margin-left:auto;">friendly</span></button>
            <button class="tweak-opt" data-font="editorial">Newsreader <span style="opacity:.5;font-size:.8em;margin-left:auto;font-style:italic;">editorial</span></button>
            <button class="tweak-opt" data-font="plex">IBM Plex <span style="opacity:.5;font-size:.8em;margin-left:auto;">technical</span></button>
            <button class="tweak-opt" data-font="modern">Crimson Pro <span style="opacity:.5;font-size:.8em;margin-left:auto;">literary</span></button>
          </div>
        </div>
        <div class="tweaks-section">
          <span class="tweaks-label">Density</span>
          <div class="tweaks-density">
            <button class="tweak-opt" data-density="compact">Compact</button>
            <button class="tweak-opt" data-density="comfortable">Comfortable</button>
            <button class="tweak-opt" data-density="spacious">Spacious</button>
          </div>
        </div>
      </div>
    `;

    const trigger = panel.querySelector('.tweaks-trigger');
    const popup   = panel.querySelector('.tweaks-popup');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) popup.classList.remove('open');
    });

    panel.addEventListener('click', (e) => {
      const el = e.target.closest('[data-palette],[data-font],[data-density]');
      if (!el) return;
      const key = el.dataset.palette ? 'palette' : el.dataset.font ? 'font' : 'density';
      prefs[key] = el.dataset[key === 'density' ? 'density' : key];
      save(prefs);
      apply(prefs);
      refresh(panel, prefs);
    });

    return panel;
  }

  function refresh(panel, prefs) {
    panel.querySelectorAll('[data-palette]').forEach(el => {
      el.classList.toggle('on', el.dataset.palette === prefs.palette);
    });
    panel.querySelectorAll('[data-font]').forEach(el => {
      el.classList.toggle('on', el.dataset.font === prefs.font);
    });
    panel.querySelectorAll('[data-density]').forEach(el => {
      el.classList.toggle('on', el.dataset.density === prefs.density);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const prefs = load();
    apply(prefs);
    const panel = buildPanel(prefs);
    document.body.appendChild(panel);
    refresh(panel, prefs);
  });
})();
