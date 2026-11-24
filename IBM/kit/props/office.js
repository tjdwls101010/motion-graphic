/* props/office.js — office and market props in the look of the IBM spots: a seated pose for the figure rig, an office chair, a desk, a monitor seen from the front, and a candlestick chart to put on its screen. Flat fills and ink outlines like everything else; a screen is paper white and what is on it is drawn, never glowing. Needs ink.js and figure.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C, F = IB.FIG;

  /* How high a seat holds the hip joint, as a fraction of the sitter's height: 0.05 h (half a thigh's thickness) above a seat whose top is 0.285 h off the floor. */
  IB.SEAT = 0.335;

  /* sit(x, floor, look) — the pose of a figure sitting with its hip joint at x: thighs level, shins down, hands out in front at keyboard height (0.25 h ahead, 0.11 h above the hip, inside the arm's reach). Move the hands and the lean from here; the feet stay where they are while the sitter acts. */
  IB.sit = (x, floor, look) => {
    const h = look.h, d = look.dir || 1, hy = floor - IB.SEAT * h;
    return {
      hip: [x, hy], lean: 0.04, nod: 0,
      feet: [[x + 0.27 * h * d, floor - F.ankle * h, 0], [x + 0.21 * h * d, floor - F.ankle * h, 0]],
      hands: [[x + 0.25 * h * d, hy - 0.11 * h], [x + 0.21 * h * d, hy - 0.1 * h]],
    };
  };

  /* chair(ctx, x, floor, h, dir, opts) — an office chair for a sitter of height h whose hip is at x: a seat slab, a back on the side away from dir, a stem and a base on two casters. Draw it before the figure so the sitter covers the seat. */
  IB.chair = (ctx, x, floor, h, dir = 1, o = {}) => {
    const { fill = C.paper, lw = IB.figLine(h), seed = 700 } = o, top = floor - (IB.SEAT - 0.05) * h, k = (dx) => x + dx * h * dir;
    IB.tube(ctx, [[k(-0.12), top - 0.02 * h], [k(-0.17), top - 0.16 * h], [k(-0.16), top - 0.3 * h]], { w: 0.045 * h, edge: lw, fill, smooth: true, seed });   // back
    IB.seg(ctx, x, top + 0.05 * h, x, floor - 0.05 * h, { w: lw * 1.3, seed: seed + 1 });                                                                // stem
    IB.ink(ctx, [[k(-0.15), floor - 0.03 * h], [x, floor - 0.06 * h], [k(0.15), floor - 0.03 * h]], { w: lw * 1.2, smooth: false, seed: seed + 2 });   // base
    for (const s of [-0.15, 0.15]) IB.oval(ctx, k(s), floor - 0.018 * h, 0.018 * h, 0.018 * h, { fill, w: lw * 0.8, seed: seed + 3 + (s > 0 ? 1 : 0), n: 8 });
    IB.ink(ctx, [[k(-0.15), top], [k(0.13), top], [k(0.14), top + 0.05 * h], [k(-0.15), top + 0.05 * h]], { closed: true, smooth: false, fill, w: lw, seed: seed + 6 });   // seat
  };

  /* desk(ctx, x0, x1, top, floor, opts) — a table seen from the side: a slab from x0 to x1 with its top face at `top`, a leg near each end, graphite under the slab. */
  IB.desk = (ctx, x0, x1, top, floor, o = {}) => {
    const { fill = C.paper, lw = 3, thick = 16, seed = 720 } = o;
    for (const x of [x0 + 26, x1 - 26]) IB.box(ctx, x - 7, top + thick, 14, floor - top - thick, { fill, w: lw * 0.9, seed: seed + (x === x0 + 26 ? 1 : 2) });
    IB.shade(ctx, x0 + 12, top + thick + 2, x1 - x0 - 24, 22, { from: 'top', seed: seed + 3, alpha: 0.45 });
    IB.box(ctx, x0, top, x1 - x0, thick, { fill, w: lw, seed });
  };

  /* monitor(ctx, cx, bottom, w, h, opts) — a monitor facing the viewer, standing on `bottom`: a bezel, a white screen inset by `bezel` px, a neck and a foot. Returns the screen rectangle [x, y, w, h] to draw on; clip to it with IB.clipRect when what you draw can run off the screen's edge. */
  IB.monitor = (ctx, cx, bottom, w, h, o = {}) => {
    const { lw = 3, bezel = Math.max(8, w * 0.03), seed = 740, neck = h * 0.16 } = o, y = bottom - neck - h;
    IB.box(ctx, cx - w * 0.07, bottom - neck - 2, w * 0.14, neck, { fill: C.bg, w: lw, seed: seed + 1 });
    IB.box(ctx, cx - w * 0.2, bottom - Math.max(8, h * 0.035), w * 0.4, Math.max(8, h * 0.035), { fill: C.bg, w: lw, seed: seed + 2 });
    IB.box(ctx, cx - w / 2, y, w, h, { fill: C.bg, w: lw, seed });
    const r = [cx - w / 2 + bezel, y + bezel, w - bezel * 2, h - bezel * 2];
    IB.box(ctx, r[0], r[1], r[2], r[3], { fill: C.paper, w: lw * 0.7, seed: seed + 3 });
    return r;
  };
  IB.clipRect = (ctx, [x, y, w, h]) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); };

  /* candles(ctx, rect, data, n, opts) — a candlestick chart in `rect`. data is [[open, close, high, low], ...] in price units, scaled so opts.min..opts.max fills the rect's height. n is how many candles are there: a whole number draws that many, and a half more draws the next one's wick only, so stepping n by 0.5 per drawing puts each candle on in two drawings, wick then body. A rising candle is opts.up (blue) and a falling one opts.down (red), the market scenes' convention; a candle that closes where it opened counts as rising, and a body thinner than 1.5 line widths is drawn that thick, centred on its price. Returns { x(i), y(price) } for whatever the scene draws over it. */
  IB.candles = (ctx, [rx, ry, rw, rh], data, n, o = {}) => {
    const { min = 0, max = 1, lw = 3, up = C.blue, down = C.red, seed = 760, slot = rw / data.length } = o;
    const X = (i) => rx + slot * (i + 0.5), Y = (v) => ry + rh - ((v - min) / (max - min)) * rh;
    data.forEach(([op, cl, hi, lo], i) => {
      if (i >= n) return;
      IB.seg(ctx, X(i), Y(hi), X(i), Y(lo), { w: lw * 0.8, seed: seed + i * 3, wob: 0.3 });
      if (i + 0.5 >= n) return;
      const a = Y(Math.max(op, cl)), b = Y(Math.min(op, cl)), tall = Math.max(lw * 1.5, b - a);
      IB.box(ctx, X(i) - slot * 0.28, (a + b) / 2 - tall / 2, slot * 0.56, tall, { fill: cl >= op ? up : down, w: lw, seed: seed + i * 3 + 1, wob: 0.4 });
    });
    return { x: X, y: Y };
  };

  /* arrow(ctx, at, opts) — a solid up or down triangle that says which way a price went: up blue, down red (the only two meanings these colours carry). `at` is its centre; `half` its half width, `base` and `tip` how far the base and the point sit from the centre (market/watched-chart-drops, market/trading-desk-row). */
  IB.arrow = (ctx, [x, y], o = {}) => {
    const { up = true, half = 18, base = 14, tip = 16, fill = up ? C.blue : C.red, w = 2.8, seed = 91 } = o;
    ctx.save();
    IB.ink(ctx, up ? [[x - half, y + base], [x, y - tip], [x + half, y + base]] : [[x - half, y - base], [x, y + tip], [x + half, y - base]], { closed: true, smooth: false, fill, w, seed });
    ctx.restore();
  };

  /* keyboard(ctx, at, opts) — a flat keyboard seen from the side, lying on a desk top: `at` is its near left corner on the top surface (market/watched-chart-drops). */
  IB.keyboard = (ctx, [x, top], o = {}) => {
    const { w = 170, seed = 50 } = o;
    ctx.save();
    IB.box(ctx, x, top - 12, w, 12, { fill: C.bg, w: 2.8, seed });
    ctx.restore();
  };

  /* lineChart(ctx, screen, values, opts) — a live line chart on a monitor screen [x, y, w, h] (IB.monitor's return): two faint grid lines, the last `win` values one `gap` px apart as one ink line clipped to the screen, a dot on the newest value and an arrow in the corner, blue when it last rose and red when it fell. `min`..`min + span` is the value range mapped onto the screen. Grow it by one value every two drawings: a drawn chart is a drawing (market/watched-chart-drops). */
  IB.lineChart = (ctx, scr, v, o = {}) => {
    const { win: WIN = 27, gap: GAP = 17, min = 20, span = 60, seed = 70 } = o;
    const n = v.length, first = Math.max(0, n - WIN), y = (val) => scr[1] + scr[3] - 30 - ((val - min) / span) * (scr[3] - 70);
    ctx.save(); IB.clipRect(ctx, scr);
    for (const g of [0.3, 0.6]) IB.seg(ctx, scr[0], scr[1] + scr[3] * g, scr[0] + scr[2], scr[1] + scr[3] * g, { w: 1.6, color: '#d9d9d9', seed: seed + g * 10, grain: 0 });
    const pts = v.slice(first).map((val, i) => [scr[0] + 22 + i * GAP, y(val)]);
    if (pts.length > 1) IB.ink(ctx, pts, { w: 4, smooth: false, seed: seed + 10 + first, taper: false, wob: 0.3 });
    ctx.restore();
    if (n > 1) {
      const rising = v[n - 1] > v[n - 2], col = rising ? C.blue : C.red, end = pts[pts.length - 1];
      ctx.save();
      if (end[1] > scr[1] + 12) IB.oval(ctx, end[0], end[1], 9, 9, { fill: col, w: 2.6, seed: seed + 20, n: 9 });
      ctx.restore();
      IB.arrow(ctx, [scr[0] + 44, scr[1] + 44], { up: rising, fill: col, seed: seed + 21 });   // the arrow in the corner says the same thing
    }
  };

  /* chartAxes(ctx, origin, opts) — the two axes of a drawn chart from `origin` = [x, y] (the bottom left corner): up to `top`, right to `right`, with yTicks ticks every yStep px on the vertical axis and xTicks every xStep px under the horizontal one (market/chart-rollercoaster-rider). */
  IB.chartAxes = (ctx, [AX, BASE], o = {}) => {
    const { top = 150, right = 1800, yTicks = 5, yStep = 130, xTicks = 9, xStep = 165, seed = 10 } = o;
    ctx.save();
    IB.seg(ctx, AX, top, AX, BASE, { w: 4, seed }); IB.seg(ctx, AX, BASE, right, BASE, { w: 4, seed: seed + 1 });
    for (let i = 1; i <= yTicks; i++) IB.seg(ctx, AX - 16, BASE - i * yStep, AX, BASE - i * yStep, { w: 3, seed: seed + 2 + i });
    for (let i = 1; i <= xTicks; i++) IB.seg(ctx, AX + i * xStep, BASE, AX + i * xStep, BASE + 16, { w: 3, seed: seed + 10 + i });
    ctx.restore();
  };
})(window);
