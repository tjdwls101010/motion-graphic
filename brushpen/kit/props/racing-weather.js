/* props/racing-weather.js — the race away from the dry straight: rain (the rooster tail of spray seen from any angle, the rain light glowing through it, drops on the lens, standing water), a circuit with curves for the helicopter (IB.trackPath, IB.circuit) with the cars' sun shadows, rubber marks and the smoke of a drift drawn in the same space, a raised apex kerb for a camera on the tarmac, the pit wall the team climbs to cheer, and the marshal's post with the chequered flag. Everything that lies on the track takes `map`, the view's space in metres (IB.trackSpace with the same view opts as IB.racer), so it stays glued to the cars in any shot. New, not measured: the reference has no racing. Needs ink.js, solid.js, marks.js, figure.js and props/racing.js. */
(function (window) {
  const IB = window.IB, C = IB.C;
  const MIST = 'rgba(226, 233, 239, 0.45)', MIST_LINE = 'rgba(130, 150, 170, 0.35)', SPRAY = '#9fb3c6', WATER = '#d5e4f1', SHADE = '#d2d2d2', RUBBER = '#4a4a4a';

  /* trackSpace(view) — the view IB.racer and IB.trackStrip use (at, yaw, pitch, roll, f, look, s), as a map from metres on the track ([x along, y down, z across]) to stage [X, Y, depth]. Its .f is the lens, for dropping points behind it. */
  IB.trackSpace = (o = {}) => {
    const U = 140 * (o.s || 1), f = o.f || 1500, space = IB.space({ at: o.at || [960, 800], yaw: o.yaw || 0, pitch: o.pitch || 0, roll: o.roll || 0, f, look: o.look == null ? 0.18 : o.look });
    const m = ([x, y, z]) => space([x * U, y * U, z * U]);
    m.f = f;
    return m;
  };
  const ok = (map, p) => p[2] > -map.f * 0.8;
  const pxm = (map, p) => { const a = map(p); return Math.max(...[[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(([dx, dy, dz]) => { const b = map([p[0] + dx * 0.5, p[1] + dy * 0.5, p[2] + dz * 0.5]); return Math.hypot(b[0] - a[0], b[1] - a[1]) * 2; })); };   // stage px a metre at p, the largest across the three axes
  const onTrack = (car, [x, y, z]) => { const h = car.heading || 0, c = Math.cos(h), s = Math.sin(h); return [x * c - z * s + (car.x || 0), y, x * s + z * c + (car.z || 0)]; };

  /* carAt(map, car, p) — the stage point of p = [x, y, z] in a car's own metres (x forward, y down, z across, as IB.racer is built) for the car at car = { x, z, heading } on the track. The rain light is [-2.62, -0.42, 0], the rear contact patches [-1.85, 0, ±0.8], the front ones [1.75, 0, ±0.8]. */
  IB.carAt = (map, car, p) => map(onTrack(car, p));

  /* ---------- rain ---------- */

  /* wetSpray(ctx, map, car, opts) — the rooster tail a car throws up on a wet track, in 3-D: from its two rear tyres it streams back `len` m (16), spreading and rising to `high` m (2.6), as translucent mist puffs (the car behind shows dimly through them) with blue-grey streaks thrown back and up through them, re-rolled every drawing d (on twos). Drawn far to near, so a camera behind the car sees the car through it (draw it after the car) and one ahead sees it behind (draw it first, then the car). A chaser hidden in it is drawn before it. opts { d, len, high, mist (translucent puffs, 22), n (streaks, 110), maxR (the largest puff, 240 px), lw, seed }. */
  IB.wetSpray = (ctx, map, car, o = {}) => {
    const r = MG.rng((o.seed || 3100) + (o.d || 0) * 17), len = o.len || 16, high = o.high || 2.6, lw = o.lw || 2.2, items = [], ok = (m, p) => p[2] > -m.f * 0.45;   // nothing within half a lens of the camera: a puff there would fill the frame
    const at = (u, k, h) => [-2.2 - u * len, -(0.15 + u * high * h), k * (0.8 - 0.3 * u) + (r() - 0.5) * (0.4 + u * 1.8)];   // u: 0 at the tyres .. 1 at the tail; the two plumes merge and spread as they go
    for (let i = 0; i < (o.mist == null ? 22 : o.mist); i++) {
      const u = Math.pow(r(), 0.8), k = r() < 0.5 ? -1 : 1, rad = 0.35 + u * 1.1 * (0.6 + r() * 0.5), p = onTrack(car, at(u, k, 0.3 + r() * 0.6)), q = map(p);
      if (ok(map, q)) items.push({ z: q[2], draw: () => { const R = Math.min(o.maxR || 240, rad * pxm(map, p)); IB.oval(ctx, q[0], q[1], R * 1.2, R * 0.8, { fill: MIST, color: MIST_LINE, w: Math.max(1, Math.min(2, R / 50)), n: 12, seed: 3100 + i }); } });
    }
    for (let i = 0; i < (o.n || 110); i++) {
      const u = r(), k = r() < 0.5 ? -1 : 1, l = 0.4 + r() * 1.6, a3 = at(u, k, r()), rise = 0.4 - 0.3 * u, blue = r() < 0.3;
      const a = onTrack(car, a3), b = onTrack(car, [a3[0] - l, a3[1] - l * rise, a3[2] + (a3[2] - k * 0.5) * 0.08 * l]), qa = map(a), qb = map(b);
      if (ok(map, qa) && ok(map, qb) && Math.hypot(qb[0] - qa[0], qb[1] - qa[1]) < 220) items.push({ z: (qa[2] + qb[2]) / 2, draw: () => IB.seg(ctx, qa[0], qa[1], qb[0], qb[1], { w: Math.max(1, Math.min(6, (lw * pxm(map, a)) / 140)), color: blue ? C.blue : SPRAY, wob: 0, grain: 0, seed: 3200 + i }) });
    }
    items.sort((p, q) => q.z - p.z).forEach((it) => it.draw());
  };

  /* rainLight(ctx, [x, y], opts) — the red rain light on the back of a car, glowing: a red dot with short rays, for a car seen through spray or far up the track where IB.racer's own lit lamp is a few px. Give it IB.carAt(map, car, [-2.62, -0.42, 0]). opts { on (blink it: about 4 a second, on ones), s }. Nothing is drawn while off. */
  IB.rainLight = (ctx, [x, y], o = {}) => {
    if (o.on === false) return;
    const s = o.s || 1, seed = o.seed || 3300;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; IB.seg(ctx, x + Math.cos(a) * 18 * s, y + Math.sin(a) * 18 * s, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 34 * s, { w: 2.6 * s, color: C.red, wob: 0, grain: 0, seed: seed + i }); }
    IB.oval(ctx, x, y, 11 * s, 11 * s, { fill: C.red, w: 2 * s, n: 10, seed: seed + 9 });
  };

  /* lensDrops(ctx, opts) — rain on the camera's lens, in screen px: drawn outside IB.film (so the camera's moves do not carry it), over the picture and under the broadcast graphics: n drops, each a clear ring with a darker lower rim and a white catch-light, about a third of them running down at their own speed and leaving a short trail. f is the frame: glass on the lens slides on ones. opts { n (16), f, s, seed, box [x0, y0, x1, y1] (where they sit: the whole frame) }. */
  IB.lensDrops = (ctx, o = {}) => {
    const r = MG.rng(o.seed || 3400), s = o.s || 1, f = o.f || 0, [x0, y0, x1, y1] = o.box || [0, 0, MG.W, MG.H];
    for (let i = 0; i < (o.n || 16); i++) {
      const x = x0 + r() * (x1 - x0), ys = y0 + r() * (y1 - y0), rad = (7 + r() * r() * 26) * s, runs = r() < 0.35, v = 2 + r() * 6, f0 = r() * 40;
      const dy = runs ? Math.max(0, f - f0) * v : 0, span = y1 - y0 + 120, y = runs ? y0 + ((ys - y0 + dy) % span) - 60 : ys;
      if (runs && dy > 0) IB.seg(ctx, x, Math.max(y0, y - Math.min(dy, 90 * s)), x, y - rad, { w: rad * 0.45, color: 'rgba(92, 172, 245, 0.25)', wob: 0.4, grain: 0, seed: 3400 + i });
      IB.ink(ctx, IB.ellipse(x, y, rad, rad * 0.92, 14), { closed: true, fill: 'rgba(253, 253, 253, 0.28)', w: Math.max(1.4, rad * 0.12), color: '#8fb0cc', seed: 3420 + i });
      IB.ink(ctx, IB.ellipse(x, y, rad * 0.8, rad * 0.75, 8, 0.4, Math.PI - 0.4), { w: Math.max(1.4, rad * 0.16), color: C.blue, seed: 3440 + i, grain: 0 });
      IB.oval(ctx, x - rad * 0.35, y - rad * 0.4, rad * 0.2, rad * 0.16, { fill: C.paper, w: 0, n: 8, seed: 3460 + i });
    }
  };

  /* trackPuddles(ctx, map, opts) — standing water on the tarmac, in the cars' space: a pool every `every` m (14) from `from` to `to` (m along x), at a random place across ±half (5), sliding back by `run` m like IB.trackStrip's kerbs, each a flat pale-blue pool 2-5 m long with two ripple lines; and between them long thin streaks of wet sheen. Draw after IB.trackStrip and before the cars. opts { from, to, run, half, every, seed, lw }. */
  IB.trackPuddles = (ctx, map, o = {}) => {
    const from = o.from == null ? -10 : o.from, to = o.to == null ? 80 : o.to, run = o.run || 0, half = o.half || 5, every = o.every || 14, seed = o.seed || 3500, lw = o.lw || 2;
    const pool = (cx, cz, a, b, n) => IB.ellipse(0, 0, a, b, n).map(([u, v]) => map([cx + u, 0, cz + v]));
    for (let k = Math.floor((from + run) / every) - 1; k * every - run < to + every; k++) {
      const r = MG.rng(seed + k * 7), cx = k * every - run + r() * every * 0.6, cz = (r() * 2 - 1) * half * 0.8, a = 1 + r() * 1.5, b = 0.4 + r() * 0.5;
      if (cx - a < from || cx + a > to) continue;
      const P = pool(cx, cz, a, b, 16);
      if (P.every((p) => ok(map, p))) {
        IB.ink(ctx, P, { closed: true, fill: WATER, w: lw * 0.8, color: '#8fb0cc', seed: seed + k });
        [0.55, 0.3].forEach((m, j) => { const R = pool(cx + a * 0.1, cz, a * m, b * m, 10).slice(1, 8); IB.ink(ctx, R, { w: lw * 0.7, color: C.blue, grain: 0, seed: seed + 40 + k + j }); });
      }
      const zs = cz + (r() < 0.5 ? -1 : 1) * (1 + r() * 2), x0 = cx + a + 1, x1 = x0 + 3 + r() * 6;
      const S = [map([x0, 0, zs]), map([x1, 0, zs + 0.1])];
      if (x1 < to && S.every((p) => ok(map, p))) IB.ink(ctx, S, { w: lw * 0.8, color: '#b9cad9', grain: 0, seed: seed + 80 + k, taper: true });
    }
  };

  /* ---------- the circuit from above ---------- */

  /* trackPath(points) — a circuit's centre line through `points` ([x, z] metres on the ground, in order), rounded through them (Catmull-Rom) and measured along its length. Returns { len, at(s) } where at(s) = { x, z, heading } at s metres along it (held at the ends) and heading is the way it runs as IB.racer reads it (atan2(dz, dx)), so a car at path.at(s) rides the line; add an angle to the heading for a slide. side(s, d): the point d m to the left of the line at s (left of the way it runs: +z when it runs along +x). */
  IB.trackPath = (pts) => {
    const P = [pts[0], ...pts, pts[pts.length - 1]], line = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t, [a, b, c, d] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      line.push([0, 1].map((j) => 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3)));
    }
    line.push(pts[pts.length - 1]);
    const L = [0];
    for (let i = 1; i < line.length; i++) L.push(L[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const len = L[L.length - 1];
    const pos = (s) => {
      s = Math.max(0, Math.min(len, s));
      let i = 1;
      while (i < L.length - 1 && L[i] < s) i++;
      const u = (s - L[i - 1]) / (L[i] - L[i - 1] || 1), a = line[i - 1], b = line[i];
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    };
    const at = (s) => {
      const [x, z] = pos(s), a = pos(Math.min(s, len - 0.5) - 0.5), b = pos(Math.max(s, 0.5) + 0.5);   // the heading across a metre of line, so it turns smoothly between the samples
      return { x, z, heading: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    const side = (s, d) => { const p = at(s); return [p.x - Math.sin(p.heading) * d, p.z + Math.cos(p.heading) * d]; };
    return { len, at, side };
  };

  /* circuit(ctx, map, path, opts) — that circuit in the cars' space, for a helicopter shot or any other: the tarmac (a pale grey band) between two edge lines `half` m (6) either side of the line, the grass beyond as a green chalk smear, yellow-and-white kerbs 1.2 m a block and `kerb` m (1.2) wide outside the edge along each stretch of opts.kerbs ([[s0, s1, side]]: side 1 the left of the way it runs, -1 the right), the barriers `wall` m (half + 9) out, and a finish line across it at s = opts.line (a chequered band); grass: false leaves the green out. Draws s from `from` to `to` (the whole path). off: [x, z] subtracted from everything, the camera's place when it follows the cars (pass the same to the cars' x and z). */
  IB.circuit = (ctx, map, path, o = {}) => {
    const half = o.half || 6, kerb = o.kerb || 1.2, wall = o.wall || half + 9, from = o.from || 0, to = o.to == null ? path.len : o.to, [ox, oz] = o.off || [0, 0], lw = o.lw || 2.4, seed = o.seed || 3600;
    const P = (s, d, y = 0) => { const [x, z] = path.side(s, d); return map([x - ox, y, z - oz]); };
    const ss = (a, b, step) => { const out = []; for (let s = a; s < b; s += step) out.push(s); out.push(b); return out; };
    const S = ss(from, to, 2), line = (pts, opts) => { let seg = []; pts.forEach((p) => { if (ok(map, p)) seg.push(p); else { if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); seg = []; } }); if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); };
    const k = pxm(map, P((from + to) / 2, 0));
    if (o.grass !== false) [-1, 1].forEach((sd) => line(S.map((s) => P(s, sd * (half + kerb + 3))), { w: 5.5 * k, color: 'rgba(66, 190, 100, 0.12)', grain: 0, seed: seed + 1 + sd }));   // grass (leave it out on a long lens down the track, where a metre near the lens is many far away)
    const band = [...S.map((s) => P(s, half)), ...S.slice().reverse().map((s) => P(s, -half))];
    if (band.every((p) => ok(map, p))) IB.ink(ctx, band, { closed: true, fill: o.tarmac || '#e3e3e3', w: 0, smooth: false, seed: seed + 3 });
    (o.kerbs || []).forEach(([s0, s1, sd], j) => {
      for (let i = 0; s0 + i * 1.2 < s1; i++) {
        const a = s0 + i * 1.2, b = Math.min(s1, a + 1.2), q = [P(a, sd * half), P(b, sd * half), P(b, sd * (half + kerb)), P(a, sd * (half + kerb))];
        if (q.every((p) => ok(map, p))) IB.ink(ctx, q, { closed: true, smooth: false, fill: i % 2 ? C.yellow : C.paper, w: lw * 0.5, seed: seed + 100 + j * 50 + i });
      }
    });
    if (o.line != null) for (let i = 0; i < 12; i++) for (let r = 0; r < 2; r++) {
      const a = o.line + r * 0.6, d0 = -half + (i * 2 * half) / 12, d1 = d0 + (2 * half) / 12, q = [P(a, d0), P(a + 0.6, d0), P(a + 0.6, d1), P(a, d1)];
      if (q.every((p) => ok(map, p))) IB.ink(ctx, q, { closed: true, smooth: false, fill: (i + r) % 2 ? C.ink : C.paper, w: 0, seed: seed + 300 + i * 2 + r });
    }
    [-1, 1].forEach((sd) => {
      line(S.map((s) => P(s, sd * half)), { w: lw, seed: seed + 10 + sd });
      line(S.map((s) => P(s, sd * wall)), { w: lw * 0.9, color: '#8a8a8a', seed: seed + 20 + sd });
      line(S.map((s) => P(s, sd * wall, -0.9)), { w: lw * 0.6, color: '#b0b0b0', seed: seed + 30 + sd });
    });
  };

  /* carShadow(ctx, map, car, opts) — the shadow a car casts on the tarmac in sunshine, pushed off it by sun = [dx, dz] metres (1.2, -0.9): the long body, the two wings and the four tyres as one grey shape, so a car seen from above sits on the ground. Draw it before the car and after the track. */
  IB.carShadow = (ctx, map, car, o = {}) => {
    const [dx, dz] = o.sun || [1.2, -0.9], seed = o.seed || 3700;
    const shape = [[2.85, -1.0], [2.85, 1.0], [2.3, 1.0], [2.0, 0.5], [1.4, 1.0], [-1.6, 1.02], [-2.2, 0.6], [-2.85, 0.55], [-2.85, -0.55], [-2.2, -0.6], [-1.6, -1.02], [1.4, -1.0], [2.0, -0.5], [2.3, -1.0]];
    const q = shape.map(([x, z]) => { const p = onTrack(car, [x, 0, z]); return map([p[0] + dx, 0, p[2] + dz]); });
    if (q.every((p) => ok(map, p))) IB.ink(ctx, q, { closed: true, smooth: true, fill: o.color || SHADE, w: 0, seed });
  };

  /* tyreMarks(ctx, map, pts, opts) — black rubber laid on the tarmac along pts ([x, z] metres on the ground), drawn before the car: a donut's circles, a lock-up's stripe. opts { w (m, 0.32: a rear tyre's width), color, seed }. */
  IB.tyreMarks = (ctx, map, pts, o = {}) => {
    const q = pts.map(([x, z]) => map([x, 0, z])).filter((p) => ok(map, p));
    if (q.length < 2) return;
    const k = pxm(map, [pts[0][0], 0, pts[0][1]]);
    IB.ink(ctx, q, { w: Math.max(1.2, (o.w || 0.32) * k), color: o.color || RUBBER, grain: 0.6, taper: false, seed: o.seed || 3750 });
  };

  /* smokeCloud(ctx, map, opts) — tyre smoke left in the air where a sliding car has been, in the cars' space, so a helicopter and a camera on the tarmac see the same cloud: from each emitter (opts.at: a list of functions of time t -> [x, z], a spinning rear tyre's path) a puff is born every `every` s (1/12, on twos), grows by `grow` m/s (1) from r0 (0.4 m), rises `rise` m/s (0.5) and drifts with the wind [vx, vz] (m/s), and is gone after `life` s (1.6); `now` is the scene's time on twos. Puffs are drawn far to near: white young, their outline fading as they age. A car inside its own smoke is drawn between two calls: pass 'far' draws only the puffs deeper than `split` (the car's depth: map([x, 0, z])[2]), pass 'near' the rest. opts { at, now, every, life, grow, r0, rise, wind, start (no puffs born before it), split, pass, seed, lw }. */
  IB.smokeCloud = (ctx, map, o = {}) => {
    const every = o.every || 1 / 12, life = o.life || 1.6, grow = o.grow || 1, r0 = o.r0 || 0.4, rise = o.rise == null ? 0.5 : o.rise, [vx, vz] = o.wind || [0, 0], now = o.now || 0, lw = o.lw || 2.4, items = [];
    (o.at || []).forEach((fn, e) => {
      for (let n = Math.ceil((now - life) / every); n * every <= now + 1e-9; n++) {
        const tb = n * every, age = now - tb;
        if (tb < (o.start || 0)) continue;
        const r = MG.rng((o.seed || 3800) + n * 13 + e * 7), [x, z] = fn(tb), rad = r0 + grow * age * (0.8 + r() * 0.4);
        const p = [x + vx * age + (r() - 0.5) * (0.6 + age), -(rad * 0.7 + rise * age), z + vz * age + (r() - 0.5) * (0.6 + age)], q = map(p);
        const side = o.split == null || !o.pass ? true : o.pass === 'far' ? q[2] > o.split : q[2] <= o.split;
        if (ok(map, q) && side) items.push({ z: q[2], x: q[0], y: q[1], r: rad * pxm(map, p), age: age / life });
      }
    });
    IB.billow(ctx, items.sort((p, q) => q.z - p.z), { lw, seed: o.seed || 3800 });   // far to near, drawn as one cloud
  };

  /* apexKerb(ctx, map, opts) — the raised kerb at an apex, for a camera down on the tarmac: blocks `len` m (1.2) long and `h` m (0.06) high with a sloped inner face, yellow and white, from x `from` to `to` (m along the track, sliding back by `run` like IB.trackStrip's), between z0 and z1 m across (the inner edge first), drawn far to near so the block nearest the lens is in front. opts { from, to, run, z0, z1, h, len, seed, lw }. */
  IB.apexKerb = (ctx, map, o = {}) => {
    const from = o.from == null ? -10 : o.from, to = o.to == null ? 30 : o.to, run = o.run || 0, z0 = o.z0 == null ? -6 : o.z0, z1 = o.z1 == null ? -7.2 : o.z1, h = o.h || 0.06, L = o.len || 1.2, seed = o.seed || 3900, lw = o.lw || 2.4;
    const zm = z0 + (z1 - z0) * 0.3, blocks = [];
    for (let k = Math.floor((from + run) / L); k * L - run < to; k++) {
      const a = Math.max(from, k * L - run), b = Math.min(to, (k + 1) * L - run), fill = k % 2 ? C.yellow : C.paper;
      const top = [[a, -h, zm], [b, -h, zm], [b, -h, z1], [a, -h, z1]].map(map), slope = [[a, 0, z0], [b, 0, z0], [b, -h, zm], [a, -h, zm]].map(map), end = [[a, 0, z0], [a, -h, zm], [a, -h, z1], [a, 0, z1]].map(map);
      if (![top, slope, end].every((q) => q.every((p) => ok(map, p)))) continue;
      blocks.push({ z: (top[0][2] + top[2][2]) / 2, draw: () => { IB.ink(ctx, end, { closed: true, smooth: false, fill: '#cfcfcf', w: lw * 0.6, seed: seed + k * 3 }); IB.ink(ctx, slope, { closed: true, smooth: false, fill, w: lw * 0.7, seed: seed + k * 3 + 1 }); IB.ink(ctx, top, { closed: true, smooth: false, fill, w: lw * 0.7, seed: seed + k * 3 + 2 }); } });
    }
    blocks.sort((p, q) => q.z - p.z).forEach((b) => b.draw());
  };

  /* ---------- people at the track ---------- */

  /* pitWall(ctx, [x0, x1], floor, opts) — the pit wall seen side on across the track by a long lens, in two layers so the team can stand in it: layer 'back' the gantry they stand on (a deck `deck` px up, its roof on posts with a row of timing screens and a stripe in the team's colour) and layer 'front' the concrete wall to floor - 150 s px with the debris fence over it to floor - 470 s (posts, three cables, a faint diamond mesh) that the crew climb and lean over. Draw back, the crew (IB.figure standing on the returned deck y), then front. opts { layer, s, color, run (m the camera has panned: the posts slide), seed }. Returns { deck, wallTop, fenceTop } in stage y. */
  IB.pitWall = (ctx, [x0, x1], floor, o = {}) => {
    const s = o.s || 1, seed = o.seed || 4000, run = (o.run || 0) * 140 * s, deck = floor - 60 * s, wallTop = floor - 150 * s, fenceTop = floor - 470 * s, lw = 2.6 * Math.max(0.6, s);
    const box = (a, b, y0, y1, fill, sd, w = lw) => IB.ink(ctx, [[a, y0], [b, y0], [b, y1], [a, y1]], { closed: true, smooth: false, fill, w, seed: sd });
    const each = (step, fn) => { for (let k = Math.floor((x0 + run) / step); k * step - run < x1; k++) fn(k * step - run, k); };
    if (o.layer !== 'front') {
      box(x0, x1, floor - 700 * s, floor - 660 * s, C.charcoal, seed);   // the roof
      box(x0, x1, floor - 660 * s, floor - 646 * s, o.color || C.navy, seed + 1, 0);
      each(520 * s, (x, k) => IB.seg(ctx, x, floor - 646 * s, x, deck, { w: lw * 1.4, color: '#7a7a7a', seed: seed + 10 + k }));
      each(260 * s, (x, k) => box(x + 40 * s, x + 200 * s, floor - 620 * s, floor - 530 * s, '#3a3a3a', seed + 40 + k, lw * 0.8));   // timing screens
      box(x0, x1, deck, deck + 16 * s, '#cfcfcf', seed + 2, lw * 0.8);
    }
    if (o.layer !== 'back') {
      box(x0, x1, wallTop, floor, C.paper, seed + 3);
      each(380 * s, (x, k) => IB.seg(ctx, x, wallTop, x, floor, { w: lw * 0.6, color: '#a8a8a8', seed: seed + 60 + k }));
      const mesh = [];
      each(60 * s, (x) => { mesh.push([[x, wallTop], [x + 120 * s, fenceTop]]); mesh.push([[x + 120 * s, wallTop], [x, fenceTop]]); });
      mesh.forEach(([a, b], i) => IB.seg(ctx, a[0], a[1], b[0], b[1], { w: 0.9 * Math.max(0.6, s), color: 'rgba(120, 120, 120, 0.35)', wob: 0, grain: 0, seed: seed + 200 + i }));
      each(400 * s, (x, k) => IB.seg(ctx, x, wallTop, x, fenceTop - 10 * s, { w: lw * 1.2, color: '#6a6a6a', seed: seed + 100 + k }));
      [0, 0.45, 1].forEach((u, j) => IB.ink(ctx, [[x0, fenceTop + u * (wallTop - fenceTop)], [x1, fenceTop + u * (wallTop - fenceTop)]], { w: lw * 0.6, color: '#7a7a7a', taper: false, seed: seed + 150 + j }));
    }
    return { deck, wallTop, fenceTop };
  };

  /* flagStand(ctx, [x, floor], opts) — the marshal's post at the finish line: a small raised deck on two legs, the marshal on it in white overalls holding the chequered flag (IB.chequer) high in both hands and swinging it across: k is the drawing (on twos), the pole swings through four drawings (-0.55, 0.05, 0.6, 0.05 rad from upright) and the cloth ripples with each. dir: the way the marshal faces (toward the track). opts { k, s, dir, look (laid over the overalls), seed }. */
  IB.flagStand = (ctx, [x, floor], o = {}) => {
    const s = o.s || 1, k = o.k || 0, dir = o.dir || -1, seed = o.seed || 4100, h = 250 * s, top = floor - 170 * s, lw = 2.6 * Math.max(0.6, s);
    [-1, 1].forEach((sd, i) => IB.seg(ctx, x + sd * 70 * s, top, x + sd * 80 * s, floor, { w: lw * 1.4, color: '#6a6a6a', seed: seed + i }));
    IB.ink(ctx, [[x - 110 * s, top], [x + 110 * s, top], [x + 110 * s, top + 20 * s], [x - 110 * s, top + 20 * s]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + 3 });
    const look = { h, dir, top: C.bg, topKind: 'long', bottom: C.bg, hair: 'cap', hat: C.charcoal, skin: C.skin[2], shoe: C.ink, seed, ...(o.look || {}) };
    const a = [-0.55, 0.05, 0.6, 0.05][k % 4] * dir, p = IB.posed(look, { ...IB.stand(x, top, look), lean: -0.05, hands: [{ a: -1.25 + a * dir * 0.5, l: 0.27 }, { a: -1.05 + a * dir * 0.5, l: 0.25 }], hand: ['grip', 'grip'] });
    IB.figure(ctx, p, look, 'far');
    const g = p.hands[0], fs = 0.7 * s;
    ctx.save(); ctx.translate(g[0], g[1]); ctx.rotate(a);
    IB.chequer(ctx, [0, -300 * fs], { s: fs, wave: k % 2, dir, seed: seed + 10 });
    ctx.restore();
    IB.figure(ctx, p, look, 'near');
  };
})(window);
