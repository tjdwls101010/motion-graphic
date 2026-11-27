/* marks.js — the effect marks the IBM look draws beside a thing instead of moving it smoothly: burst lines at an impact, speed arcs behind a swing, chalk puddles, breath and smoke. Each is a few brush-pen strokes that exist for one to three drawings and are redrawn with a new seed every drawing. Needs ink.js; adds to the global IB. */
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

  /* whipBreakup(ctx, frame, opts) — how a shot leaves or arrives through a speed-line whip (IB.whip): bars of bare stage eat into it from its open side, re-rolled for every `frame`. Draw the shot shoved sideways (about 1150 px), then this, then IB.whip. leaving: true for the shot going out to the left, false for the one coming in from the right. open (0..1) thins the bars as an arriving shot settles; wipe: true also clears the whole open half; streaks: [colour, colour] adds 30 translucent bars of the shot's own colours where it tears (insert/mesh-eyes-whip, variation/hall-whip-button). */
  IB.whipBreakup = (ctx, frame, o = {}) => {
    const { leaving = true, open = 1, wipe = false, streaks = null } = o;
    ctx.save();
    const r = MG.rng(700 + frame);
    ctx.fillStyle = C.bg;
    for (let i = 0; i < Math.round(46 * open); i++) { const y = r() * 1080, h = 6 + r() * 30, w = 500 + r() * 1100; ctx.fillRect(leaving ? 1920 - w - 260 * r() : 0, y, w + 400, h); }
    if (wipe) ctx.fillRect(leaving ? 1000 : 0, 0, 920, 1080);
    if (streaks) for (let i = 0; i < 30; i++) { const y = r() * 1080, h = 5 + r() * 26, w = 200 + r() * 700; ctx.fillStyle = r() < 0.5 ? streaks[0] : streaks[1]; ctx.globalAlpha = 0.85; ctx.fillRect(leaving ? 1000 - w * 0.4 : 920 - w * 0.6, y, w, h); }
    ctx.restore();
  };

  /* smudge(ctx, pts, opts) — rubbed graphite: three passes of a wide translucent stroke along `pts`, each pass `dy` px higher and `dw` px thinner. Softer than IB.shade's stipple: under a nose in a close-up, inside a cloud (insert/mesh-eyes-whip, establish/city-stadium-flyin). */
  IB.smudge = (ctx, pts, o = {}) => {
    const { w = 16, dw = 4, dy = 5, color = 'rgba(60, 52, 44, 0.2)', seed = 54, wob = 0.7 } = o;
    ctx.save();
    for (let i = 0; i < 3; i++) IB.ink(ctx, pts.map(([x, y]) => [x, y - i * dy]), { w: w - i * dw, color, seed: seed + i, grain: 0, wob });
    ctx.restore();
  };

  /* puddle(ctx, at, opts) — the chalk under a character's shoes as the reference packs it: a flat ragged core, solid in the middle, under IB.smear's dust. `at` = [centre x, the floor line]; opts.w is the smear's width (84 px plus the distance between two planted feet). It is a puddle round the shoes, not a line under them: the smear starts `rise` px above the floor line. opts rx, ry, n, wob shape the core (a small one under a balloon that has come to rest: spot/folder-meets-document). */
  IB.puddle = (ctx, [cx, floor], o = {}) => {
    const { w = 84, rx = w * 0.4, ry = 5.5, n = 14, wob = 2.4, h = 14, rise = 11, seed = 9 } = o;
    ctx.save();
    IB.ink(ctx, IB.ellipse(cx, floor - 3, rx, ry, n), { closed: true, fill: C.smear, w: 0, wob, seed });
    IB.smear(ctx, cx, floor - rise, w, { h, seed });
    ctx.restore();
  };

  /* ripples(ctx, at, opts) — the floor under a wheel: four short blue scribbles, narrower as they go down, that shift between two drawings (alt 0 / 1). Rolling things get these instead of the chalk smear standing figures get. `at` = [the wheel's x, the ground line]. They belong to the ground: draw them before the vehicle is tipped (spot/tandem-riders-join). */
  IB.ripples = (ctx, [x, ground], o = {}) => {
    const { alt = 0, seed = 70 } = o;
    ctx.save();
    for (let k = 0; k < 4; k++) { const y = ground + 2 + k * 5, half = 46 - k * 7, pts = []; for (let i = 0; i <= 6; i++) pts.push([x - half + (i / 6) * half * 2 + ((k + alt) % 2) * 6, y + (i % 2 ? -1.6 : 1.6)]); IB.ink(ctx, pts, { w: 2, color: C.blue, seed: seed + 20 + k, grain: 0 }); }
    ctx.restore();
  };

  /* wheelDust(ctx, at, state) — a puff of dust off a rear wheel: two small ovals that drift back over three drawings, then three drawings without. `at` = [the axle's x, the axle's y]; state.d is the drawing number (frame / 2) (spot/tandem-riders-join). */
  IB.wheelDust = (ctx, [rx, AXLE], st = {}) => {
    const { d: d2 = 0 } = st;
    ctx.save();
    if (d2 % 6 < 3) for (let k = 0; k < 2; k++) IB.oval(ctx, rx - 70 - k * 28 - (d2 % 3) * 14, AXLE + 30 + k * 6 - (d2 % 3) * 3, 12 - k * 5 - (d2 % 3) * 2, 7 - k * 3, { w: 1.6, seed: 90 + k, n: 7, fill: C.bg });
    ctx.restore();
  };
})(window);
