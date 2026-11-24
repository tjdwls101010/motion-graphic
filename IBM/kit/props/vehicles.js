/* props/vehicles.js — things that roll, fly or carry in the IBM look: flat colour bodies in a brush-pen outline, wheels as paper ovals, motion shown by drawings and marks rather than blur. Needs ink.js and figure.js; adds to the global IB. */
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

  /* cab(ctx, at, state, opts) — a yellow taxi 388 px long seen from the side, heading right: `at` = [its centre x, the road's y]; the wheels (radius 34) stand on the road. state.spin turns the wheels: give it the distance travelled / 34. A machine: move it on ones (market/street-rush-hour: 520 px/s). */
  IB.cab = (ctx, [x, ROAD], st = {}, o = {}) => {
    const { spin = 0 } = st, y = ROAD - 34;   // the wheels stand on the road, inside its near edge
    ctx.save();
    IB.ink(ctx, [[x - 190, y], [x - 196, y - 50], [x - 150, y - 62], [x - 104, y - 112], [x + 56, y - 112], [x + 110, y - 62], [x + 178, y - 54], [x + 192, y - 30], [x + 190, y]], { closed: true, smooth: false, fill: C.yellow, w: 3.4, seed: 700, wob: 0.5 });
    IB.ink(ctx, [[x - 134, y - 64], [x - 96, y - 102], [x - 28, y - 102], [x - 28, y - 64]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: 701 });
    IB.ink(ctx, [[x - 14, y - 64], [x - 14, y - 102], [x + 50, y - 102], [x + 92, y - 64]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: 702 });
    IB.box(ctx, x - 44, y - 132, 60, 20, { fill: C.paper, w: 2.6, seed: 703 });
    for (let i = 0; i < 9; i++) if (i % 2 === 0) { ctx.fillStyle = C.ink; ctx.fillRect(x - 126 + i * 26, y - 44, 26, 12); }
    for (const wx of [x - 118, x + 116]) {
      IB.oval(ctx, wx, y, 34, 34, { fill: C.charcoal, w: 3, seed: 710 + (wx > x ? 1 : 0), n: 16, wob: 0.3 });
      IB.oval(ctx, wx, y, 14, 14, { fill: C.paper, w: 2, seed: 712, n: 10, wob: 0.2 });
      IB.seg(ctx, wx - Math.cos(spin) * 13, y - Math.sin(spin) * 13, wx + Math.cos(spin) * 13, y + Math.sin(spin) * 13, { w: 2, seed: 713, wob: 0 });
    }
    ctx.restore();
  };

  /* rotor(ctx, x, y, span, lw, d) — a helicopter's spinning rotor: a fan of nine thin straight strokes through the mast at (x, y), re-rolled for every drawing d. It stays within a few degrees of level whatever the body is doing. */
  IB.rotor = (ctx, x, y, span, lw, d) => {
    const rng = MG.rng;
    const r = rng(700 + d);
    for (let i = 0; i < 9; i++) { const l = span * (0.6 + r() * 0.4), k = (r() - 0.5) * 0.16; IB.seg(ctx, x - l, y - l * k + (r() - 0.5) * 14, x + l * (0.5 + r() * 0.5), y + l * k * 0.6 + (r() - 0.5) * 14, { w: lw, wob: 0, seed: 710 + i + d * 9 }); }
  };

  /* heli(ctx, at, opts) — the yellow helicopter seen from the side, nose right, drawn about the centre of its cabin at `at`: s scales it, rot tips it, facing -1 flips it nose left (and -1.3 also stretches it: the smear drawing it enters on), d is the drawing number (re-rolls the rotor). The rotor does not tip with the body: 85% of the body's turn is taken back out about the mast. Line width thins with the square root of the scale. The reference paints a brand mark and a word on the cabin: left out. */
  // 성진: only a side view and a front view exist, so the oblique drawings of a turn are the side view scaled and rotated. Draw the in-between angles in the upgrade round (plan 4-3).
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
    ctx.scale(1 / s, 1 / s); IB.rotor(ctx, 17 * s, -62 * s, 280 * s, 1.6 * Math.sqrt(s), d); 
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
    IB.rotor(ctx, x, y - 132 * sy, 300 * sx, 1.6, d);
  };

  /* heli.MOVE.flyIn — the reference's fly-in, one drawing per two frames (nineteen of them, never hovering): [x, y of the centre of its yellow shape, scale, rotation, facing (negative = nose left; -1.3 also stretches it into a smear)], or ['front', x, y, sx, sy] for the two drawings where it faces the lens. Measured on the reference: position = centroid of its yellow pixels, scale = square root of their area against this drawing's own at scale 1 (11631 px), rotation = the principal axis of that area. The first three are larger than the frame and cut off by it, so their numbers are fitted by eye. It comes past the lens from the lower right, swings round to face us with its tail up for two drawings, and then never hovers: it keeps shrinking (1.48 to 0.86) and levelling out (0.69 to 0.01 rad) while it drifts 136 px left and 76 px back right, flying away toward the stadium. */
  IB.heli.MOVE = { flyIn: [
    [2090, 570, 4.6, -0.2, -1.3], [1400, 640, 4.4, -0.15, -1], [1200, 500, 3.7, -0.2, -1],
    ['front', 660, 628, 1, 1], ['front', 549, 620, 0.67, 0.87],
    [414, 581, 1.48, 0.69, 1], [339, 567, 1.43, 0.39, 1], [315, 567, 1.37, 0.29, 1], [293, 566, 1.27, 0.18, 1], [283, 565, 1.23, 0.14, 1], [278, 561, 1.18, 0.09, 1],
    [285, 560, 1.1, 0.085, 1], [288, 559, 1.1, 0.06, 1], [298, 558, 1.025, 0.04, 1], [304, 558, 1.0, 0.025, 1], [320, 557, 0.95, 0.02, 1], [332, 555, 0.93, 0.01, 1], [338, 555, 0.91, 0.01, 1], [354, 556, 0.86, 0.01, 1],
  ] };
  /* heliDrawing(ctx, row, d) — draw one row of a flight table like heli.MOVE.flyIn as drawing number d: a side-view row is placed by the centre of its yellow shape (which sits (-47.9, -14.1) x scale from the craft's own origin), a 'front' row by its cabin. */
  IB.heliDrawing = (ctx, k, d) => {
    if (k[0] === 'front') return IB.heliFront(ctx, [k[1], k[2]], { sx: k[3], sy: k[4], d });
    const [x, y, sc, rot, facing] = k, c = Math.cos(rot), sn = Math.sin(rot), ox = -47.9 * sc * facing, oy = -14.1 * sc;   // (ox, oy): where the yellow shape's centroid sits relative to the craft's own origin
    IB.heli(ctx, [x - (ox * c - oy * sn), y - (ox * sn + oy * c)], { s: sc, rot, facing, d });
  };
})(window);
