/* cast/closeup.js — the two faces behind fencing masks from the reference's first spot, as full-frame inserts: everything is drawn in a 1920x1080 frame and the mesh of the mask lies over it. Their acting is brows and lids only, on twos, while the whole frame (head and mask as one) tilts and sinks. Forms were read off the reference on a 100 px grid (STYLE.md "insert"). Needs ink.js and marks.js; adds to the global IB. Used by insert/mesh-eyes-whip. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const SKIN = '#cfbba0', SHADE = '#867968', MESH = '#d9d7d6', BROW_B = '#948da1';
  /* The colours of these inserts: skin under the mask, the shadow above the eye line, the mesh, the paler face's brow. A scene tints its whip with skin and shade. */
  IB.MASK = { skin: SKIN, shade: SHADE, mesh: MESH, brow: BROW_B };

  /* A face and its mesh fill a 1920 x 1080 frame (the face paints the shadow colour far beyond its skin), so when one is moved (opts.at, opts.s, opts.flip) the frame goes with it and nothing is drawn outside it: a smaller insert. */
  const frame = (ctx, o) => {
    if (o.at == null && (o.s == null || o.s === 1) && !o.flip) return;
    IB.place(ctx, [960, 540], o);
    IB.clipRect(ctx, [0, 0, 1920, 1080]);
  };

  /* Both faces and the mesh fill a 1920 x 1080 frame about its centre [960, 540]; opts.at, opts.s and opts.flip move that centre and clip to the moved frame, for a face in a window or a smaller insert. Give the face and the mesh the same opts.
     closeup(ctx, pose, draw, dx) — frame an insert: the whole drawing (face and mesh together) scaled by pose.zoom about the frame's centre, tilted pose.rot, shifted pose.dx / pose.dy, plus dx for the sideways shove of a whip. draw() paints the 1920x1080 frame inside. */
  IB.closeup = (ctx, p, draw, dx = 0) => {
    ctx.save();
    ctx.translate(960 + p.dx + dx, 540 + p.dy); ctx.rotate(p.rot); ctx.scale(p.zoom, p.zoom); ctx.translate(-960, -540);
    draw();
    ctx.restore();
  };

  /* maskMesh(ctx) — the fencing mask's wire mesh over a full-frame face: lines 11 px wide about 125 px apart, bowed outward like a lens. It is fixed to the mask, so draw it inside the same IB.closeup as the face. */
  IB.maskMesh = (ctx, o = {}) => {
    ctx.save();
    frame(ctx, o);
    const bow = (v, o) => 1 + 0.07 * (1 - Math.pow(o / 760, 2)) * (Math.abs(v) / 960);
    for (let i = -9; i <= 9; i++) {
      const x0 = i * 125 + 40, pts = [];
      for (let y = -120; y <= 1200; y += 80) pts.push([960 + x0 * bow(x0, y - 540), y]);
      IB.ink(ctx, pts, { w: 11, color: MESH, seed: 900 + i, taper: false, wob: 0.5 });
    }
    for (let j = -6; j <= 6; j++) {
      const y0 = j * 122 + 30, pts = [];
      for (let x = -160; x <= 2080; x += 120) pts.push([x, 540 + y0 * bow(y0 * 1.6, x - 960)]);
      IB.ink(ctx, pts, { w: 11, color: MESH, seed: 930 + j, taper: false, wob: 0.5 });
    }
    ctx.restore();
  };

  /* Everything on a face is drawn for the eye on screen-left and mirrored about the face's centre line for the other (IB.mirror); irises are placed per eye, because both look the same way. */
  function skin(ctx, outline) {
    ctx.fillStyle = SHADE; ctx.fillRect(-2400, -600, 6800, 2400);
    IB.ink(ctx, outline, { closed: true, smooth: false, fill: SKIN, w: 0, wob: 0 });   // straight along the visor's shadow, slanting away down both cheeks
  }
  /* An eye: the white as a filled almond, then (after the caller has drawn anything that belongs inside the eye) the iris and its glint clipped to it. Returns the function that draws the iris and ends the clip: it must be called. */
  function eyeball(ctx, almond, iris, r, glint, white, seed) {
    IB.ink(ctx, almond, { closed: true, fill: white, w: 0, seed, wob: 0.3 });
    ctx.save();
    ctx.beginPath(); almond.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
    return () => { IB.oval(ctx, iris[0], iris[1], r, r, { fill: C.ink, w: 0, n: 18 }); IB.oval(ctx, glint[0], glint[1], r * 0.18, r * 0.18, { fill: '#d5d5d5', w: 0, n: 8 }); ctx.restore(); };
  }

  /* boldFace(ctx, pose) — the confident fencer: dark heavy brows, grey whites in the mask's shadow. pose.scowl 0..1 lowers the brows (inner ends 24 px) and the upper lids until they cut across the iris.
     POSE: rest, and the three drawings of the scowl going in. MOVE.scowl (frames from its first drawing): three drawings in, the head tilting 0.018 rad and sinking 14 then 10 px more, a hold of 4 frames, and back out through the same drawings. */
  IB.boldFace = (ctx, p, o = {}) => {
    ctx.save();
    frame(ctx, o);
    const CX = 934, M = IB.mirror(CX), k = p.scowl, VISOR = 445;
    skin(ctx, [[130, VISOR], [1845, VISOR], [1880, 560], [1902, 700], [1910, 1200], [14, 1200], [20, 930], [70, 680]]);
    for (const side of [0, 1]) {
      const m = side ? M : (q) => q, sx = side ? -1 : 1;
      // upper lid: the scowl drops its middle 33 px and leaves the corners where they are
      const lidTop = [[250, 426], [300, 364 + k * 20], [385, 312 + k * 30], [500, 297 + k * 33], [600, 332 + k * 28], [660, 400 + k * 12], [695, 464]];
      const almond = m(lidTop.concat([[600, 472], [480, 478], [330, 456]]));
      const iris = side ? [1398, 407] : [490, 403];
      const done = eyeball(ctx, almond, iris, 92, [iris[0] - 32, iris[1] - 54 + k * 30], '#a7a7a7', 10 + side);
      ctx.fillStyle = '#dedede'; ctx.fillRect(0, VISOR + 4, 1920, 60);   // below the visor's shadow line the white of the eye is lit
      done();
      IB.ink(ctx, m(lidTop), { w: 17, seed: 12 + side, wob: 0.5 });
      IB.ink(ctx, m([[640, 440], [690, 470], [702, 482]]), { w: 6, seed: 14 + side });                 // the lash that runs on past the inner corner
      // brow: thin and high at the temple, thick and low over the nose; the scowl turns it about its outer end
      const a = k * 0.05 * sx, c = Math.cos(a), sn = Math.sin(a), turn = (pts) => pts.map(([x, y]) => { const X = 2 * (side ? CX : 0) + (side ? -x : x), dx = X - (side ? 2 * CX - 220 : 220), dy = y - 195; return [X - dx + dx * c - dy * sn, y - dy + dx * sn + dy * c]; });
      IB.ink(ctx, turn([[220, 190], [300, 176], [385, 168], [470, 172], [557, 188], [640, 228], [698, 270], [718, 296], [708, 312], [686, 310], [634, 286], [560, 250], [480, 222], [400, 208], [320, 202], [227, 203]]), { closed: true, fill: C.ink, w: 3, seed: 20 + side });
    }
    // nose: one open stroke, graphite at the nostril line, and the hard shadow it throws below
    IB.ink(ctx, [[800, 952], [940, 962], [1090, 946], [1046, 1012], [920, 1036], [818, 1002]], { closed: true, fill: SHADE, w: 0, wob: 0 });
    IB.ink(ctx, [[837, 576], [792, 680], [748, 790], [739, 873], [806, 940], [921, 959], [1046, 940], [1113, 873], [1110, 783]], { w: 12, seed: 50 });
    IB.smudge(ctx, [[850, 912], [920, 926], [1000, 916]], { seed: 54, wob: 1.5 });
    ctx.restore();
  };
  const A0 = { scowl: 0, zoom: 1, dx: 0, dy: 0, rot: 0 };
  const A6 = { ...A0, scowl: 0.12 }, A8 = { ...A0, scowl: 0.45 }, A10 = { ...A0, scowl: 0.8 }, A12 = { ...A0, scowl: 1, rot: 0.018, dy: 14, zoom: 1.02 };
  IB.boldFace.POSE = { rest: A0, narrow: A6, frown: A8, glare: A10, scowl: A12 };
  IB.boldFace.MOVE = { scowl: [[0, A6], [2, A8], [4, A10], [6, A12], [8, { ...A12, dy: 24, zoom: 1.025 }], [12, A12], [14, A10], [16, A8]] };   // back out through the drawings it went in by

  /* worriedFace(ctx, pose) — the anxious fencer: a little smaller and lower in frame, pale outlined brows, freckles, white eyes. pose.lids 0..1 opens the eyes from slits; pose.worry 0..1 raises the brows into an arch (inner ends 110 px); pose.drop is the length of the sweat drop hanging from a fixed point on the temple (0 for none).
     POSE: squint (how it enters) and alarmed. MOVE.alarm (frames from its first drawing): the eyes widen and the brows rise over three drawings, then the face is dead still while only the drop grows on twos, 74 to 160 px. */
  IB.worriedFace = (ctx, p, o = {}) => {
    ctx.save();
    frame(ctx, o);
    const CX = 960, M = IB.mirror(CX), VISOR = 470;
    skin(ctx, [[130, VISOR], [1760, VISOR], [1850, 600], [1918, 740], [1904, 1200], [40, 1200], [10, 650], [60, 540]]);
    for (const side of [0, 1]) {
      const m = side ? M : (q) => q;
      const shut = (1 - p.lids) * 62, lidTop = [[250, 514], [300, 468 + shut * 0.55], [380, 428 + shut * 0.9], [460, 407 + shut], [540, 422 + shut * 0.9], [620, 462 + shut * 0.55], [682, 503]];
      const iris = side ? [1398, 490] : [470, 490];
      eyeball(ctx, m(lidTop.concat([[640, 532], [460, 537], [300, 530]])), iris, 82, [iris[0] - 25, iris[1] - 30], C.paper, 30 + side)();
      IB.ink(ctx, m(lidTop), { w: 16, seed: 32 + side, wob: 0.5 });
      IB.ink(ctx, m([[640, 478], [700, 512], [716, 524]]), { w: 6, seed: 34 + side });
      // brow: pale, outlined, blunt over the nose and tapering to the temple; worry lifts the inner end 110 px and the outer end 58
      const lift = (pts) => pts.map(([x, y]) => [x, y + (1 - p.worry) * (58 + (52 * (x - 134)) / 590)]);
      IB.ink(ctx, m(lift([[134, 230], [190, 184], [250, 148], [384, 90], [480, 72], [576, 66], [722, 72], [728, 104], [576, 106], [480, 112], [384, 128], [300, 156], [240, 190]])), { closed: true, fill: BROW_B, w: 7, seed: 40 + side });
    }
    ctx.fillStyle = C.ink;
    for (const [x, y] of [[610, 710], [470, 762], [591, 802], [349, 810], [399, 946], [1229, 687], [1338, 783], [1223, 797], [1492, 787], [1319, 883], [1450, 918]]) { ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); }   // freckles
    IB.ink(ctx, [[790, 1016], [1100, 1016], [1070, 1090], [830, 1090]], { closed: true, fill: SHADE, w: 0, wob: 0 });
    IB.ink(ctx, [[797, 374], [826, 470], [841, 556], [824, 610]], { w: 10, seed: 52 });                                   // the bridge, on the side away from the light
    IB.ink(ctx, [[1052, 576], [1062, 680], [1078, 770], [1112, 880], [1104, 968], [1040, 1024], [921, 1040], [826, 1018], [768, 950], [758, 872], [770, 806], [803, 758]], { w: 12, seed: 51 });
    IB.smudge(ctx, [[850, 990], [925, 1004], [1000, 994]], { seed: 55, wob: 1.5 });
    if (p.drop) {   // a sweat drop on the temple: a point at the top, a bulb at the bottom
      const len = p.drop, y = 380, x = 1822, r = Math.min(29, len * 0.3), by = y + len - r;
      IB.ink(ctx, [[x - 4, y], [x - r * 0.75, by - r * 0.7], [x - r, by], [x - r * 0.7, by + r * 0.72], [x, by + r], [x + r * 0.7, by + r * 0.72], [x + r, by], [x + r * 0.7, by - r * 0.7], [x + 2, y + len * 0.3]], { closed: true, fill: SHADE, w: 7, seed: 60 });
      if (len > 60) IB.ink(ctx, [[x - r * 0.45, by - r * 0.1], [x - r * 0.3, by + r * 0.4]], { w: 4, color: C.paper, seed: 61, grain: 0 });
    }
    ctx.restore();
  };
  const B0 = { lids: 0.3, worry: 0, zoom: 0.97, dx: 0, dy: 24, rot: 0, drop: 20 };
  const B40 = { ...B0, lids: 1, worry: 1, zoom: 1.02, dy: 0 };
  IB.worriedFace.POSE = { squint: B0, alarmed: B40 };
  IB.worriedFace.MOVE = { alarm: [
    [0, { ...B0, lids: 0.65, zoom: 1, dy: 8, rot: -0.02, worry: 0.15, drop: 30 }],
    [2, { ...B40, lids: 0.9, worry: 0.65, drop: 50 }],
    [4, { ...B40, drop: 74 }],
    ...[[6, 96], [8, 114], [10, 130], [12, 142], [14, 152], [16, 158], [18, 160]].map(([f, drop]) => [f, { ...B40, drop }]),
  ] };
})(window);
