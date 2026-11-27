/* sets/city.js — the reference's opening establishing shot: a city skyline with a stadium, as one dense black-and-white line drawing that fills the frame and never moves. Lines of 1-6 px mixed, pattern on a third to two thirds of each face and the rest left white, every gap between buildings filled with foliage, colour in one place only (the stadium's blue strip). Positions, heights and where each tower carries its window pattern were read off the reference frame on a 100 px grid (STYLE.md "establish"). Needs ink.js, solid.js and props/nature.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;

  /* tower(ctx, row, opts) — one high-rise of a skyline seen front on. row = [x0, x1, top, texture, from, to, cap]: texture 'dots' (columns of short window dashes), 'v' (vertical lines), 'h' (horizontal lines), 'grid', 'bays' or '' (blank); from / to = the part of the width that carries it (the reference leaves a third of most towers white); cap = a narrower block on the roof, [x0, x1, top]. Its base runs down to y `base` (700), behind whatever stands in front. */
  IB.tower = (ctx, [x0, x1, top, tex, from = 0, to = 1, cap], o = {}) => {
    const { base = 700, seed = 100 } = o, lw = { w: 1.6, wob: 0.5, taper: false }, a = lerp(x0, x1, from), b = lerp(x0, x1, to);
    ctx.save();
    if (cap) IB.box(ctx, cap[0], cap[2], cap[1] - cap[0], top - cap[2] + 4, { fill: C.bg, w: 2.6, seed: seed + 1 });
    IB.ink(ctx, [[x0, base], [x0, top], [x1, top], [x1, base]], { smooth: false, fill: C.bg, w: 3, seed, closed: true });
    if (tex === 'dots') for (let x = a + 8; x < b - 4; x += 15) for (let y = top + 22; y < base; y += 21) IB.seg(ctx, x, y, x, y + 8, { w: 2.6, wob: 0, seed: seed + x + y });
    if (tex === 'v' || tex === 'grid') for (let x = a + 4; x < b - 2; x += tex === 'grid' ? 42 : 13) IB.seg(ctx, x, top + 8, x, base, { ...lw, seed: seed + x });
    if (tex === 'h' || tex === 'grid') for (let y = top + (tex === 'grid' ? 42 : 16); y < base; y += tex === 'grid' ? 40 : 15) IB.seg(ctx, a, y, b, y + 1, { ...lw, seed: seed + y });
    if (tex === 'bays') for (let k = 0; k < 4; k++) { const x = a + 8 + k * 36; IB.box(ctx, x, top + 38, 20, 140, { w: 2, seed: seed + k }); for (let y = top + 60; y < top + 178; y += 22) IB.seg(ctx, x, y, x + 20, y, { ...lw, seed: seed + k * 9 + y }); }
    ctx.restore();
  };

  /* roofBlock(ctx, q, opts) — a flat-roofed block seen from above: the roof is the four points q (left, back, right, front), the two near faces drop opts.h px. More than four points make a stepped roof (an L, a notch: the reference steps some roofs): every edge facing the viewer drops a wall, and tex patterns each wall. opts.tex: 'v' vertical lines on both faces, 'band' two horizontal lines with a row of dashes between them, 'h' horizontal lines on the right face, 'u' small window marks on the left face, 'none'. */
  IB.roofBlock = (ctx, q, o = {}) => {
    const { h = 60, seed = 500, tex = 'v' } = o;
    if (q.length > 4) return stepped(ctx, q, h, seed, tex);
    ctx.save();
    const down = (p) => [p[0], p[1] + h];
    IB.ink(ctx, [q[0], q[3], down(q[3]), down(q[0])], { closed: true, smooth: false, fill: C.bg, w: 3, seed: seed + 1 });
    IB.ink(ctx, [q[3], q[2], down(q[2]), down(q[3])], { closed: true, smooth: false, fill: C.bg, w: 3, seed: seed + 2 });
    IB.ink(ctx, q, { closed: true, smooth: false, fill: C.bg, w: 3.2, seed });
    const face = (a, b, kind) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (kind === 'v') for (let i = 1; i < Math.floor(len / 17); i++) { const u = i / Math.floor(len / 17), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); IB.seg(ctx, x, y + 12, x, y + Math.min(h - 8, 12 + h * 0.55), { w: 1.7, wob: 0.4, seed: seed + i * 7 }); }
      if (kind === 'band') { for (const k of [0.36, 0.7]) IB.seg(ctx, a[0] + 3, a[1] + h * k, b[0] - 3, b[1] + h * k, { w: 1.8, wob: 0.4, seed: seed + k * 100 }); for (let i = 1; i < Math.floor(len / 20); i++) { const u = i / Math.floor(len / 20), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); IB.seg(ctx, x, y + h * 0.44, x, y + h * 0.62, { w: 2, wob: 0, seed: seed + i * 7 }); } }
      if (kind === 'h') for (let y = 16; y < h - 6; y += 15) IB.seg(ctx, a[0] + 5, a[1] + y, b[0] - 5, b[1] + y, { w: 1.7, wob: 0.4, seed: seed + y });
      if (kind === 'u') for (let i = 1; i < 4; i++) for (let y = 26; y < h - 14; y += 30) { const u = i / 4, x = lerp(a[0], b[0], u), yy = lerp(a[1], b[1], u) + y; IB.ink(ctx, [[x - 4, yy - 5], [x - 3, yy + 3], [x + 3, yy + 3], [x + 4, yy - 5]], { w: 2, seed: seed + i * 5 + y }); }
    };
    if (tex === 'v') { face(q[0], q[3], 'v'); face(q[3], q[2], 'v'); }
    if (tex === 'band') { face(q[0], q[3], 'band'); face(q[3], q[2], 'band'); }
    if (tex === 'h') face(q[3], q[2], 'h');
    if (tex === 'u') { face(q[0], q[3], 'u'); face(q[3], q[2], 'h'); }
    ctx.restore();
  };

  /* A roof of more than four points: an L or a notched block (the reference steps some roofs). Every edge whose outward side faces the viewer (down the screen) drops a wall h px, the walls far to near, then the roof over them; tex patterns every wall as roofBlock does its two. */
  function stepped(ctx, q, h, seed, tex) {
    ctx.save();
    const n = q.length, area = q.reduce((a, p, i) => a + p[0] * q[(i + 1) % n][1] - q[(i + 1) % n][0] * p[1], 0), turn = area > 0 ? -1 : 1;
    const walls = [];
    for (let i = 0; i < n; i++) {
      const a = q[i], b = q[(i + 1) % n], ny = turn * (b[0] - a[0]);   // y of the edge's outward normal: > 0 faces the viewer
      if (ny > 0) walls.push([a, b, i]);
    }
    walls.sort((u, v) => Math.max(u[0][1], u[1][1]) - Math.max(v[0][1], v[1][1]));
    for (const [a, b, i] of walls) {
      IB.ink(ctx, [a, b, [b[0], b[1] + h], [a[0], a[1] + h]], { closed: true, smooth: false, fill: C.bg, w: 3, seed: seed + 1 + i });
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (tex === 'band' && len > 30) {
        for (const k of [0.36, 0.7]) IB.seg(ctx, a[0] + 3, a[1] + h * k, b[0] - 3, b[1] + h * k, { w: 1.8, wob: 0.4, seed: seed + i * 13 + k * 100 });
        for (let j = 1; j < Math.floor(len / 20); j++) { const u = j / Math.floor(len / 20), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); IB.seg(ctx, x, y + h * 0.45, x, y + h * 0.6, { w: 2.2, wob: 0, seed: seed + i * 17 + j }); }
      }
      if (tex === 'v') for (let j = 1; j < Math.floor(len / 17); j++) { const u = j / Math.floor(len / 17), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); IB.seg(ctx, x, y + 12, x, y + Math.min(h - 8, 12 + h * 0.55), { w: 1.7, wob: 0.4, seed: seed + i * 7 + j }); }
    }
    IB.ink(ctx, q, { closed: true, smooth: false, fill: C.bg, w: 3.2, seed });
    ctx.restore();
  }

  /* stadium(ctx, opts) — the stadium: a drum seen from a little above, with a rounded shoulder, a band of big V trusses, a band of crosses between posts, a blue strip at its foot (the shot's one colour apart from what flies through), and the open roof showing pale seating and the dark bowl. opts.shift = [dx, dy] moves it from where the reference has it (centre x 965, foot y 790). */
  IB.stadium = (ctx, o = {}) => {
    const { shift = [0, 0] } = o;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    // a drum seen from a little above: a rounded shoulder, a band of big V trusses, a band of crosses between posts, a bright strip at its foot
    const cx = 965, RX = 425, arc = (cy, ry, a0, a1, n = 28) => IB.ellipse(cx, cy, RX, ry, n, a0, a1);
    const shoulder = [[545, 800], [545, 660], [560, 600], [600, 560], [700, 515], [830, 492], [960, 487], [1100, 492], [1220, 512], [1320, 550], [1370, 600], [1392, 650], [1392, 800]];
    IB.ink(ctx, shoulder.concat(arc(790, 95, 0.02, Math.PI - 0.02)), { closed: true, fill: C.paper, w: 4.5, seed: 300 });
    // the strip at the foot, right of centre
    const s0 = arc(790, 95, 0.27, 1.28, 14), s1 = IB.ellipse(cx, 822, RX, 95, 14, 0.27, 1.28);
    IB.ink(ctx, s0.concat(s1.slice().reverse()), { closed: true, fill: '#3b98e6', w: 0, wob: 0.5 });
    for (let i = 1; i < s0.length * 2 - 1; i++) { const u = i / (s0.length * 2 - 1), k = u * (s0.length - 1), j = Math.min(s0.length - 2, Math.floor(k)), v = k - j; IB.seg(ctx, lerp(s0[j][0], s0[j + 1][0], v), lerp(s0[j][1], s0[j + 1][1], v) + 2, lerp(s1[j][0], s1[j + 1][0], v), lerp(s1[j][1], s1[j + 1][1], v), { w: 1.7, wob: 0, seed: 380 + i, color: '#17406e' }); }
    IB.ink(ctx, arc(790, 95, 0.02, Math.PI - 0.02), { w: 4.5, seed: 303 });
    // lower band: posts at equal angles round the drum, a cross in every bay
    const mid = (a) => [cx + Math.cos(a) * RX, 650 + Math.sin(a) * 90], foot = (a) => [cx + Math.cos(a) * RX, 790 + Math.sin(a) * 95];
    const N = 9, at = (i) => Math.PI * (0.06 + (0.88 * i) / N);
    for (let i = 0; i <= N; i++) { IB.ink(ctx, [mid(at(i)), foot(at(i))], { w: 2.6, seed: 330 + i, smooth: false }); if (i < N) { IB.ink(ctx, [mid(at(i) + 0.02), foot(at(i + 1) - 0.02)], { w: 2.3, seed: 345 + i, smooth: false }); IB.ink(ctx, [mid(at(i + 1) - 0.02), foot(at(i) + 0.02)], { w: 2.3, seed: 360 + i, smooth: false }); } }
    IB.ink(ctx, arc(650, 90, 0.03, Math.PI - 0.03), { w: 4, seed: 301 });
    // upper band: V trusses hanging from under the lip
    const lip = (a) => [cx + Math.cos(a) * RX * 0.97, 562 + Math.sin(a) * 84], M = 9;
    for (let i = 0; i < M; i++) { const a0 = Math.PI * (0.07 + (0.86 * i) / M), a1 = Math.PI * (0.07 + (0.86 * (i + 1)) / M), b = mid((a0 + a1) / 2); IB.ink(ctx, [lip(a0 + 0.02), [b[0], b[1] - 8], lip(a1 - 0.02)], { w: 2.8, seed: 310 + i, smooth: false }); }
    // the roof: ticks round the white rim, pale seating with four ring lines, the dark bowl under the far stand
    const open = IB.ellipse(966, 575, 320, 58, 30);
    for (let i = 0; i < 15; i++) { const a = Math.PI * (1.04 + (0.92 * i) / 14), o = [cx + Math.cos(a) * RX * 0.93, 590 + Math.sin(a) * 96], q = [966 + Math.cos(a) * 320 * 1.05, 575 + Math.sin(a) * 58 * 1.12]; IB.ink(ctx, [[lerp(q[0], o[0], 0.2), lerp(q[1], o[1], 0.2)], [lerp(q[0], o[0], 0.75), lerp(q[1], o[1], 0.75)]], { w: 2.2, seed: 370 + i, smooth: false }); }
    IB.ink(ctx, open, { closed: true, fill: C.sky, w: 0, seed: 305 });
    ctx.save();
    IB.clip(ctx, open);
    for (const ry of [42, 30, 19, 9]) IB.ink(ctx, IB.ellipse(966, 578, 316, ry, 22, Math.PI, Math.PI * 2), { w: 2.2, seed: 306 + ry });
    IB.ink(ctx, IB.ellipse(966, 610, 290, 38, 20, Math.PI, Math.PI * 2).concat([[1256, 660], [676, 660]]), { closed: true, smooth: false, fill: C.ink, w: 0, wob: 0 });
    ctx.restore();
    IB.ink(ctx, open, { closed: true, w: 4, seed: 304 });
    ctx.restore();
  };

  /* The skyline, far to near; clouds [x0, x1, y, height]; birds. */
  const TOWERS = [
  [1272, 1410, 90, 'v', 0.68, 0.72], [632, 700, 108, 'h', 0.25, 0.95], [452, 580, 153, 'v', 0.66, 1], [880, 1005, 150, 'h', 0.55, 1], [1190, 1310, 152, 'dots', 0.34, 0.95],
  [783, 852, 182, 'v', 0.1, 0.5], [598, 760, 212, 'dots', 0.42, 0.98], [818, 942, 212, 'dots', 0.42, 0.98, [840, 860, 238]], [360, 440, 215, 'dots', 0.3, 0.95], [1505, 1612, 213, 'v', 0.45, 0.95],
  [1065, 1188, 272, 'h', 0.06, 0.94, [1092, 1172, 242]], [395, 518, 272, 'v', 0.12, 0.55], [1312, 1492, 335, 'grid', 0.08, 1], [298, 368, 335, 'dots', 0.1, 0.9, [305, 352, 322]], [945, 990, 335, 'h', 0.2, 0.9],
  [1703, 1788, 360, 'h', 0.05, 0.95], [1522, 1650, 392, 'dots', 0.1, 0.6], [780, 945, 395, 'v', 0.05, 0.95], [100, 285, 435, 'bays', 0.05, 0.75], [518, 640, 452, 'dots', 0.2, 0.7], [1465, 1705, 540, 'v', 0.1, 0.6], [1725, 1845, 478, 'h', 0.3, 0.95],
];
  const BIRDS = [[230, 415], [262, 466], [1020, 405], [1555, 95], [1520, 148], [1735, 108], [1672, 438]];
  const CLOUDS = [[725, 1072, 55, 40], [1068, 1228, 80, 25], [300, 618, 145, 58], [133, 285, 286, 28], [1678, 1843, 196, 21], [1442, 1560, 4, 16]];

  /* Everything in front of the skyline, far to near (0: behind the stadium, the feet of the towers; 1: in front of it). Foliage goes in as it comes, so that each clump hides the foot of what stands behind it. */
  function ground(ctx, layer) {
    const C1 = (list) => list.forEach(([x, y, rx, ry], i) => IB.clump(ctx, [x, y], [rx, ry], { seed: 500 + layer * 40 + i }));
    if (layer === 0) {   // behind the stadium: the feet of the towers
      C1([[150, 612, 70, 26], [300, 620, 90, 30], [460, 628, 80, 30], [1440, 620, 70, 34], [1600, 690, 70, 30], [1800, 640, 110, 40], [1860, 720, 80, 40]]);
      IB.roofBlock(ctx, [[1650, 628], [1692, 618], [1735, 628], [1692, 638]], { h: 86, seed: 590, tex: 'v' });   // the small round tower, drawn as a box
      return;
    }
    C1([[110, 700, 110, 48], [200, 780, 120, 44], [1700, 770, 110, 36]]);
    IB.roofBlock(ctx, [[205, 672], [495, 637], [524, 652], [520, 664], [362, 698], [515, 726], [526, 738], [318, 772]], { h: 55, seed: 520 });   // one block whose roof is cut by a notch on its right (the reference's first frame)
    IB.roofBlock(ctx, [[1400, 742], [1512, 708], [1590, 724], [1470, 760]], { h: 118, seed: 510, tex: 'u' });
    C1([[150, 900, 150, 60], [1640, 880, 80, 30], [1520, 900, 60, 24]]);
    IB.roofBlock(ctx, [[1690, 828], [1800, 806], [1850, 820], [1735, 845]], { h: 92, seed: 530, tex: 'h' });
    IB.roofBlock(ctx, [[198, 834], [420, 790], [755, 833], [408, 920], [255, 888], [360, 862]], { h: 96, seed: 540, tex: 'band' });   // an L: its near-left corner stepped back (read on the reference's first frame, 50 px grid)
    C1([[920, 862, 150, 30], [820, 846, 60, 22], [1030, 854, 50, 20], [380, 1010, 120, 40], [1790, 970, 150, 60], [1905, 915, 60, 50]]);
    IB.roofBlock(ctx, [[1060, 948], [1380, 870], [1612, 896], [1300, 976]], { h: 120, seed: 550 });
    IB.roofBlock(ctx, [[1215, 922], [1340, 898], [1405, 912], [1280, 938]], { h: 24, seed: 560, tex: 'none' });
    for (let i = 0; i < 3; i++) IB.seg(ctx, 1322 + i * 12, 940 - i * 3, 1332 + i * 12, 937 - i * 3, { w: 2, seed: 565 + i });
    IB.roofBlock(ctx, [[508, 1020], [832, 923], [988, 950], [648, 1050]], { h: 62, seed: 570, tex: 'none' });
    IB.roofBlock(ctx, [[636, 972], [686, 958], [696, 964], [646, 980]], { h: 42, seed: 575, tex: 'h' });
    C1([[1010, 1040, 90, 36], [1720, 1070, 200, 44], [90, 1030, 130, 50]]);
  }

  /* stadiumCity(ctx, opts) — the whole shot, filling a 1920x1080 frame. opts.layer draws one layer, so that something can pass between them: 'sky' (clouds and birds), 'skyline' (the towers and the foliage at their feet), 'stadium', 'front' (the blocks and foliage in front); without it all four, back to front. opts.shift = [dx, dy] moves the whole drawing. The drawing holds still: one small coloured thing crosses it on twos (establish/city-stadium-flyin: IB.heliDrawing). */
  IB.stadiumCity = (ctx, o = {}) => {
    const { layer = null, shift = [0, 0] } = o, on = (name) => !layer || layer === name;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    if (on('sky')) { CLOUDS.forEach((c, i) => IB.cloud(ctx, c, { seed: 700 + i * 3 })); for (const b of BIRDS) IB.bird(ctx, b); }
    if (on('skyline')) { TOWERS.forEach((b, i) => IB.tower(ctx, b, { seed: 100 + i * 13 })); ground(ctx, 0); }
    if (on('stadium')) IB.stadium(ctx);
    if (on('front')) ground(ctx, 1);
    ctx.restore();
  };
})(window);
