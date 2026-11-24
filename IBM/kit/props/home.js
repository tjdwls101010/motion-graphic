/* props/home.js — furniture and fittings of a room in the IBM look: paper-white wood in a brush-pen outline, graphite under seats and where things meet the floor. Needs ink.js; adds to the global IB. */
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
})(window);
