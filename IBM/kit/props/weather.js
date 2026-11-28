/* props/weather.js — rain and what goes with it, in the look of the IBM spots: rain as short blue strokes re-drawn on every drawing (never a scrolling texture), a rain cloud, a single falling drop, an umbrella that opens from furled to past round, a flat water puddle and the sheet of water a wheel throws out of one. Water is the reference's blue (#5cacf5) with paper-white streaks, as in its hose spot; everything else is white with an ink outline and one colour (the umbrella's canopy). New, not measured: the reference has no weather. For the chalk under shoes and a drop landing on the floor use IB.puddle, IB.drop and IB.splash (marks.js); for a little splash on a head IB.burst. Needs ink.js; adds to the global IB. Used by street/rain-umbrella-pop and street/puddle-hop-splash. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const lerp = (a, b, u) => a + (b - a) * u;

  /* roofAt(roofs, x) — the highest roof line over x (the smallest y), or Infinity: a roof is a polyline of stage points left to right, as IB.umbrella returns it. */
  const roofAt = (roofs, x) => {
    let best = Infinity;
    for (const r of roofs) for (let i = 1; i < r.length; i++) {
      const [ax, ay] = r[i - 1], [bx, by] = r[i];
      if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && bx !== ax) best = Math.min(best, lerp(ay, by, (x - ax) / (bx - ax)));
    }
    return best;
  };

  /* rain(ctx, box, state, opts) — a field of rain over box = [x0, y0, x1, y1]: `n` short slanted blue strokes scattered afresh for every drawing. state.d is the drawing number (frame / 2 on twos): the field is re-rolled from seed + d, so give it a new d every drawing and the rain falls; the same d is the same rain. opts { n (90), len (46), slant (0.16: px across per px down), w (2.2), color (C.blue), seed (900), roofs (polylines from IB.umbrella's `roof`: no stroke reaches below one, a few short ticks bounce off it instead), floor (a y: small two-line splashes on that line, `hits` of them, 14) }. Returns nothing. */
  IB.rain = (ctx, [x0, y0, x1, y1], st = {}, o = {}) => {
    const { d = 0 } = st, { n = 90, len = 46, slant = 0.16, w = 2.2, color = C.blue, seed = 900, roofs = [], floor = null, hits = 14 } = o;
    const r = MG.rng(seed + d * 101);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, r()), y = lerp(y0 - len, y1, r()), l = len * (0.7 + 0.6 * r());
      let ex = x + slant * l, ey = y + l;
      const roof = roofAt(roofs, ex);
      if (y >= roof) continue;   // under a roof: dry
      if (ey > roof) { ey = roof; ex = x + slant * (roof - y); }
      if (floor != null && ey > floor) { ey = floor; ex = x + slant * (floor - y); }
      if (ey - y > 6) IB.seg(ctx, x, y, ex, ey, { w, color, seed: seed + i, grain: 0, wob: 0.3 });
    }
    // drops bouncing off each roof, and splashes on the floor
    for (const roof of roofs) for (let i = 0; i < 4; i++) {
      const u = r(), a = roof[0][0], b = roof[roof.length - 1][0], x = lerp(a + (b - a) * 0.12, b - (b - a) * 0.12, u), y = roofAt([roof], x) - 6;
      IB.seg(ctx, x - 4, y - 2, x - 12, y - 12, { w: w * 0.9, color, seed: seed + 300 + i, grain: 0 });
      IB.seg(ctx, x + 4, y - 2, x + 12, y - 12, { w: w * 0.9, color, seed: seed + 310 + i, grain: 0 });
    }
    if (floor != null) for (let i = 0; i < hits; i++) {
      const x = lerp(x0, x1, r()), y = floor - 2 + r() * 10;
      if (roofAt(roofs, x) < y) continue;
      IB.seg(ctx, x - 3, y, x - 10, y - 9, { w: w * 0.9, color, seed: seed + 400 + i, grain: 0 });
      IB.seg(ctx, x + 3, y, x + 10, y - 9, { w: w * 0.9, color, seed: seed + 420 + i, grain: 0 });
    }
    ctx.restore();
  };

  /* raindrop(ctx, at, opts) — one falling drop, its round end at `at`: a blue teardrop 11 x 22 px (times s) with an ink outline, stretched along its fall by `stretch` (1.6 for the drawing where it falls fastest). Smaller than IB.drop (marks.js), for a drop that lands on a head or runs off a soaked figure. opts { s (1), stretch (1), fill (C.blue), w (2.2), seed (930) }. */
  IB.raindrop = (ctx, [x, y], o = {}) => {
    const { s = 1, stretch = 1, fill = C.blue, w = 2.2, seed = 930 } = o, k = s, t = 16 * s * stretch;
    IB.ink(ctx, [[x, y - 6 * k - t], [x - 5.5 * k, y - 3 * k], [x - 4 * k, y + 3.5 * k], [x, y + 5.5 * k], [x + 4 * k, y + 3.5 * k], [x + 5.5 * k, y - 3 * k]], { closed: true, fill, w, seed });
  };

  /* rainCloud(ctx, [x0, x1, y, h], opts) — a low grey rain cloud from x0 to x1, its flat base on y and its bumpy top h px above: five to seven round bumps of uneven size on a level base, a grey fill, a 4 px outline and graphite rubbed along the underside. Move it on twos when it drifts in. opts { fill ('#c4c4c4'), seed (940) }. */
  IB.rainCloud = (ctx, [x0, x1, y, h], o = {}) => {
    const { fill = '#c4c4c4', seed = 940 } = o, r = MG.rng(seed), w = x1 - x0, nb = Math.max(4, Math.round(w / 70)), pts = [[x1 - h * 0.25, y], [x0 + h * 0.25, y]];
    for (let i = 0; i <= nb; i++) {
      const u = i / nb, bump = (0.55 + 0.45 * Math.sin(Math.PI * u)) * (0.8 + 0.35 * r());
      pts.push([x0 + w * u, y - h * bump]);
      if (i < nb) pts.push([x0 + w * (u + 0.5 / nb), y - h * bump * 0.72]);
    }
    pts.push([x1, y - h * 0.3]);
    ctx.save();
    IB.ink(ctx, [[x0 + h * 0.2, y], [x0 - h * 0.05, y - h * 0.3], ...pts.slice(2), [x1 - h * 0.2, y]], { closed: true, fill, w: 4, seed });
    IB.shade(ctx, x0 + w * 0.08, y - h * 0.35, w * 0.84, h * 0.33, { from: 'bottom', seed: seed + 1, alpha: 0.4 });
    ctx.restore();
  };

  /* umbrella(ctx, grip, state, opts) — an umbrella held at `grip` (the wrist IB.figure returns): a crook handle below the hand, a straight shaft to a ferrule, and a canopy on ribs that hinge at the top. state { open: 0 furled tight round the shaft, 0.2-0.5 a bell (half open), 1 round, up to 1.15 the one drawing it springs past round (flatter and wider); skew -1..1 (one side lags: the drawing where it catches, skew > 0 holds back the right side); a (the shaft's angle, -PI / 2 straight up; PI / 2 hangs it from the hand point down) }. opts { s (1: shaft 170 px, ribs 118 px, for a figure 330 px tall), fill (C.yellow, the canopy), lw (3), dir (1: the crook turns back to the left), seed (950) }.
     Returns, in stage px, { grip, tip (the ferrule), roof (the canopy's top edge as a polyline left to right: pass it to IB.rain's roofs), rim (the two rib tips) }. Draw it between the two passes of the figure (only 'far', then the umbrella, then only 'near') so the hand closes over the shaft. */
  IB.umbrella = (ctx, [gx, gy], st = {}, o = {}) => {
    const { open = 0, skew = 0, a = -Math.PI / 2 } = st, { s = 1, fill = C.yellow, lw = 3, dir = 1, seed = 950 } = o;
    const L = 170 * s, R = 118 * s, rot = a + Math.PI / 2, ca = Math.cos(rot), sa = Math.sin(rot);
    const P = ([x, y]) => [gx + x * ca - y * sa, gy + x * sa + y * ca];   // umbrella-local (x across, y down the shaft from the hand) to stage
    const phi = (k) => 0.08 + 1.25 * Math.max(0, open) * k, pr = phi(1 - 0.5 * Math.max(0, skew)), pl = phi(1 - 0.5 * Math.max(0, -skew));
    const top = [0, -L], tipOf = (p, side) => [side * R * Math.sin(p), -L + R * Math.cos(p)];
    const lt = tipOf(pl, -1), rt = tipOf(pr, 1), furl = Math.max(0, 1 - open * 5);   // a furled canopy bunches out round its middle
    // the dome: from the left rib tip up over the top to the right one; its rise above the notch grows as it opens
    const rise = 0.2 * R * Math.sin(Math.min(pl, pr)), side = (tip, sd) => [lerp(top[0], tip[0], 0.5) + sd * (furl * 12 * s + Math.abs(tip[0]) * 0.16), lerp(top[1], tip[1], 0.5) - Math.abs(tip[0]) * 0.18];
    const dome = [lt, side(lt, -1), [0, -L - rise], side(rt, 1), rt];
    // the rim between the tips: scallops that sag between the ribs, a little lower in the middle (seen from just below)
    const rim = [];
    for (let i = 4; i >= 0; i--) {
      const u = i / 4, x = lerp(lt[0], rt[0], u), y = lerp(lt[1], rt[1], u) + Math.sin(Math.PI * u) * 10 * s * Math.min(1, open * 2);
      rim.push([x, y]);
      if (i) rim.push([lerp(lt[0], rt[0], u - 0.125), lerp(lt[1], rt[1], u - 0.125) + Math.sin(Math.PI * (u - 0.125)) * 10 * s * Math.min(1, open * 2) - 7 * s * Math.min(1, open * 2)]);
    }
    ctx.save();
    // shaft and crook (the crook hangs below the hand and turns back)
    IB.ink(ctx, [[0, 30 * s], [0, -L - 22 * s]].map(P), { w: lw * 1.2, smooth: false, seed });
    IB.tube(ctx, [[0, -4 * s], [0, 26 * s], [-dir * 4 * s, 38 * s], [-dir * 16 * s, 40 * s], [-dir * 22 * s, 30 * s]].map(P), { w: 9 * s, edge: lw * 0.8, fill: C.charcoal, smooth: true, seed: seed + 1 });
    // canopy: the dome and its rim as one shape, then rib lines from the top to the tips that face us
    IB.ink(ctx, [...dome, ...rim.slice(1, -1)].map(P), { closed: true, fill, w: lw, seed: seed + 2, wob: 0.6 });
    if (open > 0.15) for (const u of [0.25, 0.5, 0.75]) { const q = rim[Math.round((1 - u) * 8)]; IB.ink(ctx, [[0, -L - rise * 0.6], [q[0] * 0.55, lerp(-L - rise * 0.3, q[1], 0.5) - 6 * s], q].map(P), { w: lw * 0.6, seed: seed + 3 + u * 10 }); }
    else IB.seg(ctx, ...P([-furl * 9 * s, -L + R * 0.62]), ...P([furl * 9 * s, -L + R * 0.56]), { w: lw * 0.8, seed: seed + 6 });   // the strap round a furled one
    ctx.restore();
    const roof = [...dome].map(P).sort((p, q) => p[0] - q[0]);
    return { grip: [gx, gy], tip: P([0, -L - 22 * s]), roof, rim: [P(lt), P(rt)] };
  };

  /* waterPuddle(ctx, at, state, opts) — a puddle of rain water lying on the floor: a flat ragged pale-blue ellipse w px wide with a blue edge and one paper-white glint. `at` = [its centre, the floor line]. state.ring 0, 1, 2 draws a ripple spreading out from state.from (a drawing each: something stepped or dropped in), null none. opts { w (180), fill (C.sky), seed (960) }. */
  IB.waterPuddle = (ctx, [cx, floor], st = {}, o = {}) => {
    const { ring = null, from = cx } = st, { w = 180, fill = C.sky, seed = 960 } = o, ry = Math.max(7, w * 0.075);
    ctx.save();
    IB.ink(ctx, IB.ellipse(cx, floor - ry * 0.4, w / 2, ry, 16), { closed: true, fill, w: 2.4, color: C.blue, seed, wob: 2.2 });
    IB.ink(ctx, [[cx - w * 0.26, floor - ry * 0.7], [cx - w * 0.08, floor - ry * 0.95]], { w: 3, color: C.paper, seed: seed + 1, grain: 0 });
    if (ring != null) { const rr = 14 + ring * 22; IB.ink(ctx, IB.ellipse(from, floor - ry * 0.4, Math.min(rr, w * 0.48), Math.min(rr * 0.22, ry * 0.8), 12), { closed: true, w: 2, color: C.blue, seed: seed + 2 + ring, grain: 0 }); }
    ctx.restore();
  };

  /* wheelSplash(ctx, at, state, opts) — the sheet of water a wheel throws up out of a puddle, in five drawings on twos (state.k 0-4; anything else draws nothing): 0 a low fan at the tyre, 1 a wall taller than a person leaning `lean` px over at its top, 2 its crest curling over and breaking into drops, 3 only falling drops, 4 the last few near the floor. `at` = [the wheel's x, the ground line]. opts { h (360), w (260), lean (-140: the crest goes left; + right), fill (C.blue), seed (970) }. A soaked figure under it is the scene's (drips: IB.raindrop). */
  IB.wheelSplash = (ctx, [x, ground], st = {}, o = {}) => {
    const { k = -1 } = st, { h = 360, w = 260, lean = -140, fill = C.blue, seed = 970 } = o;
    if (!(k >= 0 && k <= 4)) return;
    const r = MG.rng(seed + k * 17);
    ctx.save();
    const sheet = (H, W, L, curl) => {
      // left edge, ragged crest of fingers, right edge; the crest curls over toward `lean` by `curl`
      const pts = [[x - W * 0.12, ground]];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, hy = H * (0.55 + 0.45 * Math.sin(Math.PI * (0.15 + 0.85 * u))), fx = x - W / 2 + W * u + L * (hy / H);
        pts.push([fx + curl * Math.sin(Math.PI * u) * 0.3, ground - hy * (i % 2 ? 0.86 : 1) + curl * 0.25 * Math.sin(Math.PI * u)]);
      }
      pts.push([x + W * 0.12, ground], [x, ground + 1]);
      IB.ink(ctx, pts, { closed: true, fill, w: 3, seed: seed + k, wob: 1.2 });
      for (let i = 0; i < 4; i++) { const u = 0.2 + i * 0.2, bx = x - W * 0.2 + W * 0.45 * u; IB.ink(ctx, [[bx, ground - 10], [bx + L * 0.35 * u + (r() - 0.5) * 20, ground - H * (0.3 + 0.35 * r())]], { w: 3, color: C.paper, seed: seed + 20 + i, grain: 0 }); }   // white streaks up the sheet
      return pts;
    };
    const drops = (count, y0, y1, spread, sz) => { for (let i = 0; i < count; i++) IB.raindrop(ctx, [x + lean * 0.8 + (r() - 0.5) * spread, lerp(y0, y1, r())], { s: sz * (0.7 + 0.6 * r()), stretch: 1.3, fill, seed: seed + 40 + i }); };
    if (k === 0) sheet(h * 0.32, w * 0.6, lean * 0.15, 0);
    if (k === 1) { const p = sheet(h, w, lean, 0); for (let i = 1; i < p.length - 1; i += 2) IB.raindrop(ctx, [p[i][0] + lean * 0.12, p[i][1] - 26], { s: 1.2, stretch: 1.3, fill, seed: seed + 60 + i }); }
    if (k === 2) { sheet(h * 0.75, w * 1.05, lean * 1.25, lean * 0.9); drops(12, ground - h * 0.95, ground - h * 0.35, w * 1.4, 1.4); }
    if (k === 3) { sheet(h * 0.22, w * 0.7, lean * 0.4, 0); drops(16, ground - h * 0.7, ground - 20, w * 1.7, 1.3); }
    if (k === 4) drops(8, ground - h * 0.3, ground - 10, w * 1.9, 1.1);
    ctx.restore();
  };
})(window);
