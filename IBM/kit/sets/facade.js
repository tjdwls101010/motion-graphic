/* sets/facade.js — the wall of an apartment building with two windows side by side and a room seen through the right one, from the reference's sixth spot: a stretched cloud and a bush on the sky side, a few brick marks standing for the whole wall, window frames with a drawn blind, a sill with a chalk line under it. Read off the reference on a 4x enlarged grid; it stays in the reference's coordinates. Needs ink.js and props/nature.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* windowFrame(ctx, x, opts) / sashAndSill(ctx, x, opts) — one sash window 280 px wide whose frame's left edge is at x (its top at y 283, as in the reference: move the whole wall with apartmentFacade's shift): the frame and panes go behind whoever is inside, the lower sash rail and the sill in front of them. */
  IB.windowFrame = (ctx, x, o = {}) => {
    const { seed = 700 } = o;
    IB.box(ctx, x, 283, 280, 507, { fill: C.paper, w: 2.8, seed });
    IB.box(ctx, x + 15, 297, 250, 478, { fill: C.paper, w: 2.5, seed: seed + 1 });
    IB.box(ctx, x + 15, 297, 250, 71, { fill: '#e9e9e9', w: 2.5, seed: seed + 2 });      // the upper pane is a drawn blind: flat grey
  };
  IB.sashAndSill = (ctx, x, o = {}) => {
    const { seed = 700 } = o;
    IB.box(ctx, x + 15, 520, 250, 15, { fill: C.paper, w: 2.5, seed: seed + 3 });        // the lower sash rail passes in front of whoever is inside
    IB.box(ctx, x + 15, 750, 250, 25, { fill: C.paper, w: 2.5, seed: seed + 4 });
    IB.box(ctx, x - 6, 791, 294, 55, { fill: C.paper, w: 2.8, seed: seed + 5 });
    IB.smear(ctx, x + 140, 848, 270, { h: 5, seed: seed + 6 });
  };

  /* apartmentFacade(ctx, opts) — the whole wall, in three layers so that the two windows' occupants can go between them. layer 'back': sky, bush, bricks, the heads of the windows above, and the left window's frame (then draw who is in the left window); 'middle': the left window's sash and sill, the right window's frame and the room behind it, with its shelf, picture and pendant lamp (then draw who is in the right window); 'front': the right window's sash and sill (then what stands on the sill). Without a layer, all three. opts.shift = [dx, dy] moves the whole wall (spot/dark-eyes-reveal). */
  IB.apartmentFacade = (ctx, o = {}) => {
    const { layer = null, shift = [0, 0] } = o, on = (name) => !layer || layer === name;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    if (on('back')) {
    // sky side: stretched clouds and a scalloped bush; wall side: a few brick marks stand for the whole wall
    IB.bandCloud(ctx, [-80, 150, 82], { seed: 600 });
    IB.bandCloud(ctx, [540, 975, 68], { seed: 601 });
    IB.seg(ctx, 970, -10, 970, 940, { w: 3.5, seed: 602 });
    const bush = [];
    for (let i = 0; i <= 26; i++) { const a = Math.PI * (1 - i / 26), bump = i % 2 ? 1.0 : 0.93; bush.push([765 + Math.cos(a) * 330 * bump, 1095 - Math.sin(a) * 245 * bump]); }
    IB.ink(ctx, bush, { w: 3, seed: 603, fill: C.bg, closed: true });
    const bricks = (x, y, seed) => { IB.seg(ctx, x, y, x + 175, y, { w: 2.5, seed }); IB.seg(ctx, x - 10, y + 38, x + 230, y + 38, { w: 2.5, seed: seed + 1 }); for (const [dx, y0] of [[48, -36], [140, -36], [0, 4], [96, 4], [150, 42]]) IB.seg(ctx, x + dx, y + y0, x + dx, y + y0 + 30, { w: 2.5, seed: seed + 2 + dx }); };
    bricks(1686, 160, 610);
    bricks(1090, 955, 630);
    for (const x of [1068, 1470]) { IB.box(ctx, x - 6, -40, 294, 66, { fill: C.paper, w: 3, seed: 650 + x }); IB.smear(ctx, x + 140, 28, 270, { h: 5, seed: 660 + x }); }
      IB.windowFrame(ctx, 1068, { seed: 700 });
    }
    if (on('middle')) {
      IB.sashAndSill(ctx, 1068, { seed: 700 });
      IB.windowFrame(ctx, 1470, { seed: 720 });
    // the far corner, a shelf unit on the right wall, a framed picture on the left
    IB.seg(ctx, 1485, 368, 1662, 368, { w: 2.4, seed: 400 });
    IB.seg(ctx, 1662, 368, 1734, 330, { w: 2.4, seed: 401 });
    IB.seg(ctx, 1661, 368, 1661, 666, { w: 1.8, seed: 402 });
    IB.ink(ctx, [[1692, 432], [1734, 408], [1734, 676], [1692, 660]], { closed: true, smooth: false, fill: '#e9e9e9', w: 2.6, seed: 403 });
    IB.ink(ctx, [[1700, 442], [1734, 424], [1734, 664], [1700, 652]], { closed: true, smooth: false, fill: C.paper, w: 2.2, seed: 404 });
    for (let i = 0; i < 6; i++) IB.box(ctx, 1714, 452 + i * 30 + (i > 2 ? 18 : 0), 18, 12, { w: 2, seed: 405 + i });
    IB.box(ctx, 1488, 468, 80, 164, { fill: '#e6e6e6', w: 2.6, seed: 412 });
    IB.oval(ctx, 1500, 508, 10, 10, { fill: C.paper, w: 2.2, seed: 413, n: 10 });
    IB.ink(ctx, [[1514, 540], [1546, 590], [1532, 612], [1518, 590]], { closed: true, fill: C.paper, w: 2.2, seed: 414 });
    for (let i = 0; i < 5; i++) IB.seg(ctx, 1490, 560 + i * 10, 1506, 562 + i * 10, { w: 1.8, seed: 415 + i });
    // pendant lamp: ceiling rose, cord, a lens-shaped shade with a line across its widest point
    IB.oval(ctx, 1564, 322, 21, 7, { fill: '#e9e9e9', w: 2.4, seed: 420, n: 12 });
    IB.seg(ctx, 1564, 329, 1564, 392, { w: 2.2, seed: 421 });
    IB.ink(ctx, [[1506, 424], [1530, 400], [1564, 392], [1598, 400], [1622, 424], [1598, 448], [1564, 456], [1530, 448]], { closed: true, fill: C.paper, w: 2.6, seed: 422 });
    IB.seg(ctx, 1508, 424, 1620, 424, { w: 2.2, seed: 423 });
    IB.shade(ctx, 1532, 400, 44, 12, { from: 'top', seed: 424, alpha: 0.16 });
    }
    if (on('front')) IB.sashAndSill(ctx, 1470, { seed: 720 });
    ctx.restore();
  };
})(window);
