/* props/racing-corners.js — the corners of a circuit, for IB.trackStrip's bend (props/racing.js), and what a car leaves in them. Needs ink.js, solid.js and marks.js.
   A corner is a curvature along the track (1/m as a function of X, metres along it): IB.hairpin and IB.chicane build the two a race is decided in, and bends add up, so a lap is a sum of them. IB.smokeTrail is the smoke a sliding or locked tyre leaves where it has been, for views from above where a puff cannot simply drift back across the screen as IB.tyreSmoke's do.
   Numbers (140 px a metre): a hairpin is taken at 60-80 km/h on a radius of 10-18 m (about 2.7 g), a fast chicane at about 190 km/h with a peak curvature of 0.012-0.016 /m over 30 m each way (a jog of 7-9 m, the car cutting it to half that). */
(function (window) {
  const IB = window.IB;

  /* hairpin(opts) — the curvature of a hairpin: from X = at (metres along the track), turn rad (PI by default) on a radius r (14 m), toward +z (dir 1) or -z (dir -1). Returns (X) => 1/m, for trackStrip's bend. */
  IB.hairpin = (o = {}) => { const at = o.at || 0, r = o.r || 14, len = (o.turn || Math.PI) * r, k = (o.dir || 1) / r; return (X) => (X >= at && X < at + len ? k : 0); };

  /* chicane(opts) — the curvature of a chicane: from X = at, one whole sine of peak k (0.014 /m) over 2 len metres (len 30): toward +z (dir 1) for len, then toward -z for len, so the track leaves it parallel to how it came, about 2 k len² / PI metres to the side (8 m at the defaults). Returns (X) => 1/m. */
  IB.chicane = (o = {}) => { const at = o.at || 0, len = o.len || 30, k = (o.k || 0.014) * (o.dir || 1); return (X) => (X >= at && X < at + 2 * len ? k * Math.sin(((X - at) / len) * Math.PI) : 0); };

  /* smokeTrail(ctx, view, poses, opts) — the smoke a sliding tyre leaves behind it, seen from any angle: view is the racer's view (at, yaw, pitch, look, f, s), poses where the car was, newest first and one a drawing ({ x, z, heading }, as IB.trackPose gives them), wheels the points on the car that smoke ([x, z] in the car's metres; the two rear tyres by default). Each puff has grown and paled with its age; s scales them (a fresh puff 30 px across at 1). Re-seed with the drawing. */
  IB.smokeTrail = (ctx, view, poses, o = {}) => {
    const U = 140 * (view.s || 1), space = IB.space({ at: view.at || [960, 800], yaw: view.yaw || 0, pitch: view.pitch || 0, roll: view.roll || 0, f: view.f || 1500, look: view.look == null ? 0.18 : view.look });
    const s = o.s || 1, seed = o.seed || 2700, r = MG.rng(seed), wheels = o.wheels || [[-1.85, -0.8], [-1.85, 0.8]];
    const puffs = [];
    for (let i = poses.length - 1; i >= 0; i--) {
      const { x = 0, z = 0, heading = 0 } = poses[i], c = Math.cos(heading), sn = Math.sin(heading);
      const nx = poses[Math.max(0, i - 1)];   // the pose a drawing newer: a second puff halfway to it closes the gap a fast car leaves
      wheels.forEach(([ax, az]) => {
        const at = (q) => { const cc = Math.cos(q.heading || 0), ss = Math.sin(q.heading || 0); return space([((q.x || 0) + ax * cc - az * ss) * U, 0, ((q.z || 0) + ax * ss + az * cc) * U]); };
        const a = at(poses[i]), b = at(nx), rad = (24 + i * 11) * s * (0.85 + r() * 0.3);
        [[a, 0], [[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 0.5]].forEach(([q, h]) => puffs.push({ x: q[0] + (r() - 0.5) * 10 * s * i, y: q[1] + (r() - 0.5) * 10 * s * i, r: rad * (1 - h * 0.12), age: (i - h) / (poses.length + 1) }));
      });
    }
    IB.billow(ctx, puffs, { lw: 2.6 * s, seed });   // oldest first, as one cloud
  };
})(window);
