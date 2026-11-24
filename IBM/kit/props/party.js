/* props/party.js — balloons and party things in the IBM look: flat colour inside a brush-pen outline, a paper glint, strings as thin ink. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;

  /* balloon(ctx, at, opts) — an upright balloon (120 x 140 px) on a string: `at` is the balloon's centre, `from` where the string is tied (a knot, a hand); the string sags toward the knot under the balloon. One flat fill, a paper glint arc on its upper left (vignette/balloons-lift-chair). */
  IB.balloon = (ctx, [x, y], o = {}) => {
    const { from = [x, y + 160], fill = C.yellow, seed = 100 } = o;
    ctx.save();
    IB.ink(ctx, [from, [lerp(from[0], x, 0.45) + 14, lerp(from[1], y + 74, 0.5)], [x, y + 78]], { w: 2, seed: seed + 3 });
    IB.oval(ctx, x, y, 60, 70, { fill, w: 3.2, seed, n: 14 });
    IB.ink(ctx, [[x - 9, y + 68], [x + 9, y + 68], [x + 7, y + 82], [x - 8, y + 81]], { closed: true, fill, w: 2.4, seed: seed + 1 });
    IB.ink(ctx, IB.ellipse(x - 6, y - 4, 40, 50, 6, 3.5, 4.5), { w: 2.6, color: C.paper, seed: seed + 2 });
    ctx.restore();
  };
})(window);
