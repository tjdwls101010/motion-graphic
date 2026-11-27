/* cast/watcher.js — the watcher of the reference's sixth spot: a pair of green eyes in the dark that turn out, at the cut, to belong to someone at a window with binoculars. Her drawings were read off the reference on a 4x enlarged grid and stay in its coordinates (the axis of her face at x 1206, the point between her lenses at y 462): to stage her somewhere else, give opts.at, opts.s and opts.flip (IB.place). Needs ink.js; adds to the global IB. Used by spot/dark-eyes-reveal. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const GREEN = '#4ca757', SKIRT = '#7cc47a', SKIN = C.skin[0], HX = 1206;   // HX: the axis her face is symmetric about

  /* darkEyes(ctx, state, opts) — the opening on black: two big eyes (white almond, black iris ringed green, a glint), with nothing else in the frame. state: dx, dy move the irises; lid 0 shut .. 1 open (at 0 nothing is drawn: a blink is an empty frame); s shrinks the pair toward opts.focus, which is how the shot zooms out: drawings, not a camera. opts.eyes are the two centres at s = 1.
     MOVE.search: the eyes looking left and right and blinking, on the frames where the reference changes its drawing; MOVE.shrink: the five drawings in which the pair shrinks toward the cut (the cut's first lit drawing puts the lenses where the eyes were). Both [frame, state] from the move's start, like every MOVE. */
  IB.darkEyes = (ctx, st = {}, o = {}) => {
    const { dx = 0, dy = 0, lid = 1, s = 1 } = st, { focus: FOCUS = [1193, 438], eyes = [[1100, 541], [1568, 543]] } = o;
    if (lid > 0) for (const [ex, ey] of eyes) eye(ctx, FOCUS[0] + (ex - FOCUS[0]) * s, FOCUS[1] + (ey - FOCUS[1]) * s, s, dx, dy, lid);
  };
  IB.darkEyes.MOVE = {
    search: [[0, { dx: 0, dy: 0, lid: 1 }], [8, { dx: -5, dy: 0, lid: 1 }], [10, { dx: -75, dy: 0, lid: 1 }], [12, { dx: -85, dy: 0, lid: 1 }], [24, { dx: 0, dy: 0, lid: 0 }], [26, { dx: -85, dy: 4, lid: 0.8 }], [28, { dx: -85, dy: 0, lid: 1 }], [37, { dx: 0, dy: 0, lid: 0 }], [39, { dx: 4, dy: -11, lid: 1 }], [41, { dx: 9, dy: -27, lid: 1 }], [53, { dx: 15, dy: -18, lid: 1 }], [55, { dx: 41, dy: 19, lid: 1 }], [57, { dx: 46, dy: 26, lid: 1 }]],
    shrink: [[0, { s: 0.98 }], [2, { s: 0.9 }], [4, { s: 0.8 }], [6, { s: 0.65 }], [8, { s: 0.46 }]],
  };
  function eye(ctx, cx, cy, s, dx, dy, lid) {
    ctx.save();
    ctx.translate(cx, cy + dy * 0.3 * s);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-142, 6);
    ctx.quadraticCurveTo(-20, -134 * (2.5 * lid - 1.5), 142, 10);
    ctx.quadraticCurveTo(10, 118, -142, 6);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(dx - 2, dy, 58, 0, 7); ctx.fill();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.arc(dx - 2, dy, 44, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx + 16, dy - 14, 7, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* One barrel of her binoculars seen head-on: black rim, white ring, dark glass, and in the glass whatever `kind` says. */
  function lens(ctx, x, y, r, kind, eye, seed) {
    IB.oval(ctx, x, y, r, r, { fill: C.ink, w: 2.2, seed, n: 16 });
    IB.oval(ctx, x, y, r * 0.86, r * 0.86, { fill: C.paper, w: 0, n: 16 });
    IB.oval(ctx, x, y, r * 0.74, r * 0.74, { fill: C.ink, w: 0, n: 14 });
    const ex = x + eye[0], ey = y + eye[1];
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r * 0.74, 0, 7); ctx.clip();   // her eye is behind the glass: it cannot spill onto the rim
    if (kind === 'eye') {
      IB.ink(ctx, [[ex - 9, ey + 1], [ex - 3, ey - 4], [ex + 4, ey - 4], [ex + 9, ey + 1], [ex + 3, ey + 3.5], [ex - 4, ey + 3.5]], { closed: true, fill: C.paper, w: 0, wob: 0 });
      IB.oval(ctx, ex + eye[0] * 0.3, ey + 2.5, 3.6, 3.6, { fill: GREEN, w: 0, n: 8 });
      IB.oval(ctx, ex + eye[0] * 0.3, ey + 2.5, 1.7, 1.7, { fill: C.ink, w: 0, n: 6 });
    } else if (kind === 'squint') IB.ink(ctx, [[ex - 8, ey + 1], [ex, ey - 4], [ex + 8, ey + 1]], { w: 3, color: C.paper, seed: seed + 1, grain: 0 });
    else if (kind === 'wide') {
      IB.ink(ctx, [[ex - 10, ey], [ex - 4, ey - 6], [ex + 4, ey - 6], [ex + 10, ey], [ex + 4, ey + 6], [ex - 4, ey + 6]], { closed: true, fill: C.paper, w: 0, wob: 0 });
      IB.oval(ctx, ex, ey, 5.4, 5.4, { fill: GREEN, w: 0, n: 10 });
      IB.oval(ctx, ex, ey, 3.6, 3.6, { fill: C.paper, w: 0, n: 8 });
      IB.oval(ctx, ex, ey, 2.2, 2.2, { fill: C.ink, w: 0, n: 8 });
    }
    ctx.restore();
  }

  /* watcher(ctx, pose, opts) — her at the window, from the waist up, behind its glass (she is clipped to the window's opening: sleeves that reach its edges end there).
   pose: arms 'up': hx, hy shift hands and binoculars and carry the head with them at 0.55 of that; a large negative hx also turns the binoculars, so the right barrel shows its side; big enlarges the lenses; eye is where her eye sits inside each lens (px off its centre); lens is what shows in the glass: 'eye' (white almond, green iris), 'dark' (a blink), 'squint' (an arc), 'wide' (round, the green ring of the opening). arms 'down': drop lowers hands and binoculars (px), fore 0..1 foreshortens the barrels (1 = full length), face is 'wide' | 'half' | 'closed'.
     POSE: up (binoculars at her eyes, looking straight out). MOVE, in frames from each one's first drawing: scanRight, swingLeft, find, lower. IB.watcher.FOCUS is the point between her lenses, for a camera that pulls back from them; opts.at puts it elsewhere, with opts.s and opts.flip (IB.place). */
  IB.watcher = (ctx, p, o = {}) => {
    const isUp = p.arms === 'up', hx = isUp ? p.hx : 0, hy = isUp ? p.hy : 0;
    const mir = (pts) => pts.map(([x, y]) => [2 * HX - x, y]), H = (pts, k = 0.55) => pts.map(([x, y]) => [x + hx * k, y + hy * k]);
    ctx.save();
    IB.place(ctx, IB.watcher.FOCUS, o);
    ctx.beginPath(); ctx.rect(1083, 368, 250, 407); ctx.clip();   // she is inside the window: sleeves that reach its edges end there

    // ---- below the rail: skirt, sweater, and when the arms are down the arms, hands and binoculars
    IB.box(ctx, 1146, 683, 120, 68, { fill: SKIRT, w: 2.5, seed: 300 });
    if (isUp) {
      // sleeves run straight out to the window's edges while the arms are up
      IB.ink(ctx, [[1080, 534], [1334, 534], [1334, 575], [1300, 568], [1268, 560], [1274, 684], [1136, 684], [1143, 560], [1112, 568], [1080, 575]], { closed: true, smooth: false, fill: C.mint, w: 2.5, seed: 301 });
      IB.seg(ctx, 1120, 553, 1139, 536, { w: 2.2, seed: 302 });
      IB.seg(ctx, 1273, 536, 1293, 550, { w: 2.2, seed: 303 });
    } else {
      const d = p.drop, k = p.fore;
      IB.ink(ctx, [[1128, 534], [1282, 534], [1274, 684], [1134, 684]], { closed: true, smooth: false, fill: C.mint, w: 2.5, seed: 301 });
      // each arm: shoulder, out past the window's edge at the elbow, forearm back in to the cuff
      const armL = [[1128, 532], [1104, 572], [1088, 610 + d * 0.4], [1078, 640 + d * 0.7], [1080, 662 + d * 0.8], [1150, 642 + d], [1142, 616 + d], [1140, 560]];
      for (const [arm, sd] of [[armL, 330], [mir(armL).map(([x, y]) => [x + 6, y + 2]), 340]]) {
        IB.ink(ctx, arm, { closed: true, fill: C.mint, w: 0, seed: sd });
        IB.ink(ctx, arm.slice(0, 7), { w: 2.5, seed: sd });
        IB.ink(ctx, [arm[7], [arm[7][0], arm[7][1] + 52 + d * 0.6]], { w: 2.3, smooth: false, seed: sd + 1 });          // where the arm lies against the body
        const s = arm === armL ? 1 : -1;
        IB.ink(ctx, [[arm[6][0] - 42 * s, arm[6][1] + 12], arm[6]], { w: 2.3, smooth: false, seed: sd + 2 });            // top of the forearm
        IB.seg(ctx, arm[6][0] - 20 * s, arm[6][1] + 16, arm[6][0] - 12 * s, arm[6][1] + 31, { w: 2, seed: sd + 3 });     // a fold above the cuff
      }
      // binoculars held low, lenses toward the floor: two white barrels and the black of the glass seen from below
      const by = 640 + d, top = by - 72 * k;
      for (const [s, sd] of [[-1, 350], [1, 355]]) {
        const cx = 1201 + s * 20;
        IB.ink(ctx, [[cx - s * 2 - 12, top + 9], [cx - s * 2 - 6, top], [cx - s * 2 + 6, top], [cx - s * 2 + 12, top + 9], [cx + 18, by - 2], [cx - 18, by - 2]], { closed: true, fill: C.paper, w: 2.2, seed: sd });
        if (k > 0.8) IB.ink(ctx, [[cx - 15, by - 28], [cx, by - 24], [cx + 15, by - 28]], { w: 1.7, seed: sd + 1 });
        IB.oval(ctx, cx, by, 20, 12 + 3 * (1 - k), { fill: C.paper, w: 2.2, seed: sd + 2, n: 14 });
        IB.oval(ctx, cx, by, 14.5, 8 + 3 * (1 - k), { fill: C.ink, w: 0, n: 12 });
      }
      // hands: each a mitt gripping a barrel from the side, two finger lines across it
      const handL = [[1142, 617 + d], [1157, 597 + d], [1174, 594 + d], [1181, 607 + d], [1168, 617 + d], [1165, 629 + d], [1151, 641 + d]];
      for (const [hand, s, sd] of [[handL, 1, 360], [mir(handL).map(([x, y]) => [x + 6, y + 2]), -1, 365]]) {
        IB.ink(ctx, hand, { closed: true, fill: SKIN, w: 2.2, seed: sd });
        const o = hand[3];
        IB.seg(ctx, o[0] - 16 * s, o[1] + 1, o[0] - 2 * s, o[1] - 2, { w: 1.5, seed: sd + 1 });
        IB.seg(ctx, o[0] - 15 * s, o[1] + 8, o[0] - 6 * s, o[1] + 6, { w: 1.5, seed: sd + 2 });
      }
    }

    // ---- above the rail: hair, face, neck and shoulders, and when the arms are up the hands and binoculars
    const hair = []; for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; hair.push([HX - 1 + hx * 0.3 + Math.cos(a) * 87 * (i % 2 ? 1 : 0.92), 447 + hy * 0.3 + Math.sin(a) * (isUp ? 59 : 61) * (i % 2 ? 1 : 0.92)]); }
    IB.ink(ctx, hair, { closed: true, fill: C.ink, w: 2, seed: 304 });
    // turtleneck and shoulders go on before the face: her chin sits in front of the collar
    IB.ink(ctx, isUp ? [[1150, 520], [1163, 508], [1187, 503], [1189, 486], [1222, 486], [1224, 503], [1248, 508], [1260, 520]] : [[1146, 520], [1160, 510], [1187, 506], [1189, 484], [1222, 484], [1224, 506], [1250, 510], [1264, 520]], { closed: true, fill: C.mint, w: 2.4, seed: 318 });
    IB.seg(ctx, 1188, 502, 1223, 502, { w: 1.8, seed: 319 });
    IB.ink(ctx, H([[1177, 442], [1181, 424], [1191, 414], [1198, 412], [1204, 418], [1213, 412], [1225, 416], [1233, 428], [1235, 446], [1231, 469], [1219, 486], [1205, 491], [1191, 486], [1181, 469]]), { closed: true, fill: SKIN, w: 2.2, seed: 305 });
    for (const s of [-1, 1]) IB.ink(ctx, H([[HX + s * 25, 434], [HX + s * 18, 430], [HX + s * 12, 432]]), { w: 2, seed: 306 + s });                     // brows
    IB.seg(ctx, 1200 + hx * 0.7, 475 + hy * 0.55, 1209 + hx * 0.7, 475 + hy * 0.55, { w: 2, seed: 309 });                                                              // mouth
    if (!isUp) {
      for (const [x, y, r] of [[1175, 466, 7], [1237, 462, 8]]) IB.oval(ctx, x, y, r, r + 3, { fill: C.ink, w: 0, n: 8 });                             // curls lying on the cheeks
      IB.ink(ctx, [[1199, 444], [1200, 460], [1207, 461]], { w: 2, seed: 310 });                                                                        // nose
      for (const s of [-1, 1]) {
        const x = HX + s * 14, y = 443;
        if (p.face === 'wide') { IB.oval(ctx, x, y, 6.2, 3.8, { fill: C.paper, w: 1.6, seed: 311 + s, n: 10 }); IB.oval(ctx, x, y, 2, 2, { fill: C.ink, w: 0, n: 6 }); }
        else if (p.face === 'half') { IB.seg(ctx, x - 6, y, x + 6, y, { w: 2.6, seed: 311 + s }); IB.ink(ctx, [[x - 4, y + 3], [x, y + 4], [x + 4, y + 3]], { w: 1.2, seed: 313 + s }); }
        else IB.ink(ctx, [[x - 6, y], [x, y + 2], [x + 6, y]], { w: 1.8, seed: 311 + s });
      }
    }
    // with the arms up: a forearm and hand each side of the face, rising from the cuffs to the barrels
    if (isUp) {
      const handL = [[1140 + hx * 0.3, 502], [1149 + hx * 0.6, 470 + hy], [1158 + hx, 450 + hy], [1166 + hx, 441 + hy], [1178 + hx, 442 + hy], [1183 + hx, 474 + hy], [1172 + hx * 0.4, 502]];
      const handR = mir([[1140 - hx * 0.3, 502], [1149 - hx * 0.6, 470 + hy], [1158 - hx, 450 + hy], [1166 - hx, 441 + hy], [1178 - hx, 442 + hy], [1183 - hx, 474 + hy], [1172 - hx * 0.4, 502]]);
      IB.ink(ctx, handL, { closed: true, fill: SKIN, w: 2.2, seed: 316 });
      IB.ink(ctx, handR, { closed: true, fill: SKIN, w: 2.2, seed: 317 });
    }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) IB.oval(ctx, HX + s * (26 - i * 3.2), 501 + i * 5, 3.1, 3.1, { fill: C.paper, w: 1.5, seed: 320 + i + s, n: 6 });   // necklace, a strand each side of the collar
    if (isUp) {
      for (const s of [-1, 1]) { IB.ink(ctx, [[HX + s * 108, 520], [HX + s * 69, 494], [HX + s * 46, 520]], { closed: true, smooth: false, fill: C.mint, w: 2.4, seed: 326 + s }); IB.seg(ctx, HX + s * 82, 509, HX + s * 74, 519, { w: 2, seed: 328 + s }); }
      // the cuffs of both sleeves stand above the rail as two peaks; then the binoculars: the barrel on the side she turns toward is nearer and so larger
      const turn = hx / 27, gap = 29 - Math.abs(hx) * 0.18, y = 462 + hy, cx = HX + hx, R = 21 * p.big, away = -Math.sign(hx);
      if (turn < -0.5) {   // turned left: the right barrel shows its length, two rings round it (turned right, the reference shows no more than a wider rim)
        const bx = cx + away * gap, len = 15 * Math.abs(turn);
        IB.ink(ctx, [[bx, y - R * 0.95], [bx + away * (len + R * 0.5), y - R * 0.8], [bx + away * (len + R * 0.75), y], [bx + away * (len + R * 0.5), y + R * 0.8], [bx, y + R * 0.95]], { closed: true, fill: C.paper, w: 2, seed: 330 });
        for (const k of [0.45, 0.8]) IB.ink(ctx, [[bx + away * (R * 0.6 + len * k), y - R * 0.82], [bx + away * (R * 0.78 + len * k), y], [bx + away * (R * 0.6 + len * k), y + R * 0.82]], { w: 1.6, seed: 338 + k * 10 });
      }
      IB.tube(ctx, [[cx - 14, y - 12], [cx, y - 19], [cx + 14, y - 12]], { w: 7, edge: 1.8, fill: C.paper, smooth: true, seed: 331 });
      IB.ink(ctx, [[cx - 4 - hx * 0.3, y - 14], [cx - 4 - hx * 0.3, y + 2 - hy * 0.4], [cx + 4 - hx * 0.3, y + 2 - hy * 0.4], [cx + 4 - hx * 0.3, y - 14]], { w: 1.8, smooth: false, seed: 332 });   // her nose between the barrels
      lens(ctx, cx - gap, y, R * (1 - turn * 0.06), p.lens, p.eye, 333);
      lens(ctx, cx + gap, y, R * (1 + turn * 0.06), p.lens, p.eye, 334);
      IB.oval(ctx, cx, y - 19, 4.6, 4.6, { fill: C.paper, w: 1.7, seed: 335, n: 8 });
      for (const s of [-1, 1]) for (const dy of [-4, 4]) IB.seg(ctx, cx + s * (gap + R * 0.86), y + dy, cx + s * (gap + R * 0.43), y + dy + 2, { w: 1.5, seed: 336 + s + dy });   // fingertips over the rims
    }
    ctx.restore();
  };
  IB.watcher.FOCUS = [HX, 462];
  const UP = { arms: 'up', hx: 0, hy: 0, eye: [0, 3], lens: 'eye', big: 1 };
  const up = (o) => ({ ...UP, ...o });
  IB.watcher.POSE = { up: UP };
  IB.watcher.MOVE = {
    // scans right: the head leads, the eye arrives last
    scanRight: [
    [0, up({ hx: 8, eye: [2, 2] })], [2, up({ hx: 17, eye: [4, 1] })], [4, up({ hx: 24, eye: [5, 0] })], [6, up({ hx: 25, eye: [6, 0] })],
    ],
    // swings left and up, through a blink
    swingLeft: [
    [0, up({ hx: 12, eye: [2, 0] })], [2, up({ hx: -4, hy: -5, lens: 'dark' })], [4, up({ hx: -18, hy: -10, eye: [-4, 0] })], [6, up({ hx: -29, hy: -15, eye: [-6, -1] })], [8, up({ hx: -27, hy: -14, eye: [-5, 0] })],
    [18, up({ hx: -27, hy: -14, eye: [-3, 1] })], [22, up({ hx: -27, hy: -14, lens: 'dark' })], [24, up({ hx: -27, hy: -14, eye: [-6, 1] })],
    [28, up({ hx: -27, hy: -14, eye: [-5, 1] })], [30, up({ hx: -28, hy: -12, eye: [-6, 1] })], [32, up({ hx: -30, hy: -10, eye: [-6, 1] })],
    ],
    // swings back blind, finds it low, then lifts the binoculars and her eyes are wide and green: the eyes of the opening
    find: [
    [0, up({ hx: -6, hy: 2, lens: 'dark' })], [2, up({ hy: 2, eye: [-1, 3] })], [4, up({ hy: 1, eye: [1, 3] })],
    [6, up({ hy: -15, lens: 'wide', big: 1.1 })],
    [33, up({ hy: -15, lens: 'dark', big: 1.1 })], [37, up({ hy: -15, lens: 'wide', big: 1.1 })],
    ],
    // down they come: a dip first, then half-way, past, back, rest
    lower: [
    [0, up({ hy: 1, lens: 'wide' })],
    [2, { arms: 'down', drop: -40, fore: 0.45, face: 'wide' }], [4, { arms: 'down', drop: 6, fore: 1, face: 'wide' }], [6, { arms: 'down', drop: -2, fore: 1, face: 'wide' }], [8, { arms: 'down', drop: 0, fore: 1, face: 'wide' }],
    [17, { arms: 'down', drop: 0, fore: 1, face: 'half' }], [19, { arms: 'down', drop: 0, fore: 1, face: 'closed' }], [23, { arms: 'down', drop: 0, fore: 1, face: 'half' }],
    ],
  };
})(window);
