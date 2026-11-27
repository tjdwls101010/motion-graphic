/* sets/corridor.js — a long corridor in one-point perspective, as a dense line drawing with one colour: the establishing-shot grammar of the reference (still drawing, 1.5-5 px lines mixed, pattern everywhere, colour in one or two places) applied to an interior. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;

  /* corridor(ctx, opts) — the corridor seen down its length, vanishing at opts.vp: floor boards and ceiling lights receding, a far wall with a yellow door, framed pictures on the left wall, doors, a notice board and a bench on the right, lines thickening toward the lens. Everything is placed on the corridor's shell by (side, z, v): side -1 / 1 = left / right wall, z = 1 at the far end growing toward the lens, v = 0 floor .. 1 ceiling. Push the camera in by scaling about vp on ones (1 to 1.045 over 2.75 s) and let one small coloured thing fly through on twos (variation/hall-whip-button). */
  IB.corridor = (ctx, o = {}) => {
    const { vp: VP = [960, 500] } = o;
    const wall = (side, z, v) => [VP[0] + side * 140 * z, VP[1] + lerp(140, -100, v) * z];
    const quad = (ctx, side, z0, z1, v0, v1, o) => IB.ink(ctx, [wall(side, z0, v0), wall(side, z1, v0), wall(side, z1, v1), wall(side, z0, v1)], { closed: true, smooth: false, ...o });
    ctx.save();
    const lw = (z) => 1.4 + z * 0.55;   // lines thicken toward the lens
    // floor boards and ceiling lights recede
    for (const z of [1.25, 1.6, 2.1, 2.8, 3.8, 5.2, 7.2]) IB.seg(ctx, ...wall(-1, z, 0), ...wall(1, z, 0), { w: lw(z) * 0.7, seed: 100 + z * 10 });
    for (let i = -3; i <= 3; i++) IB.seg(ctx, VP[0] + i * 40, VP[1] + 140, VP[0] + i * 40 * 8, VP[1] + 140 * 8, { w: 1.6, seed: 120 + i });
    for (const z of [1.5, 2.2, 3.3, 5]) { IB.oval(ctx, VP[0], VP[1] - 100 * z, 26 * z, 6 * z, { w: lw(z), seed: 130 + z * 10, n: 12, fill: C.bg }); IB.oval(ctx, VP[0], VP[1] - 100 * z + 2 * z, 15 * z, 3 * z, { w: lw(z) * 0.6, seed: 140 + z * 10, n: 10 }); }
    // the far end: a wall with a yellow door
    IB.ink(ctx, [wall(-1, 1, 0), wall(1, 1, 0), wall(1, 1, 1), wall(-1, 1, 1)], { closed: true, smooth: false, w: 3, seed: 150 });
    IB.box(ctx, VP[0] - 52, VP[1] - 56, 104, 196, { fill: C.yellow, w: 2.6, seed: 151 });
    IB.box(ctx, VP[0] - 38, VP[1] - 40, 76, 70, { w: 1.6, seed: 152 }); IB.box(ctx, VP[0] - 38, VP[1] + 44, 76, 80, { w: 1.6, seed: 153 });
    IB.oval(ctx, VP[0] + 36, VP[1] + 40, 4, 4, { w: 1.6, seed: 154, n: 8, fill: C.paper });
    IB.box(ctx, VP[0] - 22, VP[1] - 86, 44, 16, { w: 1.6, seed: 155 });
    // the four long edges, baseboards and a picture rail
    for (const side of [-1, 1]) {
      for (const v of [0, 1]) IB.seg(ctx, ...wall(side, 1, v), ...wall(side, 8, v), { w: 4.6, seed: 160 + side + v * 3 });
      IB.seg(ctx, ...wall(side, 1, 0.07), ...wall(side, 8, 0.07), { w: 2, seed: 166 + side });
      IB.seg(ctx, ...wall(side, 1, 0.86), ...wall(side, 8, 0.86), { w: 1.6, seed: 169 + side });
    }
    // left wall: framed pictures, each a quad in perspective with a scribble inside
    [[1.25, 1.55, 0.4, 0.74], [1.75, 2.3, 0.34, 0.78], [2.7, 3.7, 0.3, 0.8], [4.3, 6.1, 0.3, 0.8]].forEach(([z0, z1, v0, v1], i) => {
      quad(ctx, -1, z0, z1, v0, v1, { w: lw(z1), seed: 200 + i * 9, fill: C.bg });
      quad(ctx, -1, lerp(z0, z1, 0.14), lerp(z0, z1, 0.86), v0 + 0.05, v1 - 0.05, { w: lw(z1) * 0.6, seed: 201 + i * 9 });
      const a = wall(-1, lerp(z0, z1, 0.25), v0 + 0.1), b = wall(-1, lerp(z0, z1, 0.5), v1 - 0.14), c = wall(-1, lerp(z0, z1, 0.62), v0 + 0.2), d = wall(-1, lerp(z0, z1, 0.8), v0 + 0.1);
      IB.ink(ctx, [a, b, c, [lerp(c[0], d[0], 0.5), lerp(b[1], d[1], 0.4)], d], { w: lw(z1) * 0.6, smooth: false, seed: 202 + i * 9 });
      for (let k = 0; k < 3; k++) IB.seg(ctx, ...wall(-1, lerp(z0, z1, 0.2 + k * 0.08), v1 - 0.1), ...wall(-1, lerp(z0, z1, 0.3 + k * 0.08), v1 - 0.1), { w: 1.4, seed: 204 + i * 9 + k });
    });
    // right wall: doors with knobs and transoms, a notice board, a bench
    [[1.3, 1.62], [2.5, 3.3], [4.6, 6.4]].forEach(([z0, z1], i) => {
      quad(ctx, 1, z0, z1, 0, 0.8, { w: lw(z1), seed: 260 + i * 9, fill: C.bg });
      quad(ctx, 1, lerp(z0, z1, 0.14), lerp(z0, z1, 0.86), 0.42, 0.72, { w: lw(z1) * 0.6, seed: 261 + i * 9 });
      quad(ctx, 1, lerp(z0, z1, 0.14), lerp(z0, z1, 0.86), 0.08, 0.34, { w: lw(z1) * 0.6, seed: 262 + i * 9 });
      const k = wall(1, lerp(z0, z1, 0.2), 0.38); IB.oval(ctx, k[0], k[1], 3.2 * z1, 3.2 * z1, { w: lw(z1) * 0.7, seed: 263 + i * 9, n: 8, fill: C.paper });
    });
    quad(ctx, 1, 1.78, 2.3, 0.36, 0.7, { w: 2.4, seed: 300, fill: C.bg });
    for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 3; c2++) quad(ctx, 1, 1.82 + c2 * 0.155, 1.94 + c2 * 0.155, 0.4 + r * 0.1, 0.47 + r * 0.1, { w: 1.3, seed: 301 + r * 3 + c2 });
    const b0 = wall(1, 3.5, 0.2), b1 = wall(1, 4.4, 0.2);
    IB.ink(ctx, [b0, b1, [b1[0] - 110, b1[1] + 10], [b0[0] - 84, b0[1] + 8]], { closed: true, smooth: false, w: 3.2, seed: 320, fill: C.bg });
    for (const [p, dx] of [[b0, -84], [b1, -110]]) { IB.seg(ctx, p[0] + dx, p[1] + 8, p[0] + dx, wall(1, p === b0 ? 3.5 : 4.4, 0)[1] + 4, { w: 3, seed: 322 + dx }); IB.seg(ctx, p[0] - 6, p[1], p[0] - 6, wall(1, p === b0 ? 3.5 : 4.4, 0)[1], { w: 3, seed: 324 + dx }); }
    IB.shade(ctx, b0[0] - 90, wall(1, 3.9, 0)[1] - 6, 300, 26, { from: 'top', seed: 31, alpha: 0.5 });
    ctx.restore();
  };
})(window);
