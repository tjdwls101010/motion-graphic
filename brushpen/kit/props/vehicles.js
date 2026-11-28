/* props/vehicles.js — things that roll, fly or carry in the IBM look: flat colour bodies in a brush-pen outline, wheels as paper ovals, motion shown by drawings and marks rather than blur. Needs ink.js, marks.js and figure.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* rail(points, per = 40) — a track through `points` as dense samples of the same Catmull-Rom curve IB.ink draws through them, with the length run so far at each sample: { pts, len, per, at(s) }, where at(s) is the point { p, a } (position and tangent angle) at arc length s. len[i * per] is the arc length at point i (market/chart-rollercoaster-rider). */
  IB.rail = (P, PER = 40) => {
    const n = P.length, at = (i) => P[Math.max(0, Math.min(n - 1, i))], pts = [];
    for (let i = 0; i < n - 1; i++) { const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2); for (let k = 0; k < PER; k++) { const u = k / PER, u2 = u * u, u3 = u2 * u; pts.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))); } }
    pts.push(P[n - 1]);
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const railAt = (s) => {
      s = clamp(s, 0, len[len.length - 1] - 0.01);
      let i = 0; while (len[i + 1] < s) i++;
      const u = (s - len[i]) / (len[i + 1] - len[i]), a = pts[i], b = pts[i + 1];
      return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    return { pts, len, per: PER, at: railAt, points: P };
  };

  /* coasterTrack(ctx, rail, opts) — the track itself: thin grey supports every 96 px from the rail down to `base`, then the rail as one 5.5 px ink line through its points; layer 'supports' or 'rail' draws only one of them, so a floor smear can go between. Draw a chart's axes (IB.chartAxes) under it to make the ride a price chart (market/chart-rollercoaster-rider). */
  IB.coasterTrack = (ctx, rail, o = {}) => {
    const { base: BASE = 900, layer = 'all', seed = 30 } = o;
    ctx.save();
    if (layer !== 'rail') for (let s = 90; s < rail.len[rail.len.length - 1]; s += 96) { const q = rail.at(s).p; IB.seg(ctx, q[0], q[1] + 4, q[0], BASE, { w: 2, color: '#b0b0b0', seed: seed + Math.round(s), grain: 0 }); }
    if (layer !== 'supports') IB.ink(ctx, rail.points, { w: 5.5, seed: seed + 10, taper: false });
    ctx.restore();
  };

  /* coasterCart(ctx, rail, s, opts) — a yellow cart on two paper wheels riding the rail with its rear wheel near arc length s, and a rider sitting in it, everything drawn at scale K with line widths divided back. Each wheel's centre sits one radius (plus half the rail's thickness) off the rail along the rail's normal there; the cart does not bend, so the front wheel is found on the rail one wheelbase from the rear. stretch > 1 is the one smear drawing of a plunge. rider: { look, pose, bar } — an IB.figure look and a pose in cart coordinates (hip about [-14, -52], feet forward and hidden), bar false when the hands are thrown up. Returns { p, a }: the cart's centre and angle (market/chart-rollercoaster-rider). */
  IB.coasterCart = (ctx, rail, s, o = {}) => {
    const { stretch = 1, K = 1.35, rider = null, seed = 60 } = o;
    const R = 11 * K + 2.75, off = (q) => [q.p[0] + Math.sin(q.a) * R, q.p[1] - Math.cos(q.a) * R];
    const base = 82 * K * stretch, sr = s - 40 * K * stretch, rear = off(rail.at(sr));
    let lo = sr + base * 0.5, hi = sr + base * 1.6;
    for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, q = off(rail.at(mid)); if (Math.hypot(q[0] - rear[0], q[1] - rear[1]) < base) lo = mid; else hi = mid; }
    const front = off(rail.at((lo + hi) / 2)), a = Math.atan2(front[1] - rear[1], front[0] - rear[0]);
    const p = [lerp(rear[0], front[0], 40 / 82) - Math.sin(a) * 11 * K, lerp(rear[1], front[1], 40 / 82) + Math.cos(a) * 11 * K];
    ctx.save();
    ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.scale(stretch * K, K);
    const who = rider && { ...rider.look, lw: IB.figLine(rider.look.h * K) / K };
    if (rider) IB.figure(ctx, rider.pose, who, 'far');
    if (rider && rider.bar !== false) IB.seg(ctx, 40, -50, 50, -94, { w: 3.4 / K, seed });                                               // the bar
    IB.ink(ctx, [[-66, -66], [-58, -16], [58, -16], [72, -52], [56, -52], [48, -40], [-46, -40], [-50, -66]], { closed: true, smooth: false, fill: C.yellow, w: 3.8 / K, seed: seed + 1 });
    for (const x of [-40, 42]) { IB.oval(ctx, x, -11, 11, 11, { fill: C.paper, w: 3.2 / K, seed: seed + 2 + x, n: 10 }); IB.oval(ctx, x, -11, 3, 3, { fill: C.ink, w: 0, n: 6 }); }
    if (rider) IB.figure(ctx, rider.pose, who, 'near');
    ctx.restore();
    return { p, a };
  };

  /* coasterClack(ctx, cart, k, opts) — the clack of the chain catching each notch on the way up: one short stroke behind the cart (70 K back along its angle), alternating up and down with the notch count k (market/chart-rollercoaster-rider). */
  IB.coasterClack = (ctx, c, k, o = {}) => {
    const { K = 1.35, seed = 70 } = o, back = [c.p[0] - Math.cos(c.a) * 70 * K, c.p[1] - Math.sin(c.a) * 70 * K], side = k % 2 ? -1 : 1;
    ctx.save();
    IB.seg(ctx, back[0] - 14, back[1] + side * 10 - 20, back[0] - 30, back[1] + side * 16 - 26, { w: 2.6, seed: seed + k });
    ctx.restore();
  };

  /* coasterSpeedLines(ctx, rail, from, to, opts) — four slanted speed lines along the rail between arc lengths from and to, drawn with the plunge's one smear drawing (market/chart-rollercoaster-rider). */
  IB.coasterSpeedLines = (ctx, rail, from, to, o = {}) => {
    const { seed = 100 } = o;
    ctx.save();
    for (let i = 0; i < 4; i++) { const q = rail.at(lerp(from, to, i / 3)).p; IB.seg(ctx, q[0] + 26 + i * 6, q[1] - 34 - i * 12, q[0] + 64 + i * 10, q[1] + 36 - i * 8, { w: 3, seed: seed + i }); }
    ctx.restore();
  };

  /* conveyor(ctx, at, state, opts) — a belt conveyor running off-screen right: `at` = [x of its rounded left end, y of the belt's top]. Lavender pipe legs at each x in `legs` standing on `floor` (each with its chalk smear), a grey belt 46 px deep, a roller every 150 px, short marks on the belt. state.travel is how far the belt has run in px: rollers turn and marks move with it. It is a machine: give it travel = raw t * speed, on ones, while what rides it acts on twos (metaphor/parcels-board-conveyor: 230 px/s). */
  IB.conveyor = (ctx, [BX0, BELT], st = {}, o = {}) => {
    const { travel = 0 } = st, { floor: FLOOR = BELT + 210, legs = [960, 1340, 1720], seed = 300 } = o;
    ctx.save();
    for (const x of legs) { IB.smear(ctx, x, FLOOR - 4, 130, { h: 9, seed: seed - 260 + x }); IB.pipe(ctx, [[x - 34, FLOOR], [x, BELT + 60], [x + 34, FLOOR]], { seed: seed + x }); }
    IB.ink(ctx, [[2000, BELT + 46], [2000, BELT]].concat(IB.ellipse(BX0 + 23, BELT + 23, 23, 23, 8, -Math.PI / 2, -Math.PI * 1.5)), { closed: true, smooth: false, fill: '#d9d9d9', w: 3.6, seed: seed + 10 });
    for (let x = BX0 + 26; x < 1960; x += 150) {
      IB.oval(ctx, x, BELT + 23, 17, 17, { fill: C.paper, w: 2.6, seed: seed + 20 + x, n: 10, wob: 0.3 });
      const a = travel / 17; IB.seg(ctx, x - Math.cos(a) * 12, BELT + 23 - Math.sin(a) * 12, x + Math.cos(a) * 12, BELT + 23 + Math.sin(a) * 12, { w: 2, seed: seed + 21, wob: 0 });
    }
    // marks on the belt, travelling with it on ones
    for (let i = -1; i < 13; i++) { const x = BX0 + 40 + ((i * 90 + travel) % 1080 + 1080) % 1080; IB.seg(ctx, x, BELT + 6, x + 26, BELT + 6, { w: 2, seed: seed + 30 + ((i % 12) + 12) % 12, color: '#8a8a8a' }); }
    ctx.restore();
  };

  /* stamper(ctx, at, state, opts) — a gantry over a belt with a stamping pad on a rod and a lamp: `at` = [the pad's x, the belt's top y]. state: down 0..1 (0 the pad at rest 318 px above the belt, 1 touching); top, the y of the top of the thing under it (the pad stops 34 px above... on it); hit, the drawing of a stamp: 0 the pad on its way down (one stretched drawing), 1 contact, 2-3 going back up, -1 none. A burst flies off the contact on drawings 1 and 2; the lamp is green from contact on. The pad's four drawings: down 0.6, 1, 0.55, 0.2 (metaphor/parcels-board-conveyor). */
  const STAMPER_AT = [1500, 690];
  IB.stamper = (ctx, at, st = {}, o = {}) => {
    const { down = 0, hit = -1 } = st, { seed = 340 } = o, SCAN = STAMPER_AT[0], BELT = STAMPER_AT[1], dy = at[1] - BELT;
    const top = (st.top == null ? at[1] - 150 : st.top) - dy, rest = 372, y = lerp(rest, top - 34, down);
    ctx.save(); ctx.translate(at[0] - SCAN, dy);
    IB.tube(ctx, [[SCAN, 300], [SCAN, y]], { w: 11, edge: 2.4, fill: C.paper, seed: seed + 10 });
    if (hit === 0) IB.ink(ctx, [[SCAN - 46, rest + 6], [SCAN + 46, rest + 6], [SCAN + 50, y + 34], [SCAN - 50, y + 34]], { closed: true, smooth: false, fill: C.charcoal, w: 3, seed: seed + 12 });   // the pad on its way down: one stretched drawing
    else IB.box(ctx, SCAN - 50, y, 100, 34, { fill: C.charcoal, w: 3.4, seed: seed + 11 });
    if (hit === 1 || hit === 2) IB.burst(ctx, [SCAN, top], { angles: [-2.6, -2.1, -1.05, -0.55], r0: 84 + (hit - 1) * 20, r1: 84 + (hit - 1) * 20 + 36, sy: 0.6, seed: seed + 20 + hit * 5 });
    IB.pipe(ctx, [[SCAN - 170, BELT + 2], [SCAN - 170, 296], [SCAN + 170, 296], [SCAN + 170, BELT + 2]], { seed });
    IB.box(ctx, SCAN - 44, 272, 88, 50, { fill: C.lavender, w: 3.2, seed: seed + 1 });
    IB.oval(ctx, SCAN, 297, 11, 11, { fill: hit >= 1 ? C.green : C.paper, w: 2.4, seed: seed + 2, n: 9 });
    ctx.restore();
  };

  /* paperPlane(ctx, at, opts) — a lavender paper plane 124 px long (times s) pointing right, turned by rot; stretch > 1 is its smear drawing as it enters. Line width is kept at 3 px on screen down to scale 1.9, then 1.6 px in the plane's own units. Fly it as a list of drawings on twos, each smaller, toward a vanishing point (variation/hall-whip-button). */
  IB.paperPlane = (ctx, [x, y], o = {}) => {
    const { s = 1, rot = 0, stretch = 1, seed = 400 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * stretch, s);
    const w = Math.max(1.6, 3 / s);
    IB.ink(ctx, [[-60, -6], [64, 0], [-60, 30], [-40, 6]], { closed: true, smooth: false, fill: C.lavender, w, seed });
    IB.ink(ctx, [[-60, -6], [64, 0], [-52, -34]], { closed: true, smooth: false, fill: '#d3c4f5', w, seed: seed + 1 });
    IB.seg(ctx, -40, 6, 64, 0, { w: w * 0.7, seed: seed + 2 });
    ctx.restore();
  };

  /* cab(ctx, at, state, opts) — a yellow taxi 388 px long seen from the side, heading right: `at` = [its centre x, the road's y]; the wheels (radius 34) stand on the road. state.spin turns the wheels: give it the distance travelled / 34; state.lit draws three short glow strokes over the roof sign (the cab is free). A machine: move it on ones (market/street-rush-hour: 520 px/s). */
  IB.cab = (ctx, [x, ROAD], st = {}, o = {}) => {
    const { spin = 0 } = st, y = ROAD - 34;   // the wheels stand on the road, inside its near edge
    ctx.save();
    IB.ink(ctx, [[x - 190, y], [x - 196, y - 50], [x - 150, y - 62], [x - 104, y - 112], [x + 56, y - 112], [x + 110, y - 62], [x + 178, y - 54], [x + 192, y - 30], [x + 190, y]], { closed: true, smooth: false, fill: C.yellow, w: 3.4, seed: 700, wob: 0.5 });
    IB.ink(ctx, [[x - 134, y - 64], [x - 96, y - 102], [x - 28, y - 102], [x - 28, y - 64]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: 701 });
    IB.ink(ctx, [[x - 14, y - 64], [x - 14, y - 102], [x + 50, y - 102], [x + 92, y - 64]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: 702 });
    IB.box(ctx, x - 44, y - 132, 60, 20, { fill: C.paper, w: 2.6, seed: 703 });
    if (st.lit) [-1, 0, 1].forEach((k) => IB.seg(ctx, x - 14 + k * 26, y - 140, x - 14 + k * 34, y - 156, { w: 2.4, seed: 704 + k }));   // the roof sign lit: the cab is free
    for (let i = 0; i < 9; i++) if (i % 2 === 0) { ctx.fillStyle = C.ink; ctx.fillRect(x - 126 + i * 26, y - 44, 26, 12); }
    for (const wx of [x - 118, x + 116]) {
      IB.oval(ctx, wx, y, 34, 34, { fill: C.charcoal, w: 3, seed: 710 + (wx > x ? 1 : 0), n: 16, wob: 0.3 });
      IB.oval(ctx, wx, y, 14, 14, { fill: C.paper, w: 2, seed: 712, n: 10, wob: 0.2 });
      IB.seg(ctx, wx - Math.cos(spin) * 13, y - Math.sin(spin) * 13, wx + Math.cos(spin) * 13, y + Math.sin(spin) * 13, { w: 2, seed: 713, wob: 0 });
    }
    ctx.restore();
  };

  /* rotor(ctx, at, opts) — a helicopter's spinning rotor: a fan of nine thin straight strokes opts.span long through the mast at `at`, re-rolled for every drawing opts.d. It stays within a few degrees of level whatever the body is doing. */
  IB.rotor = (ctx, [x, y], o = {}) => {
    const { span = 300, lw = 1.6, d = 0 } = o, rng = MG.rng;
    const r = rng(700 + d);
    for (let i = 0; i < 9; i++) { const l = span * (0.6 + r() * 0.4), k = (r() - 0.5) * 0.16; IB.seg(ctx, x - l, y - l * k + (r() - 0.5) * 14, x + l * (0.5 + r() * 0.5), y + l * k * 0.6 + (r() - 0.5) * 14, { w: lw, wob: 0, seed: 710 + i + d * 9 }); }
  };

  /* heli(ctx, at, opts) — the yellow helicopter seen from the side, nose right, drawn about the centre of its cabin at `at`: s scales it, rot tips it, facing -1 flips it nose left (and -1.3 also stretches it: the smear drawing it enters on), d is the drawing number (re-rolls the rotor). The rotor does not tip with the body: 85% of the body's turn is taken back out about the mast. Line width thins with the square root of the scale. The reference paints a brand mark and a word on the cabin: left out. (establish/city-stadium-flyin). */
  IB.heli = (ctx, [x, y], o = {}) => {
    const { s = 1, rot = 0, facing = 1, d = 0 } = o;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * facing, s);
    const lw = 2.4 / Math.sqrt(s);
    IB.tube(ctx, [[-55, 52], [76, 58]], { w: 9, edge: 2, fill: '#b9b9b9', seed: 600 });                      // skid
    IB.tube(ctx, [[-30, 36], [-40, 52]], { w: 7, edge: 1.8, fill: '#b9b9b9', seed: 601 });
    IB.tube(ctx, [[40, 38], [50, 56]], { w: 7, edge: 1.8, fill: '#b9b9b9', seed: 602 });
    IB.ink(ctx, [[-216, -118], [-204, -116], [-196, -20], [-212, -12]], { closed: true, smooth: false, fill: C.yellow, w: lw, seed: 603 });      // tail fin
    IB.ink(ctx, [[-228, -64], [-186, -58], [-186, -49], [-228, -52]], { closed: true, smooth: false, fill: C.yellow, w: lw, seed: 604 });        // stabiliser
    IB.ink(ctx, [[-198, -61], [-75, -43], [10, -50], [22, -36], [50, -17], [83, 27], [74, 41], [-25, 36], [-75, -5], [-198, -43]], { closed: true, fill: C.yellow, w: lw, seed: 605 });   // boom and cabin in one shape
    IB.ink(ctx, [[19, -13], [60, -9], [63, 17], [22, 14]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: 606 });                    // side window, four panes
    IB.seg(ctx, 40, -11, 42, 15, { w: lw * 0.8, seed: 607 }); IB.seg(ctx, 20, 0, 61, 4, { w: lw * 0.8, seed: 608 });
    IB.ink(ctx, [[65, -5], [77, 12], [67, 15]], { closed: true, smooth: false, fill: C.paper, w: lw * 0.8, seed: 609 });
    IB.seg(ctx, 17, -50, 17, -60, { w: lw * 1.4, seed: 610 });
    // the rotor does not tip with the body: most of the body's turn is taken back out about the mast
    ctx.translate(17, -62); ctx.rotate(-rot * 0.85 * Math.sign(facing)); ctx.translate(-17, 62);
    ctx.scale(1 / s, 1 / s); IB.rotor(ctx, [17 * s, -62 * s], { span: 280 * s, lw: 1.6 * Math.sqrt(s), d }); 
    ctx.restore();
  };

  /* heliFront(ctx, at, opts) — the same craft facing the lens, cabin centred on `at`: the boom rises behind it to the tail fin, the skids hang level under it. sx, sy squeeze it as it turns on. The reference paints an eye and a word on the cabin: left out. */
  IB.heliFront = (ctx, [x, y], o = {}) => {
    const { sx = 1, sy = 1, d = 0 } = o;
    ctx.save();
    ctx.translate(x, y); ctx.scale(sx, sy);
    const lw = 2.6;
    IB.ink(ctx, [[-22, -100], [-12, -400], [-40, -404], [-40, -420], [40, -420], [40, -404], [12, -400], [22, -100]], { closed: true, smooth: false, fill: C.yellow, w: lw, seed: 620 });   // boom and tail fin
    for (const s of [-1, 1]) { IB.tube(ctx, [[s * 58, 96], [s * 74, 126]], { w: 8, edge: 2, fill: '#b9b9b9', seed: 622 + s }); IB.tube(ctx, [[s * 108, 118], [s * 74, 128], [s * 50, 122]], { w: 9, edge: 2, fill: '#b9b9b9', smooth: true, seed: 624 + s }); }   // skids
    IB.ink(ctx, [[-80, -104], [0, -116], [80, -104], [106, -40], [112, 30], [84, 96], [0, 112], [-84, 96], [-112, 30], [-106, -40]], { closed: true, fill: C.yellow, w: lw, seed: 626 });   // cabin
    IB.ink(ctx, [[-70, -78], [0, -88], [70, -78], [84, -24], [0, -14], [-84, -24]], { closed: true, fill: C.paper, w: lw, seed: 627 });   // windscreen, two panes
    IB.seg(ctx, 0, -88, 0, -14, { w: 2, seed: 628 });
    IB.seg(ctx, 0, -116, 0, -132, { w: 4, seed: 629 });
    ctx.restore();
    IB.rotor(ctx, [x, y - 132 * sy], { span: 300 * sx, lw: 1.6, d });
  };

  /* heliTurn(ctx, at, opts) — the same craft at any angle between the side and the front, for the drawings of a turn: it is built as a few solid parts (an egg of a cabin, a boom with its fin, two skids) and projected, then drawn with the same brush pen. yaw 0 is the side view nose right, PI / 2 nose to the lens, PI side view nose left; the camera looks down at it by `tilt` rad (0.35); rot tips the drawing about `at` while the rotor keeps near level (15% of it). `at` is the cabin's centre, s its scale (1: cabin about 150 px long; lines 2.4 x sqrt(s) on screen, as IB.heli). The near side window shows only on the side that faces the lens, the windscreen only while the nose does. */
  IB.heliTurn = (ctx, [x, y], o = {}) => {
    const { s = 1, yaw = Math.PI / 4, tilt = 0.35, rot = 0, d = 0, seed = 640 } = o, c = Math.cos(yaw), sn = Math.sin(yaw), ce = Math.cos(tilt), se = Math.sin(tilt), cr = Math.cos(rot), sr = Math.sin(rot);
    // body coordinates: x forward, y to the craft's left, z up. Depth (toward the lens) is the rotated y; nearer points sit lower on screen
    const P = ([px, py, pz]) => { const X = px * c - py * sn, D = px * sn + py * c, u = s * X, v = s * (-pz * ce + D * se); return [x + u * cr - v * sr, y + u * sr + v * cr]; }, depth = ([px, py]) => px * sn + py * c;   // rot tips the whole drawing about `at`
    const lw = 2.4 * Math.sqrt(s), RX = 78, RY = 52, RZ = 56;   // on screen the same as IB.heli's line at the same scale
    const hull = (pts) => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]); const lo = [], up = []; for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
    const egg = (u, v) => [RX * Math.cos(v) * Math.cos(u) * (Math.cos(u) > 0 ? 1.12 : 0.8), RY * Math.cos(v) * Math.sin(u), RZ * Math.sin(v) * (Math.sin(v) < 0 ? 0.85 : 1)];   // the cabin: a longer nose, shorter behind, a flatter belly   // the cabin: rounder at the nose, a little shorter behind
    const parts = [];
    // boom, fin, stabiliser
    const boom = [[-58, 0, 12], [-150, 0, 22], [-232, 0, 30]];
    parts.push([depth([-150, 0]), () => {
      IB.tube(ctx, boom.map(P), { w: 15 * s, edge: lw, fill: C.yellow, seed });
      IB.ink(ctx, [[-222, 0, 26], [-236, 0, 26], [-246, 0, 112], [-232, 0, 112]].map(P), { closed: true, smooth: false, fill: C.yellow, w: lw, seed: seed + 1 });
      IB.ink(ctx, [[-238, -26, 30], [-226, -26, 30], [-226, 26, 30], [-238, 26, 30]].map(P), { closed: true, smooth: false, fill: C.yellow, w: lw, seed: seed + 2 });
    }]);
    // skids: the far one first
    for (const side of [-1, 1]) parts.push([depth([0, side * 44]) - 1000, () => {   // both skids before the cabin: they hang under it, so the cabin covers the part of the near one it is in front of
      IB.tube(ctx, [[-58, side * 44, -64], [78, side * 44, -64]].map(P), { w: 8 * s, edge: 1.8 * Math.sqrt(s), fill: '#b9b9b9', seed: seed + 3 + side });
      for (const lx of [-34, 44]) IB.tube(ctx, [[lx, side * 26, -44], [lx - 8, side * 44, -64]].map(P), { w: 6 * s, edge: 1.6 * Math.sqrt(s), fill: '#b9b9b9', seed: seed + 5 + side + lx });
    }]);
    // cabin, its windows, mast and rotor
    parts.push([depth([0, 0]), () => {
      const pts = []; for (let i = 0; i < 28; i++) for (let j = -6; j <= 6; j++) pts.push(P(egg((i / 28) * Math.PI * 2, (j / 6) * (Math.PI / 2) * 0.98)));
      IB.ink(ctx, hull(pts), { closed: true, fill: C.yellow, w: lw, seed: seed + 9 });
      // windscreen: the front of the egg above its waist, while the nose faces the lens
      if (sn > 0.12) {
        // only the part of the windscreen on the side of the egg that faces the lens: the normal (cos u, sin u) of each column against the view's direction (sin yaw, cos yaw)
        const us = []; for (let i = 0; i <= 16; i++) { const u = -0.9 + (i / 16) * 1.8; if (Math.cos(u) * sn + Math.sin(u) * c > 0.05) us.push(u); }
        const ws = us.map((u) => egg(u, 0.95)).concat(us.slice().reverse().map((u) => egg(u, 0.28)));
        if (us.length > 1) IB.ink(ctx, ws.map(P), { closed: true, fill: C.paper, w: lw, seed: seed + 10 });
        if (us[0] < 0 && us[us.length - 1] > 0) IB.ink(ctx, [egg(0, 0.97), egg(0, 0.26)].map(P), { w: lw * 0.8, seed: seed + 11 });   // the frame down its middle, when the middle shows
      }
      // side window on the side that faces the lens
      const side = c >= 0 ? 1 : -1;   // the craft's left (y > 0) faces the lens while cos(yaw) > 0
      if (Math.abs(c) > 0.15) {
        const sw = []; for (let i = 0; i <= 6; i++) sw.push(egg(side * (0.95 + (i / 6) * 0.85), 0.8)); for (let i = 6; i >= 0; i--) sw.push(egg(side * (0.95 + (i / 6) * 0.85), 0.2));
        IB.ink(ctx, sw.map(P), { closed: true, fill: C.paper, w: lw, seed: seed + 12 });
        IB.ink(ctx, [egg(side * 1.37, 0.82), egg(side * 1.37, 0.18)].map(P), { w: lw * 0.8, seed: seed + 13 });
      }
      IB.seg(ctx, ...P([6, 0, RZ - 2]), ...P([6, 0, RZ + 14]), { w: lw * 1.4, seed: seed + 14 });
      const m = P([6, 0, RZ + 16]);   // the rotor keeps near level: only 15% of the body's tip
      ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(rot * 0.15); IB.rotor(ctx, [0, 0], { span: 290 * s, lw: 1.6 * Math.sqrt(s), d }); ctx.restore();
    }]);
    ctx.save();
    parts.sort((a, b) => a[0] - b[0]).forEach(([, draw]) => draw());
    ctx.restore();
  };

  /* heli.MOVE.flyIn — the reference's fly-in, nineteen drawings on twos as [frame, drawing], never hovering; each drawing is [x, y of the centre of its yellow shape, scale, rotation, facing (negative = nose left; -1.3 also stretches it into a smear)], or ['front', x, y, sx, sy] for the two drawings where it faces the lens, or ['turn', x, y, scale, yaw, rotation, tilt] for a three-quarter drawing (IB.heliTurn, placed by its cabin's centre). Measured on the reference: position = centroid of its yellow pixels, scale = square root of their area against this drawing's own at scale 1 (11631 px), rotation = the principal axis of that area. The first three are larger than the frame and cut off by it, so their numbers are fitted by eye. It comes past the lens from the lower right (a smear, then two three-quarter drawings from the front-left, nose left: yaw 2.85, 2.7, larger than the frame), swings round to face us with its tail up for two drawings, and then never hovers: three-quarter drawings from the front-right (yaw 0.95 to 0.58) and side views, shrinking (1.48 to 0.86) and levelling out (0.25 to 0.01 rad) while it drifts 136 px left and 76 px back right, flying away toward the stadium. */
  IB.heli.MOVE = { flyIn: [
    [0, [2090, 570, 4.6, -0.2, -1.3]], [2, ['turn', 1250, 700, 4.3, 2.85, -0.1, 0.45]], [4, ['turn', 930, 640, 3.6, 2.7, -0.12, 0.45]],
    [6, ['front', 660, 628, 1, 1]], [8, ['front', 549, 620, 0.67, 0.87]],
    [10, ['turn', 430, 600, 1.48, 0.95, 0.25, 0.6]], [12, ['turn', 360, 590, 1.43, 0.85, 0.15, 0.55]], [14, ['turn', 335, 588, 1.37, 0.78, 0.1, 0.5]], [16, ['turn', 312, 586, 1.27, 0.7, 0.06, 0.48]], [18, ['turn', 302, 584, 1.23, 0.64, 0.04, 0.45]], [20, ['turn', 296, 580, 1.18, 0.58, 0.03, 0.42]],
    [22, [285, 560, 1.1, 0.085, 1]], [24, [288, 559, 1.1, 0.06, 1]], [26, [298, 558, 1.025, 0.04, 1]], [28, [304, 558, 1.0, 0.025, 1]], [30, [320, 557, 0.95, 0.02, 1]], [32, [332, 555, 0.93, 0.01, 1]], [34, [338, 555, 0.91, 0.01, 1]], [36, [354, 556, 0.86, 0.01, 1]],
  ] };
  /* heliDrawing(ctx, row, d) — draw one row of a flight table like heli.MOVE.flyIn as drawing number d: a side-view row is placed by the centre of its yellow shape (which sits (-47.9, -14.1) x scale from the craft's own origin), a 'front' or 'turn' row by its cabin's centre. (establish/city-stadium-flyin). */
  IB.heliDrawing = (ctx, k, d) => {
    if (k[0] === 'front') return IB.heliFront(ctx, [k[1], k[2]], { sx: k[3], sy: k[4], d });
    if (k[0] === 'turn') { const [, tx, ty, ts, yaw, rot = 0, tilt = 0.35] = k; return IB.heliTurn(ctx, [tx, ty], { s: ts, yaw, tilt, rot, d }); }
    const [x, y, sc, rot, facing] = k, c = Math.cos(rot), sn = Math.sin(rot), ox = -47.9 * sc * facing, oy = -14.1 * sc;   // (ox, oy): where the yellow shape's centroid sits relative to the craft's own origin
    IB.heli(ctx, [x - (ox * c - oy * sn), y - (ox * sn + oy * c)], { s: sc, rot, facing, d });
  };

  /* ---------- the tandem of the reference's fifth spot ---------- */
  /* crank: the crank arm's length; r: the wheel's radius. A rider's feet (cast/riders.js) follow the same crank. (spot/tandem-riders-join). */
  IB.TANDEM = { crank: 21, r: 50 };
  /* bikeWheel(ctx, at, opts) — a wheel centred on the axle at `at`: a thick tyre, a thin rim line, four grey arcs standing in for spokes that jump between two drawings (alt 0 / 1), a hub. */
  IB.bikeWheel = (ctx, [x, AXLE], o = {}) => {
    const { alt = 0, r: R = IB.TANDEM.r, seed = 70 } = o;
    ctx.save();
    IB.oval(ctx, x, AXLE, R - 4, R - 4, { fill: C.paper, w: 8.5, seed, n: 22, wob: 0.4 });
    IB.oval(ctx, x, AXLE, R - 13, R - 13, { w: 1.3, seed: seed + 9, n: 18, grain: 0 });
    for (let i = 0; i < 4; i++) { const a = alt * 0.8 + i * 1.57; IB.ink(ctx, IB.ellipse(x, AXLE, 20 + (i % 2) * 13, 20 + (i % 2) * 13, 5, a, a + 0.9), { w: 1.5, color: '#9a9a9a', seed: seed + i }); }
    IB.oval(ctx, x, AXLE, 4.5, 4.5, { fill: C.ink, w: 0, n: 8 });
    ctx.restore();
  };
  /* crankset(ctx, bb, a, opts) — a chainring, two cranks and pedals at the bottom bracket bb, at crank angle a, with two grey spin marks that alternate (alt 0 / 1). One turn is twelve drawings on twos (1 s). */
  IB.crankset = (ctx, bb, a, o = {}) => {
    const { alt = 0, seed = 140 } = o, CRANK = IB.TANDEM.crank, PI = Math.PI, LW = 1.9;
    ctx.save();
    for (const s of [0, PI]) { const q = [bb[0] + CRANK * Math.cos(a + s), bb[1] + CRANK * Math.sin(a + s)]; IB.seg(ctx, bb[0], bb[1], q[0], q[1], { w: 3.2, seed: seed + s }); IB.seg(ctx, q[0] - 10, q[1], q[0] + 12, q[1], { w: 3.2, seed: seed + 1 + s }); }
    IB.oval(ctx, bb[0], bb[1], 13, 13, { fill: C.paper, w: LW, seed, n: 12 });
    for (let i = 0; i < 5; i++) IB.oval(ctx, bb[0] + 7.5 * Math.cos(a + i * 1.257), bb[1] + 7.5 * Math.sin(a + i * 1.257), 2, 2, { w: 1.1, seed: seed + 3 + i, n: 6, grain: 0 });
    for (const s of [-1, 1]) IB.ink(ctx, IB.ellipse(bb[0], bb[1] + 6, 27 + alt * 5, 30 + alt * 5, 4, s > 0 ? 0.25 : 2.35, s > 0 ? 0.8 : 2.9), { w: 1.3, color: '#8a8a8a', seed: seed + 9 + alt + s });   // spin marks
    ctx.restore();
  };
  /* tandem(ctx, state, opts) — a tandem that grows a seat at a time. state: rx, fx (the two axles' x), bbs (every rider's bottom bracket, rear to front), built (which of them have their seat and crank yet: a newcomer's are not there on the first drawing of a join), crank (the crank angle), alt (0 / 1, the wheels' and cranks' two drawings). opts.axle is the axles' y; opts.layer 'wheels' or 'frame' draws only that, so the dust off the rear wheel can go between them. The frame is blue tubing; each seat behind the front one gets a stoker bar bracketed off the seat tube ahead; a grey chain line keeps every crank in step. (spot/tandem-riders-join). */
  IB.tandem = (ctx, st, o = {}) => {
    const { rx, fx, bbs, built, crank = 0, alt = 0 } = st, { axle: AXLE = 750, layer = null } = o;
    ctx.save();
    if (layer !== 'frame') { IB.bikeWheel(ctx, [rx, AXLE], { alt, seed: 70 }); IB.bikeWheel(ctx, [fx, AXLE], { alt, seed: 80 }); }
    if (layer !== 'wheels') {
      const tube = (pts, seed) => IB.tube(ctx, pts, { w: 7.5, edge: 1.9, fill: C.blue, seed });
      const topY = AXLE - 76, live = bbs.filter((_, i) => built[i]), first = live[0], last = live[live.length - 1];
      for (const dy of [-13, 13]) IB.seg(ctx, first[0], AXLE - 4 + dy, last[0], AXLE - 4 + dy, { w: 1.3, color: '#9a9a9a', seed: 98 + dy, grain: 0 });   // the chain that keeps every crank in step
      tube([[rx, AXLE], last], 100);                                              // chain stay and bottom tube
      tube([[rx, AXLE], [first[0] - 26, topY]], 101);                             // seat stay
      tube([[first[0] - 26, topY], [fx - 52, topY]], 102);                        // top tube
      tube([last, [fx - 50, topY + 6]], 103);                                     // down tube
      tube([[fx - 56, topY - 22], [fx - 48, topY + 8], [fx, AXLE]], 104);         // head tube and fork
      // front bar: a white stem curving back to a blue grip under the front rider's hands
      IB.tube(ctx, [[fx - 54, topY - 20], [fx - 60, topY - 46], [last[0] + 74, AXLE - 124]], { w: 8, edge: 2, fill: C.paper, smooth: true, seed: 105 });
      IB.ink(ctx, [[last[0] + 74, AXLE - 124], [last[0] + 50, AXLE - 122]], { w: 8.5, color: C.blue, seed: 106, taper: false });
      let prev = null;
      bbs.forEach((_, i) => {
        if (!built[i]) return;
        const bb = bbs[i];
        tube([bb, [bb[0] - 24, topY - 8]], 110 + i);                              // seat tube
        IB.ink(ctx, [[bb[0] - 44, topY - 15], [bb[0] - 24, topY - 20], [bb[0] - 6, topY - 15], [bb[0] - 8, topY - 9], [bb[0] - 40, topY - 8]], { closed: true, fill: C.charcoal, w: 2, seed: 120 + i });   // saddle
        if (prev != null) {                                                        // stoker bar for the rider behind, bracketed off this seat tube
          const g = [bbs[prev][0] + 56, AXLE - 122];
          IB.tube(ctx, [[bb[0] - 22, topY - 4], [bb[0] - 34, topY - 30], [g[0] + 18, g[1] + 2]], { w: 7, edge: 1.9, fill: C.paper, smooth: true, seed: 130 + i });
          IB.ink(ctx, [[g[0] + 18, g[1] + 2], [g[0] - 6, g[1] + 2]], { w: 8.5, color: C.blue, seed: 135 + i, taper: false });
        }
        IB.crankset(ctx, bb, crank, { alt: alt, seed: 140 + i * 9 });
        prev = i;
      });
    }
    ctx.restore();
  };
})(window);
