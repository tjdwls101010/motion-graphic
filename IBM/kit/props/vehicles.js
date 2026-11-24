/* props/vehicles.js — things that roll, fly or carry in the IBM look: flat colour bodies in a brush-pen outline, wheels as paper ovals, motion shown by drawings and marks rather than blur. Needs ink.js and figure.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* rail(points, per = 40) — a track through `points` as dense samples of the same Catmull-Rom curve IB.ink draws through them, with the length run so far at each sample: { pts, len, per, at(s) }, where at(s) is the point { p, a } (position and tangent angle) at arc length s. len[i * per] is the arc length at point i (market/chart-rollercoaster-rider). */
  IB.rail = (P, PER = 40) => {
    const n = P.length, at = (i) => P[Math.max(0, Math.min(n - 1, i))], pts = [];
    for (let i = 0; i < n - 1; i++) { const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2); for (let k = 0; k < PER; k++) { const u = k / PER, u2 = u * u, u3 = u2 * u; pts.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))); } }
    pts.push(P[n - 1]);
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const railAt = (s) => {
      s = clamp(s, 0, len[len.length - 1] - 0.01);
      let i = 0; while (len[i + 1] < s) i++;
      const u = (s - len[i]) / (len[i + 1] - len[i]), a = pts[i], b = pts[i + 1];
      return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    return { pts, len, per: PER, at: railAt, points: P };
  };

  /* coasterTrack(ctx, rail, opts) — the track itself: thin grey supports every 96 px from the rail down to `base`, then the rail as one 5.5 px ink line through its points; layer 'supports' or 'rail' draws only one of them, so a floor smear can go between. Draw a chart's axes (IB.chartAxes) under it to make the ride a price chart (market/chart-rollercoaster-rider). */
  IB.coasterTrack = (ctx, rail, o = {}) => {
    const { base: BASE = 900, layer = 'all', seed = 30 } = o;
    ctx.save();
    if (layer !== 'rail') for (let s = 90; s < rail.len[rail.len.length - 1]; s += 96) { const q = rail.at(s).p; IB.seg(ctx, q[0], q[1] + 4, q[0], BASE, { w: 2, color: '#b0b0b0', seed: seed + Math.round(s), grain: 0 }); }
    if (layer !== 'supports') IB.ink(ctx, rail.points, { w: 5.5, seed: seed + 10, taper: false });
    ctx.restore();
  };

  /* coasterCart(ctx, rail, s, opts) — a yellow cart on two paper wheels riding the rail with its rear wheel near arc length s, and a rider sitting in it, everything drawn at scale K with line widths divided back. Each wheel's centre sits one radius (plus half the rail's thickness) off the rail along the rail's normal there; the cart does not bend, so the front wheel is found on the rail one wheelbase from the rear. stretch > 1 is the one smear drawing of a plunge. rider: { look, pose, bar } — an IB.figure look and a pose in cart coordinates (hip about [-14, -52], feet forward and hidden), bar false when the hands are thrown up. Returns { p, a }: the cart's centre and angle (market/chart-rollercoaster-rider). */
  IB.coasterCart = (ctx, rail, s, o = {}) => {
    const { stretch = 1, K = 1.35, rider = null, seed = 60 } = o;
    const R = 11 * K + 2.75, off = (q) => [q.p[0] + Math.sin(q.a) * R, q.p[1] - Math.cos(q.a) * R];
    const base = 82 * K * stretch, sr = s - 40 * K * stretch, rear = off(rail.at(sr));
    let lo = sr + base * 0.5, hi = sr + base * 1.6;
    for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, q = off(rail.at(mid)); if (Math.hypot(q[0] - rear[0], q[1] - rear[1]) < base) lo = mid; else hi = mid; }
    const front = off(rail.at((lo + hi) / 2)), a = Math.atan2(front[1] - rear[1], front[0] - rear[0]);
    const p = [lerp(rear[0], front[0], 40 / 82) - Math.sin(a) * 11 * K, lerp(rear[1], front[1], 40 / 82) + Math.cos(a) * 11 * K];
    ctx.save();
    ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.scale(stretch * K, K);
    const who = rider && { ...rider.look, lw: IB.figLine(rider.look.h * K) / K };
    if (rider) IB.figure(ctx, rider.pose, who, 'far');
    if (rider && rider.bar !== false) IB.seg(ctx, 40, -50, 50, -94, { w: 3.4 / K, seed });                                               // the bar
    IB.ink(ctx, [[-66, -66], [-58, -16], [58, -16], [72, -52], [56, -52], [48, -40], [-46, -40], [-50, -66]], { closed: true, smooth: false, fill: C.yellow, w: 3.8 / K, seed: seed + 1 });
    for (const x of [-40, 42]) { IB.oval(ctx, x, -11, 11, 11, { fill: C.paper, w: 3.2 / K, seed: seed + 2 + x, n: 10 }); IB.oval(ctx, x, -11, 3, 3, { fill: C.ink, w: 0, n: 6 }); }
    if (rider) IB.figure(ctx, rider.pose, who, 'near');
    ctx.restore();
    return { p, a };
  };

  /* coasterClack(ctx, cart, k, opts) — the clack of the chain catching each notch on the way up: one short stroke behind the cart (70 K back along its angle), alternating up and down with the notch count k (market/chart-rollercoaster-rider). */
  IB.coasterClack = (ctx, c, k, o = {}) => {
    const { K = 1.35, seed = 70 } = o, back = [c.p[0] - Math.cos(c.a) * 70 * K, c.p[1] - Math.sin(c.a) * 70 * K], side = k % 2 ? -1 : 1;
    ctx.save();
    IB.seg(ctx, back[0] - 14, back[1] + side * 10 - 20, back[0] - 30, back[1] + side * 16 - 26, { w: 2.6, seed: seed + k });
    ctx.restore();
  };

  /* coasterSpeedLines(ctx, rail, from, to, opts) — four slanted speed lines along the rail between arc lengths from and to, drawn with the plunge's one smear drawing (market/chart-rollercoaster-rider). */
  IB.coasterSpeedLines = (ctx, rail, from, to, o = {}) => {
    const { seed = 100 } = o;
    ctx.save();
    for (let i = 0; i < 4; i++) { const q = rail.at(lerp(from, to, i / 3)).p; IB.seg(ctx, q[0] + 26 + i * 6, q[1] - 34 - i * 12, q[0] + 64 + i * 10, q[1] + 36 - i * 8, { w: 3, seed: seed + i }); }
    ctx.restore();
  };
})(window);
