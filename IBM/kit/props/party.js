/* props/party.js — balloons and party things in the IBM look: flat colour inside a brush-pen outline, a paper glint, strings as thin ink. Needs ink.js, marks.js and solid.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;

  /* balloon(ctx, at, opts) — an upright balloon (120 x 140 px) on a string: `at` is the balloon's centre, `from` where the string is tied (a knot, a hand); the string sags toward the knot under the balloon. One flat fill, a paper glint arc on its upper left (vignette/balloons-lift-chair). */
  IB.balloon = (ctx, [x, y], o = {}) => {
    const { from = [x, y + 160], fill = C.yellow, seed = 100 } = o;
    ctx.save();
    IB.ink(ctx, [from, [lerp(from[0], x, 0.45) + 14, lerp(from[1], y + 74, 0.5)], [x, y + 78]], { w: 2, seed: seed + 3 });
    IB.oval(ctx, x, y, 60, 70, { fill, w: 3.2, seed, n: 14 });
    IB.ink(ctx, [[x - 9, y + 68], [x + 9, y + 68], [x + 7, y + 82], [x - 8, y + 81]], { closed: true, fill, w: 2.4, seed: seed + 1 });
    IB.ink(ctx, IB.ellipse(x - 6, y - 4, 40, 50, 6, 3.5, 4.5), { w: 2.6, color: C.paper, seed: seed + 2 });
    ctx.restore();
  };

  /* discoBall(ctx, at, state, opts) — a mirror ball of radius opts.r centred on `at`, on a string from y opts.from (above the frame): a real sphere seen from 3 radii away, so the rows of tiles bow the way the reference draws them. The tiles keep their colours (warm and white up where the light is, blues underneath) and ride round with it, 0.05 rad every three frames of state.f: the one thing in its shot that never holds. Glints live four drawings each (small, big, turned, gone) and jump to another tile corner (spot/folder-meets-document). */
  IB.discoBall = (ctx, [cx, cy], st = {}, o = {}) => {
    const { f = 0 } = st, { r: R = 105, from = -10 } = o, PI = Math.PI, hash = MG.hash, clamp = MG.clamp;
    ctx.save();
    IB.seg(ctx, cx, from, cx, cy - R, { w: 3, seed: 50 });
    // a real sphere seen from 3 radii away, so the rows bow the way the reference draws them; the tiles keep their colours and ride round with it on threes
    const D = 3, r = R * Math.sqrt(D * D - 1) / D, S = IB.space({ at: [cx, cy], f: r * D, look: 0 });
    const d3 = Math.floor(f / 3), turn = d3 * 0.05, NL = 24, NR = 10, dl = (PI * 2) / NL, top = 1.2, dr = (2 * top) / NR, edge = Math.acos(1 / D) - 0.14;
    const lim = (lat) => Math.acos(Math.min(1, 1 / D / Math.cos(lat))) - 0.004;   // the furthest longitude still on the near side at this latitude
    const pt = (lon, lat) => { const m = lim(lat), l = clamp(lon, -m, m); return S([r * Math.cos(lat) * Math.sin(l), r * Math.sin(lat), -r * Math.cos(lat) * Math.cos(l)]); };
    IB.oval(ctx, cx, cy, R, R, { fill: '#dcdcdc', w: 0, n: 24 });
    const i0 = Math.ceil((-PI / 2 - turn) / dl) - 1;
    for (let k = 0; k <= NL / 2 + 1; k++) for (let j = 0; j < NR; j++) {
      const i = i0 + k, l0 = i * dl + turn, a0 = -top + j * dr, id = ((i % NL) + NL) % NL;
      const h = hash(id * 31 + j, 7), low = j / (NR - 1);   // warm and white tiles up where the light is, blues underneath
      const y = 0.16 + 0.04 * (1 - low), b = y + 0.1 + 0.3 * low, l = b + 0.04 + 0.12 * low;
      const col = h < y ? C.yellow : h < b ? C.blue : h < l ? C.lavender : h < l + 0.3 - 0.12 * low ? C.paper : null;
      if (!col) continue;
      const q = [pt(l0, a0), pt(l0 + dl / 2, a0), pt(l0 + dl, a0), pt(l0 + dl, a0 + dr / 2), pt(l0 + dl, a0 + dr), pt(l0 + dl / 2, a0 + dr), pt(l0, a0 + dr), pt(l0, a0 + dr / 2)];
      IB.ink(ctx, q, { closed: true, smooth: false, fill: col, w: 0, wob: 0 });
    }
    for (let k = 0; k <= NL / 2 + 1; k++) {
      const lon = (i0 + k) * dl + turn, line = [];
      if (Math.abs(lon) > edge) continue;   // a meridian this close to the rim would read as a second outline
      for (let s = 0; s <= 14; s++) { const lat = -top + (2 * top * s) / 14; if (Math.abs(lon) < lim(lat)) line.push(pt(lon, lat)); }
      if (line.length > 2) IB.ink(ctx, line, { w: 2.2, seed: 60 + (((i0 + k) % NL) + NL) % NL, taper: false });
    }
    for (let j = 0; j <= NR; j++) { const lat = -top + j * dr, m = lim(lat); if (m > 0.1) IB.ink(ctx, Array.from({ length: 11 }, (_, s) => pt(-m + (2 * m * s) / 10, lat)), { w: 2.2, seed: 70 + j, taper: false }); }
    IB.oval(ctx, cx, cy, R, R, { w: 3.4, seed: 51, n: 24 });
    // glints: each lives four drawings (small, big, turned, gone) and then jumps to another tile corner
    for (const s of [0, 1]) {
      const life = d3 + s * 2, born = Math.floor(life / 4), age = life % 4, len = [7, 15, 10, 0][age];
      if (!len) continue;
      const a = hash(born, 90 + s) * PI * 2, d = R * (0.35 + 0.6 * hash(born, 95 + s)), gx = cx + Math.cos(a) * d, gy = cy + Math.sin(a) * d, tilt = age === 2 ? PI / 4 : 0;
      for (const b of [0, PI / 2]) IB.seg(ctx, gx - Math.cos(b + tilt) * len, gy - Math.sin(b + tilt) * len, gx + Math.cos(b + tilt) * len, gy + Math.sin(b + tilt) * len, { w: 2.6, color: C.paper, seed: 97 + s, grain: 0 });
    }
    ctx.restore();
  };

  /* looseBalloon(ctx, at, state, opts) — a balloon lying loose on the floor that can be kicked: `at` is its centre, state { rx, ry, turn (of its long axis), knot (where the knot sits, rad round the body) }; a chalk mark grows under it within 57 px of resting on `floor`.
     looseBalloon.MOVE.kicked — the reference's kick, [frame from the kick's start, { x, y, rx, ry, turn, knot }] in the reference's stage coordinates (x, y is the centre to draw it at): it leaves as a single stretched smear, turns once as it sinks, and comes to rest with a squash and two small rocks. */
  IB.looseBalloon = (ctx, [x, y], st = {}, o = {}) => {
    const { rx = 40, ry = 33, turn = 0, knot = -0.45 } = st, { floor = 893 } = o, clamp = MG.clamp;
    if (y > floor - 57) { const k = clamp((y - (floor - 57)) / 30); IB.puddle(ctx, [x, floor + 16], { w: 70 * k, rx: 30 * k, ry: 3.2, n: 10, wob: 1.2, h: 7, rise: 6, seed: 15 }); }   // its chalk mark grows as it nears the floor
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    const a = knot - turn, kx = Math.cos(a) * rx, ky = Math.sin(a) * ry, ux = Math.cos(a), uy = Math.sin(a);
    IB.ink(ctx, [[kx - uy * 6 + ux * 9, ky + ux * 6 + uy * 9], [kx - ux * 2, ky - uy * 2], [kx + uy * 6 + ux * 9, ky - ux * 6 + uy * 9]], { closed: true, fill: C.lavender, w: 2.4, seed: 17 });
    IB.oval(ctx, 0, 0, rx, ry, { fill: C.lavender, w: 3, seed: 16, n: 12 });
    ctx.restore();
  };
  IB.looseBalloon.MOVE = { kicked: [
    [0, { x: 960, y: 855, rx: 40, ry: 33, turn: 0, knot: -0.45 }],
    [22, { x: 953, y: 851, rx: 33, ry: 37, turn: 0, knot: -0.5 }],
    [24, { x: 874, y: 722, rx: 61, ry: 24, turn: 0.99, knot: 0.9 }],
    [26, { x: 812, y: 646, rx: 34, ry: 41, turn: 0.3, knot: 1.25 }], [28, { x: 778, y: 624, rx: 36, ry: 39, turn: 0.1, knot: 1.5 }], [30, { x: 758, y: 618, rx: 39, ry: 35, turn: 0, knot: 1.6 }], [32, { x: 742, y: 616, rx: 40, ry: 33, turn: 0, knot: 1.75 }],
    [34, { x: 727, y: 617, rx: 40, ry: 33, turn: 0, knot: 2.0 }], [36, { x: 712, y: 620, rx: 40, ry: 33, turn: 0, knot: 2.3 }], [38, { x: 698, y: 626, rx: 40, ry: 33, turn: 0, knot: 2.6 }], [40, { x: 685, y: 634, rx: 40, ry: 33, turn: 0, knot: 2.95 }], [42, { x: 672, y: 644, rx: 40, ry: 33, turn: 0, knot: 3.3 }],
    [44, { x: 660, y: 656, rx: 40, ry: 33, turn: 0, knot: 3.65 }], [46, { x: 648, y: 670, rx: 40, ry: 33, turn: 0, knot: 4.0 }], [48, { x: 636, y: 686, rx: 40, ry: 33, turn: 0, knot: 4.35 }], [50, { x: 624, y: 704, rx: 40, ry: 33, turn: 0, knot: 4.7 }], [52, { x: 612, y: 723, rx: 40, ry: 33, turn: 0, knot: 5.0 }],
    [54, { x: 600, y: 744, rx: 40, ry: 33, turn: 0, knot: 5.3 }], [56, { x: 588, y: 766, rx: 40, ry: 33, turn: 0, knot: 5.55 }], [58, { x: 576, y: 789, rx: 40, ry: 33, turn: 0, knot: 5.75 }], [60, { x: 565, y: 812, rx: 40, ry: 33, turn: 0, knot: 5.9 }], [62, { x: 555, y: 834, rx: 40, ry: 33, turn: 0, knot: 6.02 }],
    [64, { x: 546, y: 854, rx: 40, ry: 33, turn: 0, knot: 6.1 }], [66, { x: 538, y: 868, rx: 41, ry: 32, turn: 0, knot: 6.15 }],
    [68, { x: 532, y: 876, rx: 44, ry: 29, turn: 0, knot: 6.18 }], [70, { x: 527, y: 868, rx: 39, ry: 34, turn: 0, knot: 6.12 }], [72, { x: 522, y: 864, rx: 40, ry: 33, turn: 0, knot: 6.05 }], [74, { x: 517, y: 868, rx: 40, ry: 33, turn: 0, knot: 5.98 }], [76, { x: 512, y: 872, rx: 42, ry: 31, turn: 0, knot: 5.94 }], [78, { x: 508, y: 872, rx: 40, ry: 33, turn: 0, knot: 5.9 }],
    [82, { x: 502, y: 872, rx: 40, ry: 33, turn: 0, knot: 5.82 }], [86, { x: 497, y: 872, rx: 40, ry: 33, turn: 0, knot: 5.9 }], [92, { x: 494, y: 872, rx: 40, ry: 33, turn: 0, knot: 5.84 }], [100, { x: 492, y: 872, rx: 40, ry: 33, turn: 0, knot: 5.87 }],
  ] };

  /* heartBalloon(ctx, at, state) — a small yellow heart balloon on a wavy string, the last small thing left moving in a spot: `at` is its centre. state.sway 1 / -1 are its two drawings (alternate them on twos) and state.edge: true is its first drawing, seen edge-on as if it turned into view. Float it up on IB.settle read on twos (spot/folder-meets-document: 290 px, tau 0.45, 2.4 s). */
  IB.heartBalloon = (ctx, [hx, hy], st = {}) => {
    const { sway: k = 1, edge = false } = st;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(k * 0.07);
    ctx.scale(edge ? 0.5 : 1.15, 1.15);   // its first drawing is seen edge-on, as if it turned into view
    IB.ink(ctx, [[0, 27], [k * 5, 40], [-k * 4, 54], [k * 2, 68]], { w: 1.8, seed: 410 });
    IB.ink(ctx, [[0, 25], [-14, 12], [-25, -3], [-22, -18], [-10, -22], [0, -11], [10, -22], [22, -18], [25, -3], [14, 12]], { closed: true, fill: C.yellow, w: 2.3, seed: 411 });
    IB.ink(ctx, [[-4, 24], [0, 30], [4, 24]], { w: 2, seed: 412 });
    ctx.restore();
  };

  /* confettiField(opts) / confetti(ctx, field) — pale flat ovals scattered on the floor (the reference's two confetti colours, #d1e2ee and #eadeac), with no outline: the only floor a party gets besides the chalk under the shoes. confettiField rolls n of them once from a seed inside x .. x + w, y .. y + h; confetti draws them. */
  IB.confettiField = (o = {}) => {
    const { seed = 12, n = 46, x = 720, w = 1230, y = 812, h = 150 } = o, r = MG.rng(seed), out = [];
    for (let i = 0; i < n; i++) out.push([x + r() * w, y + r() * h, 26 + r() * 16, r() < 0.5 ? '#d1e2ee' : '#eadeac']);
    return out;
  };
  IB.confetti = (ctx, field) => {
    ctx.save();
    for (const [x, y, rx, col] of field) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, 5, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  };
})(window);
