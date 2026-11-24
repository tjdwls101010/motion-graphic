/* cast/paper.js — the office paper that walks: the reference's folder and document (objects with thin legs, never a face) and their relatives in the creative scenes. Needs ink.js and figure.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;

  /* hidingDoc(ctx, at, state, opts) — a rigid sheet (156 x 200, a lavender block and four text lines) on two peg legs, the shy one that hides. `at` = [its centre x, the y of its bottom edge when standing]; opts.ground is the y its feet stand on (74 px lower).
     state: down, px it has sunk (120 = ducked out of sight behind a crate; clip to the floor line so nothing shows below); tilt (walking: 0.04, swapping sign every 3 drawings); feet [[dx, dy], [dx, dy]] from its x and the ground (walking: [[-30, 0], [10, -10]] and [[-10, -10], [30, 0]]; standing [[-22, 0], [22, 0]]); arm 0..1, one thin arm drawn on in two drawings (0.5, 1); wave 0 / 1, the two drawings of its mitten waving (on threes).
     It has eyes only because it must be seen in the dark: draw them with IB.docEyes (metaphor/flashlight-finds-file). */
  IB.hidingDoc = (ctx, [X, by], st = {}, o = {}) => {
    const { down = 0, tilt = 0, feet = [[-22, 0], [22, 0]], arm = 0, wave = 0 } = st, { ground = by + 74, seed = 250 } = o;
    ctx.save();
    feet.forEach(([dx, dy], i) => IB.peg(ctx, [X + (i ? 26 : -26), by - 3], [X + dx, ground + dy], { seed: seed + i * 9, dir: -1 }));
    if (arm > 0) {   // one thin arm, drawn on, with a mitten that waves
      const root = [X - 76, by - 120], hand = [root[0] - 70 * arm, root[1] - (96 + wave * 16) * arm + wave * 0];
      IB.limb(ctx, [root, [lerp(root[0], hand[0], 0.5) - 14, lerp(root[1], hand[1], 0.5) + 6], hand], [13, 10, 8], { fill: C.paper, lw: 2.8, seed: seed + 20 });
      if (arm === 1) IB.oval(ctx, hand[0] - 4 - wave * 8, hand[1] - 10, 12, 14, { fill: C.paper, w: 2.6, seed: seed + 22 + wave, n: 9 });
    }
    ctx.restore();
    ctx.save(); ctx.translate(X, by + down); ctx.rotate(tilt);
    IB.box(ctx, -78, -200, 156, 200, { fill: C.paper, w: 3.6, seed: seed + 10 });
    IB.box(ctx, -58, -112, 74, 80, { fill: C.lavender, w: 2, seed: seed + 11 });
    for (let i = 0; i < 4; i++) IB.seg(ctx, 28, -104 + i * 17, 60, -104 + i * 17, { w: 2.2, seed: seed + 12 + i });
    ctx.restore();
  };
  /* docEyes(ctx, at, look, opts) — the hiding document's two eyes, 52 px apart, the left one at `at` (26 px left of its centre, 150 px above its bottom edge). look: { dx, dy } moves the pupils (up to 6 px, toward what it watches), wide: true for found-out eyes; opts.shut draws a blink as two paper lines. Paper white, so they read on black: draw them once under the darkness and again over it. */
  IB.docEyes = (ctx, [ex, ey], look = {}, o = {}) => {
    const { shut = false, seed = 240 } = o;
    ctx.save();
    for (const i of [0, 1]) {
      const x = ex + i * 52;
      if (shut) { IB.seg(ctx, x - 13, ey, x + 13, ey, { w: 3, seed: seed + i, color: C.paper }); continue; }
      IB.oval(ctx, x, ey, 15, look.wide ? 17 : 12, { fill: C.paper, w: 2.6, seed: seed + 2 + i, n: 10 });
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + look.dx, ey + look.dy, 5.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  };
})(window);
