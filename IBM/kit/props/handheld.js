/* props/handheld.js — things a person carries, swings or points in the IBM look: flat fills inside a brush-pen outline, the hand-drawn wobble, graphite only where a thing meets the floor. Needs ink.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* cardboardBox(ctx, at, state, opts) — a taped cardboard box w x h (230 x 210) with a shipping label and two this-way-up arrows, graphite at its foot. `at` is the middle of its bottom edge; it tips by `tilt` radians about that point (a box strained at trembles by -0.02 on alternate drawings). The floor smear under it is the scene's (acting/lift-heavy-box). */
  IB.cardboardBox = (ctx, [x, y], st = {}, o = {}) => {
    const { tilt = 0 } = st, { w: BW = 230, h: BH = 210, seed = 100 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    IB.box(ctx, -BW / 2, -BH, BW, BH, { fill: C.paper, w: 3.8, seed });
    IB.box(ctx, -18, -BH, 36, 70, { w: 2.2, seed: seed + 1 });
    IB.box(ctx, -BW * 0.36, -92, 84, 58, { fill: C.bg, w: 2.2, seed: seed + 2 });
    for (let i = 0; i < 3; i++) IB.seg(ctx, -BW * 0.32, -78 + i * 15, -BW * 0.32 + 52 - i * 10, -78 + i * 15, { w: 1.8, seed: seed + 3 + i });
    for (const s of [-1, 1]) IB.ink(ctx, [[s * 58, -28], [s * 44, -44], [s * 30, -28]], { w: 2.4, smooth: false, seed: seed + 6 + s });   // this-way-up arrows
    IB.shade(ctx, -BW / 2 + 3, -40, BW - 6, 38, { from: 'bottom', seed: seed - 88, alpha: 0.45 });
    ctx.restore();
  };
})(window);
