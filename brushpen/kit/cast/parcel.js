/* cast/parcel.js — the parcel that walks: a cardboard box on two thin grey legs, in the family of the reference's folder and document (an object given legs, never a face). Needs ink.js and figure.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* parcel(ctx, at, state, opts) — a taped box w x h with a label, on two peg legs. `at` is the middle of its bottom edge; it tips by state.tilt about that point.
     state: tilt; legs 0..1, how much of the 74 px legs is out (0 = folded away, riding a belt); feet [[dx, dy], [dx, dy]], each foot from `at`'s x and from the ground line `ground` (walking: the planted foot at dy 0, the lifted one at -12); air: true in a hop (legs hang under the box, knees bent); riding: true on a belt (legs straight down); stamped: true shows the green tick.
     opts: w, h, fill, seed, leg (74), ground (the y feet stand on while walking).
     Walk it by swapping two foot sets and the sign of tilt (0.035) every 6 frames, or every 4 with tilt 0.07 when it hurries (metaphor/parcels-board-conveyor). */
  IB.parcel = (ctx, [X, Y], st = {}, o = {}) => {
    const { tilt = 0, legs = 1, feet = [[0, 0], [0, 0]], air = false, riding = false, stamped = false } = st;
    const { w = 190, h = 150, fill = C.paper, seed = 100, leg: LEG = 74, ground = Y + LEG } = o;
    const c = Math.cos(tilt), sn = Math.sin(tilt), P = (x, y) => [X + x * c - y * sn, Y + x * sn + y * c];
    ctx.save();
    if (legs > 0) for (const i of [0, 1]) {
      const hip = P((i ? 1 : -1) * w * 0.2, -3), len = LEG * legs;
      const foot = riding || air ? [hip[0] + feet[i][0] * 0.15 + (air ? 10 : 0), hip[1] + len] : [X + feet[i][0], ground + feet[i][1]];
      IB.peg(ctx, hip, foot, { seed: seed + 20 + i * 9, knee: air ? 10 : 0, fill: '#d9d9d9' });
    }
    ctx.restore();
    ctx.save(); ctx.translate(X, Y); ctx.rotate(tilt);
    IB.box(ctx, -w / 2, -h, w, h, { fill, w: 3.6, seed });
    IB.box(ctx, -15, -h, 30, h * 0.34, { w: 2, seed: seed + 1 });                                        // tape over the top seam
    IB.box(ctx, -w * 0.4, -h * 0.42, w * 0.34, h * 0.26, { fill: C.bg, w: 2, seed: seed + 2 });           // label
    for (let i = 0; i < 2; i++) IB.seg(ctx, -w * 0.36, -h * 0.34 + i * h * 0.09, -w * 0.12, -h * 0.34 + i * h * 0.09, { w: 1.8, seed: seed + 3 + i });
    if (stamped) IB.ink(ctx, [[w * 0.1, -h * 0.34], [w * 0.2, -h * 0.2], [w * 0.4, -h * 0.52]], { w: Math.max(6, w * 0.045), color: C.green, smooth: false, seed: seed + 6, taper: false });
    ctx.restore();
  };
})(window);
