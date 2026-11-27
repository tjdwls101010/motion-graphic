/* props/nature.js — plants, clouds and other growing things in the IBM look: outlines only, the fill is the stage colour, a little graphite; they are set dressing and stay white so the actors keep the colour. Needs ink.js and marks.js; adds to the global IB. */
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

  /* wispCloud(ctx, at, w, opts) — a small flat cloud w px wide with a level base, for a wide shot with a horizon: `at` is the middle of its base. Let it drift on ones, slowly (spot/tandem-riders-join: 3 px/s). */
  IB.wispCloud = (ctx, [x, y], w, o = {}) => {
    const { seed = 60 } = o;
    ctx.save();
    IB.ink(ctx, [[x - w / 2, y], [x - w * 0.2, y - w * 0.12], [x + w * 0.05, y - w * 0.16], [x + w * 0.3, y - w * 0.08], [x + w / 2, y], [x, y + 3]], { closed: true, w: 2, seed, fill: C.bg });
    ctx.restore();
  };
  /* tuft(ctx, at, opts) / stones(ctx, at, opts) — what lies on the ground beside a road: a tuft of grass as one zigzag, or three stones. Scroll them past on ones to say a thing is moving while it stays in place (spot/tandem-riders-join: 332 px/s). */
  IB.tuft = (ctx, [x, y], o = {}) => {
    const { seed = 1 } = o;
    ctx.save();
    IB.ink(ctx, [[x - 26, y], [x - 20, y - 13], [x - 12, y], [x - 4, y - 18], [x + 4, y], [x + 14, y - 12], [x + 24, y]], { w: 2, smooth: false, seed });
    ctx.restore();
  };
  IB.stones = (ctx, [x, y], o = {}) => {
    const { seed = 1 } = o;
    ctx.save();
    IB.oval(ctx, x, y, 19, 11, { w: 2, seed, n: 8, fill: C.bg }); IB.oval(ctx, x + 32, y + 5, 8, 5, { w: 1.8, seed: seed + 1, n: 6 }); IB.oval(ctx, x - 24, y + 5, 4, 3, { w: 1.8, seed: seed + 2, n: 6 });
    ctx.restore();
  };

  /* bandCloud(ctx, [x0, x1, y], opts) — a long stretched cloud with a paper fill and a 3 px outline, from x0 to x1 about y: the sky behind a wall (spot/dark-eyes-reveal). */
  IB.bandCloud = (ctx, [x0, x1, y], o = {}) => {
    const { seed = 600 } = o, lerp = MG.lerp;
    ctx.save();
    IB.ink(ctx, [[x0, y + 12], [lerp(x0, x1, 0.3), y - 8], [lerp(x0, x1, 0.6), y - 2], [x1, y - 30], [x1, y + 34], [lerp(x0, x1, 0.55), y + 28], [lerp(x0, x1, 0.2), y + 30]], { closed: true, fill: C.paper, w: 3, seed });
    ctx.restore();
  };

  /* sillPlant(ctx, state, opts) — a window-box plant: a pot under a mound of pointed leaves that spills over the sill and trails down the wall, a few purple blooms, a yellow bud. It stands where the reference has it (the pot at x 1640-1682 on the sill at y 780); opts.shift = [dx, dy] moves it. state.sway tips every leaf a little: loop three values on twos (0, 0.07, -0.05) and it is the one thing in its shot that never holds. The leaves are seeded, so their places differ from the reference's (spot/dark-eyes-reveal). */
  IB.sillPlant = (ctx, st = {}, o = {}) => {
    const { sway = 0 } = st, { shift = [0, 0] } = o, lerp = MG.lerp;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    // a pot under a mound of pointed leaves that spills over the sill and trails down the wall, with a few purple blooms
    const r = MG.rng(31), leaves = [];   // the one thing in the window that never holds: every leaf tips a little on each drawing, as in the reference
    IB.box(ctx, 1640, 726, 42, 54, { fill: C.paper, w: 2.4, seed: 500 });
    IB.shade(ctx, 1640, 726, 42, 26, { from: 'top', seed: 501, alpha: 0.4 });
    IB.shade(ctx, 1640, 682, 70, 44, { from: 'bottom', seed: 502, alpha: 0.3 });   // the dark inside the mound
    for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); leaves.push([1672 + Math.cos(a) * 62 * d, 708 + Math.sin(a) * 52 * d, a + (r() - 0.5), i]); }
    const trail = [[1700, 766], [1716, 800], [1732, 836], [1722, 870], [1740, 900], [1734, 934]];
    for (let i = 0; i < 26; i++) { const u = r() * (trail.length - 1), k = Math.min(trail.length - 2, Math.floor(u)), v = u - k; leaves.push([lerp(trail[k][0], trail[k + 1][0], v) + (r() - 0.5) * 44, lerp(trail[k][1], trail[k + 1][1], v) + (r() - 0.5) * 16, Math.PI * (0.2 + r() * 0.6), 100 + i]); }
    leaves.sort((p, q) => p[1] - q[1]);
    for (const [x, y, a, i] of leaves) {
      const bloom = i % 4 === 0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + sway * ((i % 3) - 1));
      if (bloom) IB.ink(ctx, [[-7, -3], [-9, -12], [-3, -8], [0, -14], [3, -8], [9, -12], [7, -3], [0, 6]], { closed: true, smooth: false, fill: '#a08ae8', w: 2, seed: 520 + i });
      else { IB.ink(ctx, [[0, -15], [8, -3], [5, 9], [0, 13], [-5, 9], [-8, -3]], { closed: true, fill: C.paper, w: 2, seed: 520 + i }); IB.seg(ctx, 0, -9, 0, 9, { w: 1.3, seed: 620 + i }); }
      ctx.restore();
    }
    IB.ink(ctx, [[1641, 654], [1643, 645], [1648, 644], [1650, 651], [1646, 656]], { closed: true, fill: C.yellow, w: 1.7, seed: 504 });   // the bud the flyer comes for
    ctx.restore();
  };
})(window);
