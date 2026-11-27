/* time.js — the clocks of the IBM look and the drawing lists its acting is written in. Drawn animation updates every 2 frames of the 24 fps reference (12 fps) and holds dead still in between; slow acting drops to every 3 frames (8 fps); copy, pans and scrolls stay on ones (pass them the raw t). Acting is a list of drawings, not a curve (STYLE.md "연기는 곡선이 아니라 그림 목록이다"): a scene keeps [frame, drawing] tables, reads them with held, and writes in-betweens as a short table of mix ratios. Load after ink.js. Contract: tools/test_time.js. */
(function (g) {
  const MG = g.MG;
  const IB = g.IB;

  /* ---------- clocks ---------- */
  IB.FPS = 24;
  IB.twos = (t) => MG.onTwos(t, 12);
  IB.threes = (t) => MG.onTwos(t, 8);
  IB.frame = (t) => Math.floor(t * IB.FPS + 1e-6);
  /* settle(dt, tau, stop) — 0..1, the curve copy and the end card arrive on: an exponential approach (time constant tau) rescaled so it lands exactly on 1 at `stop` seconds and is truly still afterwards. Fitted to the reference frame by frame: 71 px of head copy closes 60, 48, 38, 31, 25, 20, 16, 13, 10 ... px and is still after 0.79 s with tau 0.2. Read on twos (IB.settle(IB.twos(t) - at, ...)) for drawn things that rise or settle: tau 0.1 covers 57% of the way on the first drawing and 82% on the second. */
  IB.settle = (dt, tau = 0.2, stop = tau * 4) => (dt <= 0 ? 0 : dt >= stop ? 1 : (1 - Math.exp(-dt / tau)) / (1 - Math.exp(-stop / tau)));
  /* T(n) — the time of drawing n on the 12 fps grid: put every beat on it, or the first drawing of each beat covers a different share of the move. */
  IB.T = (n) => n / 12;
  /* drawn(tt, t0, fps = 12) — whole drawings since the beat at t0 (negative before it); tt is the quantised time (IB.twos(t), or IB.threes(t) with fps 8). */
  IB.drawn = (tt, t0, fps = 12) => Math.round((tt - t0) * fps);

  /* ---------- drawing lists ---------- */
  /* held(keys, f) — the drawing of a [[frame, drawing], ...] table (frames ascending) in force at frame f: each one holds until the frame before the next key; before the first key the first drawing shows. */
  IB.held = (keys, f) => {
    let v = keys[0][1];
    for (const [k, d] of keys) {
      if (f < k) break;
      v = d;
    }
    return v;
  };
  /* heldRow(table, f, first) — the whole row [frame, ...values] in force at frame f, or `first` before the first key; for tables whose rows carry several values (a camera's zoom and position). */
  IB.heldRow = (table, f, first) => {
    let v = first;
    for (const row of table) if (f >= row[0]) v = row;
    return v;
  };
  /* play(move, f0) — a move written in frames from its own start ([[0, drawing], [2, drawing], ...], a character's IB.<name>.MOVE) placed at frame f0 of a scene's table: spread it into the scene's [frame, drawing] list. */
  IB.play = (move, f0) => move.map(([k, d]) => [f0 + k, d]);
  /* inbetween(ratios, n) — the mix ratio of drawing n of an in-between ([0.35, 0.75, 1]: two in-betweens and the pose); past the end the last ratio holds. Hand-set ratios read better in this look than an easing curve. */
  IB.inbetween = (ratios, n) => ratios[Math.min(ratios.length - 1, n)];
  /* alternate(f, every = 3, from) — f counts from 0 (a scene clamps a count that can go negative, or gives `from`). 0 or 1: two drawings swapping every `every` frames (a flag, a flame, a tail). With `from`, 0 before that frame and the second drawing (1) first from it. */
  IB.alternate = (f, every = 3, from) => (from == null ? Math.floor(f / every) % 2 : f >= from ? (Math.floor((f - from) / every) + 1) % 2 : 0);
  /* loop(f, drawings, every = 2) — f counts from 0. A cycle of drawings that never stops, one per `every` frames: hair and cords streaming in the wind, a plant swaying. */
  IB.loop = (f, drawings, every = 2) => drawings[Math.floor(f / every) % drawings.length];
  /* bob(dt, amp, until) — how far past its place a float that has just arrived is, dt s after it starts bobbing: a damped wave (time constant 0.35 s, period 0.62 s) that the drawings move up to about 0.65 x amp, cut to exactly 0 from `until` s so the hold after it is dead still (an endless bob would be a boil the reference never has). Read it on the drawing grid: pass IB.twos(t) - start. (vignette/balloons-lift-chair, market/target-hit-balloons) */
  IB.bob = (dt, amp, until) => (dt > 0 && dt < until ? amp * Math.exp(-dt / 0.35) * Math.sin((dt * 2 * Math.PI) / 0.62) : 0);
})(window);
