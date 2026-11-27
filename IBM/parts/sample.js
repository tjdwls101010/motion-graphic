/* sample.js — layout for the part samples in IBM/parts/ (not a kit part: it draws the page a part is shown on, not the look). A sample page is a grid of cells; each cell shows a window of a virtual 1920x1080 stage, so a part is drawn exactly as a scene would draw it (stage coordinates, same line widths) and the cell only frames it. Keep windows 1:1 (a window as large as its cell: use fewer, larger cells, or S.span for a wide one) where the part fits: shrinking a drawing thins its lines and changes its dust, and that is not the look. A cell that has to shrink says so in its label (×0.64). Exposes the global SAMPLE. */
(function (g) {
  const S = (g.SAMPLE = {});
  const W = 1920, H = 1080, INK = '#6f6f6f';

  /* grid(n, cols, opts) — the [x, y, w, h] of n cells in `cols` columns under the page title, with room under each cell for its label. */
  S.grid = (n, cols, o = {}) => {
    const { top = 96, left = 48, right = 48, bottom = 24, gap = 28, label = 34 } = o, rows = Math.ceil(n / cols);
    const w = (W - left - right - (cols - 1) * gap) / cols, h = (H - top - bottom - (rows - 1) * gap) / rows - label;
    return Array.from({ length: n }, (_, i) => [left + (i % cols) * (w + gap), top + Math.floor(i / cols) * (h + gap + label), w, h]);
  };

  /* title(ctx, text, color) — the page's title line, top left (pass a light colour over a dark page). */
  S.title = (ctx, text, color = '#2a2a2a') => {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color; ctx.font = '600 30px "JetBrains Mono"'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 48, 58);
    ctx.restore();
  };

  /* caption(ctx, text, dark) — a page-wide sample's line of text, bottom left on a band of the stage colour (or black on a dark page), so it never sits on the drawing. */
  S.caption = (ctx, text, dark = false) => {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '600 26px "JetBrains Mono"'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 40;
    ctx.fillStyle = dark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(240, 240, 240, 0.9)'; ctx.fillRect(28, H - 76, w, 52);
    ctx.fillStyle = dark ? '#bdbdbd' : '#2a2a2a'; ctx.fillText(text, 48, H - 50);
    ctx.restore();
  };

  /* cell(ctx, rect, view, draw, label) — frame a window `view` = [x, y, w, h] of the stage into `rect`, scaled to fit (1 when the window is as large as the cell), clip to it, run draw() in stage coordinates, and print the label under it. */
  S.cell = (ctx, [x, y, w, h], [vx, vy, vw, vh], draw, label = '') => {
    const s = Math.min(w / vw, h / vh), ox = x + (w - vw * s) / 2, oy = y + (h - vh * s) / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(ox, oy); ctx.scale(s, s); ctx.translate(-vx, -vy);
    draw();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#d6d6d6'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = INK; ctx.font = '400 19px "JetBrains Mono"'; ctx.textBaseline = 'top';
    ctx.fillText(Math.abs(s - 1) > 0.02 ? `${label}  ×${s.toFixed(2)}` : label, x + 2, y + h + 8);
    ctx.restore();
  };

  /* span(cells, i, j) — one wide cell over cells i..j of a grid row. */
  S.span = (cells, i, j) => [cells[i][0], cells[i][1], cells[j][0] + cells[j][2] - cells[i][0], cells[i][3]];

  /* fit(rect, at, dy) — the 1:1 window of a cell `rect` with the floor point `at` dy px above its bottom edge. */
  S.fit = (rect, at, dy = 40) => S.window(at, rect[2], rect[3], dy);

  /* window(at, w, h, dy) — a w x h window of the stage centred on x = at[0], with `at` (a floor point) dy px above its bottom edge. */
  S.window = (at, w, h, dy = 40) => [at[0] - w / 2, at[1] + dy - h, w, h];

  /* cycle(f, move, hold) — the state of a MOVE ([frame, state] rows from 0) at frame f when it is played over and over with `hold` frames of its last drawing before it starts again. */
  S.cycle = (f, move, hold = 18) => g.IB.held(move, f % (move[move.length - 1][0] + hold));
})(window);
