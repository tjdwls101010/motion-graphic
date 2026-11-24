/* props/handheld.js — things a person carries, swings or points in the IBM look: flat fills inside a brush-pen outline, the hand-drawn wobble, graphite only where a thing meets the floor. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;

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

  /* gardenHose(ctx, path, state, opts) — a white garden hose 30 px thick along `path` (from off-screen to the hands), with a bulge of water travelling down it: state.bulge is the drawing of the bulge (0-5, 16% of the path further each) or null (variation/hose-wipe-endcard). */
  IB.gardenHose = (ctx, path, st = {}, o = {}) => {
    const { bulge = null } = st, { seed = 300 } = o;
    ctx.save();
    IB.tube(ctx, path, { w: 30, edge: 3.4, fill: C.paper, smooth: true, seed });
    if (bulge != null && bulge >= 0 && bulge < 6) { const q = IB.along(path, 0.12 + bulge * 0.16); IB.oval(ctx, q[0], q[1], 32, 25, { fill: C.paper, w: 3.4, seed: seed + 10 + bulge, n: 12 }); }
    ctx.restore();
  };

  /* nozzle(ctx, at, a, opts) — a hose nozzle held in two hands: a white barrel from 40 px behind `at` (the near hand) to 110 px ahead, a grey flared head to 176 px with two ribs, pointing along angle a (variation/hose-wipe-endcard). */
  IB.nozzle = (ctx, at, a, o = {}) => {
    const { seed = 320 } = o;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(a);
    IB.box(ctx, -40, -15, 150, 30, { fill: C.paper, w: 3.4, seed });
    IB.ink(ctx, [[110, -15], [150, -22], [176, -22], [176, 22], [150, 22], [110, 15]], { closed: true, smooth: false, fill: '#d9d9d9', w: 3.4, seed: seed + 1 });
    for (const x of [118, 130]) IB.seg(ctx, x, -17, x, 17, { w: 2.2, seed: seed + 2 + x });
    ctx.restore();
  };

  /* waterJet(ctx, tip, a, opts) — a jet of water from a nozzle tip along angle a: a flat blue fan of half-angle `half` (radians) running off-screen, paper streaks along the flow and loose drops beside it, all re-rolled for drawing k. Widen `half` a little every drawing and the jet fills the screen (variation/hose-wipe-endcard: 3 to 80 degrees over 13 drawings). */
  IB.waterJet = (ctx, tip, a, o = {}) => {
    const { k = 0, half = 0.05, seed = 600 } = o;
    const r = MG.rng(seed + 300 + k), far = 2600;
    const edge = (s, d) => [tip[0] + Math.cos(a + s * half) * d, tip[1] + Math.sin(a + s * half) * d];
    const fan = [tip]; for (let i = -6; i <= 6; i++) fan.push(edge(i / 6, far));   // a fan, not a triangle: a wide stream must not be cut off by the chord between its edges
    ctx.save();
    IB.ink(ctx, fan, { closed: true, smooth: false, fill: C.blue, w: 3.4, seed: seed + k, wob: 1.2 });
    // streaks along the flow and loose drops beside it, different on every drawing
    for (let i = 0; i < 5 + k; i++) { const s = (r() * 2 - 1) * 0.8, d0 = 120 + r() * 900, d1 = d0 + 140 + r() * 380; IB.ink(ctx, [edge(s, d0), edge(s, d1)], { w: 3 + r() * 3, color: C.paper, smooth: false, seed: seed + 10 + i, grain: 0 }); }
    for (let i = 0; i < 9; i++) { const s = (r() < 0.5 ? -1 : 1) * (1.15 + r() * 0.5), d = 90 + r() * 700, q = edge(s, d); IB.oval(ctx, q[0], q[1], 5 + r() * 6, 4 + r() * 4, { fill: C.blue, w: 2, seed: seed + 40 + i, n: 7 }); }
    ctx.restore();
  };
})(window);
