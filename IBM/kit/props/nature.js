/* props/nature.js — plants, clouds and other growing things in the IBM look: outlines only, the fill is the stage colour, a little graphite; they are set dressing and stay white so the actors keep the colour. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;

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

  /* cloud(ctx, [x0, x1, y, h], opts) — a cloud as the reference's establishing shots draw them: a flat thick-outlined blob from x0 to x1 centred on y, h px tall, with one rubbed line of graphite inside (IB.smudge: load marks.js). Measured on the reference's city shot (establish/city-stadium-flyin). */
  IB.cloud = (ctx, [x0, x1, y, h], o = {}) => {
    const { seed = 700 } = o;
    ctx.save();
    const w = x1 - x0, cx = (x0 + x1) / 2, pts = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 0.55) * (w / 2), y + Math.sign(sn) * Math.pow(Math.abs(sn), 0.8) * (h / 2) * (i % 3 === 1 ? 1.15 : 0.9)]); }
    IB.ink(ctx, pts, { closed: true, fill: C.bg, w: 4.5, seed });
    IB.smudge(ctx, [[cx - w * 0.3, y + 2], [cx - w * 0.18, y + 4], [cx - w * 0.06, y + 2]], { w: Math.max(4, h * 0.2), dw: 1, dy: 2, color: 'rgba(40, 40, 40, 0.13)', seed: seed + 1 });   // graphite inside the cloud
    ctx.restore();
  };

  /* clump(ctx, at, [rx, ry], opts) — foliage as the reference fills every gap between buildings with it: a cauliflower mass covering the ellipse at `at`, an open line of bumps of uneven size along its top and sides (20-30 px each, a gap here and there), a curl inside where two bumps meet. It paints over what is behind it and has no closed outline: drawn closed, with big bumps, it reads as a cloud. Seeded: the same seed gives the same clump (establish/city-stadium-flyin). */
  IB.clump = (ctx, [cx, cy], [rx, ry], o = {}) => {
    const { seed = 500 } = o, rng = MG.rng, lerp = MG.lerp;
    ctx.save();
    const r = rng(seed), n = Math.max(8, Math.round((Math.PI * (rx + ry)) / 24)), base = [], lobes = [];
    for (let i = 0; i < n; i++) { const a = ((i + (r() - 0.5) * 0.5) / n) * Math.PI * 2; base.push([cx + Math.cos(a) * rx * 0.92, cy + Math.sin(a) * ry * 0.92, a]); }
    // each bump is a round arc from one base point to the next, bulging away from the centre
    for (let i = 0; i < n; i++) {
      const p = base[i], q = base[(i + 1) % n], mx = (p[0] + q[0]) / 2 - cx, my = (p[1] + q[1]) / 2 - cy, d = Math.hypot(mx, my) || 1, chord = Math.hypot(q[0] - p[0], q[1] - p[1]), bulge = chord * (0.45 + r() * 0.25), arc = [];
      for (let k = 0; k <= 6; k++) { const u = k / 6, h = Math.pow(Math.sin(Math.PI * u), 0.75) * bulge; arc.push([lerp(p[0], q[0], u) + (mx / d) * h, lerp(p[1], q[1], u) + (my / d) * h]); }
      lobes.push({ arc, up: my / d < 0.45, skip: r() < 0.14 });
    }
    // the mass hides what is behind it but has no outline of its own: only the bumps along its top and sides are inked, as open strokes with a gap here and there
    IB.ink(ctx, lobes.flatMap((l) => l.arc.slice(0, 6)), { closed: true, smooth: false, fill: C.bg, w: 0, wob: 0 });
    lobes.forEach((l, i) => { if (l.up && !l.skip) IB.ink(ctx, l.arc, { w: 2.6, seed: seed + i, wob: 0.6 }); });
    for (let i = 0; i < Math.round(n / 7); i++) { const x = cx + (r() - 0.5) * rx * 1.1, y = cy + (r() - 0.5) * ry * 0.7, q = 6 + r() * 5; IB.ink(ctx, [[x + q, y - q * 0.6], [x - q * 0.2, y - q], [x - q, y], [x - q * 0.3, y + q * 0.8]], { w: 2.2, seed: seed + 40 + i }); }   // a curl where two bumps meet inside the mass
    ctx.restore();
  };

  /* bird(ctx, at, opts) — a far bird: one 18 px tick of two wings (establish/city-stadium-flyin). */
  IB.bird = (ctx, [x, y], o = {}) => {
    const { seed = 720 + x } = o;
    ctx.save();
    IB.ink(ctx, [[x - 9, y - 3], [x - 3, y + 2], [x + 2, y - 2], [x + 9, y - 4]], { w: 2, seed });
    ctx.restore();
  };
})(window);
