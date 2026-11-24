/* props/metaphor.js — the plain objects explainer metaphors are built from in the IBM look: bars that rise, planks, dominoes, a flag. One flat fill each inside a brush-pen outline, graphite where they meet the floor, chalk smear for the floor. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { clamp } = MG;

  /* bar(ctx, at, opts) — a bar of a bar chart standing on the floor, risen to `u` (0..1) of its height `h`: its own chalk smear (fading in with the rise), the box, graphite at its foot. `at` is the floor under its centre. Rise it on IB.settle read on twos (tau 0.1: 57% on the first drawing); below u 0.01 nothing is drawn (metaphor/bars-rise-climber). */
  IB.bar = (ctx, [x, floor], o = {}) => {
    const { h: full = 200, u = 1, w: BW = 170, fill = C.paper, seed = 200 } = o;
    if (u < 0.01) return;   // the beat's own drawing shows nothing yet: the bar is first seen one drawing later, already 57% up
    const h = full * u;
    ctx.save();
    IB.smear(ctx, x, floor - 4, BW * 1.25, { h: 10, seed: seed + 5, alpha: clamp(u * 2) });
    IB.box(ctx, x - BW / 2, floor - h, BW, h, { fill, w: 3.4, seed });
    IB.shade(ctx, x - BW / 2 + 3, floor - Math.min(h, 46), BW - 6, Math.min(h, 46) - 2, { from: 'bottom', seed: seed + 1, alpha: 0.45 });
    ctx.restore();
  };

  /* flag(ctx, at, state, opts) — a pole 250 px tall planted at `at` with a pennant at its top. state: grown, how much of the pole is drawn (draw it on in two drawings: 0.5, 1); flap null for no cloth yet, or 0 / 1, the two drawings of the cloth fluttering (alternate them on threes) (metaphor/bars-rise-climber). */
  IB.flag = (ctx, [px, base], st = {}, o = {}) => {
    const { grown = 1, flap = null } = st, { fill = C.green, seed = 300 } = o;
    ctx.save();
    IB.seg(ctx, px, base, px, base - 250 * grown, { w: 3.4, seed });
    if (flap != null) IB.ink(ctx, [[px, base - 248], [px + 64, base - 232 + flap * 8], [px + 118 - flap * 10, base - 208 - flap * 6], [px + 60, base - 190 + flap * 6], [px, base - 172]], { closed: true, fill, w: 3, seed: seed + 1 + flap });
    ctx.restore();
  };

  /* domino(ctx, at, state, opts) — a domino 44 x 160 px (times `s`) standing on the floor, tipped `deg` degrees to the right about its lower right corner `at`. Pips by `face` (any whole number: the top half shows 1-3 pips by face % 3, the bottom 1-2 by face % 2), so a row of them is not all alike (metaphor/dominoes-chain-stop). */
  IB.domino = (ctx, at, st = {}, o = {}) => {
    const { deg = 0, face = 0 } = st, { s: S = 1.3, fill = C.paper, seed = 100 } = o, i = face;
    ctx.save();
    ctx.translate(at[0], at[1]); ctx.rotate(deg * (Math.PI / 180)); ctx.scale(S, S);
    IB.box(ctx, -44, -160, 44, 160, { fill, w: 3.4 / S, seed });
    IB.seg(ctx, -38, -80, -6, -80, { w: 2 / S, seed: seed + 1 });
    ctx.fillStyle = C.ink;
    for (const [x, y] of i % 3 === 0 ? [[-22, -118]] : i % 3 === 1 ? [[-30, -130], [-14, -104]] : [[-30, -132], [-22, -118], [-14, -104]]) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); }
    for (const [x, y] of i % 2 ? [[-22, -42]] : [[-30, -54], [-14, -30]]) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  /* dominoRest(next, gap, w, h) — the angle (degrees from upright) at which a domino comes to rest on its right-hand neighbour when that neighbour is at `next` degrees; both pivot on their lower right corners `gap` apart, each w x h. Two ways they can touch: this one's top right corner on the neighbour's left face, or the neighbour's top left corner on this one's right face; the answer is the largest angle at which neither goes through. Leaning rigid things need this: an angle set by hand overlaps on some drawing. */
  IB.dominoRest = (next, GAP, DW, DH) => {
    const DEG = Math.PI / 180;
    const b = next * DEG, un = [Math.sin(b), -Math.cos(b)], rn = [Math.cos(b), Math.sin(b)];   // the neighbour's up and right
    const L = [GAP - DW * rn[0], -DW * rn[1]], TL = [L[0] + DH * un[0], L[1] + DH * un[1]];    // its lower left and top left corners, from this one's pivot
    const clear = (deg) => {
      const a = deg * DEG, u = [Math.sin(a), -Math.cos(a)], r = [Math.cos(a), Math.sin(a)], cx = DH * u[0] - L[0], cy = DH * u[1] - L[1];
      let m = Infinity;
      const up = cx * un[0] + cy * un[1]; if (up >= 0 && up <= DH) m = Math.min(m, -(cx * rn[0] + cy * rn[1]));
      const mine = TL[0] * u[0] + TL[1] * u[1]; if (mine >= 0 && mine <= DH) m = Math.min(m, TL[0] * r[0] + TL[1] * r[1]);
      return m;
    };
    let lo = 0, hi = 90;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (clear(mid) >= 0) lo = mid; else hi = mid; }
    return lo;
  };
})(window);
