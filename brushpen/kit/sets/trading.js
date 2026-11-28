/* sets/trading.js — the wall of a trading floor in the IBM look: a ticker board hung above a row of desks. The room itself stays the empty grey stage. Needs ink.js and props/office.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

  /* tickerBoard(ctx, at, state, opts) — a board 1280 x 280 with a title strip and twelve cells in two rows of six, each a pair of bars standing in for a name and a price and an arrow, graphite under its lower edge. `at` is its top left corner. state.up is twelve booleans: which cells show a blue up arrow (the rest red down). What the market does is the scene's: flip one cell every half second while idle, then run a wave across with one cell per drawing (market/trading-desk-row). */
  const BOARD_AT = [320, 110];
  IB.tickerBoard = (ctx, at, st = {}, o = {}) => {
    const { up = [] } = st, { seed = 400 } = o;
    ctx.save(); ctx.translate(at[0] - BOARD_AT[0], at[1] - BOARD_AT[1]);
    IB.shade(ctx, 330, 392, 1260, 14, { from: 'top', seed: seed - 395, alpha: 0.5 });
    IB.box(ctx, 320, 110, 1280, 280, { fill: C.paper, w: 3.6, seed });
    IB.seg(ctx, 320, 156, 1600, 156, { w: 2.6, seed: seed + 1 });
    for (let i = 0; i < 3; i++) IB.oval(ctx, 350 + i * 28, 134, 7, 7, { w: 2, seed: seed + 2 + i, n: 8 });
    for (let i = 0; i < 12; i++) {
      const col = i % 6, row = Math.floor(i / 6), x = 344 + col * 208, y = 176 + row * 100;
      IB.box(ctx, x, y, 190, 82, { w: 2, seed: seed + 10 + i });
      IB.seg(ctx, x + 16, y + 28, x + 84 + (i % 3) * 10, y + 28, { w: 5, seed: seed + 30 + i });
      IB.seg(ctx, x + 16, y + 54, x + 64 + (i % 2) * 20, y + 54, { w: 3, seed: seed + 50 + i, color: '#8a8a8a' });
      IB.arrow(ctx, [x + 150, y + 41], { up: !!up[i], half: 18, base: 15, tip: 17, w: 2.6, seed: seed + 70 + i });
    }
    ctx.restore();
  };
})(window);
