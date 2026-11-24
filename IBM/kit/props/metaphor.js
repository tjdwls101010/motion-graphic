/* props/metaphor.js — the plain objects explainer metaphors are built from in the IBM look: bars that rise, planks, dominoes, a flag. One flat fill each inside a brush-pen outline, graphite where they meet the floor, chalk smear for the floor. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { clamp } = MG;

  /* bar(ctx, at, opts) — a bar of a bar chart standing on the floor, risen to `u` (0..1) of its height `h`: its own chalk smear (fading in with the rise), the box, graphite at its foot. `at` is the floor under its centre. Rise it on IB.settle read on twos (tau 0.1: 57% on the first drawing); below u 0.01 nothing is drawn (metaphor/bars-rise-climber). */
  IB.bar = (ctx, [x, floor], o = {}) => {
    const { h: full = 200, u = 1, w: BW = 170, fill = C.paper, seed = 200 } = o;
    if (u < 0.01) return;   // the beat's own drawing shows nothing yet: the bar is first seen one drawing later, already 57% up
    const h = full * u;
    ctx.save();
    IB.smear(ctx, x, floor - 4, BW * 1.25, { h: 10, seed: seed + 5, alpha: clamp(u * 2) });
    IB.box(ctx, x - BW / 2, floor - h, BW, h, { fill, w: 3.4, seed });
    IB.shade(ctx, x - BW / 2 + 3, floor - Math.min(h, 46), BW - 6, Math.min(h, 46) - 2, { from: 'bottom', seed: seed + 1, alpha: 0.45 });
    ctx.restore();
  };

  /* flag(ctx, at, state, opts) — a pole 250 px tall planted at `at` with a pennant at its top. state: grown, how much of the pole is drawn (draw it on in two drawings: 0.5, 1); flap null for no cloth yet, or 0 / 1, the two drawings of the cloth fluttering (alternate them on threes) (metaphor/bars-rise-climber). */
  IB.flag = (ctx, [px, base], st = {}, o = {}) => {
    const { grown = 1, flap = null } = st, { fill = C.green, seed = 300 } = o;
    ctx.save();
    IB.seg(ctx, px, base, px, base - 250 * grown, { w: 3.4, seed });
    if (flap != null) IB.ink(ctx, [[px, base - 248], [px + 64, base - 232 + flap * 8], [px + 118 - flap * 10, base - 208 - flap * 6], [px + 60, base - 190 + flap * 6], [px, base - 172]], { closed: true, fill, w: 3, seed: seed + 1 + flap });
    ctx.restore();
  };

  /* domino(ctx, at, state, opts) — a domino 44 x 160 px (times `s`) standing on the floor, tipped `deg` degrees to the right about its lower right corner `at`. Pips by `face` (any whole number: the top half shows 1-3 pips by face % 3, the bottom 1-2 by face % 2), so a row of them is not all alike (metaphor/dominoes-chain-stop). */
  IB.domino = (ctx, at, st = {}, o = {}) => {
    const { deg = 0, face = 0 } = st, { s: S = 1.3, fill = C.paper, seed = 100 } = o, i = face;
    ctx.save();
    ctx.translate(at[0], at[1]); ctx.rotate(deg * (Math.PI / 180)); ctx.scale(S, S);
    IB.box(ctx, -44, -160, 44, 160, { fill, w: 3.4 / S, seed });
    IB.seg(ctx, -38, -80, -6, -80, { w: 2 / S, seed: seed + 1 });
    ctx.fillStyle = C.ink;
    for (const [x, y] of i % 3 === 0 ? [[-22, -118]] : i % 3 === 1 ? [[-30, -130], [-14, -104]] : [[-30, -132], [-22, -118], [-14, -104]]) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); }
    for (const [x, y] of i % 2 ? [[-22, -42]] : [[-30, -54], [-14, -30]]) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  /* dominoRest(next, gap, w, h) — the angle (degrees from upright) at which a domino comes to rest on its right-hand neighbour when that neighbour is at `next` degrees; both pivot on their lower right corners `gap` apart, each w x h. Two ways they can touch: this one's top right corner on the neighbour's left face, or the neighbour's top left corner on this one's right face; the answer is the largest angle at which neither goes through. Leaning rigid things need this: an angle set by hand overlaps on some drawing. */
  IB.dominoRest = (next, GAP, DW, DH) => {
    const DEG = Math.PI / 180;
    const b = next * DEG, un = [Math.sin(b), -Math.cos(b)], rn = [Math.cos(b), Math.sin(b)];   // the neighbour's up and right
    const L = [GAP - DW * rn[0], -DW * rn[1]], TL = [L[0] + DH * un[0], L[1] + DH * un[1]];    // its lower left and top left corners, from this one's pivot
    const clear = (deg) => {
      const a = deg * DEG, u = [Math.sin(a), -Math.cos(a)], r = [Math.cos(a), Math.sin(a)], cx = DH * u[0] - L[0], cy = DH * u[1] - L[1];
      let m = Infinity;
      const up = cx * un[0] + cy * un[1]; if (up >= 0 && up <= DH) m = Math.min(m, -(cx * rn[0] + cy * rn[1]));
      const mine = TL[0] * u[0] + TL[1] * u[1]; if (mine >= 0 && mine <= DH) m = Math.min(m, TL[0] * r[0] + TL[1] * r[1]);
      return m;
    };
    let lo = 0, hi = 90;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (clear(mid) >= 0) lo = mid; else hi = mid; }
    return lo;
  };

  /* ledge(ctx, at, opts) — one side of a gap: a white cliff whose top edge is at `at` = [edge x, top y], running off-screen to the left (side 'left') or right, graphite down its face and a few cracks. Two of them make the gap a plank bridges (metaphor/bridge-plank-cross). */
  IB.ledge = (ctx, [wall, TOP], o = {}) => {
    const { side = 'left', seed = 100 } = o, left = side === 'left', x0 = left ? -40 : wall, x1 = left ? wall : 1960;
    ctx.save();
    IB.ink(ctx, [[x0, TOP], [x1, TOP], [x1, 1120], [x0, 1120]], { closed: true, smooth: false, fill: C.paper, w: 3.8, seed: seed + wall });
    IB.shade(ctx, left ? wall - 70 : wall + 4, TOP + 6, 66, 370, { from: left ? 'right' : 'left', seed: seed - 89 + wall, alpha: 0.5 });
    for (let i = 0; i < 4; i++) IB.seg(ctx, wall + (left ? -1 : 1) * (130 + i * 150), TOP + 60 + (i % 2) * 80, wall + (left ? -1 : 1) * (190 + i * 150), TOP + 60 + (i % 2) * 80, { w: 2, seed: seed + 10 + i + wall });
    ctx.restore();
  };

  /* plank(ctx, state, opts) — a mustard plank `thick` px thick and ends[1] - ends[0] long, in one of three drawings. state.lie: lying from ends[0] to ends[1] on ledges whose edges are `edges`, its top at `top`, sagging into a V at sag = [x, depth] under a weight (or flat). state.held: [x, y, rot], carried with its grip point `grip` px from the left end. state.swing: [hinge x, hinge y], the one drawing of it swinging down onto the far ledge, stretched along its arc with two speed arcs (metaphor/bridge-plank-cross). */
  IB.plank = (ctx, st = {}, o = {}) => {
    const { ends: PLANK = [688, 1244], edges: [LEFT, RIGHT] = [700, 1220], top: TOP = 700, thick: THICK = 18, grip = 300, seed = 200 } = o;
    ctx.save();
    if (st.lie) {
      const sag = st.sag, line = [[PLANK[0], 0], [LEFT, 0], ...(sag ? [[sag[0], sag[1]]] : []), [RIGHT, 0], [PLANK[1], 0]];
      IB.ink(ctx, line.map(([x, d]) => [x, TOP - THICK + d]).concat(line.slice().reverse().map(([x, d]) => [x, TOP + d])), { closed: true, smooth: false, fill: C.mustard, w: 3, seed });
    } else if (st.held) {
      const [x, y, rot] = st.held;
      ctx.translate(x, y); ctx.rotate(rot);
      IB.box(ctx, -grip, -THICK / 2, PLANK[1] - PLANK[0], THICK, { fill: C.mustard, w: 3, seed });
    } else if (st.swing) {
      // one drawing: the plank halfway down and stretched along its swing, hinged where its near end will rest
      const hinge = st.swing, len = PLANK[1] - PLANK[0], pt = (deg, r) => [hinge[0] - Math.cos(deg * Math.PI / 180) * r, hinge[1] - Math.sin(deg * Math.PI / 180) * r];
      IB.ink(ctx, [pt(48, -8), pt(60, len * 0.5), pt(64, len), pt(42, len), pt(40, len * 0.5)], { closed: true, smooth: false, fill: C.mustard, w: 3, seed: seed + 10 });
      for (const r of [len * 0.9, len * 0.6]) IB.ink(ctx, IB.ellipse(hinge[0], hinge[1], r, r, 6, Math.PI + 1.2, Math.PI + 1.75), { w: 2.4, seed: seed + 11 + Math.round(r) });
    }
    ctx.restore();
  };
})(window);
