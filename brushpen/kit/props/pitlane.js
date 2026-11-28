/* props/pitlane.js — the pit lane and the podium of a motor race, for the racing scenes beside props/racing.js. Needs ink.js, solid.js and figure.js.
   The pit lane is drawn in the same metre space as IB.racer (pass the same view: at, yaw, pitch, look, f, s), so the car, its loose tyres and the box markings line up: the lane with its garages and pit wall (IB.pitLane), a wheel taken off or carried (IB.tyre). The crew are the figure rig in team overalls under full-face helmets (IB.crewLook, IB.crewman), with their tools in stage px: the wheel gun (IB.wheelGun), the jacks (IB.pitJack) and the release light over the box (IB.releaseLight). After the race: the podium (IB.podium), the drivers in their suits and caps (IB.driverLook), the trophy (IB.trophy), the champagne bottle and its cork (IB.bottle, IB.cork), the spray (IB.champagne) and the ticker tape coming down (IB.tickerTape).
   No real team, sponsor, maker or series mark: teams are a palette colour and a number (IB.TEAMS), bottles and boards are blank. Red is not used: it belongs to the start lights and the rain light. */
(function (window) {
  const IB = window.IB, C = IB.C, MG = window.MG;
  const DARK = '#2a2a2a', TYRE = '#262626', GREY = '#8a8a8a', CORK = C.skin[2], PI2 = Math.PI * 2;

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

  /* driverLook(num, i, more) — a look for IB.figure: the driver of team `num` out of the car, in a race suit of the team colour (one piece, long sleeves), dark boots and a team cap in the accent colour, face showing. i picks the face (skin). */
  IB.driverLook = (num, i = 0, more = {}) => {
    const t = IB.TEAMS[num] || IB.TEAMS[7];
    return { skin: C.skin[SKINS[i % 5]], top: t.color, topKind: 'long', bottom: t.color, shoe: DARK, hair: 'cap', hat: t.accent, face: { eye: 'dot', mouth: 'smile' }, seed: 3400 + i * 40, ...more };
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

  /* ---------- the podium ---------- */

  /* podium(ctx, [x, floor], opts) — the three steps after the race, seen from the front: the winner's block in the middle (h1 tall), second on the left (h2), third on the right (h3), each `w` wide with its place set in big numbers on its face and a strip of its top showing, and behind them a blank backdrop wall (no marks) with a band in `band`. s scales it (block 270 px wide; heights 150, 100, 66: 0.9, 0.6, 0.4 m at 167 px a metre); lw, seed. Returns the middle of each block's top: { 1: [x, y], 2: [x, y], 3: [x, y] }, where the drivers stand; IB.podiumTops([x, floor], opts) gives the same without drawing, for poses worked out before it is drawn. */
  const podiumSize = (x, o) => { const s = o.s || 1, W = (o.w || 270) * s; return { s, W, top: 22 * s, H: { 1: (o.h1 || 150) * s, 2: (o.h2 || 100) * s, 3: (o.h3 || 66) * s }, X: { 1: x, 2: x - W, 3: x + W } }; };
  IB.podiumTops = ([x, floor], o = {}) => { const { H, X, top } = podiumSize(x, o), out = {}; [1, 2, 3].forEach((n) => { out[n] = [X[n], floor - H[n] - top * 0.5]; }); return out; };
  IB.podium = (ctx, [x, floor], o = {}) => {
    const { s, W, top, H, X } = podiumSize(x, o), lw = o.lw || 2.8, seed = o.seed || 3600;
    if (o.backdrop !== false) {
      const bw = W * 2.05, bt = floor - 600 * s;
      IB.ink(ctx, [[x - bw, bt], [x + bw, bt], [x + bw, floor - 40 * s], [x - bw, floor - 40 * s]], { closed: true, smooth: false, fill: C.paper, w: lw, seed });
      IB.ink(ctx, [[x - bw, bt + 40 * s], [x + bw, bt + 40 * s], [x + bw, bt + 76 * s], [x - bw, bt + 76 * s]], { closed: true, smooth: false, fill: o.band || C.navy, w: lw * 0.8, seed: seed + 1 });
      for (let k = -1; k <= 1; k++) IB.ink(ctx, [[x + k * bw * 0.5, bt + 76 * s], [x + k * bw * 0.5, floor - 40 * s]], { w: lw * 0.5, color: '#c4c4c4', seed: seed + 3 + k, taper: false });   // the backdrop's panel joins
    }
    [2, 3, 1].forEach((n) => {
      const cx = X[n], y = floor - H[n];
      IB.ink(ctx, [[cx - W / 2, y], [cx + W / 2, y], [cx + W / 2, floor], [cx - W / 2, floor]], { closed: true, smooth: false, fill: n === 1 ? C.paper : '#f6f6f6', w: lw, seed: seed + 10 + n });
      IB.ink(ctx, [[cx - W / 2, y], [cx + W / 2, y], [cx + W / 2 - 14 * s, y - top], [cx - W / 2 + 14 * s, y - top]], { closed: true, smooth: false, fill: '#e2e2e2', w: lw, seed: seed + 20 + n });   // the top, seen a little from above
      ctx.save(); ctx.font = `800 ${Math.round(Math.min(H[n] * 0.7, 96 * s))}px ${IB.FONT}`; ctx.fillStyle = C.charcoal; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), cx, y + H[n] * 0.54); ctx.restore();
    });
    return IB.podiumTops([x, floor], o);
  };

  /* trophy(ctx, [x, y], opts) — the winner's cup: a dark base, a stem and a gold bowl with two handles. [x, y] is the bottom of the base; rot tips it about there (rad, + clockwise); s scales it (150 px tall at 1); lw, seed. Returns { handles: [left, right], base: [left, right] (the sides of the base, where hands hold it up overhead), top } in stage px. */
  IB.trophy = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, lw = o.lw || 2.8, seed = o.seed || 3700, r = o.rot || 0, c = Math.cos(r), sn = Math.sin(r);
    const P = ([px, py]) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s];
    [-1, 1].forEach((sd) => IB.ink(ctx, [[30 * sd, -126], [62 * sd, -124], [62 * sd, -96], [26 * sd, -82]].map(P), { w: 9 * s, seed: seed + 1 + sd, taper: false }));   // handles
    IB.ink(ctx, [[-36, 0], [36, 0], [30, -26], [-30, -26]].map(P), { closed: true, smooth: false, fill: C.charcoal, w: lw, seed: seed + 3 });
    IB.ink(ctx, [[-8, -26], [8, -26], [6, -62], [-6, -62]].map(P), { closed: true, smooth: false, fill: C.mustard, w: lw, seed: seed + 4 });
    IB.ink(ctx, [[-14, -60], [14, -60], [36, -84], [44, -118], [46, -146], [-46, -146], [-44, -118], [-36, -84]].map(P), { closed: true, fill: C.yellow, w: lw, seed: seed + 5 });
    IB.ink(ctx, [[-30, -132], [-26, -98]].map(P), { w: lw * 1.6, color: C.paper, seed: seed + 6 });   // the shine
    return { handles: [P([-62, -110]), P([62, -110])], base: [P([-34, -12]), P([34, -12])], top: P([0, -146]) };
  };

  /* bottle(ctx, mouth, ang, opts) — a magnum of champagne in stage px with no label but a blank one: dark glass, gold foil on the neck, `mouth` the end of the neck and ang (rad) the way it points (from the base to the mouth). cork: true while the cork is still in (popped corks fly as IB.cork). hand: a skin or glove colour to draw a fist round the neck with its thumb pushing the cork up (the close-up of the pop; thumb 0..1 how far it has pushed; sleeve: a colour for the forearm running out of the frame); s scales it (210 px long at 1); lw, seed. Returns { mouth, base, grips: [neck, body] } in stage px; IB.bottleGrips(mouth, ang, s) gives the same grips without drawing, for the hands of a figure drawn before it. */
  IB.bottleGrips = (mouth, ang, s = 1) => [[mouth[0] - Math.cos(ang) * 40 * s, mouth[1] - Math.sin(ang) * 40 * s], [mouth[0] - Math.cos(ang) * 165 * s, mouth[1] - Math.sin(ang) * 165 * s]];
  IB.bottle = (ctx, mouth, ang, o = {}) => {
    const s = o.s || 1, lw = o.lw || 2.8 * Math.max(1, s * 0.8), seed = o.seed || 3800, c = Math.cos(ang), sn = Math.sin(ang);
    const P = ([px, py]) => [mouth[0] + (px * c - py * sn) * s, mouth[1] + (px * sn + py * c) * s];
    IB.ink(ctx, [[0, -9], [-60, -10], [-90, -25], [-98, -27], [-204, -27], [-210, -20], [-210, 20], [-204, 27], [-98, 27], [-90, 25], [-60, 10], [0, 9]].map(P), { closed: true, fill: C.charcoal, w: lw, seed });
    IB.ink(ctx, [[2, -10], [-56, -11], [-62, -14], [-62, 14], [-56, 11], [2, 10]].map(P), { closed: true, fill: C.yellow, w: lw * 0.8, seed: seed + 1 });   // foil
    IB.ink(ctx, [[-118, -27], [-178, -27], [-178, 27], [-118, 27]].map(P), { closed: true, smooth: false, fill: C.paper, w: lw * 0.8, seed: seed + 2 });   // a blank label
    IB.ink(ctx, [[-130, 8], [-166, 8]].map(P), { w: lw * 0.6, color: GREY, seed: seed + 3 });
    IB.ink(ctx, [[-186, -18], [-112, -18]].map(P), { w: lw * 1.4, color: '#6b6b6b', seed: seed + 4 });   // the glass's shine
    if (o.cork) IB.ink(ctx, [[0, -8], [10, -9], [18, -13], [24, 0], [18, 13], [10, 9], [0, 8]].map(P), { closed: true, fill: CORK, w: lw * 0.8, seed: seed + 5 });
    if (o.hand) {
      const th = o.thumb || 0;
      if (o.sleeve) IB.tube(ctx, [[-52, 24], [-58, 150], [-90, 420]].map(P), { w: 40 * s, edge: lw, fill: o.sleeve, seed: seed + 12 });   // the forearm, out of the frame
      IB.ink(ctx, [[-72, -20], [-26, -20], [-20, -12], [-20, 26], [-30, 34], [-72, 32], [-80, 20], [-80, -12]].map(P), { closed: true, fill: o.hand, w: lw, seed: seed + 6 });   // the fingers wrapped round the neck, seen from their backs
      [-60, -48, -36].forEach((x, i) => IB.ink(ctx, [[x, 6], [x, 32]].map(P), { w: lw * 0.6, seed: seed + 7 + i }));   // the joins between the fingers
      IB.tube(ctx, [[-50, -18], [-24, -24], [-2, -20 - th * 2], [10 + th * 8, -15 - th * 2]].map(P), { w: 15 * s, edge: lw, fill: o.hand, seed: seed + 10 });   // the thumb up the neck, pushing the cork
    }
    return { mouth: P([0, 0]), base: P([-210, 0]), grips: IB.bottleGrips(mouth, ang, s) };
  };

  /* cork(ctx, [x, y], opts) — a champagne cork in flight: the mushroom head and its swollen plug, turned by rot (rad); s scales it (34 px long at 1); lw, seed. Put IB.burst at the mouth for the pop. */
  IB.cork = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, r = o.rot || 0, c = Math.cos(r), sn = Math.sin(r), P = ([px, py]) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s];
    IB.ink(ctx, [[-14, -8], [2, -9], [8, -14], [18, -10], [20, 0], [18, 10], [8, 14], [2, 9], [-14, 8]].map(P), { closed: true, fill: CORK, w: o.lw || 2.8, seed: o.seed || 3850 });
    IB.ink(ctx, [[8, -12], [8, 12]].map(P), { w: (o.lw || 2.8) * 0.6, seed: (o.seed || 3850) + 1 });
  };

  /* champagne(ctx, mouth, opts) — the spray from a shaken bottle: `n` streams of golden liquid as ballistic arcs out of `mouth`, broken into dashes, with white foam bulging at the mouth and droplets flying off the streams; all re-rolled every drawing (pass time on twos). The main stream is aimed at `to` (stage px) and gets there after T seconds (the others fan out `spread` rad either side and fall short or long); g is gravity in px/s² (1640 at 167 px a metre); t: seconds since the spray began (it grows out of the mouth until T, then streams steadily); d: the drawing number (the roll); s scales the foam and drops; splat: true bursts drops off the target once the stream arrives (it hits someone). Returns { tips: the stage points where each stream's front is, hit: whether the main stream has arrived }. */
  IB.champagne = (ctx, [mx, my], o = {}) => {
    const T = o.T || 0.45, to = o.to || [mx - 300, my], g = o.g || 1640, t = Math.max(0, o.t || 0), n = o.n || 7, spread = o.spread == null ? 0.12 : o.spread, s = o.s || 1, d = o.d || 0, seed = o.seed || 3900, lw = o.lw || 2.6;
    const r = MG.rng(seed + d * 31), vx0 = (to[0] - mx) / T, vy0 = (to[1] - my) / T - (g * T) / 2, sp0 = Math.hypot(vx0, vy0), a0 = Math.atan2(vy0, vx0);
    const age = Math.min(t, T * 1.15), tips = [];
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) - 0.5 : 0, a = a0 + u * 2 * spread + (r() - 0.5) * 0.04, v = sp0 * (1 + (r() - 0.5) * 0.12 - Math.abs(u) * 0.1), vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      const P = (tt) => [mx + vx * tt, my + vy * tt + 0.5 * g * tt * tt];
      // the stream: dashes along the arc, longer near the mouth where it is still a jet
      const steps = 22;
      for (let k = 0; k < steps; ) {
        const len = 2 + Math.floor(r() * 4), k1 = Math.min(steps, k + len), pts = [];
        for (let m = k; m <= k1; m++) pts.push(P((m / steps) * age));
        const u0 = k / steps;
        if (r() > u0 * 0.5) IB.ink(ctx, pts, { w: (7 - u0 * 4) * s * (i === Math.floor(n / 2) ? 1.4 : 1), color: r() < 0.7 ? C.yellow : C.mustard, seed: seed + i * 50 + k + d });
        k = k1 + (r() < 0.35 ? 1 : 0);
      }
      // droplets thrown off it, further out the further along
      for (let k = 0; k < 7; k++) {
        const tt = (0.2 + r() * 0.85) * age, p = P(tt), off = tt * 220 * s, rr = (4 + r() * 5) * s;
        IB.oval(ctx, p[0] + (r() - 0.5) * off, p[1] + (r() - 0.5) * off, rr, rr, { fill: r() < 0.5 ? C.paper : C.yellow, w: lw * 0.5, color: GREY, n: 7, seed: seed + 600 + i * 10 + k + d });
      }
      tips.push(P(age));
    }
    // foam bulging out of the mouth
    for (let k = 0; k < 5; k++) { const b = (8 + r() * 12) * s, tt = r() * 0.06; IB.oval(ctx, mx + vx0 * tt + (r() - 0.5) * 18 * s, my + vy0 * tt + (r() - 0.5) * 18 * s, b * 1.2, b, { fill: C.paper, w: lw * 0.7, color: GREY, n: 9, seed: seed + 800 + k + d }); }
    const hit = t >= T;
    if (hit && o.splat) {   // it lands on someone: drops burst back off the target and run down
      const back = Math.sign(mx - to[0]) || 1;   // the drops bounce back toward the bottle and fall
      for (let k = 0; k < 12; k++) {
        const a = -Math.PI / 2 + back * r() * 1.4 + (r() - 0.5) * 0.6, l = (24 + r() * 80) * s, p = [to[0] + Math.cos(a) * l, to[1] + Math.sin(a) * l * 0.7 + r() * 60 * s];
        IB.oval(ctx, p[0], p[1], (3 + r() * 3) * s, (3 + r() * 4) * s, { fill: r() < 0.5 ? C.paper : C.yellow, w: lw * 0.5, color: GREY, n: 7, seed: seed + 900 + k + d });
      }
      for (let k = 0; k < 2; k++) { const b = (7 + r() * 7) * s; IB.oval(ctx, to[0] + back * (8 + r() * 24) * s, to[1] - (6 + r() * 16) * s, b * 1.2, b, { fill: C.paper, w: lw * 0.7, color: GREY, n: 9, seed: seed + 950 + k + d }); }
    }
    return { tips, hit };
  };

  /* tickerTape(ctx, t, opts) — strips of paper coming down over the podium, tumbling: n strips in the box `area` [x0, y0, x1, y1], each falling at its own speed (90-200 px/s x s) and swaying, its length showing and hiding as it turns over. t: seconds (pass it on twos: paper is drawn, not filmed), from: when it was let go (no strips before; each starts somewhere in the 0.3 x height above the box and falls in, then comes round again from the top); colors (C.paper and C.yellow); s scales the strips (34 x 10 px at 1); seed. */
  IB.tickerTape = (ctx, t, o = {}) => {
    const [x0, y0, x1, y1] = o.area || [0, 0, 1920, 1080], n = o.n || 60, s = o.s || 1, seed = o.seed || 4000, cols = o.colors || [C.paper, C.yellow], tt = t - (o.from || 0);
    if (tt < 0) return;
    const r = MG.rng(seed), H = y1 - y0;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), v = (90 + r() * 110) * s, ph = r() * PI2, start = r() * 0.3 * H, col = cols[Math.floor(r() * cols.length)], spin = 3 + r() * 4;
      const y = y0 - 0.3 * H + ((0.3 * H - start + v * tt) % (1.3 * H));   // from above the box, down through it, round again
      if (y < y0 - 40 || y > y1) continue;
      const cx = x + Math.sin(ph + tt * 2.2) * 26 * s, a = ph + tt * 1.1, k = Math.cos(ph + tt * spin), L = 17 * s, Wd = 5 * s * (0.3 + 0.7 * Math.abs(k));
      const c = Math.cos(a), sn = Math.sin(a), P = ([px, py]) => [cx + px * c - py * sn, y + px * sn + py * c];
      IB.ink(ctx, [[-L, -Wd], [L, -Wd], [L, Wd], [-L, Wd]].map(P), { closed: true, smooth: false, fill: col, w: 1.4 * s, color: GREY, seed: seed + i });
    }
  };
})(window);
