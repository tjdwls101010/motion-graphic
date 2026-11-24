/* props/nature.js — plants, clouds and other growing things in the IBM look: outlines only, the fill is the stage colour, a little graphite; they are set dressing and stay white so the actors keep the colour. Needs ink.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* pottedPlant(ctx, at, opts) — a floor plant: long pointed leaves fanned from the top of a tapered pot, its chalk smear under it. `at` is the floor under the pot's centre. opts is one of IB.PLANTS or your own: leaves [[angle, length], ...] (radians from upright), hw the leaf's half width, lw / vein the line widths, pivot how high above the floor the leaves spring from, pot { top, bottom, h, lw } (half widths and height), rim { w, h, y, lw } or null, smear { w, h, dy, seed }, seed. */
  IB.PLANTS = {
    tall: { leaves: [[-0.9, 150], [-0.45, 220], [0.05, 270], [0.5, 210], [0.95, 140]], hw: 16, lw: 2.6, vein: 1.5, pivot: 130, pot: { top: 50, bottom: 36, h: 132, lw: 3.2 }, rim: null, smear: { w: 140, h: 9, dy: 3, seed: 31 }, seed: 310 },   // metaphor/flashlight-finds-file
    bushy: { leaves: [[-1.0, 120], [-0.5, 170], [0.05, 200], [0.55, 160], [1.05, 115], [-0.25, 110], [0.3, 105]], hw: 14, lw: 2.4, vein: 1.4, pivot: 120, pot: { top: 46, bottom: 34, h: 122, lw: 3 }, rim: { w: 104, h: 18, y: 134, lw: 2.6 }, smear: { w: 130, h: 8, dy: 2, seed: 22 }, seed: 520 },   // acting/walk-cycle-bag
  };
  IB.pottedPlant = (ctx, [x, FLOOR], o = IB.PLANTS.tall) => {
    const { leaves, hw, lw, vein, pivot, pot, rim, smear, seed } = { ...IB.PLANTS.tall, ...o };
    ctx.save();
    if (smear) IB.smear(ctx, x, FLOOR - smear.dy, smear.w, { h: smear.h, seed: smear.seed });
    const leaf = (a, len, sd) => { ctx.save(); ctx.translate(x, FLOOR - pivot); ctx.rotate(a); IB.ink(ctx, [[0, 0], [hw, -len * 0.45], [0, -len], [-hw, -len * 0.45]], { closed: true, w: lw, seed: sd, fill: C.bg }); IB.seg(ctx, 0, -6, 0, -len * 0.8, { w: vein, seed: sd + 1 }); ctx.restore(); };
    leaves.forEach(([a, l], i) => leaf(a, l, seed + i * 2));
    IB.ink(ctx, [[x - pot.top, FLOOR - pot.h], [x + pot.top, FLOOR - pot.h], [x + pot.bottom, FLOOR], [x - pot.bottom, FLOOR]], { closed: true, smooth: false, w: pot.lw, seed: seed + 20, fill: C.bg });
    if (rim) IB.box(ctx, x - rim.w / 2, FLOOR - rim.y, rim.w, rim.h, { w: rim.lw, seed: seed + 21, fill: C.bg });
    ctx.restore();
  };
})(window);
