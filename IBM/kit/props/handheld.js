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

  /* handset(ctx, hand, opts) — a phone handset held in the hand at `hand` (the wrist IB.figure returns), upright beside the head; cradle = [the base's left edge, the desk top's y] draws its cord back to an IB.phoneCradle. Hold it at the ear (0.035 h behind the head centre), not in front of the face (market/trading-desk-row). */
  IB.handset = (ctx, [hx, hy], o = {}) => {
    const { cradle = null, seed = 521 } = o;
    ctx.save();
    if (cradle) IB.ink(ctx, [[hx + 10, hy + 18], [hx + 60, hy + 70], [cradle[0] + 14, cradle[1] - 60], [cradle[0] + 26, cradle[1] - 22]], { w: 2, seed });
    IB.ink(ctx, [[hx - 9, hy - 20], [hx + 3, hy - 22], [hx + 9, hy + 16], [hx - 3, hy + 20]], { closed: true, fill: C.charcoal, w: 2.6, seed: seed + 1 });
    ctx.restore();
  };

  /* cup(ctx, hand, opts) — a paper cup 40 px tall held at `hand` (the wrist), or standing on a surface when `hand` is 6 px above it (market/trading-desk-row). */
  IB.cup = (ctx, [hx, hy], o = {}) => {
    const { seed = 523 } = o;
    ctx.save();
    IB.ink(ctx, [[hx - 4, hy - 34], [hx + 22, hy - 34], [hx + 18, hy + 6], [hx, hy + 6]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed });
    ctx.restore();
  };

  /* torch(ctx, wrist, a, opts) — a grey hand torch held at `wrist`, pointing along angle a: a barrel with three grip ribs and a flared head whose lens is 96 px ahead of the wrist. Its light is IB.darkness / IB.lightBeam (metaphor/flashlight-finds-file). */
  IB.torch = (ctx, w, a, o = {}) => {
    const { seed = 200 } = o;
    ctx.save(); ctx.translate(w[0], w[1]); ctx.rotate(a);
    IB.box(ctx, -34, -13, 90, 26, { fill: '#d9d9d9', w: 3, seed });
    IB.ink(ctx, [[56, -13], [84, -24], [96, -24], [96, 24], [84, 24], [56, 13]], { closed: true, smooth: false, fill: '#d9d9d9', w: 3, seed: seed + 1 });
    for (let i = 0; i < 3; i++) IB.seg(ctx, -22 + i * 12, -12, -22 + i * 12, 12, { w: 1.8, seed: seed + 2 + i });
    ctx.restore();
  };

  /* slingBag(ctx, at, opts) — a long bag (476 px, a fencer's) slung across the back, drawn before the figure: `at` is its centre, about 0.05 h behind the hip and 42% of the way up to the shoulder; it lies at 0.36 rad, low end ahead of the hip. Let it lag: add 1.6 times how far the hip moved since the last drawing to its y (acting/walk-cycle-bag). */
  IB.slingBag = (ctx, [cx, cy], o = {}) => {
    const { fill = '#b79df0', seed = 600 } = o;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.36);
    IB.ink(ctx, [[-238, -22], [-226, -36], [-200, -40], [0, -42], [190, -40], [224, -30], [238, -6], [236, 16], [222, 32], [190, 38], [0, 40], [-205, 40], [-230, 34], [-240, 14]], { closed: true, fill, w: 3.6, seed });
    IB.seg(ctx, 96, -40, 104, 36, { w: 2.4, seed: seed + 1 }); IB.seg(ctx, 112, -40, 120, 36, { w: 2.4, seed: seed + 2 });
    ctx.restore();
  };
  /* strap(ctx, pts, opts) — a bag strap as one flat 4.4 px line through `pts`, drawn over the figure: over the near shoulder, down across the chest, under the hand that holds it, to the bag's low end (acting/walk-cycle-bag). */
  IB.strap = (ctx, pts, o = {}) => {
    const { seed = 610 } = o;
    ctx.save();
    IB.ink(ctx, pts, { w: 4.4, seed, taper: false, smooth: false });
    ctx.restore();
  };

  /* strawCup(ctx, hand, opts) — a takeaway cup with a lid and a straw in the hand at `hand` (the wrist), drawn over the figure with three fingers of colour `skin` wrapped back over it (acting/walk-cycle-bag). */
  IB.strawCup = (ctx, [hx, hy], o = {}) => {
    const { skin = C.skin[4], seed = 620 } = o;
    ctx.save(); ctx.translate(hx + 20, hy - 6);
    IB.seg(ctx, 4, -44, 9, -74, { w: 3, seed });
    IB.ink(ctx, [[-19, -42], [23, -42], [17, 26], [-13, 26]], { closed: true, smooth: false, fill: C.paper, w: 3, seed: seed + 1 });
    IB.box(ctx, -22, -50, 48, 10, { fill: C.paper, w: 2.6, seed: seed + 2 });
    for (const y of [-6, 3, 12]) IB.ink(ctx, [[-22, y], [-6, y - 3], [2, y]], { w: 6.4, color: C.ink, seed: seed + 10 + y, grain: 0 });
    for (const y of [-6, 3, 12]) IB.ink(ctx, [[-22, y], [-6, y - 3], [1, y]], { w: 3, color: skin, seed: seed + 10 + y, grain: 0 });
    ctx.restore();
  };

  /* briefcase(ctx, hand, opts) — a briefcase hanging from the hand at `hand` (the wrist), sized to a figure of height h (0.18 h wide), lines of width lw (the figure's): what a walker in a crowd carries (market/street-rush-hour). */
  IB.briefcase = (ctx, [hx, hy], o = {}) => {
    const { h = 250, fill = C.paper, lw = IB.figLine(h), seed = 820 } = o;
    ctx.save();
    IB.seg(ctx, hx, hy + 6, hx, hy + 16, { w: lw, seed });
    IB.box(ctx, hx - 0.09 * h, hy + 16, 0.18 * h, 0.12 * h, { fill, w: lw, seed: seed + 1 });
    ctx.restore();
  };
  /* smallCup(ctx, hand, opts) — a small paper cup (36 px) carried in front of the body by a walker in a crowd: `hand` is the wrist, d the way they face (1 right, -1 left) (market/street-rush-hour). */
  IB.smallCup = (ctx, [hx, hy], o = {}) => {
    const { d = 1, lw = 2.2, seed = 822 } = o;
    ctx.save();
    IB.ink(ctx, [[hx - 9 + 8 * d, hy - 30], [hx + 9 + 8 * d, hy - 30], [hx + 6 + 8 * d, hy + 6], [hx - 6 + 8 * d, hy + 6]], { closed: true, smooth: false, fill: C.paper, w: lw, seed });
    ctx.restore();
  };
  /* phone(ctx, at, opts) — a mobile phone 18 x 32: `at` = [its centre x, its top edge]. up: true shows a small blue up arrow on its screen (good news) (market/street-rush-hour). */
  IB.phone = (ctx, [px, py], o = {}) => {
    const { up = false, lw = 2.2, seed = 823 } = o;
    ctx.save();
    IB.box(ctx, px - 9, py, 18, 32, { fill: C.paper, w: lw, seed });
    if (up) IB.ink(ctx, [[px - 5, py + 20], [px, py + 9], [px + 5, py + 20]], { closed: true, smooth: false, fill: C.blue, w: 1.2, seed: seed + 1 });
    ctx.restore();
  };
})(window);
