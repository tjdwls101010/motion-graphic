/* ui.js — DOM builders for the "clean UI card" family (styles in ui.css). Builders run once in setup(); the objects they return expose small setters that render(t) calls with a progress value. Exposes the global UI. */
(function (g) {
  const MG = g.MG;
  const UI = (g.UI = {});
  const el = MG.el;

  const P = {
    doc: '<path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5M9 13h8M9 17h6"/>',
    pr: '<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M6 7.5v9M18 16.5V10a3 3 0 0 0-3-3h-3m2-2.5L11.5 7 14 9.5"/>',
    cube: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" fill="currentColor"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" stroke="#fff"/>',
    check: '<path d="M5 12.5 10 17.5 19.5 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v2M15 13v2"/>',
    spark: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  /* icon('pr', 30) — a stroke icon span that inherits text colour. Brand marks in the reference are replaced by these generic glyphs. */
  UI.icon = (name, size = 30) => el('span', { class: 'icon', html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${P[name] || ''}</svg>` });

  /* root(stage) — the pale grey backdrop every UI scene sits on. */
  UI.root = (stage) => { const r = el('div', { class: 'ui' }); stage.append(r); return r; };

  UI.box = (parent, cls, x, y, w, h, ...kids) => {
    const b = el('div', { class: cls, style: { left: x + 'px', top: y + 'px', width: w ? w + 'px' : '', height: h ? h + 'px' : '' } }, ...kids);
    parent.append(b);
    return b;
  };
  UI.card = (parent, x, y, w, h, ...kids) => UI.box(parent, 'card', x, y, w, h, ...kids);

  /* header(n, iconName, label) — "① ▤ 스킬 사용 ……… ●". Returns { el, label } so the label can be typed on. */
  UI.header = (n, icon, label) => {
    const lab = el('span', { text: label });
    const ic = icon ? UI.icon(icon, 34) : null;
    const node = el('div', { class: 'card-h' }, el('span', { class: 'num', text: n }), ic, lab, el('span', { class: 'dot' }));
    return { el: node, label: lab, icon: ic, text: label };
  };
  UI.chip = (cls, ...kids) => el('span', { class: 'chip ' + (cls || '') }, ...kids);

  /* odometer(pattern) — pattern like '00,000': one sliding tile per digit, separators as plain glyphs.
     .roll(from, to, p, { spins, stagger }) shows the value between two same-length digit strings: tiles turn in sequence (left to right) and every tile takes the long way round `spins` extra full turns (default 1, so a 0 that stays 0 still rolls through 1-9, as on a real counter); pass spins: 0 for a small correction where only the changed digits should move. p is linear 0..1; easing is applied per tile. */
  UI.odometer = (pattern) => {
    const node = el('div', { class: 'odo' });
    const tiles = [];
    for (const ch of pattern) {
      if (/\d/.test(ch)) {
        const strip = el('div', { class: 'strip' }, ...Array.from({ length: 11 }, (_, i) => el('span', { text: String(i % 10) })));
        node.append(el('div', { class: 'tile' }, strip));
        tiles.push(strip);
      } else node.append(el('div', { class: 'sep', text: ch }));
    }
    const digits = (s) => s.replace(/\D/g, '').split('').map(Number);
    return {
      el: node,
      roll(from, to, p, o = {}) {
        const a = digits(from), b = digits(to), n = tiles.length, st = o.stagger ?? 0.12, spins = o.spins ?? 1;
        tiles.forEach((strip, i) => {
          const local = MG.ease.inOutCubic(MG.clamp((p * (1 + st * (n - 1)) - st * i) / 1));
          const steps = ((b[i] - a[i] + 10) % 10) + 10 * spins;
          const v = (a[i] + steps * local) % 10;
          strip.style.transform = `translateY(${-v * 138}px)`;
        });
      },
    };
  };

  /* window(parent, x, y, w, h, url) — browser/document window with traffic lights. Returns { el, body, bar }. */
  UI.window = (parent, x, y, w, h, url) => {
    const body = el('div', { class: 'win-body' });
    const bar = el('div', { class: 'win-bar' }, el('i'), el('i'), el('i'), el('span', { text: url || '' }));
    const node = UI.box(parent, 'win', x, y, w, h, bar, body);
    return { el: node, body, bar };
  };

  /* hl(span, p) — drive a .hl / .ul sweep. */
  UI.hl = (span, p) => span.style.setProperty('--p', MG.clamp(p));

  /* type(el, text, p, caret) — type-on with an optional block caret while typing. */
  UI.type = (node, text, p, caret) => {
    const s = MG.typed(text, p);
    node.textContent = s;
    if (caret && p > 0 && p < 1) node.append(el('span', { class: 'caret' }));
  };
})(window);
