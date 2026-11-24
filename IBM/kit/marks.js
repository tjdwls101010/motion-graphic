/* marks.js — the effect marks the IBM look draws beside a thing instead of moving it smoothly: burst lines at an impact, speed arcs behind a swing, chalk puddles, breath and smoke. Each is a few brush-pen strokes that exist for one to three drawings and are redrawn with a new seed every drawing. Load after ink.js and time.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;

  /* burst(ctx, at, opts) — short lines radiating from an impact at `at`, from radius r0 to r1, squashed vertically by sy. Angles are a0 + i * da for i < n, or the list `angles`. Each line's seed is seed + i: pass seed + drawing * k so every drawing is new. Two drawings, the second a little further out (r0 + 12 to + 40 per drawing): metaphor/dominoes-chain-stop, bridge-plank-cross, parcels-board-conveyor, acting/axe-windup-smear, market/*, variation/hall-whip-button, vignette/trick-candle-relight. */
  IB.burst = (ctx, [cx, cy], o = {}) => {
    const { n = 4, a0 = -2.6, da = 0.5, angles = null, r0 = 40, r1 = r0 + 40, sy = 1, w = 2.8, color = C.ink, seed = 300 } = o;
    ctx.save();
    for (let i = 0; i < (angles ? angles.length : n); i++) {
      const a = angles ? angles[i] : a0 + i * da;
      IB.seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * sy, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * sy, { w, color, seed: seed + i });
    }
    ctx.restore();
  };

  /* thud(ctx, at, opts) — something heavy set down on the floor: on each side of it two lines kick up and out along the floor and a dust puff rolls away. `at` is the floor under its centre, `half` its half width, `k` the drawing (0, then 1 a little further out: two drawings) (acting/lift-heavy-box). */
  IB.thud = (ctx, [bx, FLOOR], o = {}) => {
    const { half = 115, k = 0, seed = 400 } = o;
    ctx.save();
    for (const d of [-1, 1]) {
      for (let i = 0; i < 2; i++) IB.seg(ctx, bx + d * (half + 22 + k * 16), FLOOR - 14 - i * 26, bx + d * (half + 62 + k * 22), FLOOR - 26 - i * 44, { w: 3, seed: seed + i + d + k * 7 });
      IB.oval(ctx, bx + d * (half + 50 + k * 30), FLOOR - 8, 20 - k * 6, 12 - k * 4, { w: 2.2, seed: seed + 10 + d + k, n: 8, fill: C.bg });
    }
    ctx.restore();
  };

  /* breath(ctx, head, opts) — three lines leaving a mouth and travelling forward, one drawing each for three drawings (k 0, 1, 2: 70 px further each, times `big`). `head` is the head centre IB.figure returns (headAt) of a figure facing right (vignette/trick-candle-relight). */
  IB.breath = (ctx, head, o = {}) => {
    const { k: b = 0, big = 1, seed = 300 } = o;
    ctx.save();
    for (let i = -1; i <= 1; i++) { const x0 = head[0] + 44 + b * 70 * big, y0 = head[1] + 12 + i * 15 * big; IB.ink(ctx, [[x0, y0], [x0 + 46 * big, y0 - 4 + i * 5], [x0 + 92 * big, y0 - 12 + i * 12]], { w: 2.8, seed: seed + i + b * 5 }); }
    ctx.restore();
  };

  /* smoke(ctx, at, opts) — a thin wisp of smoke from a snuffed wick at `at`, climbing 14 px a drawing (k 0, 1, ...); six drawings is plenty. Give a new seed every drawing (vignette/trick-candle-relight). */
  IB.smoke = (ctx, [x, base], o = {}) => {
    const { k = 0, seed = 320 } = o, y = base - 12 - k * 14;
    ctx.save();
    IB.ink(ctx, [[x + 2, y], [x + 9, y - 12], [x - 3, y - 26], [x + 6, y - 40]], { w: 1.8, seed });
    ctx.restore();
  };

  /* drop(ctx, at, opts) — one falling drop of water, 51 px tall, its round end at `at` (variation/hose-wipe-endcard). */
  IB.drop = (ctx, [x, y], o = {}) => {
    const { fill = C.blue, seed = 700 } = o;
    ctx.save();
    IB.ink(ctx, [[x, y - 34], [x - 13, y - 4], [x - 9, y + 12], [x, y + 17], [x + 9, y + 12], [x + 13, y - 4]], { closed: true, fill, w: 2.8, seed });
    ctx.restore();
  };

  /* splash(ctx, at, opts) — where a drop hits the floor at `at`: three short lines thrown up and out, drawing k 0 then 1 (wider and higher), then nothing (variation/hose-wipe-endcard). */
  IB.splash = (ctx, [x, y0], o = {}) => {
    const { k: s = 0, color = C.blue, seed = 710 } = o;
    ctx.save();
    for (let i = -1; i <= 1; i++) IB.seg(ctx, x + i * (16 + s * 10), y0 - s * 6, x + i * (34 + s * 18), (y0 - 26) - s * 16 - (i === 0 ? 14 : 0), { w: 2.8, color, seed: seed + i + s * 5 });
    ctx.restore();
  };

  /* beamPath(ctx, from, a, half) — adds to the current path the cone of a torch beam from `from` along angle a, `half` radians to each side, running off-screen. Used by the two below. */
  const beamPath = (ctx, lens, a, half) => { ctx.moveTo(lens[0], lens[1]); for (const s of [-1, 1]) ctx.lineTo(lens[0] + Math.cos(a + s * half) * 2400, lens[1] + Math.sin(a + s * half) * 2400); ctx.closePath(); };
  /* darkness(ctx, opts) — a dark scene the way the reference's sixth spot does it: one flat black over the whole frame, with no gradient. beam = { from, a, half } cuts a hard-edged triangle of light out of it (half defaults to 13 degrees): everything drawn before shows inside the beam, anything that must show in the dark (eyes) is drawn again after. Cut to light on a held pose with a hard cut (metaphor/flashlight-finds-file). */
  IB.darkness = (ctx, o = {}) => {
    const { beam = null, color = '#000000' } = o;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color; ctx.beginPath(); ctx.rect(0, 0, MG.W, MG.H);
    if (beam) beamPath(ctx, beam.from, beam.a, beam.half == null ? 13 * (Math.PI / 180) : beam.half);
    ctx.fill('evenodd');
    ctx.restore();
  };
  /* lightBeam(ctx, from, a, opts) — the same beam in a lit room: a faint paper triangle over what it falls on (metaphor/flashlight-finds-file). */
  IB.lightBeam = (ctx, from, a, o = {}) => {
    const { half = 13 * (Math.PI / 180), alpha = 0.55 } = o;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = C.paper; ctx.beginPath(); beamPath(ctx, from, a, half); ctx.fill(); ctx.restore();
  };
})(window);
