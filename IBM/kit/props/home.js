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
})(window);
