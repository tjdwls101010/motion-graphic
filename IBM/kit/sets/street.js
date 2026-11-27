/* sets/street.js — a financial district street as one still line drawing: a far skyline, two towers, a stock exchange with columns and a pediment, kerb, lamp and hydrant. The establishing-shot grammar of the reference: 1.5-4 px lines, no fills (every face is the stage colour), windows as texture, and nothing moves but one small thing (the flag). Needs ink.js and props/office.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* windowGrid(ctx, at, opts) — opts.rows x opts.cols of small window boxes w x h, one every gx / gy px from `at` (the top left one's corner): the texture of a tower face. 1.5 px lines. */
  IB.windowGrid = (ctx, [x, y], o = {}) => {
    const { cols = 6, rows = 8, w = 40, h = 38, gx = 64, gy = 56, seed = 110 } = o;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) IB.box(ctx, x + c * gx, y + r * gy, w, h, { w: 1.5, seed: seed + r * 17 + c, wob: 0.4 });
  };

  /* financeStreet(ctx, state, opts) — the whole street, filling a 1920x1080 frame with the road's near edge at y 862. state.flap is 0 / 1, the two drawings of the flag on the exchange's roof (alternate them on threes): the only thing on the street that moves. opts.shift = [dx, dy] moves the whole drawing. Put what is alive in front of it on other clocks: a cab on ones along the road (y 856), a crowd on twos on the pavement below (market/street-rush-hour). */
  IB.financeStreet = (ctx, st = {}, o = {}) => {
    const { flap = 0 } = st, { shift = [0, 0] } = o, ROAD = 856;
    ctx.save(); ctx.translate(shift[0], shift[1]);
    // far skyline, thin
    for (const [x, w, top] of [[40, 150, 150], [330, 120, 60], [560, 90, 210], [1290, 110, 130], [1480, 170, 40], [1760, 140, 190]]) { IB.ink(ctx, [[x, 760], [x, top], [x + w, top], [x + w, 760]], { w: 1.6, smooth: false, seed: 10 + x }); for (let i = 1; i < 6; i++) IB.seg(ctx, x + 8, top + i * 46, x + w - 8, top + i * 46, { w: 1.2, seed: 20 + x + i }); }
    // left tower
    IB.box(ctx, 90, 96, 440, 664, { w: 3.4, seed: 100, fill: C.bg });
    IB.windowGrid(ctx, [122, 130], { cols: 6, rows: 10, w: 42, h: 40, gx: 64, gy: 56, seed: 110 });
    IB.box(ctx, 250, 690, 120, 70, { w: 2.6, seed: 300 }); IB.seg(ctx, 310, 690, 310, 760, { w: 2, seed: 301 });
    IB.ink(ctx, [[226, 690], [394, 690], [410, 664], [210, 664]], { closed: true, smooth: false, w: 2.6, seed: 302, fill: C.bg });
    // right tower, stepped
    IB.box(ctx, 1400, 250, 430, 510, { w: 3.4, seed: 320, fill: C.bg });
    IB.box(ctx, 1470, 96, 290, 154, { w: 3, seed: 321, fill: C.bg });
    IB.windowGrid(ctx, [1430, 284], { cols: 6, rows: 8, w: 40, h: 38, gx: 64, gy: 56, seed: 330 });
    IB.windowGrid(ctx, [1500, 122], { cols: 4, rows: 2, w: 40, h: 38, gx: 64, gy: 56, seed: 500 });
    IB.wallClock(ctx, [1615, 60], { r: 26, hands: [[0, -16], [11, 6]], fill: C.bg, lw: 2.6, hw: 2, n: 14, seed: 520 });
    // the exchange: steps, six columns, entablature, pediment, flag
    IB.box(ctx, 600, 300, 720, 460, { w: 3.6, seed: 540, fill: C.bg });
    for (let i = 0; i < 3; i++) IB.box(ctx, 580 - i * 14, 716 + i * 15, 760 + i * 28, 15, { w: 2.4, seed: 541 + i, fill: C.bg });
    IB.box(ctx, 600, 300, 720, 54, { w: 3, seed: 545, fill: C.bg });
    for (let i = 0; i < 17; i++) IB.seg(ctx, 622 + i * 42, 312, 622 + i * 42, 342, { w: 1.6, seed: 546 + i });
    IB.ink(ctx, [[584, 300], [960, 168], [1336, 300]], { closed: true, smooth: false, w: 3.6, seed: 570, fill: C.bg });
    IB.ink(ctx, [[660, 286], [960, 196], [1260, 286]], { closed: true, smooth: false, w: 1.8, seed: 571 });
    for (let i = 0; i < 6; i++) {
      const x = 650 + i * 124;
      IB.box(ctx, x - 22, 372, 44, 344, { w: 2.8, seed: 580 + i, fill: C.bg });
      for (const dx of [-8, 8]) IB.seg(ctx, x + dx, 384, x + dx, 706, { w: 1.3, seed: 590 + i * 3 + dx });
      IB.box(ctx, x - 30, 354, 60, 18, { w: 2.4, seed: 610 + i, fill: C.bg }); IB.box(ctx, x - 30, 700, 60, 16, { w: 2.4, seed: 620 + i, fill: C.bg });
    }
    for (let i = 0; i < 5; i++) IB.box(ctx, 690 + i * 124, 470, 44, 150, { w: 1.6, seed: 630 + i });
    IB.seg(ctx, 960, 168, 960, 60, { w: 2.6, seed: 640 });
    IB.ink(ctx, [[960, 64], [1010, 70 + flap * 6], [1052 - flap * 8, 62 - flap * 4], [1052 - flap * 8, 100 - flap * 4], [1010, 108 + flap * 6], [960, 102]], { closed: true, w: 2.2, seed: 641 + flap, fill: C.bg });
    // kerb, lamp, hydrant, a sign with nothing written on it
    IB.seg(ctx, -20, 762, 1940, 762, { w: 3, seed: 660 }); IB.seg(ctx, -20, ROAD + 6, 1940, ROAD + 6, { w: 3.4, seed: 661 });
    for (let i = 0; i < 9; i++) IB.seg(ctx, 60 + i * 230, 812, 170 + i * 230, 812, { w: 2.2, seed: 670 + i });
    IB.seg(ctx, 560, 760, 560, 420, { w: 4, seed: 680 }); IB.ink(ctx, [[560, 424], [566, 392], [600, 384]], { w: 3.4, seed: 681 }); IB.oval(ctx, 606, 400, 18, 22, { w: 2.6, seed: 682, n: 10, fill: C.bg });
    IB.ink(ctx, [[1352, 760], [1352, 716], [1362, 704], [1378, 704], [1388, 716], [1388, 760]], { closed: true, smooth: false, w: 2.8, seed: 690, fill: C.bg }); IB.seg(ctx, 1344, 728, 1396, 728, { w: 2.6, seed: 691 });
    ctx.restore();
  };
})(window);
