/* props/sports.js — the ball games: the flight of a ball under gravity with its bounces and roll (IB.flight, IB.aim), the balls (IB.soccerBall, IB.basketball, IB.ballTrail), a football goal and a basketball hoop seen from the side with a hint of depth (IB.soccerGoal, IB.hoop), the crowd in the stands and the hoarding in front of them (IB.stands, IB.adBoards, both with the grass in IB.pitchside and the arena's in IB.courtside), the corner flag (IB.cornerFlag), a camera that eases between crop windows (IB.camera) and a scoreboard of drawn segment digits (IB.scoreboard, IB.segDigits), the clock over a backboard (IB.gameClock) and the penalty mark (IB.penaltySpot). Sizes are for a wide shot where a 1.8 m player is 360 px tall (200 px a metre); opts.s scales a part from there, and line widths stay in screen px. Needs ink.js. */
(function (g) {
  const IB = g.IB, C = IB.C, MG = g.MG;
  const MESH = '#9a9a9a';   // net strings: lighter than ink so the players and the ball read over them
  const TAU = Math.PI * 2;

  /* aim(p0, p1, T, g) — the launch velocity [vx, vy] (px/s, +y down) that carries a ball from p0 to p1 in T seconds under gravity g px/s². A pass, a shot or a lob is planned by where and when it arrives, so a scene picks those and gets the arc. */
  IB.aim = (p0, p1, T, grav) => [(p1[0] - p0[0]) / T, (p1[1] - p0[1]) / T - (grav * T) / 2];

  /* flight(o, t) — where a ball is t seconds after it left o.p with velocity o.v (px/s): { p, v, bounces, rolling }.
       o.g      gravity, px/s² (+y down). A wide shot where a 1.8 m player is h px tall has h / 1.8 px a metre, so g = 9.81 x h / 1.8 (1962 at h 360).
       o.floor  the y the ball's centre sits at on the floor (floor line minus its radius); left out, the ball never lands.
       o.e      the share of vertical speed kept at a bounce (a football on grass 0.5-0.6, a basketball on wood 0.75-0.8).
       o.mu     the share of horizontal speed kept at a bounce (default 1).
       o.settle a rebound slower than this (px/s, default 60) does not leave the floor: the ball rolls from there.
       o.roll   how fast a rolling ball slows, px/s² (default 0: it rolls on).
     Pure in t: the bounces are worked out from the start each call, so any frame can be drawn alone. */
  IB.flight = (o, t) => {
    const G = o.g, e = o.e == null ? 0.5 : o.e, mu = o.mu == null ? 1 : o.mu, settle = o.settle == null ? 60 : o.settle, roll = o.roll || 0;
    let [x, y] = o.p, [vx, vy] = o.v, left = t, bounces = 0;
    const rollFrom = (x0, v0, dt) => {   // along the floor, slowing to a stop
      const stop = roll > 0 ? Math.abs(v0) / roll : Infinity, s = Math.sign(v0), u = Math.min(dt, stop);
      return { p: [x0 + v0 * u - (s * roll * u * u) / 2, o.floor], v: [dt < stop ? v0 - s * roll * dt : 0, 0], bounces, rolling: true };
    };
    if (o.floor != null && y >= o.floor - 1e-9 && vy >= 0 && vy < settle) return rollFrom(x, vx, left);
    for (let i = 0; i < 64; i++) {
      let hit = Infinity;
      if (o.floor != null) {   // first time ahead when y + vy t + G t²/2 = floor
        const a = G / 2, b = vy, c = y - o.floor, disc = b * b - 4 * a * c;
        if (disc >= 0) { const r = (-b + Math.sqrt(disc)) / (2 * a); if (r > 1e-9) hit = r; }
      }
      if (left <= hit) return { p: [x + vx * left, y + vy * left + (G * left * left) / 2], v: [vx, vy + G * left], bounces, rolling: false };
      x += vx * hit; y = o.floor; left -= hit;
      const impact = vy + G * hit;
      if (e * impact < settle) { vx *= mu; return rollFrom(x, vx, left); }
      vy = -e * impact; vx *= mu; bounces++;
    }
    return rollFrom(x, vx, left);
  };

  /* ---------- balls ---------- */

  /* soccerBall(ctx, [x, y], opts) — a white ball with black pentagon patches, turned in the picture plane by `rot` (rad): a ball rolling or spinning across a side view turns this way, rot = distance / r. opts: r (22 px: 0.11 m at 200 px/m), rot, lw, seed. */
  IB.soccerBall = (ctx, [x, y], o = {}) => {
    const r = o.r || 22, rot = o.rot || 0, lw = o.lw || 2.8, seed = o.seed || 1;
    const pent = (cx, cy, R, a) => Array.from({ length: 5 }, (_, i) => [cx + R * Math.cos(a + (i * TAU) / 5), cy + R * Math.sin(a + (i * TAU) / 5)]);
    IB.oval(ctx, x, y, r, r, { fill: C.paper, w: 0, seed, n: 16 });
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const core = pent(x, y, r * 0.3, rot - Math.PI / 2);
    IB.ink(ctx, core, { closed: true, fill: C.ink, w: 0, smooth: false, seed: seed + 1 });
    for (let i = 0; i < 5; i++) {   // a seam out from each corner of the centre patch, and between them a patch cut by the rim
      const a = rot - Math.PI / 2 + (i * TAU) / 5, b = a + Math.PI / 5, c = [x + Math.cos(b) * r * 0.9, y + Math.sin(b) * r * 0.9];
      IB.seg(ctx, core[i][0], core[i][1], x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, { w: lw * 0.45, seed: seed + 8 + i });
      IB.ink(ctx, pent(c[0], c[1], r * 0.24, b + Math.PI), { closed: true, fill: C.ink, w: 0, smooth: false, seed: seed + 2 + i });
    }
    ctx.restore();
    IB.oval(ctx, x, y, r, r, { w: lw, seed: seed + 15, n: 16 });
  };

  /* basketball(ctx, [x, y], opts) — the mustard ball with its eight seams drawn as the reference draws a sphere: two great circles (a straight line and a circle edge-on) and two curved seams, turned by `rot`. opts: r (24 px: 0.12 m), rot, lw, seed, fill (C.mustard: the palette has no orange, and mustard is the warm colour nearest the ball). */
  IB.basketball = (ctx, [x, y], o = {}) => {
    const r = o.r || 24, rot = o.rot || 0, lw = o.lw || 2.8, seed = o.seed || 1;
    IB.oval(ctx, x, y, r, r, { fill: o.fill || C.mustard, w: lw, seed, n: 16 });
    const R = (u, v) => [x + (u * Math.cos(rot) - v * Math.sin(rot)) * r, y + (u * Math.sin(rot) + v * Math.cos(rot)) * r];
    const seam = (pts, sd) => IB.ink(ctx, pts.map(([u, v]) => R(u, v)), { w: lw * 0.7, seed: seed + sd, taper: false });
    seam([[0, -0.97], [0, 0.97]], 2);
    seam([[-0.97, 0], [0.97, 0]], 3);
    seam(IB.ellipse(-1.15, 0, 0.62, 0.86, 10, -1.05, 1.05), 4);
    seam(IB.ellipse(1.15, 0, 0.62, 0.86, 10, Math.PI - 1.05, Math.PI + 1.05), 5);
  };

  /* ballTrail(ctx, p, v, opts) — the speed lines behind a fast ball: three strokes trailing opposite its velocity v (px/s), longer the faster it goes, none below 600 px/s. A ball drawn on twos moves 25-70 px a drawing in a shot; the lines say which way it went. opts: r (the ball's radius), seed. */
  IB.ballTrail = (ctx, [x, y], [vx, vy], o = {}) => {
    const sp = Math.hypot(vx, vy), r = o.r || 22, seed = o.seed || 1;
    if (sp < 600) return;
    const ux = -vx / sp, uy = -vy / sp, L = Math.min(6 * r, 0.06 * sp);
    [-0.55, 0, 0.55].forEach((k, i) => {
      const ox = -uy * k * r, oy = ux * k * r, a = 1.3 * r + (i === 1 ? 0 : 0.3 * r), l = L * (i === 1 ? 1 : 0.7);
      IB.seg(ctx, x + ox + ux * a, y + oy + uy * a, x + ox + ux * (a + l), y + oy + uy * (a + l), { w: 2.6, seed: seed + i });
    });
  };

  /* ---------- the football goal ---------- */

  /* soccerGoal(ctx, [x, floor], opts) — a goal seen from the touchline: `x` is the goal line where it crosses the floor line the players stand on, which is the middle of the goal's mouth. The mouth runs into the picture with a little oblique depth (a metre into the screen is 0.12 m right and 0.06 m up), so the near post stands below the floor line and the far post above it; the net runs back from the line, its roof sloping down to the ground 2 m behind. 2.44 m high, 7.32 m wide.
       opts: dir (1: the net is to the right of the line, shots go right), s (scale, 1 = 200 px/m), lw, bulge: { at: [x, y], k } pushes the back net out round a point (k 1 = 0.4 m), layer: 'back' (far post, net) | 'front' (the near side's net, near post, crossbar) | both. Draw 'back', then the ball and the keeper, then 'front'.
     Returns { line, bar, back, mouth: [top, bottom] at the middle plane }. */
  IB.soccerGoal = (ctx, [x, floor], o = {}) => {
    const s = o.s || 1, d = o.dir || 1, lw = o.lw || 3.2, seed = o.seed || 400, M = 200 * s;
    const H = 2.44 * M, W = 7.32 * M, ox = 0.12 * W / 2, oy = -0.06 * W / 2, D = 1.1 * M, Dg = 2.0 * M;
    const P = (dx, up, z) => [x + d * dx + (z / (W / 2)) * ox, floor - up + (z / (W / 2)) * oy];   // dx back from the line, up from the floor, z across the mouth (-W/2 near .. W/2 far)
    const zN = -W / 2, zF = W / 2;
    const mesh = (A, B, Cc, Dd, nu, nv, push) => {   // strings across the quad A-B-C-D (A-B one edge, D-C the opposite), nu x nv cells
      const at = (u, v) => { const p = [A[0] + (B[0] - A[0]) * u + (Dd[0] - A[0]) * v + (A[0] - B[0] + Cc[0] - Dd[0]) * u * v, A[1] + (B[1] - A[1]) * u + (Dd[1] - A[1]) * v + (A[1] - B[1] + Cc[1] - Dd[1]) * u * v]; return push ? push(p) : p; };
      for (let i = 1; i < nu; i++) IB.ink(ctx, Array.from({ length: 9 }, (_, j) => at(i / nu, j / 8)), { w: lw * 0.4, color: MESH, seed: seed + 50 + i, taper: false, wob: 0.3 });
      for (let j = 1; j < nv; j++) IB.ink(ctx, Array.from({ length: 9 }, (_, i) => at(i / 8, j / nv)), { w: lw * 0.4, color: MESH, seed: seed + 80 + j, taper: false, wob: 0.3 });
    };
    const b = o.bulge, push = b && b.k ? (p) => { const r = Math.hypot(p[0] - b.at[0], p[1] - b.at[1]), f = b.k * 0.4 * M * Math.exp(-(r * r) / (2 * (0.6 * M) ** 2)); return [p[0] + d * f, p[1] + f * 0.15]; } : null;
    const post = (z, sd) => { const a = P(0, 0, z), t = P(0, H, z); IB.tube(ctx, [a, t], { w: 0.12 * M, edge: lw, fill: C.paper, seed: seed + sd }); };
    if (o.layer !== 'front') {
      post(zF, 1);
      // back net: from the roof's back edge down to the ground at Dg, across the whole width
      mesh(P(D, H * 0.82, zN), P(D, H * 0.82, zF), P(Dg, 0, zF), P(Dg, 0, zN), 9, 5, push);
      IB.ink(ctx, [P(0, H, zF), P(D, H * 0.82, zF), P(Dg, 0, zF)], { w: lw * 0.6, color: MESH, seed: seed + 3 });
      mesh(P(0, H, zN), P(0, H, zF), P(D, H * 0.82, zF), P(D, H * 0.82, zN), 9, 2, null);   // roof
    }
    if (o.layer !== 'back') {
      mesh(P(0, H, zN), P(D, H * 0.82, zN), P(Dg, 0, zN), P(0, 0, zN), 3, 4, null);   // near side panel, in front of the ball
      IB.ink(ctx, [P(0, H, zN), P(D, H * 0.82, zN), P(Dg, 0, zN)], { w: lw * 0.6, color: MESH, seed: seed + 4 });
      post(zN, 2);
      IB.tube(ctx, [P(0, H, zN), P(0, H, zF)], { w: 0.12 * M, edge: lw, fill: C.paper, seed: seed + 5 });   // crossbar
    }
    return { line: x, bar: floor - H, back: x + d * Dg, mouth: [floor - H, floor] };
  };

  /* ---------- the basketball hoop ---------- */

  /* hoop(ctx, [x, floor], opts) — a hoop seen from the sideline: `x` is the face of the backboard. The board is 1.05 m tall with its bottom 2.9 m up, seen nearly edge-on with a sliver of its face; the rim (0.45 m across) is 3.05 m up, its centre 0.375 m out from the board toward the court, drawn as a flat ellipse seen from a little below; the net hangs 0.45 m. A padded pole stands 1.2 m behind the board on an arm.
       opts: dir (-1: the hoop is on the right and faces left, the court is to the left), s, lw, net: { swish: k } (drawings since the ball went through: the net stretches and whips back over 6 drawings) | { shake: k } (a rattle on the rim: the net jiggles 4 drawings), rim: { bend } (a dunk pulls the front of the rim down, px), layer: 'back' (pole, arm, board, the rim's far half, the net's back strings) | 'front' (the rim's near half and the net's front strings) | both. Draw 'back', then the ball, then 'front'.
     Returns { rim: [cx, cy], r, board, netBottom }. */
  IB.hoop = (ctx, [x, floor], o = {}) => {
    const s = o.s || 1, d = o.dir || -1, lw = o.lw || 3.2, seed = o.seed || 600, M = 200 * s;
    const rimY = floor - 3.05 * M, R = 0.225 * M, cx = x + d * 0.375 * M, ry = 0.035 * M;
    const bend = (o.rim && o.rim.bend) || 0, n = o.net || {};
    const sw = n.swish == null ? -1 : n.swish, sh = n.shake == null ? -1 : n.shake;
    const stretch = sw >= 0 && sw < 6 ? [1.35, 1.25, 0.9, 1.08, 0.97, 1.0][sw] : 1;
    const whip = sw >= 0 && sw < 6 ? [0, 0.18, -0.22, 0.12, -0.05, 0][sw] * M : sh >= 0 && sh < 4 ? [0.05, -0.04, 0.025, 0][sh] * M : 0;
    const L = 0.45 * M * stretch, bot = [cx + whip, rimY + bend * 0.5 + L], br = R * 0.55;
    const rimPt = (a) => [cx + Math.cos(a) * R, rimY + Math.sin(a) * ry + (Math.cos(a) * -d > 0 ? Math.cos(a) * -d * bend : 0)];   // the front of the rim (away from the board) bends down with `bend`
    const netPt = (a) => [bot[0] + Math.cos(a) * br, bot[1] + Math.sin(a) * ry * 0.6];
    const strings = (front) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2, isFront = Math.sin(a) > 0;
        if (isFront !== front) continue;
        const a2 = a + TAU / 8, m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        IB.ink(ctx, [rimPt(a), m(rimPt(a), netPt(a2)), netPt(a2)], { w: lw * 0.45, color: front ? C.ink : MESH, seed: seed + 20 + i, taper: false });
        IB.ink(ctx, [rimPt(a2), m(rimPt(a2), netPt(a)), netPt(a)], { w: lw * 0.45, color: front ? C.ink : MESH, seed: seed + 30 + i, taper: false });
      }
      if (front) IB.ink(ctx, IB.ellipse(bot[0], bot[1], br, ry * 0.6, 12, 0, Math.PI), { w: lw * 0.45, seed: seed + 40, taper: false });
    };
    if (o.layer !== 'front') {
      const pole = x - d * 1.2 * M;
      IB.tube(ctx, [[pole, floor], [pole, floor - 3.5 * M]], { w: 0.14 * M, edge: lw, fill: C.paper, seed: seed + 1 });
      IB.ink(ctx, [[pole - 0.13 * M, floor], [pole - 0.13 * M, floor - 1.2 * M], [pole + 0.13 * M, floor - 1.2 * M], [pole + 0.13 * M, floor]], { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 2 });   // the padding round its foot
      IB.tube(ctx, [[pole, floor - 3.4 * M], [x - d * 0.12 * M, floor - 3.4 * M], [x - d * 0.04 * M, floor - 3.2 * M]], { w: 0.09 * M, edge: lw, fill: C.paper, seed: seed + 3 });
      const top = floor - 3.95 * M, low = floor - 2.9 * M, t = 0.05 * M, f = 0.11 * M;   // the board: its edge and a sliver of its face (1.8 m wide seen nearly side-on)
      IB.ink(ctx, [[x, top], [x - d * t, top], [x - d * t, low], [x, low]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + 4 });
      IB.ink(ctx, [[x, top], [x + d * f, top - 0.08 * M], [x + d * f, low - 0.08 * M], [x, low]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + 5 });
      IB.ink(ctx, [[x + d * f * 0.35, low - 0.12 * M], [x + d * f * 0.35, low - 0.5 * M], [x + d * f * 0.75, low - 0.53 * M], [x + d * f * 0.75, low - 0.15 * M]], { closed: true, smooth: false, w: lw * 0.7, seed: seed + 6 });   // the shooter's square, foreshortened
      IB.seg(ctx, x, rimY + 0.02 * M, cx - d * R, rimY, { w: lw * 1.3, seed: seed + 7 });   // the bracket
      IB.ink(ctx, IB.ellipse(cx, rimY, R, ry, 14, Math.PI, TAU).map((p, i, a) => rimPt(Math.PI + (i / (a.length - 1)) * Math.PI)), { w: lw * 1.2, color: C.ink, seed: seed + 8, taper: false });
      strings(false);
    }
    if (o.layer !== 'back') {
      strings(true);
      IB.ink(ctx, Array.from({ length: 15 }, (_, i) => rimPt((i / 14) * Math.PI)), { w: lw * 1.4, seed: seed + 9, taper: false });
    }
    return { rim: [cx, rimY], r: R, board: x, netBottom: bot };
  };

  /* ---------- the crowd and the scoreboard ---------- */

  /* stands(ctx, [x0, x1], top, opts) — the crowd behind the pitch or the court: `rows` tiers of seated fans (a head and a pair of shoulders each), the far rows smaller and greyer, a rail in front of each tier. Most fans are grey; `colors` (the two teams' colours) dress one in `share` of them. cheer: 0 seated still, 1 | 2 the two drawings of a cheer (alternate them on twos: a scattered half of the crowd throws its arms up on each), 'up' everyone standing with arms up (a goal). opts: rows (3), gap (46 px between fans), rh (row height 64 px), s, seed, faint (grey lines and paler fills: a crowd that sits behind something drawn in ink, like a hoop, and must not compete with it). */
  IB.stands = (ctx, [x0, x1], top, o = {}) => {
    const s = o.s || 1, rows = o.rows || 3, gap = (o.gap || 46) * s, rh = (o.rh || 64) * s, seed = o.seed || 700, cols = o.colors || [], share = o.share == null ? 0.3 : o.share, ch = o.cheer || 0;
    const line = o.faint ? '#b4b4b4' : C.ink, greys = o.faint ? ['#ececec', '#e4e4e4', '#efefef'] : ['#dedede', '#cfcfcf', '#e6e6e6'];
    for (let row = 0; row < rows; row++) {
      const k = 0.78 + 0.22 * (row / Math.max(1, rows - 1)), y = top + row * rh, r = MG.rng(seed + row * 37), lw = 1.6 + row * 0.35;
      IB.ink(ctx, [[x0, y + rh * 0.55], [x1, y + rh * 0.55]], { w: lw, color: line, seed: seed + 3 + row, taper: false });
      for (let x = x0 + (row % 2) * gap * 0.5; x < x1; x += gap * (0.9 + 0.2 * r())) {
        const pick = r(), color = pick < share && cols.length ? cols[Math.floor(r() * cols.length)] : greys[Math.floor(r() * 3)], skin = C.skin[Math.floor(r() * 5)], odd = r() < 0.5;
        const up = ch === 'up' || (ch === 1 && odd) || (ch === 2 && !odd), lift = up && ch === 'up' ? 0.25 * rh : 0, hr = 9 * s * k, by = y + rh * 0.5 - lift;
        if (up) [-1, 1].forEach((sd) => IB.seg(ctx, x + sd * 8 * s * k, by - 10 * s * k, x + sd * 13 * s * k, by - 40 * s * k, { w: lw * 1.6, color: line, seed: seed + row + sd }));
        IB.ink(ctx, [[x - 15 * s * k, by + 4], [x - 13 * s * k, by - 12 * s * k], [x + 13 * s * k, by - 12 * s * k], [x + 15 * s * k, by + 4]], { closed: true, smooth: false, fill: color, w: lw, color: line, seed: seed + row * 7 + Math.round(x) });
        IB.oval(ctx, x, by - 12 * s * k - hr, hr, hr, { fill: skin, w: lw, color: line, seed: seed + Math.round(x) + row, n: 9 });
      }
    }
  };

  /* adBoards(ctx, [x0, x1], floor, opts) — the low hoarding round a pitch, between the play and the stands: a row of blank panels (no brands: the reference's rule for real logos and copy) alternating white and pale grey, `ht` px tall (60), standing on a line `back` px behind the floor line (the far touchline). opts: ht, w (panel width 240), back (150), seed. */
  IB.adBoards = (ctx, [x0, x1], floor, o = {}) => {
    const ht = o.ht || 60, w = o.w || 240, y = floor - (o.back == null ? 150 : o.back), lw = o.lw || 2.6, seed = o.seed || 750;
    for (let x = x0, i = 0; x < x1; x += w, i++) IB.ink(ctx, [[x, y - ht], [x + w, y - ht], [x + w, y], [x, y]], { closed: true, smooth: false, fill: i % 2 ? '#e2e2e2' : C.paper, w: lw, seed: seed + i });
    return y - ht;
  };

  /* cornerFlag(ctx, [x, floor], opts) — the corner post (1.5 m) and its flag, which flaps in two drawings: pass `wave` 0 | 1 and alternate it on twos while there is wind, hold it for a still shot. opts: s, fill (the flag, C.yellow), wave, seed. */
  IB.cornerFlag = (ctx, [x, floor], o = {}) => {
    const s = o.s || 1, M = 200 * s, top = floor - 1.5 * M, lw = o.lw || 3, w = o.wave ? 1 : 0, seed = o.seed || 780;
    IB.tube(ctx, [[x, floor], [x, top]], { w: 0.035 * M, edge: lw * 0.8, fill: C.paper, seed });
    const fw = 0.4 * M, fh = 0.3 * M, pts = w ? [[x, top], [x + fw * 0.5, top + fh * 0.12], [x + fw, top - fh * 0.05], [x + fw * 0.95, top + fh * 0.9], [x + fw * 0.5, top + fh * 1.05], [x, top + fh]] : [[x, top], [x + fw * 0.45, top - fh * 0.1], [x + fw, top + fh * 0.08], [x + fw * 0.98, top + fh * 1.02], [x + fw * 0.45, top + fh * 0.88], [x, top + fh]];
    IB.ink(ctx, pts, { closed: true, fill: o.fill || C.yellow, w: lw * 0.8, seed: seed + 1 + w });
  };

  /* penaltySpot(ctx, [x, floor], opts) — the penalty mark on the grass: a small white disc seen almost edge-on (9 x 3 px at 140 px a metre). opts: s, seed. */
  IB.penaltySpot = (ctx, [x, floor], o = {}) => { const s = o.s || 1; IB.oval(ctx, x, floor + 2, 9 * s, 3 * s, { fill: C.paper, w: 1.5, n: 8, seed: o.seed || 3 }); };

  /* gameClock(ctx, [cx, cy], text, opts) — the small game clock hung over a backboard, as arenas have one there: a charcoal box 124 x 52 with the time in segment digits (yellow, white once it has run out: opts.out), and its hanger down to `hangTo` (a point on the board's top). */
  IB.gameClock = (ctx, [cx, cy], text, o = {}) => {
    IB.ink(ctx, [[cx - 62, cy - 26], [cx + 62, cy - 26], [cx + 62, cy + 26], [cx - 62, cy + 26]], { closed: true, smooth: false, fill: C.charcoal, w: 2.8, seed: 850 });
    if (o.hangTo) IB.seg(ctx, cx, cy + 26, o.hangTo[0], o.hangTo[1], { w: 2.6, seed: 851 });
    IB.segDigits(ctx, [cx - 50, cy - 15], text, { size: 30, color: o.out ? C.paper : C.yellow, seed: 852 });
  };

  /* pitchside(ctx, [x0, x1], floor, opts) — the backdrop of a football shot in one call: the crowd (IB.stands, top at floor - 470), the hoarding (IB.adBoards, 160 px back) and the green chalk smear of the grass along the floor line. opts: cheer, colors (the two teams), seed. */
  IB.pitchside = (ctx, [x0, x1], floor, o = {}) => {
    IB.stands(ctx, [x0, x1], floor - 470, { colors: o.colors || [C.navy, C.yellow], share: 0.35, cheer: o.cheer || 0, s: 0.9, seed: o.seed || 710 });
    IB.adBoards(ctx, [x0 - 40, x1 + 40], floor, { back: 160, ht: 56 });
    IB.smear(ctx, (x0 + x1) / 2, floor - 6, x1 - x0 + 200, { h: 16, color: C.green, seed: 9 });
  };

  /* courtside(ctx, [x0, x1], floor, opts) — the backdrop of a basketball shot in one call: the arena crowd (IB.stands, four faint rows from floor - 600, so the hoop's ink reads over them), a padded courtside wall 110 px behind the floor line, and the wooden floor as a mustard chalk smear. opts: cheer, colors, seed. */
  IB.courtside = (ctx, [x0, x1], floor, o = {}) => {
    IB.stands(ctx, [x0, x1], floor - 600, { rows: 4, colors: o.colors || [C.yellow, C.lavender], share: 0.3, cheer: o.cheer || 0, s: 0.85, seed: o.seed || 720, faint: true });
    IB.ink(ctx, [[x0 - 40, floor - 150], [x1 + 40, floor - 150], [x1 + 40, floor - 110], [x0 - 40, floor - 110]], { closed: true, smooth: false, fill: C.charcoal, w: 2.6, seed: 760 });
    IB.smear(ctx, (x0 + x1) / 2, floor - 6, x1 - x0 + 200, { h: 16, color: C.mustard, seed: 11 });
  };

  /* camera(keys, f) — the crop window [x, y, w] (for IB.crop) at frame f, from [frame, [x, y, w]] keys: held before the first and after the last, eased with a smoothstep between two keys. Call it with the frame of the drawing (on twos) so the camera moves on twos with the players. */
  IB.camera = (keys, f) => {
    let i = 0; while (i < keys.length - 1 && f >= keys[i + 1][0]) i++;
    if (i === keys.length - 1 || f <= keys[0][0]) return keys[f <= keys[0][0] ? 0 : i][1];
    const [f0, a] = keys[i], [f1, b] = keys[i + 1], u = (f - f0) / (f1 - f0), k = u * u * (3 - 2 * u);
    return a.map((v, j) => v + (b[j] - v) * k);
  };

  /* segDigits(ctx, [x, y], text, opts) — numbers drawn as seven-segment strokes in ink (a scoreboard is a drawn object here, not typeset copy): digits, ':' and '.'; [x, y] is the top left, each digit `size` px tall and 0.55 of that wide. Returns the width drawn. opts: size (40), color, lw, seed. */
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  IB.segDigits = (ctx, [x, y], text, o = {}) => {
    const h = o.size || 40, w = h * 0.55, lw = o.lw || Math.max(2.5, h * 0.11), color = o.color || C.ink, seed = o.seed || 1;
    let cx = x;
    String(text).split('').forEach((c, i) => {
      if (c === ':' || c === '.') { const dots = c === ':' ? [0.3, 0.7] : [0.95]; dots.forEach((v) => IB.oval(ctx, cx + lw, y + v * h, lw * 0.6, lw * 0.6, { fill: color, w: 0, n: 6 })); cx += lw * 3; return; }
      const on = SEG[c] || '', P = { a: [[0, 0], [1, 0]], b: [[1, 0], [1, 0.5]], c: [[1, 0.5], [1, 1]], d: [[0, 1], [1, 1]], e: [[0, 0.5], [0, 1]], f: [[0, 0], [0, 0.5]], g: [[0, 0.5], [1, 0.5]] };
      on.split('').forEach((sgm, j) => { const [[u0, v0], [u1, v1]] = P[sgm], pad = 0.12; IB.seg(ctx, cx + (u0 + (u1 - u0) * pad) * w, y + (v0 + (v1 - v0) * pad) * h, cx + (u1 - (u1 - u0) * pad) * w, y + (v1 - (v1 - v0) * pad) * h, { w: lw, color, seed: seed + i * 7 + j }); });
      cx += w + h * 0.22;
    });
    return cx - x;
  };

  /* scoreboard(ctx, [cx, top], { home, away, clock }, opts) — a hanging board: a charcoal panel with the two scores either side of the game clock in paper-white segment digits, each score under a band of its team's colour. opts: colors ([home, away]), w (440), s. Returns its rect. */
  IB.scoreboard = (ctx, [cx, top], st = {}, o = {}) => {
    const s = o.s || 1, w = (o.w || 440) * s, h = 130 * s, x = cx - w / 2, lw = o.lw || 3, cols = o.colors || [C.sky, C.yellow];
    IB.seg(ctx, cx - w * 0.3, top - 60 * s, cx - w * 0.3, top, { w: lw * 0.8, seed: 801 }); IB.seg(ctx, cx + w * 0.3, top - 60 * s, cx + w * 0.3, top, { w: lw * 0.8, seed: 802 });
    IB.ink(ctx, [[x, top], [x + w, top], [x + w, top + h], [x, top + h]], { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: 803 });
    [0, 1].forEach((i) => IB.ink(ctx, [[x + (i ? w * 0.72 : w * 0.06), top + 14 * s], [x + (i ? w * 0.94 : w * 0.28), top + 14 * s], [x + (i ? w * 0.94 : w * 0.28), top + 26 * s], [x + (i ? w * 0.72 : w * 0.06), top + 26 * s]], { closed: true, smooth: false, fill: cols[i], w: 0, seed: 804 + i }));
    const dg = 56 * s, num = (v, xc) => { const t = String(v == null ? 0 : v); IB.segDigits(ctx, [xc - (t.length * dg * 0.77 - dg * 0.22) / 2, top + 42 * s], t, { size: dg, color: C.paper, seed: 810 + xc }); };
    num(st.home, x + w * 0.15); num(st.away, x + w * 0.85);
    if (st.clock != null) { const t = String(st.clock), cw = t.replace(/[:.]/g, '').length * 34 * s * 0.77 + (t.match(/[:.]/g) || []).length * 10 * s; IB.segDigits(ctx, [cx - cw / 2, top + 52 * s], t, { size: 34 * s, color: st.clockColor || C.yellow, seed: 830 }); }
    return [x, top, w, h];
  };
})(window);
