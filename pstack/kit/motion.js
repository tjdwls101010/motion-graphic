/* motion.js — time helpers shared by every scene. All functions are pure: the same t always gives the same value, so a scene can be seeked to any frame. Loaded as a classic script (file:// cannot load ES modules) and exposes the global MG. */
(function (g) {
  const MG = (g.MG = g.MG || {});

  MG.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  MG.lerp = (a, b, u) => a + (b - a) * u;
  MG.mix = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * u) : a + (b - a) * u);

  const c1 = 1.70158;
  MG.ease = {
    linear: (x) => x,
    inQuad: (x) => x * x,
    outQuad: (x) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inBack: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : (c1 + 1) * x * x * x - c1 * x * x),
    // overshoots past 1 then settles: the default "pop" for stickers, chips and cards
    outBack: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)),
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    outBounce: (x) => {
      const n = 7.5625, d = 2.75;
      if (x < 1 / d) return n * x * x;
      if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
      if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
      return n * (x -= 2.625 / d) * x + 0.984375;
    },
  };

  /* prog(t, start, dur, ease) — progress 0..1 of a beat that starts at `start` and lasts `dur` seconds. The workhorse: every beat in a scene is one prog() call. Exactly 0 before the beat and exactly 1 after it for every ease, so `p > 0` is a safe "has started" test; a zero-length beat is a step at `start`. */
  MG.prog = (t, start, dur, e) => {
    const u = dur > 0 ? MG.clamp((t - start) / dur) : t >= start ? 1 : 0;
    return e ? (typeof e === 'string' ? MG.ease[e] : e)(u) : u;
  };

  /* kf(t, [[time, value, easeIntoThisKey], ...]) — keyframes over numbers or equal-length arrays. Holds the first value before the first key and the last value after the last. */
  MG.kf = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      if (t < t1) {
        const [t0, v0] = keys[i - 1];
        const fn = e ? (typeof e === 'string' ? MG.ease[e] : e) : MG.ease.inOutCubic;
        return MG.mix(v0, v1, fn((t - t0) / (t1 - t0)));
      }
    }
    return keys[keys.length - 1][1];
  };

  /* rng(seed) — deterministic generator (mulberry32). Use it for anything "random" so a frame renders the same every time. */
  MG.rng = (seed) => {
    let a = (seed * 2654435761) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  };
  /* hash(a, b) — one deterministic value in [0, 1) from two integers, with no generator state. */
  MG.hash = (a, b = 0) => {
    let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };

  /* onTwos(t, fps) — quantise time so motion updates at `fps` (hand-drawn scenes in the reference move at 15 fps inside a 30 fps video). */
  MG.onTwos = (t, fps = 15) => Math.floor(t * fps + 1e-6) / fps;

  /* typed(text, p) — the first p (0..1) of a string, for type-on text. */
  MG.typed = (text, p) => text.slice(0, Math.round(text.length * MG.clamp(p)));

  /* blink(t, period) — true for the first half of each period: terminal cursors. */
  MG.blink = (t, period = 1.0) => t % period < period / 2;
})(window);
