/* cast/paper.js — the office paper that walks: the reference's folder and document (objects with thin legs, never a face) and their relatives in the creative scenes. Needs ink.js, marks.js, figure.js and solid.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* hidingDoc(ctx, at, state, opts) — a rigid sheet (156 x 200, a lavender block and four text lines) on two peg legs, the shy one that hides. `at` = [its centre x, the y of its bottom edge when standing]; opts.ground is the y its feet stand on (74 px lower).
     state: down, px it has sunk (120 = ducked out of sight behind a crate; clip to the floor line so nothing shows below); tilt (walking: 0.04, swapping sign every 3 drawings); feet [[dx, dy], [dx, dy]] from its x and the ground (walking: [[-30, 0], [10, -10]] and [[-10, -10], [30, 0]]; standing [[-22, 0], [22, 0]]); arm 0..1, one thin arm drawn on in two drawings (0.5, 1); wave 0 / 1, the two drawings of its mitten waving (on threes).
     It has eyes only because it must be seen in the dark: draw them with IB.docEyes (metaphor/flashlight-finds-file). */
  IB.hidingDoc = (ctx, [X, by], st = {}, o = {}) => {
    const { down = 0, tilt = 0, feet = [[-22, 0], [22, 0]], arm = 0, wave = 0 } = st, { ground = by + 74, seed = 250 } = o;
    ctx.save();
    feet.forEach(([dx, dy], i) => IB.peg(ctx, [X + (i ? 26 : -26), by - 3], [X + dx, ground + dy], { seed: seed + i * 9, dir: -1 }));
    if (arm > 0) {   // one thin arm, drawn on, with a mitten that waves
      const root = [X - 76, by - 120], hand = [root[0] - 70 * arm, root[1] - (96 + wave * 16) * arm + wave * 0];
      IB.limb(ctx, [root, [lerp(root[0], hand[0], 0.5) - 14, lerp(root[1], hand[1], 0.5) + 6], hand], [13, 10, 8], { fill: C.paper, lw: 2.8, seed: seed + 20 });
      if (arm === 1) IB.oval(ctx, hand[0] - 4 - wave * 8, hand[1] - 10, 12, 14, { fill: C.paper, w: 2.6, seed: seed + 22 + wave, n: 9 });
    }
    ctx.restore();
    ctx.save(); ctx.translate(X, by + down); ctx.rotate(tilt);
    IB.box(ctx, -78, -200, 156, 200, { fill: C.paper, w: 3.6, seed: seed + 10 });
    IB.box(ctx, -58, -112, 74, 80, { fill: C.lavender, w: 2, seed: seed + 11 });
    for (let i = 0; i < 4; i++) IB.seg(ctx, 28, -104 + i * 17, 60, -104 + i * 17, { w: 2.2, seed: seed + 12 + i });
    ctx.restore();
  };
  /* docEyes(ctx, at, look, opts) — the hiding document's two eyes, 52 px apart, the left one at `at` (26 px left of its centre, 150 px above its bottom edge). look: { dx, dy } moves the pupils (up to 6 px, toward what it watches), wide: true for found-out eyes; opts.shut draws a blink as two paper lines. Paper white, so they read on black: draw them once under the darkness and again over it. */
  IB.docEyes = (ctx, [ex, ey], look = {}, o = {}) => {
    const { shut = false, seed = 240 } = o;
    ctx.save();
    for (const i of [0, 1]) {
      const x = ex + i * 52;
      if (shut) { IB.seg(ctx, x - 13, ey, x + 13, ey, { w: 3, seed: seed + i, color: C.paper }); continue; }
      IB.oval(ctx, x, ey, 15, look.wide ? 17 : 12, { fill: C.paper, w: 2.6, seed: seed + 2 + i, n: 10 });
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + look.dx, ey + look.dy, 5.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- the folder and the document of the reference's fourth spot ---------- */
  /* Both are things with thickness that turn in depth (solid.js projects them and the same brush pen draws the result), on rubber-hose legs with boots, and arms that grow out from behind an edge only while they are needed. They are staged in the reference's own coordinates: floor line y 893, the folder starting at x 1093 and the document at x 1700. A pose's x and its feet are stage px, not offsets from the body: a planted foot keeps the same x from drawing to drawing while the body's x moves over it, which is what stops it skating. To stage them somewhere else, translate the context. */
  const PI = Math.PI, FLOOR = 893, ANKLE = FLOOR - 12, HIP = 106;
  IB.PAPER = { floor: FLOOR, ankle: ANKLE, hip: HIP };

  /* Two legs from the hips (stage px, wherever the body's turn has put them) to the feet, with the chalk puddle round the planted shoes. p.feet are [x on the stage, height above the floor line (negative = up)] per ankle; via is a knee, an optional point the leg passes through; bow, toe, frot per leg bend the hose, point the boot (0 front on, -1 / 1 in profile) and tip it. */
  function legs(ctx, p, hips, fill, seed, shoe) {
    const hs = hips.slice().sort((a, b) => a[0] - b[0]);
    const feet = p.feet.map(([x, dy]) => [x, ANKLE + dy]);
    const down = feet.filter((q) => q[1] > ANKLE - 9);
    if (down.length) {   // a puddle around the shoes, not a line under them: it starts above the soles and stretches to span a wide stance
      const x0 = Math.min(...down.map((q) => q[0])), x1 = Math.max(...down.map((q) => q[0]));
      IB.puddle(ctx, [(x0 + x1) / 2, FLOOR], { w: 84 + (x1 - x0), seed });
    }
    feet.forEach((foot, i) => {
      const via = p.via && p.via[i] ? [p.via[i][0], ANKLE + p.via[i][1]] : null;
      IB.hose(ctx, [hs[i][0], hs[i][1] - 10], foot, { bow: p.bow[i], via, w: 18, w1: 14.5, fill, lw: 2.4, seed: seed + 3 + i * 5, shade: 18 });
      IB.boot(ctx, foot, { dir: p.toe[i], rot: p.frot[i], lw: 2.6, seed: seed + 9 + i * 5, ...shoe });
    });
  }
  /* paperArm(ctx, root, to, opts) — one of their arms: a thin white hose from a root behind the body's edge to a wrist, with a small fingered hand once it is long enough to have one (opts.hand 'rest' | 'reach' | 'open', aim its angle, flip its side, bow the hose's bend). */
  IB.paperArm = (ctx, root, to, o) => {
    const ang = IB.hose(ctx, root, to, { bow: o.bow || 0, w: 10, w1: 8, fill: C.bg, lw: 2.4, seed: o.seed, shade: 34 });
    if (o.hand) IB.mitt(ctx, to, o.aim == null ? ang : o.aim, { kind: o.hand, flip: o.flip || 1, s: 1.25, seed: o.seed + 9 });
  };

  const FW = 200, FH = 167, TAB = 23;
  const F0 = { x: 1093, lift: 0, roll: 0, yaw: 0, open: 0, feet: [[1076, 0], [1110, 0]], bow: [0, 0], toe: [0, 0], frot: [0, 0] };
  const fo = (o, base = F0) => ({ ...base, ...o });
  const FT = fo({ yaw: PI });                 // turned to face the other way: the tab is now on the left
  const FC = fo({ x: 1268, feet: [[1251, 0], [1285, 0]] }, FT), FD = fo({ x: 1315, feet: [[1298, 0], [1332, 0]] }, FT);
  /* folder(ctx, pose, opts) — the blue folder: two stiff covers hinged along the bottom, the tab always on the cover that is behind (which is what the reference draws from either side). It never squashes: it turns (yaw; PI = its back to us), tips (roll), lifts, and opens, and when it opens past 0.07 rad the far cover shows beyond the near one with graphite in the gap.
     pose: x, lift, roll, yaw, open, feet [[x, dy], [x, dy]], bow [2], toe [2], frot [2], via [2] (see the note above).
     POSE: front, back (turned to face the other way: the tab is now on the left), and the two places it stands later in the spot (centre, byDoc).
     MOVE: its acting in the spot, each a list of drawings in frames from its first: kick, aboutFace, groove (one 12-frame bar: play it twice), hipOut, lunge, shiftWeight, walkOver, leanIn; reach is its arm finding the document's (rows for IB.paperArm relative to IB.folder.reachRoot, ending in 'clasp'; IB.paperReach draws both arms). */
  IB.folder = (ctx, p, o = {}) => {
    const { seed = 200 } = o;
    ctx.save();
    const S = IB.folder.space(p);
    const h = p.open / 2, cs = Math.cos(h), sn = Math.sin(h);
    // a cover leaning `side` of the hinge; the tab belongs to whichever cover is behind, which is what the reference draws from either side
    const cover = (side, tab) => {
      const P = (x, up) => [x, -up * cs, side * (up * sn + 2)];
      return tab ? [P(-100, FH), P(10, FH), P(28, FH + TAB), P(100, FH + TAB), P(100, 0), P(-100, 0)] : [P(-100, FH), P(100, FH), P(100, 0), P(-100, 0)];
    };
    const a = IB.cast(S, cover(1)), b = IB.cast(S, cover(-1)), side = a.z >= b.z ? 1 : -1;
    const far = IB.cast(S, cover(side, true)), near = side === 1 ? b : a;
    legs(ctx, p, [S([-17, 0, 0]), S([17, 0, 0])], C.sky, seed, {});
    IB.ink(ctx, far.pts, { closed: true, smooth: false, fill: C.blue, w: 3.7, seed: 21 });
    if (p.open > 0.07) {
      // graphite inside the gap, along whichever side edge of the near cover the far one shows beyond
      const cx = (q) => q.reduce((s, v) => s + v[0], 0) / q.length, left = cx(far.pts) < cx(near.pts);
      const e0 = near.pts[0][0] < near.pts[1][0] ? (left ? [3, 0] : [2, 1]) : (left ? [2, 1] : [3, 0]);
      ctx.save();
      IB.clip(ctx, far.pts);
      IB.crease(ctx, near.pts[e0[0]], near.pts[e0[1]], 18 + 70 * p.open, { side: left ? 1 : -1, seed: 23, alpha: 0.75 });
      ctx.restore();
    }
    IB.ink(ctx, near.pts, { closed: true, smooth: false, fill: C.blue, w: 3.7, seed: 22 });
    ctx.restore();
  };
  IB.folder.space = (p) => IB.space({ at: [p.x, ANKLE - HIP - p.lift], yaw: p.yaw, roll: p.roll, look: 0.22 });
  IB.folder.reachRoot = (p) => IB.folder.space(p)([-(FW / 2 - 8), -112, 0]);   // with its back to us its -x edge is the one on the right, toward the document
  IB.folder.POSE = { front: F0, back: FT, centre: FC, byDoc: FD };
  IB.folder.MOVE = {
    // kick: the near leg curls back for two drawings, snaps straight through the balloon, hangs for three, comes home
    kick: [
    [0, fo({ roll: -0.02, feet: [[1095, -10], [1110, 0]], bow: [-12, 0], toe: [-1, 0], frot: [-0.5, 0] })],
    [2, fo({ roll: -0.04, feet: [[1101, -17], [1110, 0]], bow: [-17, 0], toe: [-1, 0], frot: [-0.8, 0] })],
    [4, fo({ x: 1096, roll: 0.05, feet: [[1032, -20], [1110, 0]], toe: [-1, 0], frot: [0.55, 0] })],
    [6, fo({ x: 1097, roll: 0.07, feet: [[1024, -27], [1110, 0]], toe: [-1, 0], frot: [0.7, 0] })],
    [8, fo({ x: 1097, roll: 0.06, feet: [[1027, -23], [1110, 0]], toe: [-1, 0], frot: [0.6, 0] })],
    [12, fo({ x: 1094, roll: 0.02, feet: [[1060, -3], [1110, 0]], bow: [5, 0], toe: [-1, 0], frot: [0.15, 0] })],
    [14, F0],
    ],
    // faces about with a hop: crouch, deeper, one drawing in the air seen nearly edge-on, squash, rebound
    aboutFace: [
    [0, fo({ lift: -5, bow: [-5, 5] })],
    [2, fo({ lift: -11, bow: [-10, 10] })],
    [4, fo({ lift: 16, yaw: 1.25, open: 0.14, feet: [[1084, -15], [1103, -11]], bow: [4, -4], toe: [1, 1], frot: [0.5, 0.35] })],
    [6, fo({ lift: -8, bow: [-9, 9] }, FT)],
    [8, fo({ lift: 3 }, FT)],
    [10, FT],
    ],
    // step-touch groove, a drawing every 2 or 4 frames, 12 frames a bar: the hips swing over planted feet, then the free foot crosses in front
    groove: [
    [0, fo({ x: 1098, lift: -4, roll: 0.03, bow: [7, 7] }, FT)],
    [2, fo({ x: 1099, lift: 2, roll: 0.045, feet: [[1126, -2], [1110, 0]], via: [[1078, -54], null], toe: [1, 0] }, FT)],
    [6, fo({ x: 1088, lift: -4, roll: -0.03, bow: [-7, -7] }, FT)],
    [8, fo({ x: 1087, lift: 2, roll: -0.045, feet: [[1076, 0], [1060, -2]], via: [null, [1108, -54]], toe: [0, -1] }, FT)],
    ],
    // hip out, covers apart: settles past the pose and back, then holds while the document has the floor
    hipOut: [
    [0, fo({ x: 1100, roll: -0.05, yaw: PI + 0.22, open: 0.14, feet: [[1065, -6], [1100, 0]], toe: [-1, 0], frot: [0.2, 0] })],
    [2, fo({ x: 1108, roll: -0.15, yaw: PI + 0.46, open: 0.36, feet: [[1060, 0], [1100, 0]], toe: [-1, -1] })],
    [4, fo({ x: 1108, roll: -0.11, yaw: PI + 0.4, open: 0.28, feet: [[1060, 0], [1100, 0]], toe: [-1, -1] })],
    [6, fo({ x: 1108, roll: -0.125, yaw: PI + 0.42, open: 0.31, feet: [[1060, 0], [1100, 0]], toe: [-1, -1] })],
    ],
    // spin kick into a lunge: gather, crouch (held 4 frames), whirl on one foot, reach, land low and wide, slide the weight over, pop up
    lunge: [
    [0, fo({ x: 1100, roll: -0.04, yaw: PI + 0.25, open: 0.2, lift: -5, feet: [[1060, 0], [1116, -6]], toe: [-1, 1], frot: [0, -0.2] })],
    [2, fo({ x: 1092, yaw: PI + 0.3, open: 0.4, lift: -18, feet: [[1060, 0], [1123, 0]], bow: [-13, 13] })],
    [6, fo({ x: 1079, lift: 10, roll: -0.85, yaw: PI + 0.3, open: 0.22, feet: [[1060, 0], [1179, -116]], bow: [-9, -24], toe: [0, 1], frot: [0, -0.5] })],
    [8, fo({ x: 1079, lift: 12, roll: -0.92, yaw: PI + 0.3, open: 0.26, feet: [[1060, 0], [1186, -121]], bow: [-10, -26], toe: [0, 1], frot: [0, -0.65] })],
    [10, fo({ x: 1104, lift: -14, roll: -0.5, yaw: PI + 0.45, open: 0.3, feet: [[1060, 0], [1285, 0]], bow: [-9, 0], toe: [0, 1], frot: [0, -0.2] })],
    [12, fo({ x: 1150, lift: -36, roll: -0.03, yaw: PI + 0.5, open: 0.62, feet: [[1060, 0], [1285, 0]], bow: [-16, 16], toe: [-1, 1] })],
    [14, fo({ x: 1228, lift: -30, roll: 0.05, yaw: PI + 0.62, open: 0.82, feet: [[1060, 0], [1285, 0]], bow: [0, 18], toe: [-1, 1] })],
    [16, fo({ x: 1262, lift: 7, yaw: PI + 0.25, open: 0.16 }, FC)],
    [18, fo({ x: 1266, lift: -2, yaw: PI + 0.1, open: 0.06 }, FC)],
    [20, FC],
    ],
    // shifts its weight, half turned toward the document, and back
    shiftWeight: [
    [0, fo({ roll: 0.02, yaw: PI + 0.2, open: 0.1, feet: [[1251, 0], [1292, -5]], toe: [0, 1] }, FC)],
    [2, fo({ x: 1272, roll: 0.035, yaw: PI + 0.26, open: 0.13, feet: [[1251, 0], [1297, 0]], toe: [0, 1] }, FC)],
    [6, fo({ x: 1272, yaw: PI + 0.08, feet: [[1251, 0], [1290, -4]] }, FC)],
    [10, fo({ x: 1272 }, FC)],
    ],
    // three steps over to the document
    walkOver: [
    [0, fo({ x: 1273, lift: -4, roll: 0.03, yaw: PI + 0.15, open: 0.08, bow: [5, 5] }, FC)],
    [2, fo({ x: 1281, lift: 2, roll: 0.05, yaw: PI + 0.22, open: 0.12, feet: [[1251, 0], [1315, -5]], toe: [1, 1], frot: [0, -0.25] }, FC)],
    [4, fo({ x: 1292, roll: 0.02, yaw: PI + 0.3, open: 0.18, feet: [[1284, -8], [1316, 0]], bow: [6, 0], toe: [1, 1], frot: [0.3, 0] }, FC)],
    [8, fo({ x: 1304, roll: -0.05, yaw: PI + 0.42, open: 0.27, feet: [[1298, 0], [1316, 0]], toe: [1, 1] }, FC)],
    [10, fo({ x: 1311, roll: -0.03, yaw: PI + 0.3, open: 0.16, feet: [[1298, 0], [1327, -5]], toe: [0, 1], frot: [0, -0.2] }, FC)],
    [12, fo({ x: 1315, yaw: PI + 0.1, open: 0.05 }, FD)],
    [14, FD],
    ],
    // the hands meet: both start back, lean in, and stand straight once they hold
    leanIn: [
    [0, fo({ x: 1312, roll: -0.06 }, FD)],
    [2, fo({ x: 1311, roll: -0.075 }, FD)],
    [6, fo({ x: 1314, roll: -0.02 }, FD)],
    [8, fo({ x: 1318, roll: 0.05 }, FD)],
    [10, fo({ x: 1318, roll: 0.035 }, FD)],
    [12, FD],
    ],
    // its arm: out from behind the edge, hangs, reaches, opens; drops back, flings up, comes down and holds
    reach: [
      [0, { to: [8, 28] }], [2, { to: [16, 54], bow: -3 }], [4, { to: [24, 74], bow: -5, hand: 'rest' }], [6, { to: [30, 86], bow: -6, hand: 'rest', aim: 1.35 }],
      [10, { to: [32, 84], bow: -7, hand: 'rest', aim: 1.1 }],
      [14, { to: [40, 86], bow: -7, hand: 'reach', aim: 0.95 }], [16, { to: [46, 86], bow: -8, hand: 'reach', aim: 0.8 }], [18, { to: [52, 86], bow: -8, hand: 'open', aim: 0.7 }], [20, { to: [56, 86], bow: -8, hand: 'open', aim: 0.6 }],
      [30, { to: [34, 88], bow: -6, hand: 'rest', aim: 1.3 }],
      [32, { to: [52, -22], bow: 13, hand: 'open', aim: 0.75 }], [34, { to: [60, -30], bow: 15, hand: 'open', aim: 0.5 }],
      [38, { to: [54, 52], bow: -4, hand: 'reach', aim: 0.7 }],
      [40, 'clasp'],
    ],
  };

  const DW = 173, DH = 238, PIN = [-30, -222];
  const D0 = { x: 1700, lift: 0, roll: 0, yaw: 0, pitch: 0, sway: 0, sag: 0, wave: 0, arch: 0, curl: 0, twist: 0, feet: [[1682, 0], [1718, 0]], bow: [0, 0], toe: [0, 0], frot: [0, 0], n: [0, 0], arms: null };
  const dc = (o, base = D0) => ({ ...base, ...o });
  const DD = dc({ x: 1598, feet: [[1580, 0], [1616, 0]] });
  /* One of the papers under the clip. It hangs from the clip (PIN), swings about it in the plane of the sheet and lifts off it like a flap, each paper by its own share `k` of the pose's [swing, lift]; z < 0 is toward the viewer. A lifted paper also bellies: the middle of its free edge hangs lower than its corners, and it throws graphite onto the sheet below that edge (pass the sheet's outline to keep the tone on the sheet). */
  function note(ctx, M, [x, y, w, h], n, k, fill, seed, sheet) {
    const N = 6;   // samples per side of the paper's outline
    const sw = n[0] * k, lf = n[1] * k, c = Math.cos(sw), s = Math.sin(sw), cl = Math.cos(lf), sl = Math.sin(lf);
    const q = IB.cast(M, IB.rim(x, y, w, h, N).map(([px, py]) => {
      const dx = px - PIN[0], dy = py - PIN[1], rx = dx * c - dy * s, ry = dx * s + dy * c, d = Math.max(0, ry), e = (2 * (px - x)) / w - 1;
      const belly = sl * 0.16 * d * (1 - e * e), flick = sl * 0.1 * d * e * Math.sign(sw || 1);
      return [PIN[0] + rx + flick, PIN[1] + (ry > 0 ? d * cl : ry) + belly, -1.5 - d * sl];
    }));
    if (lf > 0.12 && sheet) {
      const e = q.pts.slice(2 * N, 3 * N + 1);   // the free (bottom) edge, right to left: IB.rim lists the sides top, right, bottom, left
      ctx.save();
      IB.clip(ctx, sheet);
      for (let i = 0; i < e.length - 1; i++) IB.crease(ctx, e[i + 1], e[i], 5 + 13 * lf, { side: -1, seed: seed + 50 + i, alpha: 0.5 });
      ctx.restore();
    }
    IB.ink(ctx, q.pts, { closed: true, smooth: false, fill, w: 2, seed });
  }


  /* doc(ctx, pose, opts) — the document: a limp sheet with ruled lines, three coloured notes under a clip, grey lace-up boots. It bends instead of turning: sway (the top leans sideways), sag (the middle drops), wave (an S), and in depth arch, curl, twist; a fast turn is drawn as two drawings pitched back and forth, not as a spin (edge-on it would be a line and its back is blank). The notes swing and lift after it by pose.n = [swing, lift] and settle last.
     pose: x, lift, roll, yaw, pitch, sway, sag, wave, arch, curl, twist, feet, bow, toe, frot, via, n, arms null | [left, right] each 'short' | 'hip' | 'out' | 'up' | 'low'.
     POSE: stand and byFolder (where it ends up).
     MOVE: spin, armDance, watch, cross, leanIn; reach is its arm finding the folder's. */
  IB.doc = (ctx, p, o = {}) => {
    const { seed = 300 } = o;
    ctx.save();
    const S = IB.doc.space(p);
    const B = IB.bend({ w: DW, h: DH, sway: p.sway, sag: p.sag, wave: p.wave, arch: p.arch, curl: p.curl, twist: p.twist });
    const M = (q) => S(B(q));
    const sheet = IB.cast(M, IB.rim(-DW / 2, -DH, DW, DH, 10));
    legs(ctx, p, [S([-18, 0, 0]), S([18, 0, 0])], '#d4d4d4', seed, { s: 1.2, laces: true });
    if (p.arms) [-1, 1].forEach((s, i) => {
      const kind = p.arms[i], root = M([s * 78, -118, 0]);
      if (kind === 'hip') {   // hand on the hip: a ring that leaves the edge and comes back to it, the hand itself behind the sheet
        const ring = Array.from({ length: 9 }, (_, k) => { const a = -PI / 2 + (PI * k) / 8; return M([s * (76 + Math.cos(a) * 30), -76 + Math.sin(a) * 40, 0]); });
        IB.limb(ctx, ring, ring.map(() => 12.5), { fill: C.bg, lw: 2.4, seed: seed + 40 + i, shade: 24 });
      }
      else {
        const to = { short: [s * 10, 50], low: [s * 14, 126], out: [s * 34, 118], up: [s * 58, 102] }[kind];
        IB.paperArm(ctx, root, [root[0] + to[0], root[1] + to[1]], { bow: kind === 'up' ? s * 11 : kind === 'out' ? s * 8 : s * 4, hand: kind === 'out' || kind === 'up' ? 'open' : 'rest', flip: s, seed: seed + 50 + i * 20 });
      }
    });
    IB.ink(ctx, sheet.pts, { closed: true, smooth: false, fill: C.paper, w: 3.3, seed: 31 });
    const clip = [[-23, -DH - 16], [-23, -DH + 30], [-27, -DH + 38], [-33, -DH + 33], [-33, -DH + 8]];
    // the sheet has no back side: nothing here asks cast() which face is showing, so a pose turned past edge-on (|yaw| > PI / 2) would show the face mirrored, which is how the reference draws the document when it turns round. No key in DOC goes that far
    for (let i = 0; i < 6; i++) IB.ink(ctx, [[20, -182 + i * 15, 0], [42, -182 + i * 15, 0], [64, -182 + i * 15, 0]].map(M), { w: 2.4, seed: 35 + i });
    note(ctx, M, [-60, -227, 82, 149], p.n, 1.3, C.mint, 34, sheet.pts);
    note(ctx, M, [-71, -227, 95, 114], p.n, 1, C.lavender, 32, sheet.pts);
    note(ctx, M, [-58, -227, 57, 52], p.n, 0.5, C.yellow, 33, sheet.pts);
    IB.ink(ctx, clip.map((q) => M([...q, -3])), { w: 2.5, seed: 41 });
    ctx.restore();
  };
  IB.doc.space = (p) => IB.space({ at: [p.x, ANKLE - HIP - p.lift], yaw: p.yaw, pitch: p.pitch, roll: p.roll, look: 0.18 });
  IB.doc.reachRoot = (p) => IB.doc.space(p)([-(DW / 2 - 8), -122, 0]);
  IB.doc.POSE = { stand: D0, byFolder: DD };
  IB.doc.MOVE = {
    // spin on the spot: winds up against the turn, then the feet lead and the top edge follows up to 1 rad behind; the notes fly out, overshoot the other way and settle last
    spin: [
    [0, dc({ lift: -4, roll: 0.02, bow: [-4, 4], n: [0.05, 0] })],
    [2, dc({ lift: 3, roll: 0.035, sway: -7, feet: [[1682, 0], [1696, -13]], bow: [0, 6], toe: [0, -1], frot: [0, 0.4], n: [0.1, 0.12] })],
    [4, dc({ x: 1697, lift: 6, roll: -0.075, sway: 12, sag: 3, feet: [[1682, 0], [1666, 0]], via: [null, [1703, -54]], toe: [0, -1], n: [-0.18, 0.35] })],
    [6, dc({ x: 1703, lift: 11, roll: 0.18, yaw: 0.4, pitch: 0.9, sway: 15, sag: -5, wave: 5, feet: [[1682, 0], [1666, 0]], via: [[1690, -58], [1706, -52]], toe: [0, -1], n: [-0.36, 0.8] })],
    [8, dc({ x: 1699, lift: 5, roll: -0.04, pitch: -0.8, sway: -12, sag: 6, wave: -9, feet: [[1682, 0], [1704, -9]], bow: [-4, 4], toe: [0, 1], frot: [0, -0.4], n: [0.32, 0.22] })],
    [10, dc({ lift: 2, roll: -0.13, sway: 18, sag: -3, n: [0.5, 0.75] })],
    [12, dc({ roll: -0.05, sway: 9, n: [0.3, 0.5] })],
    [14, dc({ lift: -2, roll: 0.012, sway: -3, n: [-0.1, 0.18] })],
    [16, dc({ n: [0.04, 0.05] })],
    [20, D0],
    ],
    // arms: out of both edges at once, onto the hips, then one hand and the other thrown open on the beat; the body dips a little into each
    armDance: [
    [0, dc({ arms: ['short', 'short'] })],
    [2, dc({ lift: -3, arms: ['hip', 'hip'] })],
    [6, dc({ roll: 0.025, arms: ['hip', 'hip'] })],
    [8, dc({ lift: -3, roll: -0.03, sway: -4, arms: ['out', 'hip'] })],
    [10, dc({ lift: 3, arms: ['up', 'up'] })],
    [12, dc({ lift: -3, arms: ['hip', 'hip'] })],
    [14, dc({ roll: -0.025, arms: ['hip', 'hip'] })],
    [16, dc({ lift: -3, roll: 0.03, sway: 4, arms: ['hip', 'out'] })],
    [18, dc({ lift: 3, arms: ['up', 'up'] })],
    [20, dc({ arms: ['out', 'out'] })],
    [22, dc({ arms: ['low', 'low'] })],
    [24, dc({ arms: ['short', 'short'] })],
    ],
    // turns to watch the folder wind up, leaning in; rears back when the lunge lands at its feet; straightens
    watch: [
    [0, dc({ lift: -7, bow: [-5, 5] })],
    [2, dc({ lift: 3, yaw: -0.5, sway: -6 })],
    [4, dc({ yaw: -0.62, sway: -17, twist: -0.1 })],
    [6, dc({ yaw: -0.6, sway: -13, twist: -0.06 })],
    [20, dc({ lift: 3, yaw: -0.5, sway: 16, arch: 12, twist: 0.12, n: [-0.12, 0.25] })],
    [22, dc({ lift: 1, yaw: -0.46, sway: 27, arch: 18, twist: 0.16, roll: 0.03, n: [-0.2, 0.4] })],
    [24, dc({ yaw: -0.3, sway: 17, arch: 9, n: [0.1, 0.2] })],
    [26, dc({ yaw: -0.15, sway: 7, n: [0.05, 0.08] })],
    [28, dc({ sway: -3 })],
    [36, D0],
    ],
    // crosses to the folder in two steps: dips, kicks a leg up and leans into it, strides, and brakes with the top and the notes carrying on
    cross: [
    [0, dc({ lift: -8, roll: 0.02, bow: [-7, 7] })],
    [2, dc({ x: 1682, lift: 5, roll: -0.11, sway: -8, feet: [[1648, -24], [1718, 0]], bow: [-14, 0], toe: [-1, -1], frot: [0.7, 0], n: [-0.2, 0.3] })],
    [4, dc({ x: 1652, lift: -3, roll: -0.06, yaw: -0.25, feet: [[1580, 0], [1692, -5]], toe: [-1, -1], frot: [0, 0.4], n: [-0.3, 0.5] })],
    [6, dc({ x: 1622, lift: 2, yaw: -0.42, sway: -5, feet: [[1580, 0], [1642, -14]], bow: [0, 8], toe: [-1, -1], frot: [0, 0.5], n: [0.2, 0.55] })],
    [8, dc({ x: 1603, yaw: -0.2, sway: -15, twist: -0.1, n: [0.27, 0.5] }, DD)],
    [10, dc({ x: 1598, sway: 6, n: [0.14, 0.3] }, DD)],
    [12, dc({ x: 1598, sway: -2, n: [-0.08, 0.12] }, DD)],
    [14, DD],
    ],
    // the hands meet: it leans toward the folder, back, and stands straight once they hold
    leanIn: [
    [0, dc({ x: 1601, roll: 0.035 }, DD)],
    [2, dc({ x: 1602, roll: 0.05, sway: 3 }, DD)],
    [6, dc({ x: 1599, roll: 0.01 }, DD)],
    [8, dc({ x: 1595, roll: -0.045, sway: -4, n: [0.1, 0.15] }, DD)],
    [10, dc({ x: 1595, roll: -0.03, n: [-0.05, 0.05] }, DD)],
    [12, DD],
    ],
    // its arm, two frames behind the folder's
    reach: [
      [0, { to: [-8, 28] }], [2, { to: [-20, 56], bow: 4, hand: 'rest' }], [4, { to: [-32, 76], bow: 6, hand: 'rest', aim: 1.85 }], [6, { to: [-36, 78], bow: 7, hand: 'rest', aim: 2.05 }],
      [14, { to: [-42, 80], bow: 8, hand: 'reach', aim: 2.25 }], [16, { to: [-48, 80], bow: 8, hand: 'reach', aim: 2.4 }], [18, { to: [-54, 80], bow: 8, hand: 'open', aim: 2.5 }],
      [28, { to: [-36, 82], bow: 6, hand: 'rest', aim: 1.9 }],
      [30, { to: [-72, 30], bow: 10, hand: 'open', aim: 2.95 }], [32, { to: [-82, 26], bow: 12, hand: 'open', aim: 3.05 }],
      [36, { to: [-56, 60], bow: 8, hand: 'reach', aim: 2.6 }],
      [38, 'clasp'],
    ],
  };

  /* paperReach(ctx, folderPose, docPose, fa, da, meet) — the two arms that find each other, drawn before the bodies so that each one's root is behind its body's edge. fa / da are the rows in force of IB.folder.MOVE.reach / IB.doc.MOVE.reach (null before they start); when they say 'clasp' both arms run to `meet`, where IB.paperClasp draws the hands over the bodies. */
  IB.paperReach = (ctx, fp, dp, fa, da, meet) => {
    const fRoot = IB.folder.reachRoot(fp), dRoot = IB.doc.reachRoot(dp);
    ctx.save();
    if (fa === 'clasp') {
      IB.paperArm(ctx, fRoot, [meet[0] - 9, meet[1] - 3], { bow: -5, seed: 400 });
      IB.paperArm(ctx, dRoot, [meet[0] + 9, meet[1] - 3], { bow: 5, seed: 420 });
    } else {
      if (fa) IB.paperArm(ctx, fRoot, [fRoot[0] + fa.to[0], fRoot[1] + fa.to[1]], { ...fa, flip: -1, seed: 400 });
      if (da) IB.paperArm(ctx, dRoot, [dRoot[0] + da.to[0], dRoot[1] + da.to[1]], { ...da, flip: 1, seed: 420 });
    }
    ctx.restore();
  };
  /* paperClasp(ctx, meet, opts) — their two hands holding at `meet`: tilted 0.12 rad on the drawings before they stand straight, level once `held`. */
  IB.paperClasp = (ctx, meet, o = {}) => IB.clasp(ctx, meet, { seed: 440, s: 1.3, rot: o.held ? 0 : 0.12 });
})(window);
