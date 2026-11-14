/* Shared, seekable DOM builders for terminal scenes. */
(function (g) {
  const M = g.MG;
  const T = g.Terminal = {};

  /** Create the full-stage pale backdrop on stage and return it. */
  T.root = (stage) => {
    const node = M.el('div', { class: 'term-root' });
    stage.append(node);
    return node;
  };

  /** Create a terminal at x, y with width w and height h inside root. */
  T.window = (root, x = 85, y = 45, w = 1750, h = 990) => {
    const body = M.el('div', { class: 'term-body' });
    const win = M.el('div', { class: 'term-window', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, body);
    root.append(win);
    return { win, body };
  };

  /** Add the pixel placeholder and three-line session header to body. */
  T.header = (body) => {
    const header = M.el('div', { class: 'term-header' }, M.el('div', { class: 'term-pixel' }), M.el('div', { html: '<strong>Claude Code v2.1.288</strong><br>Opus 5.5 (1M context) · Claude Max<br>~/Projects/my-app' }));
    body.append(header);
    return header;
  };

  /** Append a preformatted text line to body, with an optional colour class. */
  T.line = (body, text, cls = '') => {
    const node = M.el('div', { class: 'term-line ' + cls, text });
    body.append(node);
    return node;
  };

  /** Append the coloured path, branch and mode status to body. */
  T.status = (body) => {
    const node = M.el('div', { class: 'term-status', html: '~/Projects/my-app &nbsp; <span style="color:#be8790">main</span> | Opus 5.5 (1M context)<br><span style="color:#d9c867">❯❯ auto mode on</span> (shift+tab to cycle)' });
    body.append(node);
    return node;
  };

  /** Add the neutral rounded webcam placeholder to root. */
  T.webcam = (root) => {
    const node = M.el('div', { class: 'term-webcam' });
    root.append(node);
    return node;
  };

  /** Create a keycap with text at stage position x, y. */
  T.key = (root, text, x, y) => {
    const node = M.el('div', { class: 'term-key', text, style: { left: x + 'px', top: y + 'px' } });
    root.append(node);
    return node;
  };

  /** Create a curved arrow and label at stage position x, y. */
  T.arrow = (root, label, x, y) => {
    // shaft and head are separate paths: a dash pattern restarts on every subpath, so a combined path would show its head almost at once
    const path = M.svg('path', { class: 'shaft', d: 'M 350 35 Q 240 3 30 34', pathLength: '1' });
    const head = M.svg('path', { class: 'head', d: 'M 30 34 l 20 -13 M 30 34 l 21 8' });
    const text = M.svg('text', { x: 360, y: 45, fill: '#c9ff20', text: label });
    const node = M.svg('svg', { class: 'term-arrow', width: 500, height: 90, viewBox: '0 0 500 90', style: { left: x + 'px', top: y + 'px' } }, path, head, text);
    root.append(node);
    return node;
  };

  /** Pop keycap node at start, then fade it at end, for scene time t. */
  T.pop = (node, t, start, end) => {
    const p = M.prog(t, start, 0.25, 'outBack');
    node.style.opacity = M.clamp(p) * (1 - M.prog(t, end, 0.2));
    node.style.transform = `scale(${Math.max(0, p)})`;
  };

  /** Draw node's arrow from start to end and reveal its label when complete. */
  T.arrowShow = (node, t, start, end) => {
    const p = M.prog(t, start, 0.35, 'outCubic');
    M.draw(node.querySelector('.shaft'), p);
    node.querySelector('.head').style.opacity = p >= 0.95 ? 1 : 0;   // the head lands when the shaft reaches the target
    node.querySelector('text').style.opacity = M.prog(t, start + 0.2, 0.15);
    node.style.opacity = t >= start && t < end ? 1 : 0;
  };

  /** Apply camera keyframes [time, [scale, x, y]] to the whole root. */
  T.camera = (root, t, keys) => {
    const [scale, x, y] = M.kf(t, keys);
    root.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };
})(window);
