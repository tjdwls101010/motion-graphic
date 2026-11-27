/* cast/cat.js — the cats of the IBM pieces, white with an ink outline, acting with ears, eyes and tail. Needs ink.js; adds to the global IB. Used by spot/dark-eyes-reveal (IB.windowCat) and vignette/balloons-lift-chair (IB.chairCat). */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* chairCat(ctx, at, state, opts) — a big white cat loafing front-on on a seat (head 92 px wide), its tail over the seat's edge. `at` is the middle of its base on the seat. state: eyes 'shut' (curved lids) or 'wide' (round with a slit pupil); tail 0 or 1, the two drawings of a slow swing (alternate them on threes). Returns the corner of its mouth, for a bubble's tip (vignette/balloons-lift-chair). */
  IB.chairCat = (ctx, [x, by], st = {}, o = {}) => {
    const { eyes = 'shut', tail = 0 } = st, { seed = 300 } = o;
    ctx.save();
    // tail over the seat's edge, the one thing that moves at the end
    IB.tube(ctx, [[x - 46, by - 16], [x - 92, by - 6], [x - 112 + tail * 12, by + 44], [x - 96 + tail * 34, by + 86]], { w: 15, edge: 2.8, fill: C.paper, smooth: true, seed: seed + tail });
    IB.ink(ctx, [[x - 50, by], [x - 56, by - 44], [x - 30, by - 84], [x + 26, by - 86], [x + 54, by - 46], [x + 50, by]], { closed: true, fill: C.paper, w: 3.2, seed: seed + 10 });
    for (const s of [-1, 1]) IB.ink(ctx, [[x + s * 12, by - 2], [x + s * 14, by - 36], [x + s * 30, by - 34], [x + s * 32, by - 2]], { w: 2.4, seed: seed + 12 + s });   // front paws
    const hy = by - 112;
    for (const s of [-1, 1]) IB.ink(ctx, [[x + s * 40, hy - 14], [x + s * 36, hy - 50], [x + s * 10, hy - 30]], { closed: true, smooth: false, fill: C.paper, w: 3, seed: seed + 20 + s });
    IB.oval(ctx, x, hy, 46, 36, { fill: C.paper, w: 3.2, seed: seed + 22, n: 14 });
    for (const s of [-1, 1]) {
      if (eyes === 'wide') { IB.oval(ctx, x + s * 18, hy - 2, 8.5, 9.5, { fill: C.paper, w: 2.4, seed: seed + 30 + s, n: 9 }); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(x + s * 18, hy - 2, 2.6, 7, 0, 0, 7); ctx.fill(); }
      else IB.ink(ctx, [[x + s * 26, hy - 4], [x + s * 18, hy + 2], [x + s * 10, hy - 4]], { w: 2.6, seed: seed + 30 + s });
      for (const dy of [0, 9]) IB.seg(ctx, x + s * 30, hy + 10 + dy, x + s * 62, hy + 6 + dy * 1.6, { w: 1.6, seed: seed + 34 + s + dy });
    }
    IB.ink(ctx, [[x - 5, hy + 8], [x + 5, hy + 8], [x, hy + 14]], { closed: true, fill: C.ink, w: 1.5, seed: seed + 40 });
    ctx.restore();
    return [x + 44, hy - 26];
  };

  /* ---------- the cat at the next window (the reference's sixth spot) ---------- */
  /* Head, in px about its centre. turn slides the face across the skull; a head in profile gets a muzzle bump on that side. */
  function catHead(ctx, x, y, o) {
    const { turn = 0, tilt = 0, ears = [0, 0], face = 'dot', seed = 430 } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const m = Math.abs(turn) > 0.6 ? Math.sign(turn) : 0;
    IB.ink(ctx, [[-17, -1], [-18.5, -16 + ears[0]], [-10, -9], [0, -10.5], [10, -9], [18.5, -16 + ears[1]], [17, -1], [16 + m * 2.5, 7], [8 + m * 4, 13], [-8 + m * 4, 13], [-16 + m * 2.5, 7]], { closed: true, fill: C.paper, w: 2.2, seed });
    const fx = turn * 7, dot = (dx, dy) => IB.oval(ctx, fx + dx, dy, 1.9, 1.9, { fill: C.ink, w: 0, n: 6 });
    if (face === 'happy') for (const s of [-1, 1]) IB.ink(ctx, [[fx + s * 9, -2], [fx + s * 5, 0.5], [fx + s * 9, 3]], { w: 1.6, smooth: false, seed: seed + 3 + s });
    else if (face === 'up') { for (const s of [-1, 1]) IB.seg(ctx, fx + s * 6 - 2.5, -3 - s, fx + s * 6 + 2.5, -1 - s, { w: 1.8, seed: seed + 3 + s }); }
    else if (m) dot(m * 3, -1);
    else { dot(-6, 0); dot(6, 0); }
    IB.ink(ctx, [[fx - 5 + m * 6, 5.5], [fx - 2.5 + m * 6, 8.5], [fx + m * 6, 5.5], [fx + 2.5 + m * 6, 8.5], [fx + 5 + m * 6, 5.5]], { w: 1.5, seed: seed + 6 });
    ctx.restore();
  }
  /* One barrel of the cat's binoculars: white rim, then black glass, or its own eye in it (yellow with a slit pupil). */
  function catLens(ctx, x, y, r, glass, seed) {
    IB.oval(ctx, x, y, r, r, { fill: C.paper, w: 2, seed, n: 14 });
    IB.oval(ctx, x, y, r * 0.74, r * 0.74, { fill: glass === 'black' ? C.ink : C.yellow, w: 1.6, seed: seed + 1, n: 12 });
    if (glass === 'slit') IB.seg(ctx, x, y - r * 0.45, x, y + r * 0.45, { w: 2, seed: seed + 2, grain: 0 });
  }
  const TAIL = [null, [[1572, 750], [1576, 736], [1586, 726], [1596, 722]], [[1572, 750], [1574, 734], [1578, 722], [1586, 716]], [[1572, 750], [1572, 734], [1568, 722], [1574, 714]]];
  function catTail(ctx, which) {
    if (which) IB.tube(ctx, TAIL[which], { w: 13, edge: 2.1, fill: C.paper, smooth: true, seed: 450 });
  }
  const CX = 1539;   // the cat's centre line once it faces us

  /* windowCat(ctx, pose) — a small white cat (head 37 px) on a window sill, in the reference's coordinates (the sill at y 749, the cat about x 1539): to stage it somewhere else, translate the context.
   pose: kind 'sit': side-on on the sill, head turned by `turn` (-1 profile left ... 1 back over its shoulder) and tipped by `tilt` (rad, - = nose up), ears [left, right] px lowered. 'crouch', 'slink', 'rump', 'tip': leaving. 'none': gone. 'ears', 'peek', 'watch', 'lower', 'rest': front-on behind the sill with its own binoculars; glass 'black' | 'slit' is what shows in them, dip lowers them (px), tail 0-3 is which swish drawing, face 'dot' | 'happy' | 'up' | 'side'.
     opts.at puts its centre on the sill (IB.windowCat.ORIGIN) elsewhere, with opts.s and opts.flip (IB.place). POSE: sit. MOVE, in frames from each one's first drawing: earFlick, lookBack (it looks over its shoulder a beat before the watcher swings: the cat moves first), leave (off the sill in four drawings, then gone), comeBack (ear tips, binoculars on the sill, binoculars at its eyes, the tail swishing), lower (one drawing behind the watcher), followFly. */
  IB.windowCat = (ctx, p, o = {}) => {
    ctx.save();
    IB.place(ctx, IB.windowCat.ORIGIN, o);
    windowCat(ctx, p);
    ctx.restore();
  };
  IB.windowCat.ORIGIN = [CX, 749];   // its centre line on the sill
  function windowCat(ctx, p) {
    const SILL = 749;
    if (p.kind === 'none') return;
    if (p.kind === 'sit' || p.kind === 'crouch') {
      const low = p.kind === 'crouch' ? 7 : 0;
      IB.ink(ctx, [[1525, 697 + low], [1522, 711 + low], [1527, 726 + low * 0.5], [1530, 736], [1524, 747], [1538, 748], [1545, 740], [1550, 736], [1544, 748], [1583, 748], [1585, 737], [1583, 722 + low * 0.4], [1574, 705 + low], [1560, 697 + low], [1548, 688 + low]], { closed: true, fill: C.paper, w: 2.2, seed: 431 });
      IB.shade(ctx, 1528, 724, 20, 24, { from: 'bottom', seed: 432, alpha: 0.22 });
      if (low) catHead(ctx, 1522, 690, { turn: -1, tilt: 0.25, ears: [3, 3] });
      else catHead(ctx, 1533 + p.turn * 2, 680, p);   // low enough to sit on the neck: 6 px higher it floats off the body
      return;
    }
    if (p.kind === 'slink') {   // stretched from the sill down into the room, tail hooked over its back
      IB.ink(ctx, [[1486, 716], [1500, 700], [1524, 692], [1548, 688], [1560, 692], [1564, 720], [1562, 748], [1548, 748], [1546, 728], [1530, 716], [1508, 722], [1494, 740], [1484, 742]], { closed: true, fill: C.paper, w: 2.2, seed: 440 });
      IB.tube(ctx, [[1558, 694], [1566, 676], [1578, 674], [1582, 686], [1576, 694]], { w: 8, edge: 2, fill: C.paper, smooth: true, seed: 441 });
      return;
    }
    if (p.kind === 'rump') {
      IB.ink(ctx, [[1486, 752], [1492, 734], [1508, 728], [1522, 736], [1526, 752]], { closed: true, fill: C.paper, w: 2.2, seed: 442 });
      IB.tube(ctx, [[1510, 732], [1512, 700], [1518, 676], [1530, 668], [1536, 676]], { w: 8, edge: 2, fill: C.paper, smooth: true, seed: 443 });
      return;
    }
    if (p.kind === 'tip') { IB.tube(ctx, [[1494, 756], [1492, 742], [1498, 734]], { w: 8, edge: 2, fill: C.paper, smooth: true, seed: 444 }); return; }
    if (p.kind === 'ears') { for (const s of [-1, 1]) IB.ink(ctx, [[CX + s * 17, SILL + 6], [CX + s * 18, SILL - 8], [CX + s * 9, SILL + 2]], { closed: true, smooth: false, fill: C.paper, w: 2.2, seed: 445 + s }); return; }
    // front-on behind the sill
    catTail(ctx, p.tail);
    if (p.kind === 'peek') {
      catHead(ctx, CX, 716, { ears: [0, 0] });
      for (const s of [-1, 1]) catLens(ctx, CX + s * 13.5, 741, 10.5, 'black', 460 + s);
      return;
    }
    const body = [[1520, 752], [1523, 724], [1528, 711], [1550, 711], [1555, 724], [1558, 752]];
    if (p.kind === 'watch' || p.kind === 'lower') {
      const ly = p.kind === 'watch' ? 702 + p.dip : 722, hy = p.kind === 'watch' ? 688 : 694;
      IB.ink(ctx, body, { closed: true, fill: C.paper, w: 2.2, seed: 446 });
      for (const s of [-1, 1]) IB.ink(ctx, [[CX + s * 14, 724], [CX + s * 32, 722 + (ly - 702) * 0.6], [CX + s * 35, ly - 2], [CX + s * 28, ly - 11], [CX + s * 22, ly - 8], [CX + s * 24, ly + 10], [CX + s * 12, 714]], { closed: true, fill: C.paper, w: 2.2, seed: 447 + s });   // arms up to the barrels
      catHead(ctx, CX, hy, { face: 'dot' });
      for (const s of [-1, 1]) catLens(ctx, CX + s * 14, ly, 12, p.kind === 'watch' ? p.glass : 'black', 462 + s);
      return;
    }
    // 'rest': sitting, binoculars lying at its paws with their glass toward us, the lower half behind the sill
    IB.ink(ctx, [[1518, 752], [1522, 730], [1529, 712], [1549, 712], [1556, 730], [1560, 752]], { closed: true, fill: C.paper, w: 2.2, seed: 448 });
    catHead(ctx, CX + (p.face === 'side' ? 3 : 0), 698, { face: p.face === 'side' ? 'dot' : p.face, turn: p.face === 'side' ? 1 : 0, tilt: p.face === 'up' ? -0.22 : p.face === 'side' ? -0.12 : 0 });
    for (const s of [-1, 1]) catLens(ctx, CX + s * 12.5, p.sat === false ? 740 : 749, 11, 'black', 464 + s);
  }
  const sit = (o) => ({ kind: 'sit', turn: -0.3, tilt: -0.15, ears: [0, 0], ...o });
  const watch = (o) => ({ kind: 'watch', glass: 'slit', tail: 0, dip: 0, ...o });
  const rest = (o) => ({ kind: 'rest', face: 'dot', tail: 0, ...o });
  IB.windowCat.POSE = { sit: sit({}) };
  IB.windowCat.MOVE = {
    // an ear flicks
    earFlick: [
    [0, sit({ ears: [5, 0] })], [2, sit({})],
    ],
    // it looks back over its shoulder a beat before she swings left: in the reference the cat moves first
    lookBack: [
    [0, sit({ turn: 0.2, tilt: 0 })], [2, sit({ turn: 0.8, tilt: 0.05 })],
    [18, sit({ turn: 0.8, tilt: 0.05, ears: [0, 5] })], [20, sit({ turn: 0.8, tilt: 0.05 })],
    [28, sit({ turn: 0, tilt: 0 })], [30, sit({ turn: -1, tilt: -0.3 })],
    [39, sit({ turn: -1, tilt: -0.38, ears: [4, 4] })], [41, sit({ turn: -1, tilt: -0.3 })],
    ],
    // off the sill and away, a drawing every two frames
    leave: [
    [0, { kind: 'crouch' }], [2, { kind: 'slink' }], [4, { kind: 'rump' }], [6, { kind: 'tip' }], [8, { kind: 'none' }],
    ],
    // back, with binoculars
    comeBack: [
    [0, { kind: 'ears' }], [2, { kind: 'peek', tail: 1 }], [4, watch({ glass: 'black', tail: 2 })],
    ...[6, 14].flatMap((f) => [[f, watch({ tail: 1 })], [f + 2, watch({ tail: 2 })], [f + 4, watch({ tail: 3 })], [f + 6, watch({ tail: 2 })]]),
    [22, watch({ tail: 1 })],
    ],
    // lowers them one drawing behind her
    lower: [
    [0, watch({ tail: 2, dip: 5 })], [2, { kind: 'lower', tail: 3 }], [4, rest({ face: 'happy', tail: 2, sat: false })], [6, rest({ face: 'happy', tail: 1 })],
    [9, rest({ tail: 2 })], [13, rest({ tail: 3 })], [17, rest({ tail: 2 })], [21, rest({ tail: 1 })], [25, rest({ tail: 2 })], [29, rest({ tail: 3 })],
    ],
    // something is at the flowers: one look up, then it follows it out
    followFly: [
    [0, rest({ face: 'up', tail: 2 })], [2, rest({ face: 'side', tail: 1 })], [6, rest({ face: 'side', tail: 2 })], [10, rest({ face: 'side', tail: 3 })], [14, rest({ face: 'side', tail: 2 })],
    ],
  };
})(window);
