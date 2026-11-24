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

  /* axe(ctx, grip, th, opts) — a felling axe 382 px long held at `grip` (the lower hand; the upper hand goes 62 px further along the handle), its handle pointing along angle th from butt to head: yellow handle, charcoal head with a grey edge line. flip -1 turns the blade to the other side. smear: true is the one drawing of the swing instead: the head stretched along the 105 degrees of arc it has just travelled, thin where it came from and full where it is, with two speed arcs inside (acting/axe-windup-smear). */
  IB.axe = (ctx, G, th, o = {}) => {
    const { flip = 1, smear = false, seed = 300 } = o, DEG = Math.PI / 180;
    ctx.save();
    if (smear) {
      const a0 = th - 105 * DEG, pt = (a, r) => [G[0] + Math.cos(a) * r, G[1] + Math.sin(a) * r], outer = [], inner = [];
      for (let i = 0; i <= 12; i++) { const k = i / 12, a = MG.lerp(a0, th + 8 * DEG, k); outer.push(pt(a, 392)); inner.push(pt(a, 392 - 118 * Math.pow(k, 0.7))); }
      IB.ink(ctx, outer.concat(inner.reverse()), { closed: true, fill: C.charcoal, w: 3.6, seed: seed + 10 });
      for (const [r, s] of [[250, 0.72], [170, 0.5]]) IB.ink(ctx, IB.ellipse(G[0], G[1], r, r, 8, th - 105 * DEG * s, th - 12 * DEG), { w: 2.6, seed: seed + 12 + r });
      ctx.save(); ctx.translate(G[0], G[1]); ctx.rotate(th);
      IB.tube(ctx, [[-52, 0], [330, 0]], { w: 24, edge: 3.4, fill: C.yellow, seed });
      ctx.restore();
    } else {
      ctx.translate(G[0], G[1]); ctx.rotate(th); ctx.scale(1, flip);
      IB.tube(ctx, [[-52, 4], [80, -2], [200, 2], [330, 0]], { w: 24, edge: 3.4, fill: C.yellow, smooth: true, seed });
      IB.ink(ctx, [[300, -22], [358, -22], [362, 8], [392, 96], [272, 96], [298, 8]], { closed: true, fill: C.charcoal, w: 3.8, seed: seed + 1 });
      IB.ink(ctx, [[280, 82], [332, 78], [386, 82]], { w: 2.4, color: '#8a8a8a', seed: seed + 2 });
    }
    ctx.restore();
  };

  /* choppingBlock(ctx, at, opts) — a tree stump to split logs on: `at` is the floor under its centre, `top` the y of its top face (122 px up by default). Rings on the top, bark lines down the side, graphite at its foot, its own chalk smear (acting/axe-windup-smear). */
  IB.choppingBlock = (ctx, [BX, FLOOR], o = {}) => {
    const { top: TOP = FLOOR - 122, seed = 320 } = o;
    ctx.save();
    IB.smear(ctx, BX, FLOOR - 5, 300, { h: 12, seed: seed - 289 });
    IB.ink(ctx, [[BX - 96, TOP + 6], [BX - 100, FLOOR - 6], [BX - 60, FLOOR + 4], [BX + 60, FLOOR + 4], [BX + 100, FLOOR - 6], [BX + 96, TOP + 6]], { closed: true, fill: C.bg, w: 3.8, seed });
    IB.shade(ctx, BX - 96, FLOOR - 44, 192, 44, { from: 'bottom', seed: seed - 287, alpha: 0.5 });
    IB.oval(ctx, BX, TOP + 6, 96, 20, { fill: C.bg, w: 3.6, seed: seed + 1, n: 16 });
    IB.oval(ctx, BX - 6, TOP + 6, 56, 11, { w: 1.8, seed: seed + 2, n: 12 });
    IB.oval(ctx, BX - 10, TOP + 6, 22, 5, { w: 1.6, seed: seed + 3, n: 8 });
    for (const [x, y, l] of [[-70, 52, 34], [-30, 44, 50], [22, 58, 30], [58, 40, 44]]) IB.seg(ctx, BX + x, TOP + y, BX + x + 2, TOP + y + l, { w: 2, seed: seed + 10 + x });
    ctx.restore();
  };

  /* logHalf(ctx, at, opts) — one half of a split log: a half-cylinder 170 px tall, its pale cut face toward the split. `at` is the bottom of the cut edge; rot tips it about that point; side -1 is the left half, 1 the right. Two of them back to back with IB.logTop over them are the whole log before the blow (acting/axe-windup-smear). */
  IB.logHalf = (ctx, [x, y], o = {}) => {
    const { rot = 0, side = 1, seed = 350 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(side, 1);
    IB.ink(ctx, [[0, -170], [44, -166], [50, -150], [50, -4], [26, 4], [0, 0]], { closed: true, fill: '#d9d9d9', w: 3.4, seed });
    IB.ink(ctx, [[0, -170], [26, -160], [50, -164]], { w: 2, seed: seed + 1 });
    for (const yy of [-120, -70, -30]) IB.seg(ctx, 30 + (yy % 7), yy, 31, yy + 26, { w: 1.8, seed: seed + 2 - yy });
    IB.ink(ctx, [[0, -170], [0, 0]], { w: 3.4, seed: seed + 3, smooth: false });
    ctx.restore();
  };
  /* logTop(ctx, at, opts) — the round top face of a whole standing log, 168 px above its base at `at`. */
  IB.logTop = (ctx, [x, y], o = {}) => {
    const { seed = 360 } = o;
    ctx.save();
    IB.oval(ctx, x, y - 168, 49, 9, { fill: '#d9d9d9', w: 3, seed, n: 12 });
    ctx.restore();
  };

  /* woodChip(ctx, at, rot, opts) — a chip of wood about 22 px across, turned by rot: throw six up and out from a blow and leave them lying where they fall (acting/axe-windup-smear). */
  IB.woodChip = (ctx, [x, y], rot, o = {}) => {
    const { seed = 370 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    IB.ink(ctx, [[-11, -4], [10, -6], [12, 4], [-9, 6]], { closed: true, smooth: false, fill: C.paper, w: 2.2, seed });
    ctx.restore();
  };
})(window);
