/* props/traffic.js — street furniture and traffic for the daily street scenes in the IBM look: a pedestrian signal, a zebra crossing seen from the side, a bus stop, a city bus in profile with its exhaust, a one-person bicycle built from the tandem's parts with the joints its rider's figure sits on, and the ring of its bell. Flat fills in a brush-pen outline like the other props; the signal's little men and the stop's sign are plain placeholder shapes, never a real pictogram, logo or word. New, not measured: sizes are set against a wide-shot figure of h 330. Needs ink.js, figure.js and props/vehicles.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C, PI = Math.PI;
  const GREY = '#d9d9d9', DIM = '#5e5e5e';

  /* walkSignal(ctx, at, state, opts) — a pedestrian signal facing the viewer (turned to face the camera even in a side-on street, as a screen the audience must read is: STYLE.md market): a grey pole standing at `at` = [its x, the ground it stands on], a charcoal head with two lamps, the stop lamp on top (a standing little man) and the walk lamp below (a striding one), and beside them a column of `n` cells for the time left. state.go false lights the stop lamp in red, true the walk lamp in green; state.left is how many cells are lit, counted from the bottom, in the lit lamp's colour (drop one per beat, on ones: the signal is a machine). opts.s scales it (pole 470 px, head 196 px at 1); opts.pole changes the pole's height. Returns { head: [x, y] } (the head's top centre) and { lamp: [x, y] } (the lit lamp's centre) in stage px (street/crosswalk-green-cross). */
  IB.walkSignal = (ctx, [x, base], st = {}, o = {}) => {
    const { go = false, left = 0, n = 8 } = st, { s = 1, pole = 470, lw = 3.2, seed = 900 } = o;
    const W = 96, HH = 196, top = -pole - HH + 24, lit = go ? C.green : C.red;
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
    IB.tube(ctx, [[0, 0], [0, -pole]], { w: 16, edge: lw * 0.8, fill: GREY, seed });
    IB.box(ctx, -W / 2, top, W, HH, { fill: C.charcoal, w: lw, seed: seed + 1 });
    const man = (cy, walking, color, sd) => {   // a placeholder little man: a round head and thick strokes, no pictogram
      const k = { w: 7, color, seed: sd, wob: 0.3, grain: 0, smooth: false };
      IB.oval(ctx, walking ? 4 : 0, cy - 22, 7, 7, { fill: color, w: 0, n: 10, seed: sd });
      if (walking) {
        IB.ink(ctx, [[2, cy - 12], [-2, cy + 6]], { ...k, w: 9 });
        IB.ink(ctx, [[-2, cy + 6], [-12, cy + 28]], k); IB.ink(ctx, [[-2, cy + 6], [10, cy + 28]], k);
        IB.ink(ctx, [[1, cy - 9], [-11, cy + 2]], { ...k, w: 5 }); IB.ink(ctx, [[1, cy - 9], [12, cy - 1]], { ...k, w: 5 });
      } else {
        IB.ink(ctx, [[0, cy - 12], [0, cy + 6]], { ...k, w: 11 });
        IB.ink(ctx, [[-3, cy + 6], [-4, cy + 28]], k); IB.ink(ctx, [[3, cy + 6], [4, cy + 28]], k);
        IB.ink(ctx, [[-7, cy - 9], [-9, cy + 6]], { ...k, w: 5 }); IB.ink(ctx, [[7, cy - 9], [9, cy + 6]], { ...k, w: 5 });
      }
    };
    [[top + 52, false], [top + 140, true]].forEach(([cy, walking], i) => {
      const on = walking === go;
      IB.box(ctx, -36, cy - 38, 72, 76, { fill: on ? lit : DIM, w: lw * 0.75, seed: seed + 2 + i });
      IB.seg(ctx, -40, cy - 41, 40, cy - 41, { w: lw * 1.4, seed: seed + 4 + i });   // the hood over each lamp
      man(cy, walking, on ? C.paper : '#7c7c7c', seed + 6 + i * 7);
    });
    // the time left: a column of cells on the walk lamp's side
    const cx = W / 2 + 6, cw = 26, ch = (HH - 28) / n;
    IB.box(ctx, cx, top + 10, cw + 8, HH - 20, { fill: C.charcoal, w: lw * 0.8, seed: seed + 20 });
    for (let i = 0; i < n; i++) { const y = top + HH - 14 - (i + 1) * ch; ctx.fillStyle = go && i < left ? lit : DIM; ctx.fillRect(cx + 5, y + 2, cw - 2, ch - 4); }
    ctx.restore();
    return { head: [x, base + top * s], lamp: [x, base + (top + (go ? 140 : 52)) * s] };
  };

  /* crosswalk(ctx, [x0, x1, y], opts) — a zebra crossing seen from the side of the street: the white stripes lie on the ground, so each is a flat parallelogram between a far edge `far` px above the line y and a near edge `near` px below it, drawn from x0 to x1 one stripe (opts.stripe, 64 px) and one gap (opts.gap, 52 px) at a time. Weak perspective: the far edge is drawn toward the vanishing x opts.vx by opts.p (0.035), the near edge away from it. Draw it before anyone who stands on it; walkers on it still get the blue smear at their feet (street/crosswalk-green-cross). */
  IB.crosswalk = (ctx, [x0, x1, y], o = {}) => {
    const { stripe = 64, gap = 52, far = 34, near = 30, vx = 960, p = 0.035, lw = 2.4, seed = 930 } = o;
    const fx = (x) => vx + (x - vx) * (1 - p), nx = (x) => vx + (x - vx) * (1 + p);
    ctx.save();
    for (let i = 0, xa = x0; xa < x1; i++, xa += stripe + gap) {
      const xb = Math.min(x1, xa + stripe);
      IB.ink(ctx, [[fx(xa), y - far], [fx(xb), y - far], [nx(xb), y + near], [nx(xa), y + near]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + i, wob: 0.4 });
    }
    ctx.restore();
  };

  /* busStop(ctx, at, opts) — a bus shelter standing at `at` = [its centre x, the ground]: two grey posts, a flat roof slab with graphite under its edge, a pale back panel (opts.panel false leaves it open so what is behind shows through), a bench, and beside it (opts.sign 1 right, -1 left, 0 none) a pole with a round sign that carries two grey bars instead of words. opts.w and opts.ht are its width and height (440 x 400 px). Returns { roof: y, sign: [x, y] } (street/bus-missed-chase). */
  IB.busStop = (ctx, [x, floor], o = {}) => {
    const { w = 440, ht = 400, panel = true, sign = 1, lw = 3.2, seed = 960 } = o, L = x - w / 2, R = x + w / 2, top = floor - ht;
    ctx.save();
    if (panel) {
      IB.box(ctx, L + 16, top + 34, w - 32, ht - 104, { fill: '#e2e2e2', w: lw * 0.6, seed: seed + 1 });
      for (const [dx, k] of [[0.18, 0], [0.26, 1]]) IB.seg(ctx, L + w * dx, top + 80 + k * 30, L + w * dx + 60, top + 30 + k * 30 + 0.42 * (ht - 160), { w: 2.2, color: C.paper, seed: seed + 2 + k, grain: 0 });   // two glints on the glass
    }
    IB.box(ctx, L + 50, floor - 116, w - 100, 14, { fill: C.paper, w: lw * 0.8, seed: seed + 4 });   // the bench
    for (const bx of [L + 80, R - 80]) IB.seg(ctx, bx, floor - 102, bx, floor - 4, { w: lw, seed: seed + 5 + bx });
    for (const px of [L + 16, R - 16]) IB.tube(ctx, [[px, floor], [px, top + 10]], { w: 14, edge: lw * 0.8, fill: GREY, seed: seed + 8 + px });
    IB.ink(ctx, [[L - 34, top - 4], [R + 34, top - 4], [R + 26, top + 20], [L - 26, top + 20]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + 10 });
    IB.shade(ctx, L - 20, top + 20, w + 40, 26, { from: 'top', seed: seed + 11 });
    let sg = null;
    if (sign) {
      const sx = sign > 0 ? R + 74 : L - 74, sy = top - 70;
      IB.tube(ctx, [[sx, floor], [sx, sy + 38]], { w: 12, edge: lw * 0.8, fill: GREY, seed: seed + 12 });
      IB.oval(ctx, sx, sy, 42, 42, { fill: C.paper, w: lw, seed: seed + 13, n: 16 });
      for (const [dy, bw] of [[-9, 46], [11, 30]]) { ctx.fillStyle = '#9a9a9a'; ctx.fillRect(sx - bw / 2, sy + dy - 5, bw, 10); }
      sg = [sx, sy];
    }
    ctx.restore();
    return { roof: top, sign: sg };
  };

  /* BUS — the bus's measurements in px: len (body length), ht (body height), r (wheel radius), door (from the front to the door's centre), doorW, and axle positions from the centre (rear, front). */
  IB.BUS = { len: 1100, ht: 440, r: 50, door: 104, doorW: 110, axles: [-330, 290] };
  /* bus(ctx, at, state, opts) — a city bus in profile heading right: `at` = [its centre x, the road], the wheels on the road. One flat body colour (opts.fill, green) with a white window row, a windscreen, a blank charcoal destination strip (no words), a two-leaf door near the front and an exhaust pipe at the rear. state.door 0 closed .. 1 open (the leaves fold to the sides; a machine: move it on ones), state.spin turns the wheels (distance / r), state.pitch tips the body about the rear wheel (+ nose up: the squat as it pulls away). Returns { door: [x, y] (the door's sill), exhaust: [x, y] (the pipe's mouth), front, rear } in stage px, ignoring the pitch (street/bus-missed-chase). */
  IB.bus = (ctx, [x, road], st = {}, o = {}) => {
    const { door = 0, spin = 0, pitch = 0 } = st, { fill = C.green, lw = 3.4, seed = 980 } = o, B = IB.BUS;
    const F = B.len / 2, Bk = -B.len / 2, yb = -B.r + 6, yt = yb - B.ht, DX = F - B.door, DW = B.doorW, [ra, fa] = B.axles;
    ctx.save(); ctx.translate(x, road);
    ctx.translate(ra, 0); ctx.rotate(-pitch); ctx.translate(-ra, 0);
    IB.seg(ctx, Bk + 40, yb + 2, Bk - 8, yb + 8, { w: 9, color: C.charcoal, seed: seed + 1, taper: false });   // the exhaust pipe
    IB.ink(ctx, [[Bk, yb], [Bk, yt + 34], [Bk + 26, yt], [F - 70, yt], [F - 16, yt + 30], [F, yt + 160], [F, yb]], { closed: true, smooth: false, fill, w: lw, seed: seed + 2, wob: 0.5 });
    // the window row up to the door, then the windscreen
    const wy = yt + 58, wh = 140, w0 = Bk + 40, w1 = DX - DW / 2 - 24, nw = 5, ww = (w1 - w0 - (nw - 1) * 18) / nw;
    for (let i = 0; i < nw; i++) IB.box(ctx, w0 + i * (ww + 18), wy, ww, wh, { fill: C.paper, w: lw * 0.8, seed: seed + 10 + i });
    IB.ink(ctx, [[DX + DW / 2 + 12, wy - 14], [F - 30, wy - 14], [F - 8, wy + 210], [DX + DW / 2 + 12, wy + 210]], { closed: true, smooth: false, fill: C.paper, w: lw * 0.8, seed: seed + 20 });   // the windscreen's edge, seen side-on
    IB.box(ctx, DX - 150, yt + 14, 200, 28, { fill: C.charcoal, w: lw * 0.7, seed: seed + 22 });   // the destination strip, blank
    // the door: a dark opening, two glass leaves that fold back to its sides as it opens
    const dt = yt + 50, dh = yb - 10 - dt, lwid = (DW / 2) * (1 - 0.78 * MG.clamp(door));
    IB.box(ctx, DX - DW / 2, dt, DW, dh, { fill: C.charcoal, w: lw * 0.8, seed: seed + 30 });
    for (const sd of [-1, 1]) {
      const ox = DX + sd * DW / 2, ix = ox - sd * lwid;
      IB.ink(ctx, [[ox, dt + 3], [ix, dt + 3], [ix, dt + dh - 3], [ox, dt + dh - 3]], { closed: true, smooth: false, fill: C.paper, w: lw * 0.7, seed: seed + 31 + sd });
      if (lwid > 20) IB.seg(ctx, (ox + ix) / 2, dt + 20, (ox + ix) / 2, dt + dh - 20, { w: 1.6, color: '#9a9a9a', seed: seed + 33 + sd, grain: 0 });
    }
    // bumpers and a headlamp
    IB.box(ctx, F - 8, yb - 36, 16, 36, { fill: C.charcoal, w: lw * 0.7, seed: seed + 40 });
    IB.box(ctx, Bk - 8, yb - 36, 16, 36, { fill: C.charcoal, w: lw * 0.7, seed: seed + 41 });
    IB.oval(ctx, F - 18, yb - 66, 11, 11, { fill: C.paper, w: lw * 0.7, seed: seed + 42, n: 10 });
    // wheels in dark arches
    for (const [ax, i] of [[ra, 0], [fa, 1]]) {
      IB.ink(ctx, IB.ellipse(ax, -B.r, B.r + 12, B.r + 12, 12, PI, 2 * PI), { closed: true, smooth: false, fill: C.charcoal, w: lw * 0.7, seed: seed + 50 + i });
      IB.oval(ctx, ax, -B.r, B.r, B.r, { fill: C.charcoal, w: lw, seed: seed + 52 + i, n: 16, wob: 0.3 });
      IB.oval(ctx, ax, -B.r, B.r * 0.44, B.r * 0.44, { fill: C.paper, w: 2.2, seed: seed + 54 + i, n: 10, wob: 0.2 });
      const c = Math.cos(spin) * B.r * 0.36, s = Math.sin(spin) * B.r * 0.36;
      IB.seg(ctx, ax - c, -B.r - s, ax + c, -B.r + s, { w: 2.2, seed: seed + 56, wob: 0 });
    }
    ctx.restore();
    return { door: [x + DX, road + yb - 10], exhaust: [x + Bk - 12, road + yb + 9], front: x + F, rear: x + Bk };
  };

  /* exhaust(ctx, at, state) — the one puff a bus coughs as it pulls away, from the pipe's mouth `at`: drawing state.k 0 is a ball (r 20) at the pipe, 1 and 2 two and then three balls rolling back and up and growing (the largest r 44), 3 two large broken ones 136 px back; from 4 nothing. White balls in the ink outline, like the dust off a wheel (IB.wheelDust), but at a vehicle's size. It stays where it was coughed: do not move it with the bus. opts.dir is the way it drifts (-1, back from a bus heading right) (street/bus-missed-chase). */
  IB.exhaust = (ctx, [ex, ey], st = {}, o = {}) => {
    const { k = 0 } = st, { dir = -1, seed = 1000 } = o;
    const PUFF = [[[12, -2, 20]], [[36, -10, 32], [8, 2, 17]], [[80, -26, 44], [38, -10, 30], [10, 0, 15]], [[136, -50, 50], [86, -26, 32]]][k];
    if (!PUFF) return;
    ctx.save();
    PUFF.forEach(([dx, dy, r], i) => IB.ink(ctx, IB.ellipse(ex + dx * dir, ey + dy, r, r * 0.78, 12), { closed: true, fill: C.bg, w: 2.4, seed: seed + k * 7 + i, to: k === 3 ? 0.62 : 1 }));
    ctx.restore();
  };

  /* bikeFit(at, crank, opts) — where a rider of IB.bicycle goes, without drawing: { hip (the pelvis joint, 20 px over the saddle at s 1), grip (the bar end), pedals: [far, near] (the pedal spindles at crank angle `crank`), bb, axles, r, bell } in stage px, for the same `at`, opts.s and opts.dir as the bicycle. */
  IB.bikeFit = ([x, ground], crank = 0, o = {}) => {
    const { s = 1.25, dir = 1 } = o, R = IB.TANDEM.r, K = IB.TANDEM.crank, P = (px, py) => [x + px * s * dir, ground + py * s], bb = [-23, -R - 4];
    const pedal = (a) => P(bb[0] + K * Math.cos(a), bb[1] + K * Math.sin(a));
    return { s, dir, bb: P(...bb), hip: P(bb[0] - 24, bb[1] - 112), grip: P(bb[0] + 62, -R - 123), pedals: [pedal(crank + PI), pedal(crank)], axles: [P(-85, -R), P(85, -R)], r: R * s, bell: P(bb[0] + 58, -R - 132) };
  };
  /* bicycle(ctx, at, state, opts) — a one-person bicycle: the tandem (IB.tandem) with one seat, enlarged by opts.s (1.25: wheels of radius 62, a wheelbase of 212 px, for a rider of h 330) and mirrored by opts.dir -1. `at` = [the point between the two axles, the ground]. state.crank is the crank angle and state.alt (0 / 1) the wheels' and cranks' two drawings, as for the tandem: twelve drawings a turn on twos. opts.bell adds a small bell by the grip; opts.layer 'wheels' / 'frame' as IB.tandem. The tandem's stage lines scale with it (frame edge 2.4 px). Put IB.ripples under the wheels. Returns IB.bikeFit(at, state.crank, opts); dress the rider with IB.ride (street/bike-bell-sidestep). */
  IB.bicycle = (ctx, at, st = {}, o = {}) => {
    const { crank = 0, alt = 0 } = st, { s = 1.25, dir = 1, bell = true, layer = null } = o, R = IB.TANDEM.r;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.scale(s * dir, s);
    IB.tandem(ctx, { rx: -85, fx: 85, bbs: [[-23, -R - 4]], built: [true], crank, alt }, { axle: -R, layer });
    if (bell && layer !== 'wheels') {
      IB.seg(ctx, 39, -R - 126, 35, -R - 130, { w: 2, seed: 1011 });
      IB.ink(ctx, IB.ellipse(35, -R - 130, 7, 7, 10, PI, 2 * PI), { closed: true, smooth: false, fill: C.paper, w: 1.8, seed: 1012 });
    }
    ctx.restore();
    return IB.bikeFit(at, crank, { s, dir });
  };
  /* ride(fit, look, opts) — the pose of a figure (IB.figure) riding the bicycle IB.bikeFit / IB.bicycle returned: the hip on the saddle, the ankles just above and behind the pedals with the toes down a little, both hands gripping the bar end, the spine tipped forward opts.lean (0.5 rad: with the hip and grip 107 px apart at s 1.25 that is what a figure of h 330 reaches with its elbows slightly bent). opts.nod tips the head. Change the returned pose like any other (a hand off the bar to wave). */
  IB.ride = (fit, look, o = {}) => {
    const h = look.h, d = fit.dir, { lean = 0.5, nod = 0 } = o;
    return {
      hip: fit.hip.slice(), lean, nod,
      feet: fit.pedals.map(([px, py]) => [px - 0.02 * h * d, py - 0.034 * h, 0.22]),
      hands: [[fit.grip[0] + 3 * d, fit.grip[1] - 1], [fit.grip[0] - 3 * d, fit.grip[1] + 1]], hand: ['grip', 'grip'],
    };
  };

  /* bellRing(ctx, at, state) — the sound of a bicycle bell at `at` (IB.bikeFit's bell) as a placeholder mark: a small bell drawn above it, tipped the other way on every drawing and rising 6 px a drawing, and two short arcs on each side of the real bell (IB.shake). state.k is the drawing (0, 1, 2, ...); four drawings is one ring. Give it no prev and no hold: it exists only while it rings (street/bike-bell-sidestep). */
  IB.bellRing = (ctx, [x, y], st = {}, o = {}) => {
    const { k = 0 } = st, { seed = 1020, lw = 2.4 } = o, bx = x + 10, by = y - 44 - k * 6, tip = k % 2 ? 0.35 : -0.35;
    ctx.save();
    ctx.translate(bx, by); ctx.rotate(tip);
    IB.ink(ctx, [[-12, 8], [-9, -4], [-4, -11], [4, -11], [9, -4], [12, 8]], { closed: true, fill: C.paper, w: lw, seed: seed + k });
    IB.seg(ctx, -15, 9, 15, 9, { w: lw, seed: seed + 4 + k });
    IB.oval(ctx, 0, 13, 3.5, 3.5, { fill: C.ink, w: 0, n: 8 });
    IB.seg(ctx, 0, -11, 0, -16, { w: lw, seed: seed + 8 });
    ctx.restore();
    IB.shake(ctx, x, y, 12, { a: -0.5, n: 2, seed: seed + 10 + k * 3, w: 2 });
    IB.shake(ctx, x, y, 12, { a: PI + 0.5, n: 2, seed: seed + 20 + k * 3, w: 2 });
  };
})(window);
