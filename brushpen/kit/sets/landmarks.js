/* sets/landmarks.js — famous buildings and monuments of the world's cities as line drawings in the reference's ink: flat fills, a 3 px outline, details as single strokes, no lettering or logos (the reference's rule for real marks). Each stands on its ground point [x, ground] and is sized by its height h in px; a part with something that moves takes it as a state (a bridge's lift, a wheel's turn, a clock's time, a sparkle's drawing). New York: IB.liberty, IB.empireState. London: IB.bigBen, IB.towerBridge, IB.londonEye. Paris: IB.eiffel, IB.arcTriomphe. Tokyo: IB.tokyoTower, IB.torii, IB.fuji. Seoul: IB.namsanTower, IB.gwanghwamun, IB.hanok, IB.lotteTower. Elsewhere: IB.operaHouse (Sydney), IB.colosseum (Rome), IB.pyramids (Giza). Under them: the skyline's ground line (IB.skyline), a rail embankment (IB.embankment) and a cableway (IB.cableway). Red (C.red) is used here only where it is the landmark's own colour (Tokyo Tower, a torii). Needs ink.js. */
(function (g) {
  const IB = g.IB, C = IB.C, MG = g.MG, TAU = Math.PI * 2, { lerp } = MG;
  const STONE = '#e6e2d6', STEEL = '#bdbdbd';   // pale stone and grey steel: drawn things in the stage's greys, so the shot's colours stay for what matters
  const frame = (x, ground, h, d = 1) => (u, v) => [x + u * h * d, ground - v * h];   // u across, v up, in units of h
  const poly = (ctx, pts, fill, lw, seed, smooth = false) => IB.ink(ctx, pts, { closed: true, smooth, fill, w: lw, seed });
  const line = (ctx, pts, lw, seed, o = {}) => IB.ink(ctx, pts, { w: lw, seed, taper: false, ...o });

  /* ---------- New York ---------- */

  /* liberty(ctx, [x, ground], { h, lw }) — the Statue of Liberty from the side: the star-shaped fort and the pedestal in stone, the statue in verdigris (C.mint) with the torch raised in her right hand and its flame in yellow, the seven-ray crown and the tablet held in the left arm. h is the whole height to the flame. */
  IB.liberty = (ctx, [x, ground], o = {}) => {
    const h = o.h || 600, lw = o.lw || 3, s = o.seed || 900, k = frame(x, ground, h);
    poly(ctx, [k(-0.36, 0), k(-0.3, 0.06), k(0.3, 0.06), k(0.36, 0)], STONE, lw, s);                                   // the fort's walls
    poly(ctx, [k(-0.16, 0.06), k(-0.14, 0.44), k(0.14, 0.44), k(0.16, 0.06)], STONE, lw, s + 1);                       // the pedestal
    poly(ctx, [k(-0.17, 0.44), k(-0.17, 0.47), k(0.17, 0.47), k(0.17, 0.44)], STONE, lw, s + 2);
    for (const u of [-0.08, 0, 0.08]) line(ctx, [k(u - 0.02, 0.18), k(u - 0.02, 0.32), k(u + 0.02, 0.32), k(u + 0.02, 0.18)], lw * 0.6, s + 3 + u * 100);
    poly(ctx, [k(-0.09, 0.47), k(-0.07, 0.62), k(-0.05, 0.75), k(-0.06, 0.8), k(0.0, 0.85), k(0.05, 0.8), k(0.06, 0.7), k(0.09, 0.47)], C.mint, lw, s + 4, true);   // the robed body
    for (const u of [-0.04, 0.0, 0.04]) line(ctx, [k(u, 0.5), k(u + 0.005, 0.7)], lw * 0.5, s + 5 + u * 100);
    poly(ctx, IB.ellipse(...k(0.005, 0.875), 0.028 * h, 0.032 * h, 12), C.mint, lw, s + 6, true);                       // the head
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32, c = k(0.005, 0.89); line(ctx, [c, [c[0] + Math.cos(a) * 0.06 * h, c[1] + Math.sin(a) * 0.06 * h]], lw * 0.7, s + 7 + i); }   // the crown's rays
    IB.tube(ctx, [k(0.03, 0.8), k(0.05, 0.9), k(0.06, 0.97)], { w: 0.03 * h, edge: lw, fill: C.mint, seed: s + 15 });   // the raised arm
    poly(ctx, [k(0.045, 0.97), k(0.075, 0.97), k(0.07, 0.99), k(0.05, 0.99)], C.mint, lw, s + 16);                      // the torch
    poly(ctx, [k(0.06, 0.99), k(0.045, 1.015), k(0.062, 1.04), k(0.075, 1.015)], C.yellow, lw, s + 17, true);         // the flame
    poly(ctx, [k(-0.07, 0.66), k(-0.1, 0.72), k(-0.06, 0.76), k(-0.035, 0.7)], C.mint, lw, s + 18);                    // the tablet
  };

  /* empireState(ctx, [x, ground], { h, lit, lw }) — the Empire State Building front on: the broad base, the setbacks narrowing to the tower, the crown in steps and the mast. Windows are vertical strokes. lit: the crown's floodlight on (yellow). */
  IB.empireState = (ctx, [x, ground], o = {}) => {
    const h = o.h || 700, lw = o.lw || 3, s = o.seed || 920, k = frame(x, ground, h);
    const tiers = [[0.2, 0, 0.08], [0.16, 0.08, 0.13], [0.12, 0.13, 0.7], [0.095, 0.7, 0.75], [0.075, 0.75, 0.8], [0.055, 0.8, 0.84]];
    tiers.forEach(([w, v0, v1], i) => { poly(ctx, [k(-w, v0), k(-w, v1), k(w, v1), k(w, v0)], i >= 4 && o.lit ? C.yellow : C.paper, lw, s + i); });
    for (let u = -0.1; u <= 0.1; u += 0.025) line(ctx, [k(u, 0.15), k(u, 0.68)], lw * 0.5, s + 10 + u * 1000);
    poly(ctx, [k(-0.035, 0.84), k(-0.02, 0.9), k(0.02, 0.9), k(0.035, 0.84)], C.paper, lw, s + 20);                     // the mooring mast's drum
    line(ctx, [k(0, 0.9), k(0, 1)], lw * 0.9, s + 21);
  };

  /* ---------- London ---------- */

  /* bigBen(ctx, [x, ground], { h, time: [hours, minutes], lw }) — the clock tower front on: the shaft with its vertical panels, the clock stage with a face (hands set by `time`), the belfry and the spire. The hands are drawn as they stand; move the minute hand on ones for a running clock, or a jump a minute. Returns the clock's centre and radius. */
  IB.bigBen = (ctx, [x, ground], o = {}) => {
    const h = o.h || 700, lw = o.lw || 3, s = o.seed || 940, k = frame(x, ground, h), [hh, mm] = o.time || [10, 10];
    poly(ctx, [k(-0.07, 0), k(-0.07, 0.62), k(0.07, 0.62), k(0.07, 0)], STONE, lw, s);
    for (const u of [-0.035, 0, 0.035]) line(ctx, [k(u, 0.04), k(u, 0.6)], lw * 0.5, s + 1 + u * 100);
    for (const v of [0.2, 0.4]) line(ctx, [k(-0.07, v), k(0.07, v)], lw * 0.5, s + 4 + v * 10);
    poly(ctx, [k(-0.085, 0.62), k(-0.085, 0.77), k(0.085, 0.77), k(0.085, 0.62)], STONE, lw, s + 6);                  // the clock stage
    const c = k(0, 0.695), r = 0.06 * h;
    IB.oval(ctx, c[0], c[1], r, r, { fill: C.paper, w: lw, seed: s + 7, n: 18 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; IB.seg(ctx, c[0] + Math.sin(a) * r * 0.78, c[1] - Math.cos(a) * r * 0.78, c[0] + Math.sin(a) * r * 0.9, c[1] - Math.cos(a) * r * 0.9, { w: lw * 0.5, seed: s + 8 + i }); }
    const am = (mm / 60) * TAU, ah = ((hh % 12) / 12 + mm / 720) * TAU;
    IB.seg(ctx, c[0], c[1], c[0] + Math.sin(ah) * r * 0.5, c[1] - Math.cos(ah) * r * 0.5, { w: lw * 1.1, seed: s + 21 });
    IB.seg(ctx, c[0], c[1], c[0] + Math.sin(am) * r * 0.78, c[1] - Math.cos(am) * r * 0.78, { w: lw * 0.8, seed: s + 22 });
    poly(ctx, [k(-0.07, 0.77), k(-0.07, 0.84), k(0.07, 0.84), k(0.07, 0.77)], STONE, lw, s + 23);                     // the belfry
    for (const u of [-0.04, 0, 0.04]) line(ctx, [k(u - 0.012, 0.78), k(u - 0.012, 0.825), k(u, 0.835), k(u + 0.012, 0.825), k(u + 0.012, 0.78)], lw * 0.5, s + 24 + u * 100);
    poly(ctx, [k(-0.075, 0.84), k(0, 0.97), k(0.075, 0.84)], C.charcoal, lw, s + 28);                                // the spire
    line(ctx, [k(0, 0.97), k(0, 1)], lw * 0.8, s + 29);
    return { clock: c, r };
  };

  /* towerBridge(ctx, [cx, ground], { h, lift, water, lw }) — Tower Bridge from the river bank: two Gothic towers on piers, the high walkways between their tops, the two bascules that meet in the middle and rise with `lift` (0 shut .. 1 open, 1.4 rad: a machine, move it on ones), and the suspended side spans to the banks. h is the towers' height to the pinnacles; water is the river's y (ground). Returns the bascule tips. */
  IB.towerBridge = (ctx, [cx, ground], o = {}) => {
    const h = o.h || 420, lw = o.lw || 3, s = o.seed || 960, lift = MG.clamp(o.lift || 0, 0, 1), k = frame(cx, ground, h);
    const deckV = 0.22, gap = 0.42, tw = 0.13;                                                                       // deck height, half span between towers, tower half-width
    const tower = (u, sd) => {
      poly(ctx, [k(u - tw * 0.8, -0.02), k(u - tw * 0.8, 0.0), k(u + tw * 0.8, 0.0), k(u + tw * 0.8, -0.02)], STONE, lw, sd);
      poly(ctx, [k(u - tw * 0.6, 0), k(u - tw * 0.6, 0.82), k(u + tw * 0.6, 0.82), k(u + tw * 0.6, 0)], STONE, lw, sd + 1);
      line(ctx, [k(u - tw * 0.25, deckV + 0.05), k(u - tw * 0.25, 0.5), k(u, 0.56), k(u + tw * 0.25, 0.5), k(u + tw * 0.25, deckV + 0.05)], lw * 0.6, sd + 2);   // the pointed arch
      [-1, 1].forEach((sd2) => poly(ctx, [k(u + sd2 * tw * 0.62, 0.82), k(u + sd2 * tw * 0.62, 0.9), k(u + sd2 * tw * 0.47, 1.0), k(u + sd2 * tw * 0.32, 0.9), k(u + sd2 * tw * 0.32, 0.82)], C.navy, lw, sd + 3 + sd2));
      poly(ctx, [k(u - tw * 0.3, 0.82), k(u, 0.96), k(u + tw * 0.3, 0.82)], C.navy, lw, sd + 6);
    };
    // the high walkways
    poly(ctx, [k(-gap + tw * 0.6, 0.66), k(-gap + tw * 0.6, 0.72), k(gap - tw * 0.6, 0.72), k(gap - tw * 0.6, 0.66)], C.sky, lw, s);
    for (let u = -gap + tw * 0.7; u < gap - tw * 0.6; u += 0.05) line(ctx, [k(u, 0.66), k(u + 0.025, 0.72)], lw * 0.5, s + 1 + u * 100);
    // the bascules: hinged at the towers' inner faces, each half the span between them
    const half = gap - tw * 0.6, ang = lift * 1.4, tips = [];
    [-1, 1].forEach((sd) => {
      const hinge = k(sd * (gap - tw * 0.6), deckV), L = half * h, dx = -sd * Math.cos(ang) * L, dy = -Math.sin(ang) * L, tip = [hinge[0] + dx, hinge[1] + dy], t = 0.03 * h;
      poly(ctx, [hinge, tip, [tip[0], tip[1] + t], [hinge[0], hinge[1] + t]], C.sky, lw, s + 10 + sd);
      tips.push(tip);
    });
    tower(-gap, s + 20); tower(gap, s + 30);
    // the side spans: a deck on the chains hung from the towers to the banks
    [-1, 1].forEach((sd) => {
      const t0 = k(sd * (gap + tw * 0.6), 0.6), end = k(sd * (gap + 0.75), deckV + 0.08);
      line(ctx, [t0, k(sd * (gap + 0.35), deckV + 0.12), end], lw, s + 40 + sd);
      poly(ctx, [k(sd * (gap + tw * 0.6), deckV), k(sd * (gap + 0.8), deckV), k(sd * (gap + 0.8), deckV + 0.03), k(sd * (gap + tw * 0.6), deckV + 0.03)], C.sky, lw, s + 42 + sd);
      for (let i = 1; i < 6; i++) { const u = sd * (gap + tw * 0.6 + i * 0.12); const top = lerp(0.6, deckV + 0.1, Math.min(1, i / 3.2)); line(ctx, [k(u, top), k(u, deckV + 0.03)], lw * 0.5, s + 50 + i * sd); }
    });
    return { tips, deck: ground - deckV * h };
  };

  /* londonEye(ctx, [cx, ground], { r, rot, lw }) — the wheel from the side: rim, spokes and 16 egg-shaped capsules that hang level as it turns (rot, rad: it turns once in 30 minutes, so in a shot it barely moves; move it on threes), on its A-frame leaning legs. r is the wheel's radius; the hub is r + 0.12 r above the ground. */
  IB.londonEye = (ctx, [cx, ground], o = {}) => {
    const r = o.r || 300, lw = o.lw || 3, s = o.seed || 990, rot = o.rot || 0, hub = [cx, ground - r * 1.12];
    line(ctx, [[cx - r * 0.45, ground], hub, [cx + r * 0.1, ground]], lw * 1.3, s);
    IB.oval(ctx, hub[0], hub[1], r, r, { w: lw, seed: s + 1, n: 48 });
    IB.oval(ctx, hub[0], hub[1], r * 0.94, r * 0.94, { w: lw * 0.5, seed: s + 2, n: 48 });
    for (let i = 0; i < 16; i++) { const a = rot + (i / 16) * TAU; IB.seg(ctx, hub[0], hub[1], hub[0] + Math.cos(a) * r * 0.94, hub[1] + Math.sin(a) * r * 0.94, { w: lw * 0.4, color: '#7a7a7a', seed: s + 3 + i }); }
    for (let i = 0; i < 16; i++) { const a = rot + (i / 16) * TAU, p = [hub[0] + Math.cos(a) * r * 1.06, hub[1] + Math.sin(a) * r * 1.06]; IB.oval(ctx, p[0], p[1], r * 0.055, r * 0.035, { fill: C.sky, w: lw * 0.8, seed: s + 20 + i, n: 10 }); }
    IB.oval(ctx, hub[0], hub[1], r * 0.05, r * 0.05, { fill: C.paper, w: lw, seed: s + 40, n: 10 });
  };

  /* ---------- Paris ---------- */

  /* eiffel(ctx, [x, ground], { h, sparkle, lw }) — the Eiffel Tower front on: the four legs as two splayed pairs with the great arch between, the first and second platforms, the tapering shaft and the top. Lattice as crossing strokes. sparkle: a drawing number (alternate it on twos) scatters small white flashes over it, the evening show; leave it out by day. Fill C.mustard, the tower's bronze. */
  IB.eiffel = (ctx, [x, ground], o = {}) => {
    const h = o.h || 700, lw = o.lw || 3, s = o.seed || 1010, k = frame(x, ground, h);
    const W = (v) => (v < 0.06 ? 0.21 : v < 0.3 ? lerp(0.19, 0.08, (v - 0.06) / 0.24) : v < 0.6 ? lerp(0.075, 0.035, (v - 0.3) / 0.3) : lerp(0.032, 0.008, (v - 0.6) / 0.35));
    const side = (sd) => [0, 0.06, 0.12, 0.2, 0.3, 0.42, 0.6, 0.8, 0.95].map((v) => k(sd * W(v), v));
    poly(ctx, [...side(-1), ...side(1).reverse()], C.mustard, lw, s, true);
    poly(ctx, Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (i / 12); return k(-0.17 * Math.cos(a), 0.16 * Math.sin(a)); }), C.bg, lw, s + 1, false);   // the great arch, cut out (a half ellipse on a flat base)
    for (const [v, w] of [[0.12, 0.155], [0.3, 0.09], [0.6, 0.042]]) poly(ctx, [k(-w, v), k(-w, v + 0.02), k(w, v + 0.02), k(w, v)], C.paper, lw, s + 2 + v * 10);   // the platforms
    for (let v = 0.16; v < 0.92; v += 0.045) { const a = W(v), b = W(v + 0.045); line(ctx, [k(-a, v), k(b, v + 0.045)], lw * 0.4, s + 10 + v * 100); line(ctx, [k(a, v), k(-b, v + 0.045)], lw * 0.4, s + 11 + v * 100); }
    poly(ctx, [k(-0.01, 0.95), k(-0.01, 0.98), k(0.01, 0.98), k(0.01, 0.95)], C.paper, lw, s + 30);
    line(ctx, [k(0, 0.98), k(0, 1)], lw * 0.8, s + 31);
    if (o.sparkle != null) { const r = MG.rng(s + 77 + o.sparkle * 13); for (let i = 0; i < 26; i++) { const v = 0.1 + r() * 0.85, u = (r() * 2 - 1) * W(v) * 0.9, p = k(u, v); IB.oval(ctx, p[0], p[1], 3.5, 3.5, { fill: C.paper, w: 0, n: 6 }); } }
  };

  /* arcTriomphe(ctx, [x, ground], { h, lw }) — the Arc de Triomphe front on: the block with its great arch, the cornice and attic, and the relief panels as rectangles. */
  IB.arcTriomphe = (ctx, [x, ground], o = {}) => {
    const h = o.h || 300, lw = o.lw || 3, s = o.seed || 1040, k = frame(x, ground, h);
    poly(ctx, [k(-0.45, 0), k(-0.45, 0.78), k(0.45, 0.78), k(0.45, 0)], STONE, lw, s);
    poly(ctx, [k(-0.16, 0), k(-0.16, 0.42), k(-0.1, 0.52), k(0, 0.56), k(0.1, 0.52), k(0.16, 0.42), k(0.16, 0)], C.bg, lw, s + 1, true);
    poly(ctx, [k(-0.48, 0.78), k(-0.48, 0.83), k(0.48, 0.83), k(0.48, 0.78)], STONE, lw, s + 2);
    poly(ctx, [k(-0.45, 0.83), k(-0.45, 1), k(0.45, 1), k(0.45, 0.83)], STONE, lw, s + 3);
    for (const u of [-0.35, 0.25]) poly(ctx, [k(u, 0.12), k(u, 0.4), k(u + 0.1, 0.4), k(u + 0.1, 0.12)], null, lw * 0.6, s + 4 + u * 10);
    for (let u = -0.4; u < 0.45; u += 0.1) line(ctx, [k(u, 0.87), k(u, 0.96)], lw * 0.4, s + 10 + u * 100);
  };

  /* ---------- Tokyo ---------- */

  /* tokyoTower(ctx, [x, ground], { h, lw }) — Tokyo Tower front on: a lattice tower like the Eiffel's but slimmer, in red and white bands (its aviation colours), with the main and top decks as white boxes and the antenna. */
  IB.tokyoTower = (ctx, [x, ground], o = {}) => {
    const h = o.h || 700, lw = o.lw || 3, s = o.seed || 1060, k = frame(x, ground, h);
    const W = (v) => (v < 0.35 ? lerp(0.2, 0.06, v / 0.35) : v < 0.7 ? lerp(0.055, 0.02, (v - 0.35) / 0.35) : lerp(0.018, 0.006, (v - 0.7) / 0.3));
    const bands = [0, 0.1, 0.2, 0.28, 0.35, 0.44, 0.52, 0.6, 0.66, 0.72, 0.78, 0.84];
    for (let i = 0; i < bands.length - 1; i++) { const v0 = bands[i], v1 = bands[i + 1]; poly(ctx, [k(-W(v0), v0), k(-W(v1), v1), k(W(v1), v1), k(W(v0), v0)], i % 2 ? C.paper : C.red, lw, s + i); }
    poly(ctx, [k(-0.13, 0), k(-0.08, 0.09), k(0, 0.11), k(0.08, 0.09), k(0.13, 0)], C.bg, lw, s + 20, true);
    for (let v = 0.12; v < 0.82; v += 0.04) { const a = W(v), b = W(v + 0.04); line(ctx, [k(-a, v), k(b, v + 0.04)], lw * 0.35, s + 30 + v * 100); line(ctx, [k(a, v), k(-b, v + 0.04)], lw * 0.35, s + 31 + v * 100); }
    poly(ctx, [k(-0.075, 0.33), k(-0.075, 0.37), k(0.075, 0.37), k(0.075, 0.33)], C.paper, lw, s + 50);
    poly(ctx, [k(-0.03, 0.62), k(-0.03, 0.645), k(0.03, 0.645), k(0.03, 0.62)], C.paper, lw, s + 51);
    line(ctx, [k(0, 0.84), k(0, 1)], lw * 0.8, s + 52);
  };

  /* torii(ctx, [x, ground], { h, lw }) — a shrine gate: two posts leaning in a little, the straight tie beam (nuki) and the upswept top beam (kasagi) in black over vermilion. */
  IB.torii = (ctx, [x, ground], o = {}) => {
    const h = o.h || 360, lw = o.lw || 3, s = o.seed || 1080, k = frame(x, ground, h);
    [-1, 1].forEach((sd) => poly(ctx, [k(sd * 0.36, 0), k(sd * 0.32, 0.86), k(sd * 0.26, 0.86), k(sd * 0.3, 0)], C.red, lw, s + sd));
    poly(ctx, [k(-0.46, 0.68), k(-0.46, 0.74), k(0.46, 0.74), k(0.46, 0.68)], C.red, lw, s + 3);
    poly(ctx, [k(-0.5, 0.86), k(0.5, 0.86), k(0.56, 0.96), k(0.3, 0.92), k(0, 0.91), k(-0.3, 0.92), k(-0.56, 0.96)], C.red, lw, s + 4, true);
    poly(ctx, [k(-0.56, 0.96), k(-0.3, 0.92), k(0, 0.91), k(0.3, 0.92), k(0.56, 0.96), k(0.58, 1), k(0.3, 0.97), k(0, 0.96), k(-0.3, 0.97), k(-0.58, 1)], C.ink, lw, s + 5, true);
    poly(ctx, [k(-0.03, 0.74), k(-0.03, 0.86), k(0.03, 0.86), k(0.03, 0.74)], C.red, lw, s + 6);
  };

  /* fuji(ctx, [cx, horizon], { w, h, lw }) — Mount Fuji on the horizon: the wide symmetric cone in pale sky blue with the snowcap in paper white, its lower edge a zigzag of gullies. */
  IB.fuji = (ctx, [cx, horizon], o = {}) => {
    const w = o.w || 1200, h = o.h || 380, lw = o.lw || 3, s = o.seed || 1100;
    const top = [cx, horizon - h], pts = [[cx - w / 2, horizon], [cx - w * 0.3, horizon - h * 0.45], [cx - w * 0.09, horizon - h * 0.95], [cx - w * 0.04, horizon - h], [cx + w * 0.04, horizon - h], [cx + w * 0.09, horizon - h * 0.95], [cx + w * 0.3, horizon - h * 0.45], [cx + w / 2, horizon]];
    poly(ctx, pts, C.sky, lw, s, false);
    const snow = [[cx - w * 0.04, top[1]], [cx + w * 0.04, top[1]], [cx + w * 0.09, horizon - h * 0.95], [cx + w * 0.17, horizon - h * 0.7]];
    const zig = []; for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(cx + w * 0.17, cx - w * 0.17, u); zig.push([x, horizon - h * (0.7 + (i % 2 ? 0.1 : 0) - 0.04 * Math.sin(u * Math.PI))]); }
    IB.ink(ctx, [...snow, ...zig, [cx - w * 0.09, horizon - h * 0.95]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: s + 1 });
  };

  /* ---------- Seoul ---------- */

  /* namsanTower(ctx, [x, ground], { h, hill, lw }) — N Seoul Tower on Namsan: the wooded hill (a mound of IB.clump-like bumps in mint, `hill` px tall, 0 for none), the slim shaft, the observation pod as two stacked drums and the antenna mast. h is the tower from the hilltop. Returns the hilltop point. */
  IB.namsanTower = (ctx, [x, ground], o = {}) => {
    const h = o.h || 420, lw = o.lw || 3, s = o.seed || 1120, hill = o.hill == null ? 220 : o.hill;
    const top = ground - hill;
    if (hill > 0) { const w = hill * 3.2, pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, bump = (i % 2 ? 0.06 : 0) * hill; pts.push([x - w / 2 + u * w, ground - Math.sin(u * Math.PI) ** 0.8 * hill - bump * Math.sin(u * Math.PI)]); } poly(ctx, [...pts, [x + w / 2, ground], [x - w / 2, ground]], C.mint, lw, s, true); }
    const k = frame(x, top, h);
    poly(ctx, [k(-0.035, 0), k(-0.022, 0.55), k(0.022, 0.55), k(0.035, 0)], C.paper, lw, s + 1);
    poly(ctx, [k(-0.09, 0.55), k(-0.1, 0.6), k(0.1, 0.6), k(0.09, 0.55)], C.paper, lw, s + 2);
    poly(ctx, [k(-0.08, 0.6), k(-0.08, 0.66), k(0.08, 0.66), k(0.08, 0.6)], C.paper, lw, s + 3);
    for (let u = -0.06; u <= 0.06; u += 0.03) line(ctx, [k(u, 0.61), k(u, 0.65)], lw * 0.4, s + 4 + u * 100);
    poly(ctx, [k(-0.05, 0.66), k(-0.04, 0.7), k(0.04, 0.7), k(0.05, 0.66)], C.paper, lw, s + 9);
    poly(ctx, [k(-0.012, 0.7), k(-0.008, 1), k(0.008, 1), k(0.012, 0.7)], C.paper, lw * 0.8, s + 10);
    for (const v of [0.78, 0.86, 0.93]) line(ctx, [k(-0.012, v), k(0.012, v)], lw * 0.5, s + 11 + v * 10);
    return [x, top];
  };

  /* gwanghwamun(ctx, [x, ground], { h, lw }) — Gwanghwamun gate front on: the granite base with three arched gateways, and the two-storey wooden pavilion above it whose hipped roofs sweep up at the eaves (the curve of hanok roofs), in charcoal tile over mint-and-navy painted beams (dancheong) and red columns. */
  IB.gwanghwamun = (ctx, [x, ground], o = {}) => {
    const h = o.h || 380, lw = o.lw || 3, s = o.seed || 1140, k = frame(x, ground, h);
    poly(ctx, [k(-0.62, 0), k(-0.6, 0.36), k(0.6, 0.36), k(0.62, 0)], STONE, lw, s);
    for (let i = 0; i < 6; i++) line(ctx, [k(-0.61, 0.06 * i), k(0.61, 0.06 * i)], lw * 0.3, s + 1 + i);
    [-0.32, 0, 0.32].forEach((u, i) => poly(ctx, [k(u - 0.09, 0), k(u - 0.09, 0.18), k(u - 0.05, 0.25), k(u, 0.27), k(u + 0.05, 0.25), k(u + 0.09, 0.18), k(u + 0.09, 0)], C.charcoal, lw, s + 10 + i, true));
    const roof = (v, w, rise, sd) => poly(ctx, [k(-w, v), k(-w * 0.82, v + 0.02), k(-w * 0.55, v + rise * 0.8), k(w * 0.55, v + rise * 0.8), k(w * 0.82, v + 0.02), k(w, v), k(w * 1.06, v + 0.05), k(w * 0.8, v - 0.02), k(-w * 0.8, v - 0.02), k(-w * 1.06, v + 0.05)], C.charcoal, lw, sd, true);
    poly(ctx, [k(-0.4, 0.36), k(-0.4, 0.5), k(0.4, 0.5), k(0.4, 0.36)], C.paper, lw, s + 20);
    for (let u = -0.36; u <= 0.37; u += 0.12) poly(ctx, [k(u - 0.012, 0.36), k(u - 0.012, 0.47), k(u + 0.012, 0.47), k(u + 0.012, 0.36)], C.red, lw * 0.6, s + 21 + u * 10);
    poly(ctx, [k(-0.4, 0.47), k(-0.4, 0.5), k(0.4, 0.5), k(0.4, 0.47)], C.mint, lw * 0.7, s + 30);
    roof(0.52, 0.52, 0.12, s + 31);
    poly(ctx, [k(-0.3, 0.62), k(-0.3, 0.73), k(0.3, 0.73), k(0.3, 0.62)], C.paper, lw, s + 32);
    poly(ctx, [k(-0.3, 0.7), k(-0.3, 0.73), k(0.3, 0.73), k(0.3, 0.7)], C.mint, lw * 0.7, s + 33);
    for (let u = -0.26; u <= 0.27; u += 0.13) poly(ctx, [k(u - 0.01, 0.62), k(u - 0.01, 0.7), k(u + 0.01, 0.7), k(u + 0.01, 0.62)], C.red, lw * 0.6, s + 34 + u * 10);
    roof(0.75, 0.42, 0.22, s + 40);
    line(ctx, [k(-0.24, 0.93), k(0.24, 0.93)], lw * 1.2, s + 41);
  };

  /* hanok(ctx, [x, ground], { w, h, lw }) — a hanok house front on, as rows of them are seen over a wall: a low white wall with a tiled coping, the paper-and-timber front with lattice doors, and the charcoal tiled roof whose eaves sweep up at both ends. w is the house's width, h its height to the ridge. */
  IB.hanok = (ctx, [x, ground], o = {}) => {
    const w = o.w || 360, h = o.h || 200, lw = o.lw || 3, s = o.seed || 1150, k = (u, v) => [x + u * w, ground - v * h];
    poly(ctx, [k(-0.42, 0), k(-0.42, 0.52), k(0.42, 0.52), k(0.42, 0)], C.paper, lw, s);
    for (let i = 0; i < 4; i++) { const u = -0.36 + i * 0.19; poly(ctx, [k(u, 0.06), k(u, 0.46), k(u + 0.15, 0.46), k(u + 0.15, 0.06)], null, lw * 0.5, s + 1 + i); for (let j = 1; j < 4; j++) line(ctx, [k(u, 0.06 + j * 0.1), k(u + 0.15, 0.06 + j * 0.1)], lw * 0.3, s + 10 + i * 4 + j); line(ctx, [k(u + 0.075, 0.06), k(u + 0.075, 0.46)], lw * 0.3, s + 30 + i); }
    poly(ctx, [k(-0.42, 0.52), k(-0.42, 0.56), k(0.42, 0.56), k(0.42, 0.52)], C.mint, lw * 0.7, s + 40);
    poly(ctx, [k(-0.56, 0.62), k(-0.46, 0.6), k(-0.3, 0.86), k(0.3, 0.86), k(0.46, 0.6), k(0.56, 0.62), k(0.6, 0.7), k(0.44, 0.66), k(-0.44, 0.66), k(-0.6, 0.7)], C.charcoal, lw, s + 41, true);
    line(ctx, [k(-0.32, 0.9), k(0.32, 0.9)], lw * 1.2, s + 42);
  };

  /* lotteTower(ctx, [x, ground], { h, lw }) — Lotte World Tower: the 555 m supertall as one slender cone with gently convex sides, a seam running up its middle and the open crown slit at the top. */
  IB.lotteTower = (ctx, [x, ground], o = {}) => {
    const h = o.h || 800, lw = o.lw || 3, s = o.seed || 1160, k = frame(x, ground, h);
    const side = (sd) => Array.from({ length: 11 }, (_, i) => { const v = i / 10 * 0.97; return k(sd * 0.075 * (1 - v) ** 0.7 + sd * 0.004, v); });
    poly(ctx, [...side(-1), k(0, 1), ...side(1).reverse()], C.sky, lw, s, true);
    line(ctx, [k(0, 0.02), k(0, 0.93)], lw * 0.5, s + 1);
    for (let v = 0.08; v < 0.9; v += 0.08) { const w = 0.075 * (1 - v) ** 0.7; line(ctx, [k(-w * 0.9, v), k(w * 0.9, v)], lw * 0.3, s + 2 + v * 100); }
    poly(ctx, [k(-0.004, 0.9), k(-0.002, 0.98), k(0.002, 0.98), k(0.004, 0.9)], C.bg, lw * 0.5, s + 20);
  };

  /* ---------- elsewhere ---------- */

  /* operaHouse(ctx, [x, ground], { h, lw }) — the Sydney Opera House from the harbour: the podium and three groups of white sail shells overlapping, their ribs as single strokes. */
  IB.operaHouse = (ctx, [x, ground], o = {}) => {
    const h = o.h || 260, lw = o.lw || 3, s = o.seed || 1180, k = frame(x, ground, h);
    poly(ctx, [k(-1.4, 0), k(-1.4, 0.18), k(1.4, 0.18), k(1.4, 0)], STONE, lw, s);
    const shell = (u, w, t, sd) => { poly(ctx, [k(u, 0.18), k(u + w * 0.15, t * 0.7), k(u + w * 0.55, t), k(u + w, 0.18)], C.paper, lw, sd, true); for (let i = 1; i < 4; i++) line(ctx, [k(u + w * i * 0.22, 0.18), k(u + w * 0.5, t * 0.95)], lw * 0.4, sd + i); };
    [[-1.25, 0.7, 0.8], [-0.75, 0.75, 1.0], [-0.2, 0.6, 0.85], [0.25, 0.55, 0.75], [0.65, 0.5, 0.62]].forEach(([u, w, t], i) => shell(u, w, t, s + 10 + i * 5));
  };

  /* colosseum(ctx, [x, ground], { h, lw }) — the Colosseum: the curved outer wall in three arcaded storeys and the attic, its broken side stepping down, arches as dark openings. */
  IB.colosseum = (ctx, [x, ground], o = {}) => {
    const h = o.h || 300, lw = o.lw || 3, s = o.seed || 1210, k = frame(x, ground, h);
    poly(ctx, [k(-1.2, 0), k(-1.2, 0.6), k(-0.6, 0.6), k(-0.6, 1), k(1.2, 1), k(1.2, 0)], STONE, lw, s);
    for (const [v0, v1, u0] of [[0.05, 0.27, -1.2], [0.33, 0.55, -1.2], [0.62, 0.84, -0.6]]) {
      for (let u = u0 + 0.07; u < 1.15; u += 0.17) poly(ctx, [k(u, v0), k(u, v1 - 0.05), k(u + 0.05, v1), k(u + 0.1, v1 - 0.05), k(u + 0.1, v0)], C.charcoal, lw * 0.6, s + 10 + u * 100 + v0 * 10, true);
      line(ctx, [k(u0, v1 + 0.03), k(1.2, v1 + 0.03)], lw * 0.6, s + 5 + v0 * 10);
    }
    for (let u = -0.55; u < 1.15; u += 0.17) poly(ctx, [k(u, 0.88), k(u, 0.95), k(u + 0.06, 0.95), k(u + 0.06, 0.88)], null, lw * 0.5, s + 60 + u * 100);
  };

  /* pyramids(ctx, [x, ground], { h, lw }) — the three pyramids of Giza in a row, largest nearest the left, in sand yellow with a shaded face (the right one, the sun to the left). */
  IB.pyramids = (ctx, [x, ground], o = {}) => {
    const h = o.h || 320, lw = o.lw || 3, s = o.seed || 1240;
    [[0, 1], [1.5, 0.85], [2.55, 0.45]].forEach(([u, sc], i) => {
      const c = x + u * h, H = h * sc, W = H * 1.55, apex = [c, ground - H];
      poly(ctx, [[c - W / 2, ground], apex, [c + W / 2, ground]], C.yellow, lw, s + i * 5);
      poly(ctx, [apex, [c + W / 2, ground], [c + W * 0.12, ground]], C.mustard, lw, s + i * 5 + 1);
    });
  };

  /* ---------- the ground under them ---------- */

  /* skyline(ctx, y, { x0, x1, w }) — the line a city stands on: one ink stroke across the frame at y (the far bank, the horizon behind a street). */
  IB.skyline = (ctx, y, o = {}) => line(ctx, [[o.x0 == null ? -100 : o.x0, y], [o.x1 == null ? 2100 : o.x1, y]], o.w || 3, o.seed || 1300);

  /* embankment(ctx, y, { x0, x1 }) — a raised rail bed seen from the side: its top line at y and the slope below it as short grey hatches. */
  IB.embankment = (ctx, y, o = {}) => {
    const x0 = o.x0 == null ? -40 : o.x0, x1 = o.x1 == null ? 1960 : o.x1, s = o.seed || 1310;
    line(ctx, [[x0, y], [x1, y]], 4, s);
    for (let x = x0 + 50; x < x1; x += 60) IB.seg(ctx, x, y, x - 14, y + 18, { w: 2, color: '#9a9a9a', seed: s + 1 + x });
  };

  /* cableway(ctx, low, high, { gap, lw }) — an aerial cableway between two stations: the two station houses (white boxes) and the two cables, the second `gap` px under the first. Hang IB.cableCar from points along the cables. */
  IB.cableway = (ctx, low, high, o = {}) => {
    const gap = o.gap || 22, lw = o.lw || 3, s = o.seed || 1320;
    [[low[0] - 70, low[1] - 10, 120], [high[0] - 30, high[1] - 20, 110]].forEach(([x, y, w], i) => poly(ctx, [[x, y], [x + w, y], [x + w, y + 80], [x, y + 80]], C.paper, lw, s + i));
    line(ctx, [low, high], lw, s + 2);
    line(ctx, [[low[0], low[1] + gap], [high[0], high[1] + gap]], lw, s + 3);
  };
})(window);
