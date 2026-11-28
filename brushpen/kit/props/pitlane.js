/* props/pitlane.js — the pit lane of a motor race, for the racing scenes beside props/racing.js. Needs ink.js, solid.js and figure.js.
   The pit lane is drawn in the same metre space as IB.racer (pass the same view: at, yaw, pitch, look, f, s), so the car, its loose tyres and the box markings line up: the lane with its garages and pit wall (IB.pitLane), a wheel taken off or carried (IB.tyre). The crew are the figure rig in team overalls under full-face helmets (IB.crewLook, IB.crewman), with their tools in stage px: the wheel gun (IB.wheelGun), the jacks (IB.pitJack) and the release light over the box (IB.releaseLight).
   No real team, sponsor, maker or series mark: teams are a palette colour and a number (IB.TEAMS). Red is not used: it belongs to the start lights and the rain light. */
(function (window) {
  const IB = window.IB, C = IB.C, MG = window.MG;
  const DARK = '#2a2a2a', TYRE = '#262626', GREY = '#8a8a8a', PI2 = Math.PI * 2;

  /* TEAMS — the four teams of the racing scenes: number -> { color (cars, overalls, suits), accent (stripes, helmets, caps) }. */
  IB.TEAMS = {
    7: { color: C.navy, accent: C.yellow },
    16: { color: C.yellow, accent: C.navy },
    3: { color: C.mint, accent: C.navy },
    22: { color: C.lavender, accent: C.navy },
  };
  const SKINS = [4, 1, 2, 3, 0];

  /* crewLook(num, i, more) — a look for IB.crewman: crew member i of team `num` in one-piece overalls of the team colour (top and trousers the same, long sleeves), dark gloves and boots, and a full-face helmet in the accent colour with a stripe of the team colour (the head is drawn bald under it). `more` (h, dir, seed ...) is laid over it. */
  IB.crewLook = (num, i = 0, more = {}) => {
    const t = IB.TEAMS[num] || IB.TEAMS[7];
    return { skin: C.skin[SKINS[i % 5]], top: t.color, topKind: 'long', bottom: t.color, shoe: DARK, gloves: C.charcoal, hair: 'bald', helmet: t.accent, stripe: t.color, seed: 3000 + i * 40, ...more };
  };

  /* ---------- the crew ---------- */

  // a full-face helmet in head units (the profile's radius is 21, facing +x, as figure.js draws the head)
  const SHELL = [[-4, -30], [12, -27], [24, -16], [30, 0], [28, 17], [17, 26], [0, 28], [-16, 24], [-27, 10], [-29, -8], [-20, -24]];
  const VISOR = [[7, -16], [25, -13], [31, 0], [27, 7], [7, 5]];
  const helmetOn = (ctx, j, pose, look) => {
    const h = look.h, d = look.dir || 1, s = (IB.FIG.head * h * (look.headK || 1)) / 21, prev = pose.prev;
    const ang = (pose.lean || 0) * 0.5 + (pose.nod || 0) + (prev ? ((prev.lean || 0) - (pose.lean || 0)) * 0.5 + ((prev.nod || 0) - (pose.nod || 0)) * 0.5 : 0);   // the head's tilt, as IB.figure turns it
    const w = (look.lw || IB.figLine(h)) / s, seed = (look.seed || 1) + 90;
    ctx.save(); ctx.translate(j.headAt[0], j.headAt[1]); ctx.rotate(ang * d); ctx.scale(s * d, s);
    IB.ink(ctx, SHELL, { closed: true, fill: look.helmet || C.paper, w, seed });
    IB.ink(ctx, [[-25, -13], [-8, -27], [12, -24]], { w: 5, color: look.stripe || C.navy, seed: seed + 1, taper: false });
    IB.ink(ctx, VISOR, { closed: true, smooth: false, fill: DARK, w: w * 0.8, seed: seed + 2 });
    ctx.restore();
  };

  // the wheel gun's outline, in px at s 1, pointing +x with the socket's face at the origin; grips: the front handle and the pistol grip
  const GUN = { socket: [[-34, -11], [0, -11], [0, 11], [-34, 11]], body: [[-150, -21], [-34, -17], [-34, 17], [-150, 21]], band: [[-112, -20], [-98, -20], [-98, 20], [-112, 20]], front: [[-74, 15], [-58, 15], [-54, 52], [-70, 54]], pistol: [[-134, 18], [-114, 18], [-106, 70], [-126, 72]], grips: [[-63, 40], [-118, 52]] };
  const gunAt = (tip, ang, s) => { const c = Math.cos(ang), sn = Math.sin(ang), fl = c < 0 ? -1 : 1; return ([x, y]) => [tip[0] + (x * c - y * fl * sn) * s, tip[1] + (x * sn + y * fl * c) * s]; };   // the grips hang below the gun whichever way it points

  /* wheelGun(ctx, tip, ang, opts) — the pneumatic wheel gun of a pit stop, in stage px: the socket's face at `tip`, the body pointing along ang (rad, the way the socket faces: into the hub), the front handle and the pistol grip always hanging below it, the air hose falling away behind. s scales it (180 px long at 1: 0.45 m is s 0.4 at 160 px a metre). spin: a number (the frame, on ones: a gun is a machine) while it runs, which draws the socket's spin marks turning; band: the team colour on the body. hands: a glove colour to draw two fists on the grips with their sleeves (`sleeve`, a colour) running off toward `from` (a stage point off the frame): the insert at the wheel, where the crewman himself is out of the shot. Returns { grips: [front, pistol] } in stage px for the hands of the crewman who holds it (IB.crewman does this itself). */
  IB.wheelGun = (ctx, tip, ang, o = {}) => {
    const s = o.s || 1, lw = o.lw || 2.6 * Math.max(1, s * 0.9), seed = o.seed || 3100, P = gunAt(tip, ang, s);
    const rear = P([-150, 0]), back = [Math.cos(ang + Math.PI), Math.sin(ang + Math.PI)];
    IB.ink(ctx, [rear, [rear[0] + back[0] * 60 * s, rear[1] + back[1] * 60 * s + 10 * s], [rear[0] + back[0] * 110 * s, rear[1] + 90 * s], [rear[0] + back[0] * 130 * s, rear[1] + 260 * s]], { w: 9 * s, color: DARK, seed: seed + 1, taper: false });   // the air hose
    IB.ink(ctx, GUN.pistol.map(P), { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 2 });
    IB.ink(ctx, GUN.front.map(P), { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 3 });
    IB.ink(ctx, GUN.body.map(P), { closed: true, smooth: false, fill: '#c9c9c9', w: lw, seed: seed + 4 });
    IB.ink(ctx, GUN.band.map(P), { closed: true, smooth: false, fill: o.band || C.navy, w: lw * 0.6, seed: seed + 5 });
    IB.ink(ctx, GUN.socket.map(P), { closed: true, smooth: false, fill: DARK, w: lw, seed: seed + 6 });
    if (o.spin != null) {   // spin marks round the socket: three short arcs, turned a step every frame
      for (let i = 0; i < 3; i++) {
        const a0 = o.spin * 1.3 + (i * PI2) / 3, arc = Array.from({ length: 6 }, (_, k) => { const a = a0 + k * 0.18; return P([-14 + Math.cos(a) * 8, Math.sin(a) * 30]); });
        IB.ink(ctx, arc, { w: lw * 0.8, seed: seed + 10 + i + o.spin * 3 });
      }
    }
    const grips = GUN.grips.map(P);
    if (o.hands) {   // two gloved fists round the grips, their forearms running down and back out of the frame toward `from`
      const from = o.from || [tip[0] - Math.cos(ang) * 500 * s, tip[1] + 600 * s];
      grips.forEach((g, i) => {
        const fx = from[0] + (i ? -70 : 70) * s, fy = from[1], ux = g[0] - fx, uy = g[1] - fy, L = Math.hypot(ux, uy) || 1, cuff = [g[0] - (ux / L) * 34 * s, g[1] - (uy / L) * 34 * s];
        IB.tube(ctx, [[fx, fy], cuff], { w: 50 * s, edge: lw, fill: o.sleeve || C.navy, seed: seed + 20 + i });
        IB.ink(ctx, [[g[0] - 26 * s, g[1] - 22 * s], [g[0] + 22 * s, g[1] - 26 * s], [g[0] + 30 * s, g[1] + 6 * s], [g[0] + 20 * s, g[1] + 30 * s], [g[0] - 24 * s, g[1] + 28 * s], [g[0] - 32 * s, g[1] + 2 * s]], { closed: true, fill: o.hands, w: lw, seed: seed + 24 + i });   // the fist round the grip
        [-10, 4, 18].forEach((dy, m) => IB.ink(ctx, [[g[0] + 6 * s, g[1] + dy * s], [g[0] + 26 * s, g[1] + (dy + 2) * s]], { w: lw * 0.6, color: '#8a8a8a', seed: seed + 26 + i * 3 + m }));   // the fingers' joins
      });
    }
    return { grips };
  };

  /* crewman(ctx, pose, look, opts) — one of the pit crew: IB.figure in IB.crewLook's overalls with the full-face helmet over its head, drawn in two passes so a thing it holds sits between its arms. opts.gun = { tip, ang, spin, s, band }: it holds a wheel gun (IB.wheelGun) and its hands go to the gun's grips, whatever the pose says; opts.held = (ctx) => {...}: anything else it holds (a tyre, a jack's handle), drawn between the far arm and the near one. Returns IB.figure's joints. */
  IB.crewman = (ctx, pose, look, o = {}) => {
    let p = pose;
    if (o.gun) { const g = o.gun, P = gunAt(g.tip, g.ang, g.s || 0.4); p = { ...pose, hands: [P(GUN.grips[0]), P(GUN.grips[1])], hand: ['grip', 'grip'] }; }
    const j = IB.figure(ctx, p, look, 'far');
    helmetOn(ctx, j, p, look);
    if (o.gun) IB.wheelGun(ctx, o.gun.tip, o.gun.ang, { s: o.gun.s || 0.4, spin: o.gun.spin, band: o.gun.band || look.helmet, lw: look.lw || IB.figLine(look.h) * 0.9, seed: (look.seed || 1) + 300 });
    if (o.held) o.held(ctx);
    IB.figure(ctx, p, look, 'near');
    return j;
  };

  /* kneelPose(x, floor, look, opts) — a crewman down on his far knee at the wheel, ready: the far shin flat on the floor behind with the toes dug in, the near foot planted forward, the spine leaning `lean` (0.35) toward the wheel, hands in front at `hands` (stage points; by default held forward at the hip's height). A pose for IB.crewman; move `hip` (opts.dx, dy px) for the drawings that rock with the work. */
  IB.kneelPose = (x, floor, look, o = {}) => {
    const h = look.h, d = look.dir || 1, hx = x + (o.dx || 0), hy = floor - 0.29 * h + (o.dy || 0);
    return {
      hip: [hx, hy], lean: o.lean == null ? 0.35 : o.lean, nod: o.nod || 0,
      feet: [[x - d * 0.27 * h, floor - 0.04 * h, 1.35], [x + d * 0.22 * h, floor - IB.FIG.ankle * h, 0]],
      hands: o.hands || [[hx + d * 0.26 * h, hy - 0.04 * h], [hx + d * 0.22 * h, hy - 0.02 * h]], hand: o.hand || ['grip', 'grip'],
    };
  };

  /* tyre(ctx, view, [x, y, z], opts) — a racing wheel off the car (taken off, carried, put on), in the metre space of IB.racer's view (pass the same at, yaw, pitch, look, f, s): its centre at [x, y, z] (y -0.36 when it stands on the ground), its axle along z like a mounted wheel. side: which face is the outer one with the sidewall band and rim (-1: toward -z, the near side in a side view); width (0.38 front, 0.42 rear); band: the sidewall's colour (the compound); spin (rad); lw, seed. Returns { at: stage point of the outer face's centre, r: its radius in px } for the hands that hold it, or null when it is too near the lens to draw. */
  IB.tyre = (ctx, v, [x, y, z], o = {}) => {
    const U = 140 * (v.s || 1), sp = IB.space({ at: v.at || [960, 800], yaw: v.yaw || 0, pitch: v.pitch || 0, roll: v.roll || 0, f: v.f || 1500, look: v.look == null ? 0.18 : v.look });
    const map = ([a, b, c]) => sp([a * U, b * U, c * U]), R = 0.36, sd = o.side || -1, ww = o.width || 0.4, lw = o.lw || 2.6, seed = o.seed || 3200;
    const ring = (zz, r, n = 16, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + (i / n) * PI2; return map([x + Math.cos(a) * r, y + Math.sin(a) * r, zz]); });
    const zo = z + (ww / 2) * sd, outer = ring(zo, R), inner = ring(z - (ww / 2) * sd, R), f = v.f || 1500;
    if (![...outer, ...inner].every((p) => p[2] > -f * 0.85)) return null;   // too near the lens (or behind it): not drawn, as IB.racer drops such faces
    const parts = [];
    for (let i = 0; i < 16; i++) { const j = (i + 1) % 16; parts.push({ q: [outer[i], outer[j], inner[j], inner[i]], quad: true }); }
    parts.push({ q: inner }, { q: outer, deco: true });
    parts.map((p) => ({ ...p, z: p.q.reduce((a, b) => a + b[2], 0) / p.q.length - (p.deco ? 0.001 : 0) })).sort((a, b) => b.z - a.z).forEach((p, k) => {
      IB.ink(ctx, p.q, { closed: true, smooth: !p.quad, fill: TYRE, w: p.quad ? 0 : lw, seed: seed + k });
      if (!p.deco) return;
      const zz = zo + 0.002 * sd;
      IB.ink(ctx, ring(zz, R * 0.8), { closed: true, fill: null, w: lw * 1.3, color: o.band || C.yellow, seed: seed + 40 });
      IB.ink(ctx, ring(zz, R * 0.55), { closed: true, fill: '#6b6b6b', w: lw * 0.8, seed: seed + 41 });
      for (let i = 0; i < 5; i++) { const a = (o.spin || 0) + (i * PI2) / 5, p0 = map([x, y, zz]), p1 = map([x + Math.cos(a) * R * 0.52, y + Math.sin(a) * R * 0.52, zz]); IB.seg(ctx, p0[0], p0[1], p1[0], p1[1], { w: lw * 0.7, wob: 0, seed: seed + 50 + i }); }
    });
    const c = map([x, y, zo]), e = map([x + R, y, zo]);
    return { at: c, r: Math.hypot(e[0] - c[0], e[1] - c[1]) };
  };

  /* pitJack(ctx, base, grip, opts) — a pit stop jack in stage px: the floor point `base` under its cradle, the cradle `h` px above it (raise h as the jack man pulls the lever down: the car's lift), and its long handle running from the foot of the post to `grip`, where the jack man's hands are. Two small wheels at the foot. color: the frame (the team's accent); s scales it (cradle 80 px wide at 1); lw, seed. Draw it before the car (the cradle is under the nose or the tail) and the jack man after. */
  IB.pitJack = (ctx, [x, y], grip, o = {}) => {
    const s = o.s || 1, h = o.h == null ? 30 * s : o.h, lw = o.lw || 2.6, seed = o.seed || 3300, col = o.color || C.yellow;
    const dx = grip[0] - x, dy = grip[1] - y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, foot = [x + ux * 26 * s, y - 14 * s];
    IB.tube(ctx, [foot, grip], { w: 12 * s, edge: lw, fill: col, seed });   // the handle
    IB.ink(ctx, [[x - 9 * s, y - 10 * s], [x + 9 * s, y - 10 * s], [x + 9 * s, y - h], [x - 9 * s, y - h]], { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 1 });   // the post
    IB.ink(ctx, [[x - 40 * s, y - h - 12 * s], [x + 40 * s, y - h - 12 * s], [x + 34 * s, y - h + 2 * s], [x - 34 * s, y - h + 2 * s]], { closed: true, smooth: false, fill: col, w: lw, seed: seed + 2 });   // the cradle
    IB.ink(ctx, [[x - 26 * s, y - 16 * s], [foot[0] + 10 * s, foot[1] - 4 * s], [foot[0] + 10 * s, y - 4 * s], [x - 26 * s, y - 4 * s]], { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 3 });   // the base
    [x - 18 * s, foot[0] + 4 * s].forEach((wx, i) => IB.oval(ctx, wx, y - 6 * s, 9 * s, 9 * s, { fill: DARK, w: lw * 0.8, n: 10, seed: seed + 4 + i }));
  };

  /* releaseLight(ctx, [x, y], opts) — the light that sends the car out of its box, hanging over it on an arm from the gantry above: a dark box with two lamps, `state` 'hold' (the left lamp amber: wait), 'go' (the right lamp green) or 'off'. [x, y] is the box's centre; s scales it (box 170 x 76 at 1); lw, seed. */
  IB.releaseLight = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, lw = o.lw || 2.6, seed = o.seed || 3350, st = o.state || 'off';
    IB.ink(ctx, [[x, y - 38 * s], [x, y - 420 * s]], { w: 10 * s, color: C.charcoal, seed, taper: false });
    IB.ink(ctx, [[x - 85 * s, y - 38 * s], [x + 85 * s, y - 38 * s], [x + 85 * s, y + 38 * s], [x - 85 * s, y + 38 * s]], { closed: true, smooth: false, fill: DARK, w: lw, seed: seed + 1 });
    IB.oval(ctx, x - 40 * s, y, 26 * s, 26 * s, { fill: st === 'hold' ? C.mustard : '#4a4a4a', w: lw * 0.8, n: 12, seed: seed + 2 });
    IB.oval(ctx, x + 40 * s, y, 26 * s, 26 * s, { fill: st === 'go' ? C.green : '#4a4a4a', w: lw * 0.8, n: 12, seed: seed + 3 });
  };

  /* ---------- the lane ---------- */

  /* pitLane(ctx, view, opts) — the pit lane in IB.racer's metre space (pass the same view: at, yaw, pitch, look, f, s): x runs down the lane from `from` to `to`; the working lane where the cars stop is z -2.2 .. 2.2, its edge a white line at z -2.6 with the fast lane beyond it to the low pit wall at z -7; the garages stand at z `garage` (4.6) behind, one every 14 m, each an open door under a header band in its team's colour (teams: a list of numbers, repeated). Each garage's box is painted in front of it (yellow outline, a white bar where the front wheels stop: the car's middle stops at the box's x). box: the x of the box the scene's car uses (0); wall: false drops the pit wall; run: metres the camera has gone down the lane, so the lane slides back by it (a tracking shot). lw, seed. */
  IB.pitLane = (ctx, v, o = {}) => {
    const U = 140 * (v.s || 1), f = v.f || 1500, seed = o.seed || 3500, lw = o.lw || 2.4, run = o.run || 0, G = o.garage || 4.6;
    const sp = IB.space({ at: v.at || [960, 800], yaw: v.yaw || 0, pitch: v.pitch || 0, roll: v.roll || 0, f, look: v.look == null ? 0.18 : v.look });
    const map = ([x, y, z]) => sp([(x - run) * U, y * U, z * U]), ok = (p) => p[2] > -f * 0.8;
    const from = (o.from == null ? -40 : o.from) + run, to = (o.to == null ? 40 : o.to) + run, box = o.box || 0, teams = o.teams || [22, 7, 16, 3];
    const poly = (pts, opts) => { const q = pts.map(map); if (q.every(ok)) IB.ink(ctx, q, { smooth: false, ...opts }); };
    const line = (pts, opts) => { let seg = []; pts.map(map).forEach((p) => { if (ok(p)) seg.push(p); else { if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); seg = []; } }); if (seg.length > 1) IB.ink(ctx, seg, { ...opts, taper: false }); };
    const xs = (a, b, step) => { const out = []; for (let x = a; x <= b + 1e-9; x += step) out.push(x); return out; };
    const k0 = Math.floor((from - box + 7) / 14), k1 = Math.ceil((to - box + 7) / 14);
    // the garages, far to near along the lane as the view sees them: whichever end is further is drawn first
    const ks = []; for (let k = k0; k <= k1; k++) ks.push(k);
    const depth = (k) => map([box + k * 14, 0, G])[2];
    ks.sort((a, b) => depth(b) - depth(a)).forEach((k) => {
      const bx = box + k * 14, x0 = Math.max(from, bx - 7), x1 = Math.min(to, bx + 7), team = IB.TEAMS[teams[((k % teams.length) + teams.length) % teams.length]] || IB.TEAMS[7];
      if (x1 <= x0) return;
      poly([[x0, 0, G], [x1, 0, G], [x1, -4.2, G], [x0, -4.2, G]], { closed: true, fill: C.paper, w: lw, seed: seed + k * 7 });   // the front wall
      const d0 = Math.max(x0, bx - 5.5), d1 = Math.min(x1, bx + 5.5);
      if (d1 > d0) {
        poly([[d0, 0, G], [d1, 0, G], [d1, -3.1, G], [d0, -3.1, G]], { closed: true, fill: '#e2e2e2', w: lw, seed: seed + k * 7 + 1 });   // the open door
        poly([[d0, -3.35, G], [d1, -3.35, G], [d1, -3.95, G], [d0, -3.95, G]], { closed: true, fill: team.color, w: lw * 0.8, seed: seed + k * 7 + 2 });   // the header band
        line([[d0 + 0.6, -0.9, G + 2.5], [d0 + 0.6, -2.0, G + 2.5]], { w: lw * 0.7, color: GREY, seed: seed + k * 7 + 3 });   // a tool rack in the garage's back
        poly([[d0 + 0.4, 0, G + 2.5], [d0 + 2.2, 0, G + 2.5], [d0 + 2.2, -1.1, G + 2.5], [d0 + 0.4, -1.1, G + 2.5]], { closed: true, fill: '#d4d4d4', w: lw * 0.7, color: GREY, seed: seed + k * 7 + 4 });
      }
      // its box on the lane: a yellow outline and the white stop bar for the front wheels
      const b0 = bx - 3.3, b1 = bx + 3.3;
      if (b0 >= from && b1 <= to) {
        poly([[b0, 0, -2.1], [b1, 0, -2.1], [b1, 0, 2.1], [b0, 0, 2.1]], { closed: true, w: lw * 1.4, color: C.mustard, seed: seed + k * 7 + 5 });
        [-1, 1].forEach((sd) => poly([[bx + 1.45, 0, 0.55 * sd], [bx + 2.05, 0, 0.55 * sd], [bx + 2.05, 0, 1.15 * sd], [bx + 1.45, 0, 1.15 * sd]], { closed: true, fill: C.paper, w: lw * 0.7, seed: seed + k * 7 + 6 + sd }));
      }
    });
    line(xs(from, to, 1).map((x) => [x, 0, G]), { w: lw, seed: seed + 900 });
    line(xs(from, to, 1).map((x) => [x, 0, -2.6]), { w: lw * 1.6, color: C.paper, seed: seed + 901 });   // the working lane's edge
    line(xs(from, to, 1).map((x) => [x, 0, -2.6]), { w: lw * 0.5, color: GREY, seed: seed + 902 });
    // the pit wall and its fence (wall: false leaves them out, for a long lens looking over the wall)
    if (o.wall !== false) for (let k = Math.floor(from / 3); k * 3 < to; k++) {
      const x0 = Math.max(from, k * 3), x1 = Math.min(to, (k + 1) * 3);
      poly([[x0, 0, -7], [x1, 0, -7], [x1, -1.0, -7], [x0, -1.0, -7]], { closed: true, fill: C.paper, w: lw * 0.8, seed: seed + 1000 + k });
      line([[x0, -1.0, -7], [x0, -3.2, -7]], { w: lw * 0.6, color: GREY, seed: seed + 1200 + k });
    }
    if (o.wall !== false) line(xs(from, to, 1).map((x) => [x, -3.2, -7]), { w: lw * 0.6, color: GREY, seed: seed + 903 });
  };
})(window);
