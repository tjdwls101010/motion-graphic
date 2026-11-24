/* marks.js — the effect marks the IBM look draws beside a thing instead of moving it smoothly: burst lines at an impact, speed arcs behind a swing, chalk puddles, breath and smoke. Each is a few brush-pen strokes that exist for one to three drawings and are redrawn with a new seed every drawing. Load after ink.js and time.js; adds to the global IB. */
(function (g) {
  const IB = g.IB, C = IB.C;

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
})(window);
