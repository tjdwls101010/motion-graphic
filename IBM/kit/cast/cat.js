/* cast/cat.js — the cats of the IBM pieces, white with an ink outline, acting with ears, eyes and tail. Needs ink.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* chairCat(ctx, at, state, opts) — a big white cat loafing front-on on a seat (head 92 px wide), its tail over the seat's edge. `at` is the middle of its base on the seat. state: eyes 'shut' (curved lids) or 'wide' (round with a slit pupil); tail 0 or 1, the two drawings of a slow swing (alternate them on threes). Returns the corner of its mouth, for a bubble's tip (vignette/balloons-lift-chair). */
  IB.chairCat = (ctx, [x, by], st = {}, o = {}) => {
    const { eyes = 'shut', tail = 0 } = st, { seed = 300 } = o;
    ctx.save();
    // tail over the seat's edge, the one thing that moves at the end
    IB.tube(ctx, [[x - 46, by - 16], [x - 92, by - 6], [x - 112 + tail * 12, by + 44], [x - 96 + tail * 34, by + 86]], { w: 15, edge: 2.8, fill: C.paper, smooth: true, seed: seed + tail });
    IB.ink(ctx, [[x - 50, by], [x - 56, by - 44], [x - 30, by - 84], [x + 26, by - 86], [x + 54, by - 46], [x + 50, by]], { closed: true, fill: C.paper, w: 3.2, seed: seed + 10 });
    for (const s of [-1, 1]) IB.ink(ctx, [[x + s * 12, by - 2], [x + s * 14, by - 36], [x + s * 30, by - 34], [x + s * 32, by - 2]], { w: 2.4, seed: seed + 12 + s });   // front paws
    const hy = by - 112;
    for (const s of [-1, 1]) IB.ink(ctx, [[x + s * 40, hy - 14], [x + s * 36, hy - 50], [x + s * 10, hy - 30]], { closed: true, smooth: false, fill: C.paper, w: 3, seed: seed + 20 + s });
    IB.oval(ctx, x, hy, 46, 36, { fill: C.paper, w: 3.2, seed: seed + 22, n: 14 });
    for (const s of [-1, 1]) {
      if (eyes === 'wide') { IB.oval(ctx, x + s * 18, hy - 2, 8.5, 9.5, { fill: C.paper, w: 2.4, seed: seed + 30 + s, n: 9 }); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(x + s * 18, hy - 2, 2.6, 7, 0, 0, 7); ctx.fill(); }
      else IB.ink(ctx, [[x + s * 26, hy - 4], [x + s * 18, hy + 2], [x + s * 10, hy - 4]], { w: 2.6, seed: seed + 30 + s });
      for (const dy of [0, 9]) IB.seg(ctx, x + s * 30, hy + 10 + dy, x + s * 62, hy + 6 + dy * 1.6, { w: 1.6, seed: seed + 34 + s + dy });
    }
    IB.ink(ctx, [[x - 5, hy + 8], [x + 5, hy + 8], [x, hy + 14]], { closed: true, fill: C.ink, w: 1.5, seed: seed + 40 });
    ctx.restore();
    return [x + 44, hy - 26];
  };
})(window);
