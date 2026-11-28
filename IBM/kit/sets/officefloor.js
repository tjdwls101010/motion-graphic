/* sets/officefloor.js — the big furniture of an office floor for the work scenes, seen from the front or the side like everything else: a lift whose two doors slide apart (IB.elevator), a meeting table long and deep enough for a row of sitters behind it (IB.meetingTable), a whiteboard on an easel or a wall with placeholder charts and sticky notes (IB.whiteboard), and the streaks a rolling office chair leaves (IB.chairRoll). Paper-white and grey in a brush-pen outline, graphite where things meet; colour only in one or two small places (a lit arrow, a bar, the notes). New, not measured. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const STEEL = '#d9d9d9';   // the lift doors: a grey, not a palette colour, so the shot keeps its colours for the people

  /* elevator(ctx, at, state, opts) — a lift in a wall, seen from the front: an opening w x h (300 x 440, for figures 330-340 px tall) with `at` = [its centre x, the floor line], two grey doors that slide apart into the wall, a frame round the opening, and above it an indicator with an arrow and a row of floor lamps. state.open 0..1 is how far the doors are apart (0 shut, 1 gone into the wall); state.lit lights the arrow mint and state.floor picks the lamp that is on (of opts.floors). Drawn in two layers so a rider stands between them: opts.layer 'car' draws the inside of the car (back wall, handrail, ceiling light, graphite in the corners), 'front' the doors, frame and indicator; leave it out for both. A rider who must stay hidden until the doors open, or who stands to one side of the car, is drawn clipped to the opening (IB.clipRect on the returned `opening`). Doors are machines: move state.open on ones. Returns { opening: [x, y, w, h], gap: [left door's edge, right door's edge] } (work/elevator-door-dash). */
  IB.elevator = (ctx, [x, floor], st = {}, o = {}) => {
    const { open = 0, lit = false, floor: at = 0 } = st, { w = 300, h = 440, frame: FR = 26, floors = 5, layer, lw = 3.2, seed = 900 } = o;
    const x0 = x - w / 2, y0 = floor - h, half = (w / 2) * MG.clamp(open, 0, 1), side = w * 0.11;
    ctx.save();
    if (layer !== 'front') {
      IB.box(ctx, x0, y0, w, h, { fill: C.paper, w: lw * 0.6, seed, grain: 0 });
      IB.ink(ctx, [[x0, y0], [x0 + side, y0 + h * 0.08], [x0 + side, floor - h * 0.1], [x0, floor]], { closed: true, smooth: false, fill: C.bg, w: lw * 0.8, seed: seed + 1 });   // the two side walls, in perspective
      IB.ink(ctx, [[x0 + w, y0], [x0 + w - side, y0 + h * 0.08], [x0 + w - side, floor - h * 0.1], [x0 + w, floor]], { closed: true, smooth: false, fill: C.bg, w: lw * 0.8, seed: seed + 2 });
      IB.seg(ctx, x0 + side, floor - h * 0.1, x0 + w - side, floor - h * 0.1, { w: lw * 0.8, seed: seed + 3 });
      IB.box(ctx, x - w * 0.22, y0 + h * 0.025, w * 0.44, h * 0.025, { fill: C.paper, w: lw * 0.6, seed: seed + 4 });   // the ceiling light
      IB.seg(ctx, x0 + side + 6, floor - h * 0.43, x0 + w - side - 6, floor - h * 0.43, { w: lw * 1.3, seed: seed + 5 });   // handrail
      IB.shade(ctx, x0, floor - h * 0.1, w, h * 0.1, { from: 'bottom', seed: seed + 6, alpha: 0.35 });
      IB.shade(ctx, x0, y0, side * 1.4, h, { from: 'left', seed: seed + 7, alpha: 0.3 });
      IB.shade(ctx, x0 + w - side * 1.4, y0, side * 1.4, h, { from: 'right', seed: seed + 8, alpha: 0.3 });
    }
    if (layer !== 'car') {
      // the doors: each slides from the middle into the wall, so only its part still in the opening shows
      if (half < w / 2 - 1) {
        IB.box(ctx, x0, y0, w / 2 - half, h, { fill: STEEL, w: lw, seed: seed + 10 });
        IB.box(ctx, x + half, y0, w / 2 - half, h, { fill: STEEL, w: lw, seed: seed + 11 });
        if (w / 2 - half > 30) {   // the brushed shine, a stroke inside each door near its edge
          IB.seg(ctx, x - half - 18, y0 + 30, x - half - 18, floor - 40, { w: 1.6, color: C.paper, seed: seed + 12, grain: 0 });
          IB.seg(ctx, x + half + 14, y0 + 30, x + half + 14, floor - 40, { w: 1.6, color: C.paper, seed: seed + 13, grain: 0 });
        }
      }
      // the frame round the opening, over the doors' hidden ends, and the sill
      IB.box(ctx, x0 - FR, y0 - FR, FR, h + FR, { fill: C.paper, w: lw, seed: seed + 14 });
      IB.box(ctx, x0 + w, y0 - FR, FR, h + FR, { fill: C.paper, w: lw, seed: seed + 15 });
      IB.box(ctx, x0, y0 - FR, w, FR, { fill: C.paper, w: lw, seed: seed + 16 });
      IB.seg(ctx, x0 - FR, floor - 2, x0 + w + FR, floor - 2, { w: lw * 1.4, seed: seed + 17 });
      IB.shade(ctx, x0 - FR - 10, floor - 26, w + 2 * FR + 20, 24, { from: 'bottom', seed: seed + 18, alpha: 0.4 });
      // the indicator: an arrow and the floor lamps in one plate above the frame
      const iw = 46 + floors * 26, iy = y0 - FR - 70, ix = x - iw / 2;
      IB.box(ctx, ix, iy, iw, 46, { fill: C.paper, w: lw * 0.9, seed: seed + 19 });
      IB.ink(ctx, [[ix + 12, iy + 33], [ix + 26, iy + 12], [ix + 40, iy + 33]], { closed: true, smooth: false, fill: lit ? C.mint : C.bg, w: lw * 0.75, seed: seed + 20 });
      for (let i = 0; i < floors; i++) IB.oval(ctx, ix + 60 + i * 26, iy + 23, 7, 7, { fill: i === at ? C.ink : C.bg, w: lw * 0.6, seed: seed + 21 + i, n: 8 });
    }
    ctx.restore();
    return { opening: [x0, y0, w, h], gap: [x - half, x + half] };
  };

  /* meetingTable(ctx, at, opts) — a long meeting table seen from the side, deep enough that a row of sitters can sit behind it: `at` = [its centre x, the floor line], `w` long, the far edge of its top face (where the sitters sit) `top` px above the floor (135 = 0.41 of a 330 px sitter: elbow height on IB.chair) and the top face `depth` px deep as seen from a little above, so its near edge is that much lower and the slab under it covers the sitters' laps while their near hands rest on the top. A slab with a front face, two legs at each end (the far pair shorter and set back), graphite under the slab. `sheets` lays loose papers on the top (x offsets from the centre). The legs, the graphite and the papers are sized for `thick` 16 (sitters 330 px) and grow with it: give a closer shot a thicker slab (24 for sitters 500 px). Draw the chairs and the sitters' far side first, then the table, then their near arms (IB.figure's 'far' / 'near'), so the slab covers their laps and their hands rest on top. Returns the top face [x, y, w, h] (work/meeting-nod-off). */
  IB.meetingTable = (ctx, [cx, floor], o = {}) => {
    const { w = 900, top: TOP = 135, depth = 22, thick = 16, lw = 3.2, sheets = [], seed = 940 } = o;
    const x0 = cx - w / 2, back = floor - TOP, ty = back + depth, u = thick / 16;   // legs and papers grow with the slab's thickness
    ctx.save();
    for (const [x, s] of [[x0 + 60 * u, 0], [x0 + w - 44 * u, 1]]) IB.box(ctx, x - 6 * u, back + thick, 12 * u, floor - 14 * u - back - thick, { fill: C.bg, w: lw * 0.8, seed: seed + s });   // far legs
    for (const [x, s] of [[x0 + 30 * u, 2], [x0 + w - 30 * u, 3]]) IB.box(ctx, x - 8 * u, ty + thick, 16 * u, floor - ty - thick, { fill: C.paper, w: lw * 0.9, seed: seed + s });   // near legs
    IB.shade(ctx, x0 + 14, ty + thick + 2, w - 28, 26 * u, { from: 'top', seed: seed + 4, alpha: 0.45 });
    IB.ink(ctx, [[x0 + 16, back], [x0 + w + 16, back], [x0 + w, ty], [x0, ty]], { closed: true, smooth: false, fill: C.paper, w: lw, seed: seed + 5 });   // the top face
    IB.box(ctx, x0, ty, w, thick, { fill: C.bg, w: lw, seed: seed + 6 });   // the front face
    sheets.forEach((dx, i) => IB.ink(ctx, [[cx + dx, back + 5 * u], [cx + dx + 74 * u, back + 4 * u], [cx + dx + 68 * u, ty - 4 * u], [cx + dx - 6 * u, ty - 3 * u]], { closed: true, smooth: false, fill: C.paper, w: 2 * Math.sqrt(u), seed: seed + 10 + i }));
    ctx.restore();
    return [x0, back, w, depth];
  };

  /* whiteboard(ctx, at, opts) — a whiteboard w x h (300 x 220) whose content is placeholder shapes, never words: a bar chart of `bars` heights (0..1, the last one in `accent`), a rising arrow, two scribbled lines of "text" and `notes` sticky notes in yellow. `at` = [its centre x, the floor line]; the board's bottom edge is `lift` px above the floor (210: its middle at a 330 px figure's head). On an easel by default (two front legs splayed to the floor, a back leg, a marker tray); wall: true hangs it with no legs. `s` enlarges the whole board and its contents about `at` for a closer shot (1.5 beside a 520 px figure, work/meeting-nod-off); every line grows with it, so give `lw` as the wanted outline over s. Returns the board [x, y, w, h] in stage px, to point a hand at. */
  IB.whiteboard = (ctx, [cx, floor], o = {}) => {
    const { w = 300, h = 220, lift = 210, wall = false, bars = [0.35, 0.55, 0.85], accent = C.blue, notes = 2, lw = 3.2, s: S = 1, seed = 970 } = o;
    const x0 = cx - w / 2, y1 = floor - lift, y0 = y1 - h;
    ctx.save(); ctx.translate(cx, floor); ctx.scale(S, S); ctx.translate(-cx, -floor);
    if (!wall) {
      IB.seg(ctx, cx + 10, y0 + 10, cx + 26, floor - 12, { w: lw * 1.6, seed: seed });   // back leg, behind the board
      IB.seg(ctx, x0 + 30, y1 - 10, x0 - 10, floor, { w: lw * 2, seed: seed + 1 });
      IB.seg(ctx, x0 + w - 30, y1 - 10, x0 + w + 10, floor, { w: lw * 2, seed: seed + 2 });
      IB.shade(ctx, x0 - 30, floor - 16, w + 60, 16, { from: 'bottom', seed: seed + 3, alpha: 0.35 });
    }
    IB.box(ctx, x0 - 8, y0 - 8, w + 16, h + 16, { fill: C.bg, w: lw, seed: seed + 4 });
    IB.box(ctx, x0, y0, w, h, { fill: C.paper, w: lw * 0.7, seed: seed + 5 });
    if (!wall) IB.box(ctx, x0 + 10, y1 + 8, w - 20, 10, { fill: C.bg, w: lw * 0.8, seed: seed + 6 });   // the marker tray
    // a bar chart on an axis, bottom left
    const bx = x0 + 26, by = y1 - 24, bw = 26, bh = h * 0.55;
    IB.ink(ctx, [[bx, by - bh - 6], [bx, by], [bx + bars.length * 38 + 14, by]], { w: 2.4, smooth: false, seed: seed + 7 });
    bars.forEach((v, i) => IB.box(ctx, bx + 12 + i * 38, by - v * bh, bw, v * bh, { fill: i === bars.length - 1 ? accent : C.bg, w: 2.2, seed: seed + 8 + i }));
    // a rising arrow over it, two scribbled lines top right
    const ax = bx + bars.length * 38 + 30;
    IB.ink(ctx, [[bx + 6, by - bh * 0.5], [bx + 50, by - bh * 0.62], [bx + 80, by - bh * 0.56], [bx + 120, by - bh * 0.92]], { w: 2.4, smooth: false, seed: seed + 14 });
    IB.ink(ctx, [[bx + 104, by - bh * 0.92], [bx + 120, by - bh * 0.92], [bx + 118, by - bh * 0.76]], { w: 2.4, smooth: false, seed: seed + 15 });
    for (let i = 0; i < 2; i++) IB.ink(ctx, [[ax, y0 + 30 + i * 22], [ax + 30, y0 + 27 + i * 22], [ax + 60 - i * 18, y0 + 31 + i * 22]], { w: 2, seed: seed + 16 + i });
    // sticky notes, a little crooked
    for (let i = 0; i < notes; i++) {
      const nx = ax + 6 + i * 44, ny = y0 + 86 + (i % 2) * 18, a = (i % 2 ? 1 : -1) * 0.08, c = Math.cos(a), s = Math.sin(a), p = (dx, dy) => [nx + dx * c - dy * s, ny + dx * s + dy * c];
      IB.ink(ctx, [p(0, 0), p(36, 0), p(36, 36), p(0, 36)], { closed: true, smooth: false, fill: C.yellow, w: 2, seed: seed + 20 + i });
    }
    ctx.restore();
    return [cx + (x0 - cx) * S, floor + (y0 - floor) * S, w * S, h * S];
  };

  /* chairRoll(ctx, x, floor, h, dir, state) — what an office chair (IB.chair with the same x, floor, h, dir) leaves behind while it rolls: two or three short streaks trailing each caster along the floor and a puff of dust off the back one. state.k is the drawing number while it rolls (re-rolls the streaks each drawing), state.v how far it moved on that drawing in px (the streaks are as long as about 1.6 of it, and none are drawn below 2 px); state.way -1 / 1 is the way it rolls (default backward, -dir). Draw it before the chair. Rolling things get streaks and dust instead of the smear's stillness; the chair itself never turns its casters at this size (work/friday-stretch-roll). */
  IB.chairRoll = (ctx, x, floor, h, dir = 1, st = {}) => {
    const { k = 0, v = 0, way = -dir } = st;
    if (v < 2) return;
    const len = 1.6 * v, cy = floor - 0.018 * h, r = MG.rng(1000 + k * 7);
    ctx.save();
    for (const s of [-0.15, 0.15]) {
      const cx = x + s * h - way * 0.03 * h;
      for (let i = 0; i < 3; i++) { const y = cy - 6 + i * 7, l = len * (1 - i * 0.25) * (0.8 + 0.4 * r()); IB.seg(ctx, cx, y, cx - way * l, y, { w: 2.2 - i * 0.4, seed: 1010 + k * 5 + i + (s > 0 ? 20 : 0) }); }
    }
    const tail = x - way * (0.18 * h + len + 12);   // behind the trailing caster
    for (let i = 0; i < 2; i++) IB.oval(ctx, tail - way * i * 20, floor - 10 - i * 4 - (k % 2) * 3, 10 - i * 4, 6 - i * 2, { w: 1.6, fill: C.bg, seed: 1040 + k * 3 + i, n: 7 });
    ctx.restore();
  };
})(window);
