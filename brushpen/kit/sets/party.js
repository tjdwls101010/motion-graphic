/* sets/party.js — the corner of an office party from the reference's fourth spot: a basketball hoop on a lavender pipe stand with a net, a cluster of balloons tied to it, and a line of bunting running off the top right. A place is told with two or three props and no walls. Read off the reference frame. Needs ink.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* partyCorner(ctx, opts) — the hoop stand, net, six balloons and bunting where the reference has them (the stand's post at x 1650, the top right of a 1920 px frame). opts.shift = [dx, dy] moves the whole group (spot/folder-meets-document). */
  IB.partyCorner = (ctx, o = {}) => {
    const { shift = [0, 0] } = o;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    // hoop stand: lavender tubing with an ink edge
    const tube = (pts, seed) => IB.pipe(ctx, pts, { seed });
    tube([[1650, 370], [1650, 152], [1930, 152]], 80);
    tube([[1737, 337], [1737, 249], [1860, 249], [1860, 337], [1737, 337]], 81);
    tube([[1810, 362], [1930, 362]], 82);
    // net
    for (let i = 0; i < 6; i++) { IB.seg(ctx, 1708 + i * 20, 322, 1730 + i * 11, 420, { w: 2, seed: 90 + i }); IB.seg(ctx, 1808 - i * 20, 322, 1786 - i * 11, 420, { w: 2, seed: 96 + i }); }
    IB.oval(ctx, 1758, 320, 55, 6, { fill: C.bg, w: 2.6, seed: 89, n: 12 });
    // balloons
    [[1593, 357, C.yellow], [1688, 372, C.lavender], [1630, 265, C.blue], [1620, 306, C.lavender], [1684, 318, C.mint], [1641, 372, C.blue]].forEach(([x, y, col], i) => {
      IB.oval(ctx, x, y, 32, 35, { fill: col, w: 3, seed: 100 + i, n: 12 });
      IB.ink(ctx, IB.ellipse(x - 4, y - 2, 20, 23, 6, 3.4, 4.5), { w: 2.4, color: C.paper, seed: 110 + i });
    });
    // bunting
    const sag = (x) => 12 + 104 * Math.pow((x - 1500) / 430, 1.5);
    IB.ink(ctx, [1500, 1600, 1700, 1800, 1930].map((x) => [x, sag(x) - 14]), { w: 3, seed: 120 });
    [[1500, C.yellow], [1594, C.lavender], [1690, C.blue], [1782, C.mint], [1876, C.yellow]].forEach(([x, col], i) => {
      IB.ink(ctx, [[x, sag(x) - 16], [x + 78, sag(x + 78) - 12], [x + 10 + i * 4, sag(x) + 96]], { closed: true, smooth: false, fill: col, w: 3, seed: 121 + i });
    });
    ctx.restore();
  };
})(window);
