/* DOM builders for the overlay family. Set all animated properties in the scene render function. */
(function (g) {
  const O = g.OV = {};
  const M = g.MG;
  const el = M.el;

  /** root(stage) adds the blurred camera placeholder and returns the transformable overlay world. */
  O.root = (stage) => {
    const backdrop = el('div', { class: 'overlay' });
    const world = el('div', { class: 'ov-world' });
    backdrop.append(world);
    stage.append(backdrop);
    return world;
  };

  /** camera(world, t, keys) applies [scale, x, y] keyframes to all overlays together. */
  O.camera = (world, t, keys) => {
    const [scale, x, y] = M.kf(t, keys);
    world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  /** label(root, x, y, width) creates taped paper with separate plain and highlighted text spans. */
  O.label = (root, x, y, width) => {
    const text = el('span');
    const hi = el('span', { class: 'highlight' });
    const node = el('div', { class: 'ov-label', style: { left: x + 'px', top: y + 'px', width: width + 'px' } }, text, hi);
    root.append(node);
    return { el: node, text, hi };
  };

  /** check(root, x, y) creates a green pen check with two separately drawable strokes. */
  O.check = (root, x, y) => {
    const first = M.svg('path', { d: 'M8 42 L32 62', pathLength: '1' });
    const second = M.svg('path', { d: 'M32 62 Q36 66 41 58 L91 9', pathLength: '1' });
    const node = M.svg('svg', { class: 'ov-check', viewBox: '0 0 100 80', style: { left: x + 'px', top: y + 'px' } }, first, second);
    root.append(node);
    return { el: node, first, second };
  };

  /** spark(root, x, y) creates three short pen ticks at a paper corner. */
  O.spark = (root, x, y) => {
    const node = M.svg('svg', { class: 'ov-spark', viewBox: '0 0 65 65', style: { left: x + 'px', top: y + 'px' } }, M.svg('path', { d: 'M13 26 L3 21 M25 14 L23 3 M38 18 L45 8' }));
    root.append(node);
    return node;
  };

  /** badge(root, text, current) draws the dark chapter pill and six progress segments. */
  O.badge = (root, text, current = 0) => {
    const segments = Array.from({ length: 6 }, (_, i) => el('i', { class: i === current ? 'current' : '' }));
    const node = el('div', { class: 'ov-badge' }, el('span', { text }), el('div', { class: 'ov-progress' }, ...segments));
    root.append(node);
    return node;
  };

  /** chip(root, text, sub, y) adds a numbered step card with a caption and optional check. */
  O.chip = (root, text, sub, y) => {
    const check = el('span', { class: 'chip-check', text: '✓' });
    const node = el('div', { class: 'ov-chip', style: { top: y + 'px' } }, check, el('span', { text }), el('small', { text: sub }));
    root.append(node);
    return { el: node, check };
  };
})(window);
