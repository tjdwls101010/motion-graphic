/* props/home.js — furniture and fittings of a room in the IBM look: paper-white wood in a brush-pen outline, graphite under seats and where things meet the floor. Needs ink.js and marks.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* diningChair(ctx, at, opts) — a front-on wooden dining chair: four legs (the back pair a little shorter, as seen from slightly above), three back slats, a stretcher, graphite under the seat. `at` is the floor under its centre; `lift` raises the whole chair off the floor (the floor marks are the scene's, they stay); `seat` and `back` are the seat height and the height of the back above it (vignette/balloons-lift-chair). */
  IB.diningChair = (ctx, [cx, floorY], o = {}) => {
    const { lift = 0, seat: seatH = 160, back: BACK = 190, seed = 200 } = o;
    const seat = (floorY - seatH) - lift, floor = floorY - lift, post = (x, top, bot, w, sd) => IB.box(ctx, x - w / 2, top, w, bot - top, { fill: C.paper, w: 3, seed: sd });
    ctx.save();
    post(cx - 62, seat + 20, floor - 12, 12, seed); post(cx + 62, seat + 20, floor - 12, 12, seed + 1);          // back legs, a little shorter
    IB.seg(ctx, cx - 62, seat + 96, cx + 62, seat + 96, { w: 2.6, seed: seed + 2 });
    post(cx - 84, seat - BACK, floor, 17, seed + 3); post(cx + 84, seat - BACK, floor, 17, seed + 4);                // front legs run up into the back posts
    for (let i = 0; i < 3; i++) IB.box(ctx, cx - 76, seat - BACK + 22 + i * 50, 152, 22, { fill: C.paper, w: 2.6, seed: seed + 5 + i });
    IB.box(ctx, cx - 104, seat, 208, 22, { fill: C.paper, w: 3.2, seed: seed + 10 });
    IB.shade(ctx, cx - 92, seat + 23, 184, 30, { from: 'top', seed: seed - 179, alpha: 0.5 });
    IB.seg(ctx, cx - 78, seat + 110, cx + 78, seat + 110, { w: 3, seed: seed + 11 });
    ctx.restore();
  };

  /* partyTable(ctx, at, opts) — a side table 580 px wide and 240 px high with a two-tier lavender birthday cake on a plate, white icing dripping over each tier; its floor smear and the graphite under its top. `at` is the floor under the cake's centre. The cake top (where candles stand) is 120 px above the table top: IB.candle's wick goes 72 px above that (vignette/trick-candle-relight). */
  const TABLE_AT = [1062, 930];   // where the original scene put it: the numbers below are in that scene's coordinates
  IB.partyTable = (ctx, at, o = {}) => {
    const { seed = 100 } = o, FLOOR = 930, TABLE = 690;
    ctx.save(); ctx.translate(at[0] - TABLE_AT[0], at[1] - TABLE_AT[1]);
    IB.smear(ctx, 1060, FLOOR - 4, 620, { h: 12, seed: seed - 91 });
    for (const x of [830, 1290]) IB.box(ctx, x - 13, TABLE + 22, 26, FLOOR - TABLE - 22, { fill: C.bg, w: 3.2, seed: seed + x });
    IB.shade(ctx, 800, TABLE + 24, 520, 34, { from: 'top', seed: seed - 89, alpha: 0.5 });
    IB.box(ctx, 770, TABLE, 580, 24, { fill: C.paper, w: 3.6, seed: seed + 2 });
    // plate and cake: two tiers of lavender with a white drip between and on top
    IB.oval(ctx, 1062, TABLE - 4, 170, 12, { fill: C.paper, w: 3, seed: seed + 10, n: 16 });
    IB.box(ctx, 942, TABLE - 8 - 112, 240, 112, { fill: C.lavender, w: 3.6, seed: seed + 11 });
    const drip = (y, sd) => IB.ink(ctx, [[942, y], [962, y + 14], [984, y + 2], [1010, y + 16], [1034, y + 3], [1062, y + 15], [1090, y + 2], [1116, y + 16], [1140, y + 3], [1162, y + 14], [1182, y]], { w: 3, seed: sd, color: C.ink });
    IB.box(ctx, 942, TABLE - 8 - 112, 240, 14, { fill: C.paper, w: 3, seed: seed + 12 });
    drip(TABLE - 8 - 98, seed + 13); drip(TABLE - 8 - 52, seed + 14);
    for (let i = 0; i < 7; i++) IB.seg(ctx, 958 + i * 34, TABLE - 8 - 26 + (i % 2) * 8, 966 + i * 34, TABLE - 8 - 20 + (i % 2) * 8, { w: 2.2, seed: seed + 20 + i });
    ctx.restore();
  };

  /* candle(ctx, at, state, opts) — a striped birthday candle 66 px tall with its wick tip at `at`. state.lit: 0 out, 1 burning, 2 blown flat (one drawing, stretched along the breath), 3 the drawing it catches again (with a burst); state.flicker: 0 / 1, the two drawings of a burning flame (alternate them on threes). Seeds follow the candle's x so a row of them differ (vignette/trick-candle-relight). */
  IB.candle = (ctx, [x, WICK], st = {}, o = {}) => {
    const { lit: state = 1, flicker = 0 } = st, { seed = 200 } = o;
    ctx.save();
    IB.box(ctx, x - 8, WICK + 6, 16, 66, { fill: C.paper, w: 2.6, seed: seed + x });
    for (let k = 0; k < 3; k++) IB.seg(ctx, x - 8, WICK + 22 + k * 16, x + 8, WICK + 14 + k * 16, { w: 1.8, seed: seed + 1 + x + k });
    IB.seg(ctx, x, WICK + 6, x + 1, WICK - 4, { w: 2, seed: seed + 5 + x });
    ctx.restore();
    if (state === 0) return;
    const flick = flicker ? 1 : -1;
    ctx.save(); ctx.translate(x, WICK - 4);
    if (state === 2) { ctx.rotate(1.25); ctx.scale(0.75, 2.2); } else ctx.rotate(flick * 0.12);
    IB.ink(ctx, [[0, 2], [-11, -12], [-7, -30], [0, -46], [8, -28], [11, -12]], { closed: true, fill: C.yellow, w: 2.6, seed: seed + 10 + x + (flick > 0 ? 1 : 0) });
    ctx.restore();
    if (state === 3) IB.burst(ctx, [x, WICK - 26], { angles: [0, 1, 2, 3].map((i) => -Math.PI / 2 + (i - 1.5) * 0.7), r0: 62, r1: 86, w: 2.6, seed: seed + 20 + x });
  };

  /* hangingLamp(ctx, at, opts) — a pendant lamp on a cord from above the frame: a yellow trapezoid shade 160 px wide with a paper bulb under it. `at` is the middle of the shade's lower edge (metaphor/flashlight-finds-file). */
  const LAMP_AT = [1120, 300];
  IB.hangingLamp = (ctx, at, o = {}) => {
    const { fill = C.yellow, seed = 300 } = o;
    ctx.save(); ctx.translate(at[0] - LAMP_AT[0], at[1] - LAMP_AT[1]);
    IB.seg(ctx, 1120, -10, 1120, 210, { w: 3, seed });
    IB.ink(ctx, [[1040, 300], [1076, 214], [1164, 214], [1200, 300]], { closed: true, smooth: false, fill, w: 3.4, seed: seed + 1 });
    IB.ink(ctx, IB.ellipse(1120, 302, 30, 18, 6, 0, Math.PI), { w: 3, seed: seed + 2, fill: C.paper, closed: true });
    ctx.restore();
  };

  /* woodCrate(ctx, at, opts) — a wooden crate w x h: two slat lines, a diagonal brace, graphite at its foot, its chalk smear. `at` is the floor under its centre. Something can hide behind it (metaphor/flashlight-finds-file). */
  IB.woodCrate = (ctx, [cx, FLOOR], o = {}) => {
    const { w = 190, h = 170, seed = 340 } = o, x = cx - w / 2, y = FLOOR - h;
    ctx.save();
    IB.smear(ctx, cx, FLOOR - 4, w * 1.25, { h: 11, seed: seed - 308 });
    IB.box(ctx, x, y, w, h, { fill: C.bg, w: 3.8, seed });
    for (const yy of [0.34, 0.67]) IB.seg(ctx, x, y + h * yy, x + w, y + h * yy, { w: 2.4, seed: seed + 1 + yy * 10 });
    IB.seg(ctx, x + 8, y + 8, x + w - 8, y + h - 8, { w: 2.2, seed: seed + 5 });
    IB.shade(ctx, x + 3, FLOOR - 36, w - 6, 34, { from: 'bottom', seed: seed - 307, alpha: 0.45 });
    ctx.restore();
  };

  /* trophyCabinet(ctx, at, opts) — a wall cabinet 260 x 340 with three shelves of trophies, plaques and boxes, graphite under it. `at` is its top left corner. Dense line drawing with no colour: wall dressing that says "a place with a history" (acting/walk-cycle-bag). */
  IB.trophyCabinet = (ctx, [x, y], o = {}) => {
    const { seed = 300 } = o;
    ctx.save();
    IB.shade(ctx, x - 6, y + 348, 272, 16, { from: 'top', seed: seed - 296, alpha: 0.6 });
    IB.box(ctx, x, y, 260, 340, { w: 3.4, seed, fill: C.bg });
    IB.box(ctx, x + 12, y + 12, 236, 316, { w: 2, seed: seed + 1 });
    for (const sy of [110, 220]) { IB.seg(ctx, x + 12, y + sy, x + 248, y + sy, { w: 2.6, seed: seed + 2 + sy }); IB.seg(ctx, x + 12, y + sy + 9, x + 248, y + sy + 9, { w: 1.6, seed: seed + 3 + sy }); }
    const cup = (cx, by, s, sd) => {   // a trophy: bowl, stem, plinth
      IB.ink(ctx, [[cx - 20 * s, by - 62 * s], [cx + 20 * s, by - 62 * s], [cx + 14 * s, by - 34 * s], [cx, by - 26 * s], [cx - 14 * s, by - 34 * s]], { closed: true, w: 2, seed: sd, fill: C.bg });
      IB.ink(ctx, IB.ellipse(cx - 22 * s, by - 50 * s, 9 * s, 10 * s, 5, 1.2, 4.9), { w: 1.8, seed: sd + 1 });
      IB.ink(ctx, IB.ellipse(cx + 22 * s, by - 50 * s, 9 * s, 10 * s, 5, -1.8, 1.9), { w: 1.8, seed: sd + 2 });
      IB.seg(ctx, cx, by - 26 * s, cx, by - 12 * s, { w: 2, seed: sd + 3 });
      IB.box(ctx, cx - 16 * s, by - 12 * s, 32 * s, 12 * s, { w: 2, seed: sd + 4 });
    };
    const plaque = (px, py, w, h, sd) => { IB.box(ctx, px, py, w, h, { w: 2, seed: sd }); IB.ink(ctx, [[px + w * 0.3, py + h * 0.3], [px + w * 0.7, py + h * 0.3], [px + w * 0.7, py + h * 0.6], [px + w * 0.5, py + h * 0.78], [px + w * 0.3, py + h * 0.6]], { closed: true, w: 1.6, seed: sd + 1 }); };
    cup(x + 62, y + 108, 0.8, seed + 10); plaque(x + 112, y + 44, 56, 62, seed + 20); IB.box(ctx, x + 190, y + 70, 34, 38, { w: 2, seed: seed + 26 });
    cup(x + 66, y + 218, 1.1, seed + 30); IB.ink(ctx, [[x + 116, y + 218], [x + 119, y + 160], [x + 126, y + 160], [x + 129, y + 218]], { closed: true, w: 2, seed: seed + 36 }); cup(x + 168, y + 218, 0.9, seed + 40); plaque(x + 204, y + 168, 36, 48, seed + 46);
    plaque(x + 160, y + 248, 64, 74, seed + 50); cup(x + 60, y + 326, 0.75, seed + 56); IB.seg(ctx, x + 96, y + 322, x + 124, y + 248, { w: 2, seed: seed + 60 }); IB.box(ctx, x + 104, y + 300, 30, 26, { w: 2, seed: seed + 62 });
    ctx.restore();
  };

  /* crossedFoils(ctx, at, opts) — two fencing foils crossed on a wall, hilts down, centred on `at` (acting/walk-cycle-bag). */
  IB.crossedFoils = (ctx, [x, y], o = {}) => {
    const { seed = 400 } = o;
    ctx.save();
    for (const s of [-1, 1]) {
      IB.seg(ctx, x - s * 118, y - 190, x + s * 96, y + 150, { w: 2.4, seed: seed + s });
      ctx.save(); ctx.translate(x + s * 96, y + 150); ctx.rotate(s * -0.58);
      IB.ink(ctx, IB.ellipse(0, 0, 30, 26, 8, Math.PI, Math.PI * 2).concat([[26, 10], [-26, 10]]), { closed: true, w: 2.6, seed: seed + 4 + s, fill: C.bg });
      IB.box(ctx, -7, 10, 14, 44, { w: 2.2, seed: seed + 8 + s, fill: C.bg });
      ctx.restore();
    }
    ctx.restore();
  };

  /* door(ctx, at, opts) — a yellow panelled door 230 x 550 in its frame, with a knob and a small sign beside it, its chalk smear on the floor. `at` = [the door's left edge, the floor]. The one colour on a wall of line drawings: where the walk is going (acting/walk-cycle-bag). */
  IB.door = (ctx, [x, FLOOR], o = {}) => {
    const { fill = C.yellow, seed = 500 } = o;
    ctx.save();
    IB.smear(ctx, x + 115, FLOOR + 1, 300, { h: 9, seed: seed - 479 });
    IB.box(ctx, x - 16, FLOOR - 566, 262, 566, { w: 3.2, seed, fill: C.bg });
    IB.box(ctx, x, FLOOR - 550, 230, 550, { w: 3.4, seed: seed + 1, fill });
    IB.box(ctx, x + 30, FLOOR - 510, 170, 190, { w: 2.2, seed: seed + 2 });
    IB.box(ctx, x + 30, FLOOR - 280, 170, 230, { w: 2.2, seed: seed + 3 });
    IB.oval(ctx, x + 196, FLOOR - 300, 11, 11, { w: 2.6, seed: seed + 4, fill: C.paper, n: 9 });
    IB.box(ctx, x + 276, FLOOR - 420, 54, 30, { w: 2.2, seed: seed + 6, fill: C.paper });
    ctx.restore();
  };

  /* pictureFrame(ctx, at, opts) — a framed picture w x h on a wall: a mustard frame, a mountain zigzag inside, graphite under it. `at` is its top left corner (acting/walk-cycle-bag). */
  IB.pictureFrame = (ctx, [x, y], o = {}) => {
    const { w = 210, h = 160, fill = C.mustard, seed = 700 } = o;
    ctx.save();
    IB.shade(ctx, x, y + h + 4, w, 10, { from: 'top', seed, alpha: 0.5 });
    IB.box(ctx, x, y, w, h, { w: 3, seed, fill });
    IB.box(ctx, x + 14, y + 14, w - 28, h - 28, { w: 2, seed: seed + 1, fill: C.bg });
    IB.ink(ctx, [[x + 24, y + h - 24], [x + w * 0.4, y + h * 0.42], [x + w * 0.55, y + h * 0.62], [x + w * 0.7, y + h * 0.5], [x + w - 24, y + h - 24]], { w: 2, smooth: false, seed: seed + 2 });
    ctx.restore();
  };

  /* callButton(ctx, at, state, opts) — a lift call button at insert size, filling the frame: a plate with rounded corners and four screws, an indicator arrow above, and a round button 352 px across whose cap sinks 10 px when pressed. `at` is the button's centre. state.pressed sinks the cap; state.lit turns the cap blue and the indicator mint (they light together). Lines 7-9 px, as an insert's are (variation/hall-whip-button). */
  const BUTTON_AT = [860, 560];
  IB.callButton = (ctx, at, st = {}, o = {}) => {
    const { pressed = false, lit = pressed } = st;
    ctx.save(); ctx.translate(at[0] - BUTTON_AT[0], at[1] - BUTTON_AT[1]);
    IB.shade(ctx, 520, 968, 700, 34, { from: 'top', seed: 51, alpha: 0.5 });
    IB.ink(ctx, [[1176, 154, 0], [544, 154, 1], [544, 916, 2], [1176, 916, 3]].flatMap(([x, y, q]) => IB.ellipse(x, y, 44, 44, 5, -q * Math.PI / 2, -(q + 1) * Math.PI / 2)), { closed: true, smooth: false, fill: C.paper, w: 9, seed: 500, wob: 1.2 });   // a plate with rounded corners
    for (const [x, y] of [[560, 170], [1160, 170], [560, 900], [1160, 900]]) { IB.oval(ctx, x, y, 15, 15, { w: 5, seed: 510 + x + y, n: 9 }); IB.seg(ctx, x - 8, y - 6, x + 8, y + 6, { w: 4, seed: 511 + x + y }); }
    // the indicator above the button: an arrow that lights with it
    IB.box(ctx, 740, 196, 240, 96, { fill: lit ? C.mint : C.bg, w: 7, seed: 520 });
    IB.ink(ctx, [[820, 262], [860, 220], [900, 262]], { w: 9, smooth: false, seed: 521 });
    // the button: a collar, and a cap that sinks when pressed
    IB.oval(ctx, 860, 560, 176, 176, { fill: C.bg, w: 9, seed: 530, n: 22 });
    IB.shade(ctx, 860 - 150, 560 + 60, 300, 110, { from: 'bottom', seed: 53, alpha: 0.5 });
    const sink = pressed ? 10 : 0;
    IB.oval(ctx, 860, 560 + sink, 132 - sink * 0.6, 132 - sink * 0.6, { fill: lit ? C.blue : C.paper, w: 8, seed: 531, n: 20 });
    IB.ink(ctx, IB.ellipse(860, 560 + sink, 96, 96, 7, 3.5, 4.6), { w: 7, color: lit ? C.paper : '#d9d9d9', seed: 532 });
    ctx.restore();
  };
})(window);
