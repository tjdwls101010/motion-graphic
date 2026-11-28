/* props/racing.js — open-wheel motor racing, filmed like a live broadcast. Needs ink.js, solid.js, marks.js and props/sports.js.
   The car is a small 3-D model (IB.racer) projected with IB.space and inked face by face, far to near, so one car is seen from the side, head-on, from low behind, from the tarmac at its tyres, from above or sliding sideways in a drift. The track it runs on is drawn in the same space (IB.trackStrip), so kerbs and walls rush past in the same perspective. Around them: the start lights (IB.gantry), a driver's helmet seen head-on in close-up (IB.helmet), the view from the cockpit (IB.cockpit), smoke, sparks and spray, the chequered flag (IB.chequer), the trackside seen from the side for long-lens pans (IB.trackside), the broadcast graphics (IB.broadcast) and the motion of a car along a straight (IB.drive).
   Units: the model is in metres; opts.s scales it to stage px at 140 px a metre x s. No real team, driver, sponsor or series mark is drawn: teams are the palette's colours and a number. */
(function (window) {
  const IB = window.IB, C = IB.C;
  const DARK = '#2a2a2a', TYRE = '#262626', SHADOW = '#dcdcdc';

  /* ---------- the car ---------- */

  // loft(secs): a closed box-like solid from cross-sections [x, zIn, zOut, yTop, yBot] along x; returns its faces as lists of [x, y, z]
  const loft = (secs) => {
    const F = [];
    for (let i = 0; i < secs.length - 1; i++) {
      const [xa, za0, za1, ta, ba] = secs[i], [xb, zb0, zb1, tb, bb] = secs[i + 1];
      F.push([[xa, ta, za0], [xb, tb, zb0], [xb, tb, zb1], [xa, ta, za1]]);   // top
      F.push([[xa, ba, za0], [xa, ba, za1], [xb, bb, zb1], [xb, bb, zb0]]);   // bottom
      F.push([[xa, ta, za0], [xa, ba, za0], [xb, bb, zb0], [xb, tb, zb0]]);   // near side (z low)
      F.push([[xa, ta, za1], [xb, tb, zb1], [xb, bb, zb1], [xa, ba, za1]]);   // far side (z high)
    }
    const cap = ([x, z0, z1, t, b]) => [[x, t, z0], [x, t, z1], [x, b, z1], [x, b, z0]];
    F.push(cap(secs[0]), cap(secs[secs.length - 1]));
    return F;
  };
  const mirrorZ = (face) => face.map(([x, y, z]) => [x, y, -z]);
  const quad = (x0, x1, y0, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];   // upright, in a plane of constant z
  const flat = (x0, x1, y, z0, z1) => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];   // level, at height y

  const TUB = loft([[-0.95, -0.40, 0.40, -0.62, -0.10], [0.4, -0.42, 0.42, -0.58, -0.10], [1.3, -0.30, 0.30, -0.52, -0.20], [2.2, -0.17, 0.17, -0.38, -0.20], [2.78, -0.08, 0.08, -0.30, -0.22]]);
  const COVER = loft([[-0.95, -0.36, 0.36, -0.98, -0.30], [-1.5, -0.30, 0.30, -0.80, -0.28], [-2.3, -0.14, 0.14, -0.50, -0.25], [-2.55, -0.10, 0.10, -0.42, -0.25]]);
  const POD = loft([[0.55, 0.40, 0.78, -0.50, -0.14], [-0.6, 0.40, 0.74, -0.48, -0.12], [-1.5, 0.30, 0.46, -0.36, -0.14]]);
  const PODS = [...POD, ...POD.map(mirrorZ)];

  /* racer(ctx, opts) — an open-wheel racing car. The view is IB.space's: at (stage point on the ground under the middle of the car), yaw (0: side on, nose right; -PI/2: head-on; PI/2: from behind), pitch (-PI/2: from straight above), roll, look (camera height: 0.02 is down on the tarmac, 0.3 a grandstand), f (lens: 1500 long, 600 wide). Where it is: x (metres along the track from the view's origin: + is the way the track runs), z (metres across it), heading (rad: the car turned away from the way the track runs, a drift or a spin; + turns its nose toward -z). The car itself: s (scale: 784 px long at 1), color (body), accent (stripes, wings' endplates, helmet), helmet, num (shown as a colour block on the nose's flank), steer (front wheels, rad, + turns the nose toward -z), spin (wheels' turn, rad: distance / radius), frontSpin (the front wheels' turn when it differs from spin: hold it still for a locked front under braking), blur (wheels at speed: rings instead of spokes), drs (rear flap open: true, or 0..1 while it opens), glow (front brake discs glowing through the rims under heavy braking), lit (rain light on), tyre (the sidewall band's colour), rake (nose-down pitch of the body, rad), bodyRoll (lean in a corner, rad), lw, seed.
     Returns { map, U, wheels: [stage points of the four contact patches], helmet: stage point } so a scene can put smoke at a tyre or a close-up on the helmet. */
  IB.racer = (ctx, o = {}) => {
    const U = 140 * (o.s || 1), color = o.color || C.navy, accent = o.accent || C.yellow, seed = o.seed || 1600, lw = o.lw || 2.6;
    const space = IB.space({ at: o.at || [960, 800], yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f: o.f || 1500, look: o.look == null ? 0.18 : o.look });
    const rake = o.rake || 0, br = o.bodyRoll || 0, cr = Math.cos(rake), sr = Math.sin(rake), cb = Math.cos(br), sb = Math.sin(br);
    const body = ([x, y, z]) => { const y1 = y * cb - z * sb, z1 = y * sb + z * cb; return [x * cr - y1 * sr, x * sr + y1 * cr, z1]; };   // the sprung body pitches and rolls; wheels do not
    const hd = o.heading || 0, ch = Math.cos(hd), shd = Math.sin(hd), px = o.x || 0, pz = o.z || 0;
    const place = ([x, y, z]) => [x * ch - z * shd + px, y, x * shd + z * ch + pz];   // the car's own heading, then where it is on the track
    const map = (p) => { const q = place(p); return space([q[0] * U, q[1] * U, q[2] * U]); };
    const near = (q) => q.every((p) => p[2] > -(o.f || 1500) * 0.85);
    const faces = [];   // { pts (stage), z, fill, w, kind }
    const add = (pts3, fill, opts = {}) => { const q = pts3.map(opts.unsprung ? (p) => p : body).map(map); if (!near(q)) return; faces.push({ pts: q, z: q.reduce((a, p) => a + p[2], 0) / q.length + (opts.bias || 0) * U, fill, w: opts.w == null ? lw : opts.w, line: opts.line, stroke: opts.stroke, closed: opts.closed !== false }); };

    // shadow on the tarmac, always first
    const sh = flat(-2.75, 2.8, 0, -1.02, 1.02).map(map);
    if (near(sh)) IB.ink(ctx, sh, { closed: true, smooth: true, fill: SHADOW, w: 0, seed });

    add(flat(-2.3, 1.6, -0.05, -0.74, 0.74), DARK, { bias: 0.02 });   // floor
    TUB.forEach((f) => add(f, color));
    COVER.forEach((f) => add(f, color));
    PODS.forEach((f) => add(f, color));
    add(flat(-0.75, 0.32, -0.625, -0.25, 0.25), DARK, { bias: -0.05 });   // cockpit opening
    add([[-0.94, -0.98, -0.13], [-0.94, -0.98, 0.13], [-0.94, -0.84, 0.13], [-0.94, -0.84, -0.13]], DARK, { bias: -0.02 });   // the airbox over the driver's head
    [[0.56, 0.42, 0.76], [0.56, -0.76, -0.42]].forEach(([x, z0, z1]) => add([[x + 0.01, -0.46, z0], [x + 0.01, -0.46, z1], [x + 0.01, -0.22, z1], [x + 0.01, -0.22, z0]], DARK, { bias: -0.02 }));   // sidepod inlets
    // livery: a stripe down each flank of the engine cover and along the nose, the number block on the nose's flanks
    [1, -1].forEach((sd) => {
      add([[-1.0, -0.86, 0.335 * sd], [-2.2, -0.52, 0.16 * sd], [-2.2, -0.42, 0.16 * sd], [-1.0, -0.70, 0.36 * sd]], accent, { bias: -0.03, w: lw * 0.6 });
      add([[1.45, -0.46, 0.29 * sd], [2.15, -0.34, 0.18 * sd], [2.15, -0.28, 0.18 * sd], [1.45, -0.36, 0.30 * sd]], C.paper, { bias: -0.03, w: lw * 0.6 });
    });
    add([[0.9, -0.555, -0.12], [2.1, -0.385, -0.06], [2.1, -0.385, 0.06], [0.9, -0.555, 0.12]], accent, { bias: -0.03, w: lw * 0.6 });
    // front wing: two elements and the endplates
    add(flat(2.32, 2.82, -0.10, -0.98, 0.98), C.charcoal);
    add(flat(2.30, 2.52, -0.17, -0.95, 0.95), C.charcoal, { bias: -0.01 });
    [-0.99, 0.99].forEach((z) => add(quad(2.26, 2.84, -0.03, -0.30, z), accent));
    // rear wing: endplates, main plane, the DRS flap (open: lifted to near level), its pillar
    const du = o.drs === true ? 1 : Math.max(0, Math.min(1, +o.drs || 0)), lerp = (a, b) => (du === 1 ? b : du === 0 ? a : a + (b - a) * du);
    const fa = [lerp(-2.70, -2.64), lerp(-0.86, -1.0)], fb = [lerp(-2.86, -2.40), lerp(-1.02, -1.02)];   // the flap's leading and trailing edges, closed (steep) to open (level)
    [-0.53, 0.53].forEach((z) => add([[-2.86, -0.30, z], [-2.36, -0.30, z], [-2.36, -1.0, z], [-2.86, -1.04, z]], accent));
    add([[-2.45, -0.74, -0.52], [-2.78, -0.84, -0.52], [-2.78, -0.84, 0.52], [-2.45, -0.74, 0.52]], C.charcoal);   // main plane: leading edge low, trailing edge high (a steep wing shows as a band from behind)
    add([[-2.30, -0.36, -0.40], [-2.55, -0.44, -0.40], [-2.55, -0.44, 0.40], [-2.30, -0.36, 0.40]], C.charcoal, { bias: -0.005 });   // beam wing
    add([[fa[0], fa[1], -0.52], [fb[0], fb[1], -0.52], [fb[0], fb[1], 0.52], [fa[0], fa[1], 0.52]], C.charcoal, { bias: -0.005 });
    add(quad(-2.62, -2.52, -0.28, -0.78, 0), DARK);
    add([[-2.62, -0.38, -0.06], [-2.62, -0.38, 0.06], [-2.62, -0.47, 0.06], [-2.62, -0.47, -0.06]], o.lit ? C.red : DARK, { bias: -0.04 });   // rain light
    // mirrors on stalks
    [-1, 1].forEach((sd) => { add([[0.62, -0.74, 0.40 * sd], [0.42, -0.74, 0.40 * sd], [0.42, -0.64, 0.40 * sd], [0.62, -0.64, 0.40 * sd]], color, { bias: -0.02 }); add([[0.55, -0.62, 0.3 * sd], [0.52, -0.66, 0.40 * sd]], null, { stroke: true, w: lw * 0.8, closed: false }); });
    // suspension arms and the halo (strokes)
    const AX = [[1.75, 0.80], [-1.85, 0.80]];
    AX.forEach(([ax]) => [-1, 1].forEach((sd) => { add([[ax + 0.25, -0.34, 0.36 * sd], [ax, -0.36, 0.62 * sd]], null, { stroke: true, closed: false, w: lw * 0.8 }); add([[ax - 0.25, -0.20, 0.36 * sd], [ax, -0.30, 0.62 * sd]], null, { stroke: true, closed: false, w: lw * 0.8 }); }));
    add([[-0.30, -0.68, -0.36], [0.05, -0.86, -0.30], [0.40, -0.90, 0], [0.05, -0.86, 0.30], [-0.30, -0.68, 0.36]], null, { stroke: true, closed: false, w: 0.055 * U, line: C.charcoal, bias: -0.06 });
    add([[0.40, -0.90, 0], [0.74, -0.60, 0]], null, { stroke: true, closed: false, w: 0.05 * U, line: C.charcoal, bias: -0.06 });

    // the helmet: a ball in the cockpit, the visor toward +x
    const hc = map(body([0.02, -0.80, 0])), he = map(body([0.02, -0.80 - 0.16, 0])), hr = Math.hypot(he[0] - hc[0], he[1] - hc[1]);
    const visor = [[0.17, -0.87, -0.1], [0.17, -0.87, 0.1], [0.16, -0.78, 0.1], [0.16, -0.78, -0.1]].map(body).map(map);
    const seesVisor = map(body([0.6, -0.8, 0]))[2] < hc[2];   // the visor shows while the car's front is nearer the lens than the helmet
    faces.push({ z: hc[2] - 0.05 * U, draw: () => { IB.oval(ctx, hc[0], hc[1], hr, hr, { fill: o.helmet || accent, w: lw, seed: seed + 50, n: 14 }); if (seesVisor) IB.ink(ctx, visor, { closed: true, smooth: false, fill: DARK, w: lw * 0.6, seed: seed + 51 }); } });

    // wheels: cylinders, with the tyre band, the sidewall stripe and the rim on the outer face
    const wheels = [];
    const R = 0.36;
    [[1.75, 0.38, o.steer || 0, true], [-1.85, 0.42, 0, false]].forEach(([ax, ww, st, front]) => [-1, 1].forEach((sd) => {
      const cz = 0.80 * sd, turn = ([x, y, z]) => { const c = Math.cos(st), s = Math.sin(st), dx = x - ax, dz = z - cz; return [ax + dx * c - dz * s, y, cz + dx * s + dz * c]; };
      const ring = (zz, r) => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return turn([ax + Math.cos(a) * r, -R + Math.sin(a) * r, zz]); });
      const zo = cz + (ww / 2) * sd, zi = cz - (ww / 2) * sd, outer = ring(zo, R), inner = ring(zi, R);
      const ctr = map(turn([ax, -R, cz]));
      wheels.push(map([ax, 0, cz]));
      const parts = [];
      for (let i = 0; i < 16; i++) { const j = (i + 1) % 16; parts.push({ pts: [outer[i], outer[j], inner[j], inner[i]], fill: TYRE }); }
      parts.push({ pts: inner, fill: TYRE });
      const face = { pts: outer, fill: TYRE, deco: true };
      parts.push(face);
      const q = parts.map((p) => ({ ...p, q: p.pts.map(map) }));
      if (!q.every((p) => near(p.q))) return;
      faces.push({ z: ctr[2], draw: () => {
        q.map((p) => ({ ...p, z: p.q.reduce((a, b) => a + b[2], 0) / p.q.length - (p.deco ? 0.001 : 0) })).sort((a, b) => b.z - a.z).forEach((p, k) => {
          IB.ink(ctx, p.q, { closed: true, smooth: !p.pts[0] || p.pts.length > 4, fill: p.fill, w: p.pts.length > 4 ? lw : 0, seed: seed + 100 + k });
          if (p.deco) {
            const zz = zo + 0.002 * sd, band = ring(zz, R * 0.8).map(map), rim = ring(zz, R * 0.55).map(map);
            IB.ink(ctx, band, { closed: true, fill: null, w: lw * 1.3, color: o.tyre || C.yellow, seed: seed + 140 });
            IB.ink(ctx, rim, { closed: true, fill: '#6b6b6b', w: lw * 0.8, seed: seed + 141 });
            if (front && o.glow) IB.ink(ctx, ring(zz, R * 0.4).map(map), { closed: true, fill: C.yellow, w: 0, seed: seed + 143 });   // the disc behind the rim, glowing
            if (o.blur) IB.ink(ctx, ring(zz, R * 0.35).map(map), { closed: true, fill: null, w: lw * 0.6, color: '#9a9a9a', seed: seed + 142 });
            else for (let s5 = 0; s5 < 5; s5++) { const a = (front && o.frontSpin != null ? o.frontSpin : o.spin || 0) + (s5 * Math.PI * 2) / 5, p0 = map(turn([ax, -R, zz])), p1 = map(turn([ax + Math.cos(a) * R * 0.52, -R + Math.sin(a) * R * 0.52, zz])); IB.seg(ctx, p0[0], p0[1], p1[0], p1[1], { w: lw * 0.7, wob: 0, seed: seed + 150 + s5 }); }
          }
        });
      } });
    }));

    faces.sort((a, b) => b.z - a.z).forEach((fc, i) => {
      if (fc.draw) return fc.draw();
      if (fc.stroke || !fc.fill) return IB.ink(ctx, fc.pts, { closed: false, smooth: fc.pts.length > 2, w: fc.w, color: fc.line || C.ink, seed: seed + 200 + i, taper: false });
      IB.ink(ctx, fc.pts, { closed: true, smooth: false, fill: fc.fill, w: fc.w, seed: seed + 200 + i });
    });
    return { map: (p) => space([p[0] * U, p[1] * U, p[2] * U]), U, wheels, helmet: hc };   // map: the view's space without the car's place, for things on the track
  };

  // the centre line of a bent track over [a, b] (metres along it): (X) => [x, z, heading] from X = 0 (at the origin, heading 0), integrating the curvature bend(X) in 0.25 m steps (each step's turn the mean of 8 samples, so a corner that starts or ends inside a step costs no stray turn)
  const centreLine = (bend, a, b) => {
    const h = 0.25, lo = Math.floor(Math.min(0, a) / h) * h, n = Math.ceil((Math.max(0, b) - lo) / h) + 1, i0 = Math.round(-lo / h);
    const X = new Float64Array(n), Z = new Float64Array(n), T = new Float64Array(n), k0 = bend || (() => 0);
    const k = (x) => { let s = 0; for (let j = 0; j < 8; j++) s += k0(x - h / 2 + ((j + 0.5) * h) / 8); return s / 8; };   // mean curvature over the step centred on x
    for (let i = i0; i < n - 1; i++) { const x = lo + i * h; T[i + 1] = T[i] + h * k(x + h / 2); const m = (T[i] + T[i + 1]) / 2; X[i + 1] = X[i] + h * Math.cos(m); Z[i + 1] = Z[i] + h * Math.sin(m); }
    for (let i = i0; i > 0; i--) { const x = lo + i * h; T[i - 1] = T[i] - h * k(x - h / 2); const m = (T[i] + T[i - 1]) / 2; X[i - 1] = X[i] - h * Math.cos(m); Z[i - 1] = Z[i] - h * Math.sin(m); }
    return (x) => { const u = Math.max(0, Math.min(n - 1.000001, (x - lo) / h)), i = Math.floor(u), r = u - i; return [X[i] + (X[i + 1] - X[i]) * r, Z[i] + (Z[i + 1] - Z[i]) * r, T[i] + (T[i + 1] - T[i]) * r]; };
  };
  // a point on a bent track (X along it, z off its centre line) in the view's own frame: the view at X = run, lane off the line, turned veer. Returns [x, z, heading of the track there]
  const onTrack = (o, a, b) => {
    const run = o.run || 0, lane = o.lane || 0, c = centreLine(o.bend, Math.min(a, run), Math.max(b, run)), [cx, cz, ct] = c(run);
    const hv = ct + (o.veer || 0), px = cx - lane * Math.sin(ct), pz = cz + lane * Math.cos(ct), co = Math.cos(hv), si = Math.sin(hv);
    return (X, z) => { const [x, zz, t] = c(X), wx = x - z * Math.sin(t) - px, wz = zz + z * Math.cos(t) - pz; return [wx * co + wz * si, -wx * si + wz * co, t - hv]; };
  };

  /* trackStrip(ctx, opts) — the circuit around a car, in the car's own space (pass the same view opts as IB.racer: at, yaw, pitch, look, f, s). x runs along the track (metres, + ahead of the car), from `from` to `to`; the track is `half` m either side of the car's line, with kerbs `kerb` m wide outside it in blocks 1.2 m long (yellow and white), a run-off, and walls `wall` m out with a catch fence above (walls: false for none, 1 or -1 for the +z or -z side only). `run` is how far the car has gone (metres): the kerbs and wall posts slide back by it, so a car held still in the frame races. Points behind the lens are dropped.
     A track that curves: bend is its curvature (1/m) as a function of the distance along it, X (metres from the track's X = 0; + turns it toward +z, a 180° hairpin of radius R is 1 / R over PI R metres: IB.hairpin and IB.chicane in props/racing-corners.js build them), and the view then sits at X = run on the curve, lane metres off its centre line (+ toward +z), turned veer rad from its direction. Without bend, lane or veer the strip is straight, as before. Place cars on it with IB.trackPose. */
  IB.trackStrip = (ctx, o = {}) => {
    const U = 140 * (o.s || 1), f = o.f || 1500, seed = o.seed || 1700;
    const space = IB.space({ at: o.at || [960, 800], yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f, look: o.look == null ? 0.18 : o.look });
    const from = o.from == null ? -30 : o.from, to = o.to == null ? 80 : o.to, half = o.half || 6, kerb = o.kerb == null ? 1 : o.kerb, wall = o.wall || half + 6, run = o.run || 0, lw = o.lw || 2.4;
    const bent = o.bend || o.lane || o.veer ? onTrack(o, from + run, to + run) : null;
    const map = bent ? ([x, y, z]) => { const [bx, bz] = bent(x + run, z); return space([bx * U, y * U, bz * U]); } : ([x, y, z]) => space([x * U, y * U, z * U]), ok = (p) => p[2] > -f * 0.8;
    const line = (pts, opts) => { let seg = []; pts.map(map).forEach((p) => { if (ok(p)) seg.push(p); else { if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); seg = []; } }); if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); };
    const xs = (step) => { const out = []; for (let x = from; x <= to; x += step) out.push(x); return out; };
    [-1, 1].forEach((sd) => {
      // the wall and its fence
      if (o.walls !== false && o.walls !== -sd) {   // walls: 1 or -1 keeps only the wall on that side of z (the outside of a hairpin)
        const L = 2.5, k0 = Math.floor((from + run) / L);
        for (let k = k0; k * L - run < to; k++) {
          const x0 = Math.max(from, k * L - run), x1 = Math.min(to, (k + 1) * L - run), q = quad(x0, x1, 0, -0.9, wall * sd).map(map);
          if (q.every(ok)) IB.ink(ctx, q, { closed: true, smooth: false, fill: C.paper, w: lw * 0.8, seed: seed + k * 3 + (sd > 0 ? 1 : 0) });
          const post = [[x0, -0.9, wall * sd], [x0, -3.4, wall * sd]].map(map);
          if (post.every(ok)) IB.ink(ctx, post, { w: lw * 0.6, color: '#8a8a8a', seed: seed + 500 + k, taper: false });
        }
        line(xs(1).map((x) => [x, -3.4, wall * sd]), { w: lw * 0.6, color: '#8a8a8a', seed: seed + 600 });
        line(xs(1).map((x) => [x, -2.2, wall * sd]), { w: lw * 0.4, color: '#b4b4b4', seed: seed + 601 });
      }
      // kerbs
      if (kerb) {
        const L = 1.2, k0 = Math.floor((from + run) / L);
        for (let k = k0; k * L - run < to; k++) {
          const x0 = Math.max(from, k * L - run), x1 = Math.min(to, (k + 1) * L - run), q = flat(x0, x1, 0, half * sd, (half + kerb) * sd).map(map);
          if (q.every(ok)) IB.ink(ctx, q, { closed: true, smooth: false, fill: k % 2 ? C.yellow : C.paper, w: lw * 0.6, seed: seed + 900 + k });
        }
      }
      line(xs(1).map((x) => [x, 0, half * sd]), { w: lw, seed: seed + 700 + sd });
    });
    // a start line or a marking across the track at x = o.mark (metres from the car, moving back with run)
    if (o.mark != null) { const xm = o.mark - run; line([[xm, 0, -half], [xm, 0, half]], { w: lw * 3, color: C.paper, seed: seed + 800 }); }
  };

  /* trackPose(opts, X, lane) — where a car X metres along a track (the same X as trackStrip's bend and run) and lane metres off its centre line stands in a trackStrip's view (pass the strip's opts: bend, run, lane, veer): { x, z, heading }, to spread into IB.racer (add a drift to heading). On a straight strip that is { x: X - run, z: lane, heading: 0 }. */
  IB.trackPose = (o, X, lane = 0) => {
    if (!(o.bend || o.lane || o.veer)) return { x: X - (o.run || 0), z: lane, heading: 0 };
    const [x, z, heading] = onTrack(o, X, X)(X, lane);
    return { x, z, heading };
  };

  /* drive(phases, t, from) — where a car is t seconds into a run of phases [{ dur, a }] (a constant acceleration each, px/s²; the last phase lasts for ever), starting from { x, v } (px, px/s). Returns { x, v }. A start is a launch at about 1.1 g (1500 px/s² at 140 px a metre) up to 300 km/h (11 700 px/s); braking for a hairpin about 5 g (6900 px/s²). */
  IB.drive = (phases, t, from = {}) => {
    let x = from.x || 0, v = from.v || 0, left = Math.max(0, t);
    for (let i = 0; i < phases.length; i++) {
      const { dur = Infinity, a = 0 } = phases[i], dt = i === phases.length - 1 ? left : Math.min(left, dur);
      x += v * dt + 0.5 * a * dt * dt; v += a * dt; left -= dt;
      if (left <= 0) break;
    }
    return { x, v };
  };

  /* ---------- around the car ---------- */

  /* gantry(ctx, [x, y], opts) — the start lights over the grid: a dark beam with five pods of two lights each, [x, y] the middle of the beam's top. on: how many pods are lit (0..5, red), out: all dark again (lights out, go). s scales it (beam 760 px at 1). */
  IB.gantry = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, on = o.out ? 0 : o.on || 0, seed = o.seed || 1800, w = 760 * s, h = 150 * s;
    IB.ink(ctx, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + 30 * s], [x - w / 2, y + 30 * s]], { closed: true, smooth: false, fill: C.charcoal, w: 3 * s, seed });
    for (let i = 0; i < 5; i++) {
      const px = x - w / 2 + 90 * s + i * 145 * s;
      IB.ink(ctx, [[px - 44 * s, y + 30 * s], [px + 44 * s, y + 30 * s], [px + 44 * s, y + 30 * s + h], [px - 44 * s, y + 30 * s + h]], { closed: true, smooth: false, fill: DARK, w: 3 * s, seed: seed + 1 + i });
      [0, 1].forEach((r) => IB.oval(ctx, px, y + 30 * s + 40 * s + r * 70 * s, 26 * s, 26 * s, { fill: i < on ? C.red : '#4a4a4a', w: 2.4 * s, n: 12, seed: seed + 10 + i * 2 + r }));
    }
  };

  /* helmet(ctx, [x, y], opts) — a driver seen head-on in close-up: the helmet (shell in `color`, a stripe in `accent`), the visor raised enough to show the eyes over the fireproof balaclava, the collar and the halo's pillar in front. [x, y] is the middle of the visor opening; s scales it (helmet 520 px wide at 1). eyes: 'calm' | 'tense' (narrowed, brows knotted) | 'wide' | 'shut'; look: the eyes' sideways glance (-1..1); sweat: a drop at the temple (its drawing k, 0..3); blink. */
  IB.helmet = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, seed = o.seed || 1900, color = o.color || C.navy, accent = o.accent || C.yellow, lw = 4 * s;
    const sh = (dx, dy) => [x + dx * s, y + dy * s];
    IB.ink(ctx, [sh(-300, 420), sh(-200, 300), sh(200, 300), sh(300, 420)], { closed: false, fill: C.charcoal, w: lw, seed: seed + 1 });   // shoulders and collar
    IB.ink(ctx, IB.ellipse(x, y + 10 * s, 260 * s, 300 * s, 28), { closed: true, fill: color, w: lw, seed: seed + 2 });
    IB.ink(ctx, [sh(-250, -90), sh(-60, -280), sh(60, -280), sh(250, -90)], { closed: false, w: 26 * s, color: accent, seed: seed + 3, taper: false });   // the stripe over the crown
    IB.ink(ctx, [sh(-210, -70), sh(210, -70), sh(196, 70), sh(-196, 70)], { closed: true, smooth: false, fill: '#efe6dc', w: lw, seed: seed + 4 });   // the opening: balaclava
    IB.ink(ctx, [sh(-216, -112), sh(216, -112), sh(212, -66), sh(-212, -66)], { closed: true, smooth: false, fill: DARK, w: lw, seed: seed + 5 });   // the visor, raised
    const ex = (o.look || 0) * 22, mood = o.eyes || 'calm';
    [-1, 1].forEach((sd) => {
      const cx = x + sd * 92 * s, cy = y + 4 * s;
      if (o.blink || mood === 'shut') IB.ink(ctx, [[cx - 34 * s, cy], [cx + 34 * s, cy]], { w: lw, seed: seed + 10 + sd });
      else {
        const open = mood === 'tense' ? 17 : mood === 'wide' ? 30 : 22;
        IB.ink(ctx, IB.ellipse(cx, cy, 38 * s, open * s, 14), { closed: true, fill: C.paper, w: lw * 0.8, seed: seed + 12 + sd });
        IB.oval(ctx, cx + ex * s, cy + 2 * s, 11 * s, Math.min(11, open - 2) * s, { fill: C.ink, w: 0, n: 8, seed: seed + 14 + sd });
      }
      const knot = mood === 'tense' ? 18 : 0;
      IB.ink(ctx, [[cx - 40 * s * sd, cy - 40 * s - (mood === 'wide' ? 14 * s : 0)], [cx + 38 * s * sd, cy - 34 * s + knot * s * 0.6]], { w: lw * 1.1, seed: seed + 16 + sd });   // brows: the inner end drops when tense
    });
    if (o.sweat != null && o.sweat >= 0) IB.drop(ctx, [x + 168 * s, y - 30 * s + o.sweat * 22 * s], { s: 0.6 * s });
    IB.ink(ctx, [sh(0, 520), sh(0, 140)], { w: 46 * s, color: C.charcoal, seed: seed + 20, taper: false });   // the halo's pillar, out of focus in front
  };

  /* cockpit(ctx, opts) — the onboard camera over the driver's head, in screen px: the halo's pillar up the middle, the hoop across the top, the steering wheel with two gloved hands (steer: rad), the mirrors and the nose running ahead to the front wing. Draw the track ahead first with IB.trackStrip (a view from behind: yaw PI/2, look ~0.06, f ~ 700, at about [960, 600]). shake: px of vibration this frame. color: the car's body; glove. */
  IB.cockpit = (ctx, o = {}) => {
    const W = MG.W, H = MG.H, seed = o.seed || 2000, color = o.color || C.navy, sk = o.shake || 0, dx = sk * Math.cos(seed + (o.d || 0)), dy = sk * Math.sin((o.d || 0) * 1.7);
    ctx.save(); ctx.translate(dx, dy);
    IB.ink(ctx, [[760, H + 10], [900, 720], [1020, 720], [1160, H + 10]], { closed: true, smooth: false, fill: color, w: 4, seed: seed + 1 });   // nose
    IB.ink(ctx, [[-20, H + 10], [-20, 860], [520, 900], [700, H + 10]], { closed: true, smooth: false, fill: color, w: 4, seed: seed + 2 });   // the cockpit's flanks
    IB.ink(ctx, [[W + 20, H + 10], [W + 20, 860], [W - 520, 900], [W - 700, H + 10]], { closed: true, smooth: false, fill: color, w: 4, seed: seed + 3 });
    [-1, 1].forEach((sd) => IB.ink(ctx, IB.ellipse(960 + sd * 640, 830, 90, 46, 14), { closed: true, fill: DARK, w: 4, seed: seed + 4 + sd }));   // mirrors
    // the wheel: a flat-bottomed racing wheel with two grips and a display, turned by steer about its centre
    const st = o.steer || 0, c = [960, 920], cs = Math.cos(st), sn = Math.sin(st), R = ([px, py]) => [c[0] + px * cs - py * sn, c[1] + px * sn + py * cs];
    IB.ink(ctx, [[-300, -40], [-230, -120], [230, -120], [300, -40], [290, 110], [-290, 110]].map(R), { closed: true, smooth: false, fill: DARK, w: 4, seed: seed + 6 });
    IB.ink(ctx, [[-120, -80], [120, -80], [120, 0], [-120, 0]].map(R), { closed: true, smooth: false, fill: '#5a5a5a', w: 3, seed: seed + 7 });
    [-1, 1].forEach((sd) => [[-60, -40], [60, -40]].forEach(([bx], i) => { if (i) return; IB.oval(ctx, ...R([sd * 170, 40]), 18, 18, { fill: [C.yellow, C.blue][sd > 0 ? 1 : 0], w: 3, n: 10, seed: seed + 20 + sd }); }));
    [-1, 1].forEach((sd, i) => { const p = R([sd * 285, 10]); IB.oval(ctx, p[0], p[1], 66, 86, { fill: o.glove || C.paper, w: 4, n: 14, seed: seed + 8 + i }); });
    ctx.restore();
    IB.ink(ctx, [[960, H + 20], [960, 330], [930, 120], [960, -20]], { w: 70, color: C.charcoal, seed: seed + 10, taper: false });   // the halo's pillar (fixed to the camera: it does not shake)
    IB.ink(ctx, [[-40, 260], [420, 70], [960, 30], [1500, 70], [1960, 260]], { w: 70, color: C.charcoal, seed: seed + 11, taper: false });
  };

  /* tyreSmoke(ctx, [x, y], opts) — the white smoke off a locked or spinning tyre at its contact patch: k puffs (drawing number since it started, 0..), each growing and drifting back (dir -1: toward -x) and up; s scales it. Re-seed with the drawing. */
  IB.tyreSmoke = (ctx, [x, y], o = {}) => {
    const k = o.k || 0, s = o.s || 1, dir = o.dir || -1, r = MG.rng((o.seed || 2100) + k * 13);
    for (let i = 0; i <= Math.min(k, 7); i++) {
      const age = k - i, rad = (22 + age * 14) * s * (0.8 + r() * 0.4);
      IB.oval(ctx, x + dir * (age * 34 + r() * 20) * s, y - rad * 0.6 - age * 6 * s, rad * 1.3, rad, { fill: age > 4 ? '#f6f6f6' : C.paper, w: Math.max(1, 2.6 - age * 0.3) * s, color: '#8a8a8a', n: 12, seed: (o.seed || 2100) + i * 7 + k });
    }
  };

  /* sparks(ctx, [x, y], opts) — the yellow sparks from a car's plank scraping the tarmac: n short streaks thrown back (dir), re-rolled every drawing d. */
  IB.sparks = (ctx, [x, y], o = {}) => {
    const r = MG.rng((o.seed || 2200) + (o.d || 0) * 31), s = o.s || 1, dir = o.dir || -1;
    for (let i = 0; i < (o.n || 9); i++) { const l = (40 + r() * 120) * s, a = (r() - 0.7) * 0.5; IB.seg(ctx, x + dir * r() * 30 * s, y, x + dir * l * Math.cos(a), y + l * Math.sin(a), { w: 2.2 * s, color: r() < 0.5 ? C.yellow : C.mustard, wob: 0, seed: 2200 + i }); }
  };

  /* spray(ctx, [x, y], opts) — the rooster tail a car throws up on a wet track, from its rear tyres at [x, y], streaming back (dir) len px: light blue-grey dashes and dots, thickest low and near, re-rolled every drawing d. */
  IB.spray = (ctx, [x, y], o = {}) => {
    const r = MG.rng((o.seed || 2300) + (o.d || 0) * 17), s = o.s || 1, dir = o.dir || -1, len = (o.len || 520) * s;
    for (let i = 0; i < 70; i++) {
      const u = r(), px = x + dir * u * len, py = y - (u * 0.5 + r() * 0.5) * 160 * s * (0.3 + u), l = (8 + r() * 30) * s;
      IB.seg(ctx, px, py, px + dir * l, py - l * 0.15, { w: (2.6 - u * 1.6) * s, color: r() < 0.4 ? C.blue : '#c9d3dc', wob: 0, seed: 2300 + i });
    }
  };

  /* chequer(ctx, [x, y], opts) — the chequered flag on its pole, [x, y] the top of the pole: 7 x 5 squares, waving (wave 0 | 1: two drawings, alternate on twos), s scales it (cloth 300 x 210 at 1), dir: which side the cloth flies. */
  IB.chequer = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, wv = o.wave || 0, dir = o.dir || 1, seed = o.seed || 2400, W = 300 * s, H = 210 * s, cols = 7, rows = 5;
    IB.seg(ctx, x, y - 10 * s, x, y + 420 * s, { w: 6 * s, seed });
    const P = (u, v) => [x + dir * u * W, y + v * H + Math.sin(u * Math.PI * 2 + wv * Math.PI) * 16 * s * u];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const q = [P(i / cols, j / rows), P((i + 1) / cols, j / rows), P((i + 1) / cols, (j + 1) / rows), P(i / cols, (j + 1) / rows)];
      ctx.fillStyle = (i + j) % 2 ? C.paper : C.ink; ctx.beginPath(); q.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    }
    IB.ink(ctx, [...Array.from({ length: 9 }, (_, i) => P(i / 8, 0)), ...Array.from({ length: 9 }, (_, i) => P(1 - i / 8, 1))], { closed: true, fill: null, w: 3 * s, seed: seed + 1 });
  };

  /* trackside(ctx, [x0, x1], floor, opts) — the circuit seen side on by a long lens: the grandstand (IB.stands, from sports.js), the debris fence, a white wall with blank boards, the yellow-and-white kerb and the tarmac's edge, from x0 to x1 (draw only what the camera sees). run: metres the camera has panned (shifts the posts and kerbs), blur: 0..1 streaks the background at a fast pan. */
  IB.trackside = (ctx, [x0, x1], floor, o = {}) => {
    const seed = o.seed || 2500, run = (o.run || 0) * 140, blur = o.blur || 0;
    IB.stands(ctx, [x0, x1], floor - 560, { rows: 3, colors: o.colors || [C.navy, C.yellow], share: 0.3, cheer: o.cheer || 0, s: 0.8, seed, faint: true });
    IB.ink(ctx, [[x0, floor - 330], [x1, floor - 330], [x1, floor - 200], [x0, floor - 200]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: seed + 1 });
    for (let k = Math.floor((x0 + run) / 380); k * 380 - run < x1; k++) { const px = k * 380 - run; IB.seg(ctx, px, floor - 330, px, floor - 200, { w: 1.8, color: '#9a9a9a', seed: seed + 10 + k }); }
    for (let k = Math.floor((x0 + run) / 240); k * 240 - run < x1; k++) { const px = k * 240 - run; IB.seg(ctx, px, floor - 330, px, floor - 520, { w: 1.6, color: '#9a9a9a', seed: seed + 100 + k }); }
    IB.ink(ctx, [[x0, floor - 520], [x1, floor - 520]], { w: 1.6, color: '#9a9a9a', seed: seed + 3, taper: false });
    for (let k = Math.floor((x0 + run) / 120); k * 120 - run < x1; k++) { const px = k * 120 - run; IB.ink(ctx, [[px, floor + 4], [px + 120, floor + 4], [px + 120, floor + 22], [px, floor + 22]], { closed: true, smooth: false, fill: k % 2 ? C.yellow : C.paper, w: 1.8, seed: seed + 200 + k }); }
    if (blur) { const r = MG.rng(seed + Math.round(run)); for (let i = 0; i < 26 * blur; i++) { const y = floor - 560 + r() * 380, x = x0 + r() * (x1 - x0), l = 200 + r() * 600; IB.seg(ctx, x, y, x + l, y, { w: 1.4 + r() * 2, color: r() < 0.5 ? '#cfcfcf' : C.bg, wob: 0, seed: seed + 300 + i }); } }
  };

  /* broadcast(ctx, opts) — the graphics of a live race, in screen px, drawn last: the timing tower down the left (rows [{ num, color, gap }] in race order; a row's `y` (0..1 of a place) lets two rows slide past each other in an overtake; `hi` marks a row), the lap counter over it (lap: [n, of]), a "생중계" bug top right, and opts.banner: one line in a box at the bottom left (a pit time, "최고 랩"). Korean labels; the digits are typeset, as a broadcast's are. */
  IB.broadcast = (ctx, o = {}) => {
    const seed = o.seed || 2600, X = 56, Y = 60, RW = 300, RH = 50;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const text = (t, x, y, px, color, align = 'left', weight = 600) => { ctx.font = `${weight} ${px}px ${IB.FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); };
    if (o.lap) { IB.ink(ctx, [[X, Y], [X + RW, Y], [X + RW, Y + 56], [X, Y + 56]], { closed: true, smooth: false, fill: C.ink, w: 2.4, seed }); text('랩', X + 20, Y + 29, 26, '#bdbdbd', 'left', 500); text(`${o.lap[0]} / ${o.lap[1]}`, X + RW - 20, Y + 29, 30, C.paper, 'right', 700); }
    (o.rows || []).forEach((row, i) => {
      const y = Y + 66 + (row.y == null ? i : row.y) * RH;
      IB.ink(ctx, [[X, y], [X + RW, y], [X + RW, y + RH - 4], [X, y + RH - 4]], { closed: true, smooth: false, fill: row.hi ? C.charcoal : '#1b1b1b', w: 2, seed: seed + 1 + i });
      text(String(i + 1), X + 26, y + RH / 2 - 2, 24, C.paper, 'center', 700);
      IB.ink(ctx, [[X + 52, y + 10], [X + 60, y + 10], [X + 60, y + RH - 14], [X + 52, y + RH - 14]], { closed: true, smooth: false, fill: row.color || C.paper, w: 0, seed: seed + 30 + i });
      text(`#${row.num}`, X + 74, y + RH / 2 - 2, 24, C.paper, 'left', 700);
      text(row.gap || '', X + RW - 16, y + RH / 2 - 2, 22, '#bdbdbd', 'right', 500);
    });
    if (o.live !== false) { IB.ink(ctx, [[MG.W - 236, 56], [MG.W - 56, 56], [MG.W - 56, 108], [MG.W - 236, 108]], { closed: true, smooth: false, fill: C.ink, w: 2.4, seed: seed + 50 }); IB.oval(ctx, MG.W - 206, 82, 9, 9, { fill: C.yellow, w: 0, n: 8, seed: seed + 51 }); text('생중계', MG.W - 76, 83, 26, C.paper, 'right', 700); }
    if (o.banner) { ctx.font = `700 34px ${IB.FONT}`; const w = ctx.measureText(o.banner).width + 64; IB.ink(ctx, [[X, MG.H - 150], [X + w, MG.H - 150], [X + w, MG.H - 84], [X, MG.H - 84]], { closed: true, smooth: false, fill: C.ink, w: 2.4, seed: seed + 60 }); IB.ink(ctx, [[X, MG.H - 150], [X + 10, MG.H - 150], [X + 10, MG.H - 84], [X, MG.H - 84]], { closed: true, smooth: false, fill: o.bannerColor || C.yellow, w: 0, seed: seed + 61 }); text(o.banner, X + 36, MG.H - 117, 34, C.paper, 'left', 700); }
    ctx.restore();
  };
})(window);
