/* props/citylife.js — the moving things of the world's cities, to put in front of the landmarks (sets/landmarks.js): a London double-decker bus and phone box, a ferry and a tall ship, a river with its waves, a Tokyo bullet train, a cable car on its cable, a cherry tree and its falling petals, a Paris lamp post and café table, the Banpo bridge's fountain jets, and a flapping pigeon or gull (IB.doubleDecker, IB.phoneBox, IB.ferry, IB.tallShip, IB.river, IB.shinkansen, IB.cableCar, IB.sakura, IB.petals, IB.lamppost, IB.cafeTable, IB.fountainBridge, IB.flapper). Machines (bus, train, ferry, cable car) move on ones; drawn things (petals, waves, wings, water) are new drawings on twos. Red is used only where it is the thing's own colour (the bus, the phone box). Needs ink.js. */
(function (g) {
  const IB = g.IB, C = IB.C, MG = g.MG, TAU = Math.PI * 2, { lerp } = MG;
  const poly = (ctx, pts, fill, lw, seed, smooth = false) => IB.ink(ctx, pts, { closed: true, smooth, fill, w: lw, seed });
  const box = (ctx, x, y, w, h, fill, lw, seed) => poly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, lw, seed);
  const wheel = (ctx, [x, y], r, spin, lw, seed) => { IB.oval(ctx, x, y, r, r, { fill: C.ink, w: lw, seed, n: 14 }); IB.oval(ctx, x, y, r * 0.45, r * 0.45, { fill: '#bdbdbd', w: lw * 0.6, seed: seed + 1, n: 10 }); IB.seg(ctx, x, y, x + Math.cos(spin) * r * 0.4, y + Math.sin(spin) * r * 0.4, { w: lw * 0.6, seed: seed + 2 }); };

  /* doubleDecker(ctx, [x, road], { spin, door }, { s, dir, lw }) — a red London double-decker from the side, 440 px long at s 1 (heading right with dir 1): two decks of windows, the door on the lower deck, the stair window at the back, the destination blind left blank. `at` is the middle of the bus on the road. spin turns the wheels (distance / their radius 30). */
  IB.doubleDecker = (ctx, [x, road], st = {}, o = {}) => {
    const s = o.s || 1, d = o.dir || 1, lw = o.lw || 3, seed = o.seed || 1300, L = 440 * s, H = 300 * s, x0 = x - L / 2, y0 = road - 30 * s - H + 20 * s;
    const X = (u) => (d === 1 ? x0 + u * L : x0 + (1 - u) * L);
    poly(ctx, [[X(0), y0 + 20 * s], [X(0.02), y0], [X(0.98), y0], [X(1), y0 + 18 * s], [X(1), road - 26 * s], [X(0), road - 26 * s]], C.red, lw, seed, false);
    for (let i = 0; i < 6; i++) box(ctx, Math.min(X(0.06 + i * 0.15), X(0.06 + i * 0.15 + 0.12)), y0 + 26 * s, 0.12 * L, 62 * s, C.sky, lw * 0.8, seed + 1 + i);
    for (let i = 0; i < 5; i++) box(ctx, Math.min(X(0.2 + i * 0.15), X(0.2 + i * 0.15 + 0.12)), y0 + 140 * s, 0.12 * L, 58 * s, C.sky, lw * 0.8, seed + 10 + i);
    box(ctx, Math.min(X(0.04), X(0.16)), y0 + 140 * s, 0.12 * L, 112 * s, st.door ? C.charcoal : C.sky, lw * 0.8, seed + 20);   // the door at the front
    box(ctx, Math.min(X(0.86), X(0.95)), y0 + 4 * s, 0.09 * L, 16 * s, C.paper, lw * 0.6, seed + 21);   // the destination blind, blank
    IB.seg(ctx, X(0), y0 + 112 * s, X(1), y0 + 112 * s, { w: lw * 0.6, seed: seed + 22 });
    wheel(ctx, [X(0.18), road - 30 * s], 30 * s, st.spin || 0, lw, seed + 30); wheel(ctx, [X(0.8), road - 30 * s], 30 * s, st.spin || 0, lw, seed + 34);
  };

  /* phoneBox(ctx, [x, ground], { s, open, lw }) — a red telephone box: the domed roof, the crown-less top panel left blank, the glazed door in a grid of small panes. open swings the door out toward the viewer (0..1). */
  IB.phoneBox = (ctx, [x, ground], o = {}) => {
    const s = o.s || 1, lw = o.lw || 3, seed = o.seed || 1340, w = 90 * s, h = 250 * s, top = ground - h;
    box(ctx, x - w / 2 - 6 * s, ground - 10 * s, w + 12 * s, 10 * s, C.red, lw, seed);
    box(ctx, x - w / 2, top + 30 * s, w, h - 40 * s, C.red, lw, seed + 1);
    poly(ctx, [[x - w / 2 - 4 * s, top + 30 * s], [x - w / 2, top + 14 * s], [x, top], [x + w / 2, top + 14 * s], [x + w / 2 + 4 * s, top + 30 * s]], C.red, lw, seed + 2, true);
    box(ctx, x - w / 2 + 8 * s, top + 32 * s, w - 16 * s, 16 * s, C.paper, lw * 0.6, seed + 3);
    const dw = (w - 20 * s) * (1 - 0.7 * (o.open || 0)), dx = x - w / 2 + 10 * s;
    box(ctx, dx, top + 58 * s, dw, h - 80 * s, C.sky, lw * 0.8, seed + 4);
    for (let i = 1; i < 3; i++) IB.seg(ctx, dx + (dw * i) / 3, top + 58 * s, dx + (dw * i) / 3, ground - 22 * s, { w: lw * 0.5, color: C.red, seed: seed + 5 + i });
    for (let j = 1; j < 8; j++) IB.seg(ctx, dx, top + 58 * s + j * (h - 80 * s) / 8, dx + dw, top + 58 * s + j * (h - 80 * s) / 8, { w: lw * 0.5, color: C.red, seed: seed + 10 + j });
  };

  /* river(ctx, [x0, x1], y, { d, h, seed }) — water from the line y down h px (220): a pale sky band with short wave strokes re-scattered every drawing d (pass the twos drawing number), and a darker line along the far bank. */
  IB.river = (ctx, [x0, x1], y, o = {}) => {
    const h = o.h || 220, seed = o.seed || 1360, r = MG.rng(seed + (o.d || 0) * 17);
    box(ctx, x0, y, x1 - x0, h, C.sky, 0, seed);
    IB.seg(ctx, x0, y, x1, y, { w: 3, seed: seed + 1 });
    for (let i = 0; i < (x1 - x0) / 40; i++) { const x = x0 + r() * (x1 - x0), yy = y + 14 + r() * (h - 24), l = 18 + r() * 30; IB.ink(ctx, [[x, yy], [x + l * 0.5, yy - 4], [x + l, yy]], { w: 2.2, color: C.blue, seed: seed + 10 + i, taper: true }); }
  };

  /* ferry(ctx, [x, water], { s, dir, lw }) — a commuter ferry in the harbour: a yellow-and-white hull, two decks of windows, a short funnel; sits with its waterline on `water`. 420 px long at s 1. */
  IB.ferry = (ctx, [x, water], o = {}) => {
    const s = o.s || 1, d = o.dir || 1, lw = o.lw || 3, seed = o.seed || 1380, L = 420 * s, X = (u) => x + (u - 0.5) * L * d;
    poly(ctx, [[X(0), water - 40 * s], [X(0.04), water + 10 * s], [X(0.94), water + 10 * s], [X(1), water - 46 * s]], C.yellow, lw, seed);
    poly(ctx, [[X(0.08), water - 40 * s], [X(0.08), water - 110 * s], [X(0.86), water - 110 * s], [X(0.9), water - 40 * s]], C.paper, lw, seed + 1);
    poly(ctx, [[X(0.2), water - 110 * s], [X(0.2), water - 160 * s], [X(0.7), water - 160 * s], [X(0.74), water - 110 * s]], C.paper, lw, seed + 2);
    for (let i = 0; i < 9; i++) { const u = 0.12 + i * 0.08; poly(ctx, [[X(u), water - 92 * s], [X(u + 0.05), water - 92 * s], [X(u + 0.05), water - 66 * s], [X(u), water - 66 * s]], C.sky, lw * 0.6, seed + 3 + i); }
    poly(ctx, [[X(0.42), water - 160 * s], [X(0.43), water - 200 * s], [X(0.5), water - 200 * s], [X(0.5), water - 160 * s]], C.charcoal, lw, seed + 20);
  };

  /* tallShip(ctx, [x, water], { s, dir, lw }) — a three-masted tall ship under bare yards with furled sails, the hull dark: the kind of vessel Tower Bridge lifts for. Masts reach 520 px above the water at s 1. */
  IB.tallShip = (ctx, [x, water], o = {}) => {
    const s = o.s || 1, d = o.dir || 1, lw = o.lw || 3, seed = o.seed || 1400, X = (u) => x + u * s * d;
    poly(ctx, [[X(-230), water - 50 * s], [X(-200), water + 14 * s], [X(190), water + 14 * s], [X(250), water - 60 * s]], C.charcoal, lw, seed);
    IB.seg(ctx, X(240), water - 58 * s, X(330), water - 120 * s, { w: lw, seed: seed + 1 });   // the bowsprit
    [-120, 10, 130].forEach((u, i) => {
      const top = water - (440 + (i === 1 ? 80 : 0)) * s;
      IB.seg(ctx, X(u), water - 50 * s, X(u), top, { w: lw * 1.2, seed: seed + 2 + i });
      for (let k = 0; k < 3; k++) { const y = top + 60 * s + k * 110 * s, w = (70 - k * -12) * s; IB.seg(ctx, X(u) - w, y, X(u) + w, y, { w: lw, seed: seed + 10 + i * 3 + k }); IB.oval(ctx, X(u), y + 6 * s, w * 0.9, 7 * s, { fill: C.paper, w: lw * 0.6, seed: seed + 20 + i * 3 + k, n: 10 }); }
    });
    IB.ink(ctx, [[X(330), water - 120 * s], [X(130), water - 440 * s], [X(10), water - 520 * s], [X(-120), water - 440 * s], [X(-230), water - 50 * s]], { w: lw * 0.5, smooth: false, seed: seed + 40, taper: false });   // the stays, straight
  };

  /* shinkansen(ctx, [nose, rail], { len, s, lw }) — a bullet train heading right, its long duckbill nose at `nose`: white body, a blue line under the windows, a row of small windows, the cars' joints. len is the visible length behind the nose (it runs off the left edge); wake (a frame number) adds three speed lines behind the tail, new every frame. A machine: move it on ones, fast (an 80 m/s pass crosses a wide shot in a quarter second). */
  IB.shinkansen = (ctx, [nose, rail], o = {}) => {
    const s = o.s || 1, lw = o.lw || 3, seed = o.seed || 1420, len = o.len || 2400, H = 120 * s, top = rail - H - 10 * s;
    const body = [[nose, rail - 18 * s], [nose - 30 * s, rail - 34 * s], [nose - 90 * s, rail - 62 * s], [nose - 170 * s, rail - 92 * s], [nose - 260 * s, top + 4 * s], [nose - 300 * s, top], [nose - len, top], [nose - len, rail - 10 * s], [nose - 10 * s, rail - 10 * s]];
    poly(ctx, body, C.paper, lw, seed, false);
    IB.ink(ctx, [[nose - 40 * s, rail - 34 * s], [nose - 300 * s, rail - 50 * s], [nose - len, rail - 50 * s]], { w: 9 * s, color: C.blue, seed: seed + 1, taper: false });
    IB.ink(ctx, [[nose - 180 * s, top + 22 * s], [nose - 250 * s, top + 8 * s]], { w: lw, seed: seed + 2 });   // the cab window
    for (let x = nose - 330 * s; x > nose - len; x -= 40 * s) IB.oval(ctx, x, top + 38 * s, 10 * s, 9 * s, { fill: C.sky, w: lw * 0.5, seed: seed + 3 + Math.round(x), n: 8 });
    for (let x = nose - 650 * s; x > nose - len; x -= 500 * s) IB.seg(ctx, x, top + 4, x, rail - 12 * s, { w: lw, seed: seed + 5 + Math.round(x) });
    if (o.wake != null) for (let i = 0; i < 3; i++) IB.seg(ctx, nose - len - 30 - i * 40, rail - 40 - i * 22, nose - len - 260 - i * 90, rail - 40 - i * 22, { w: 2.6, seed: seed + 30 + i + o.wake });   // speed lines behind the tail, re-seeded each frame (o.wake)
  };

  /* cableCar(ctx, at, { s, sway, lw }) — a cable car hanging from its grip: the arm from the cable point `at` down to a rounded cabin with a window band; sway tips it (rad) as it starts or stops. Draw the cable first (IB.ink a line between the stations). */
  IB.cableCar = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, lw = o.lw || 3, seed = o.seed || 1440, a = o.sway || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    IB.oval(ctx, 0, 0, 10 * s, 10 * s, { fill: C.charcoal, w: lw, seed, n: 8 });
    IB.seg(ctx, 0, 0, 0, 60 * s, { w: lw * 1.2, seed: seed + 1 });
    poly(ctx, [[-60 * s, 60 * s], [60 * s, 60 * s], [66 * s, 90 * s], [62 * s, 150 * s], [-62 * s, 150 * s], [-66 * s, 90 * s]], C.yellow, lw, seed + 2, true);
    poly(ctx, [[-54 * s, 76 * s], [54 * s, 76 * s], [56 * s, 108 * s], [-56 * s, 108 * s]], C.sky, lw * 0.7, seed + 3);
    ctx.restore();
  };

  /* sakura(ctx, [x, ground], { h, seed, lw }) — a cherry tree in bloom: a dark leaning trunk forking into three branches, crowned with overlapping clouds of blossom (lavender, the palette's nearest to pale pink) inked round. */
  IB.sakura = (ctx, [x, ground], o = {}) => {
    const h = o.h || 380, lw = o.lw || 3, seed = o.seed || 1460, r = MG.rng(seed);
    IB.tube(ctx, [[x, ground], [x - 0.04 * h, ground - 0.35 * h], [x + 0.02 * h, ground - 0.55 * h]], { w: 0.07 * h, edge: lw, fill: C.charcoal, smooth: true, seed });
    [[-0.3, 0.75], [0.25, 0.8], [0.0, 0.95]].forEach(([u, v], i) => IB.tube(ctx, [[x + 0.01 * h, ground - 0.5 * h], [x + u * h, ground - v * h]], { w: 0.03 * h, edge: lw * 0.8, fill: C.charcoal, seed: seed + 1 + i }));
    for (let i = 0; i < 9; i++) { const cx = x + (r() - 0.5) * 0.85 * h, cy = ground - (0.68 + r() * 0.35) * h, rr = (0.13 + r() * 0.08) * h; IB.oval(ctx, cx, cy, rr, rr * 0.8, { fill: C.lavender, w: lw, seed: seed + 10 + i, n: 14 }); }
  };

  /* petals(ctx, [x0, y0, x1, y1], { d, n, wind, seed }) — falling blossom petals in a box: n small lavender ovals at places re-rolled every drawing d (pass the twos drawing number), drifting with `wind` (px a drawing). A drawn thing: new on every drawing, never tweened. */
  IB.petals = (ctx, [x0, y0, x1, y1], o = {}) => {
    const n = o.n || 24, d = o.d || 0, wind = o.wind || 0, seed = o.seed || 1480, r = MG.rng(seed);
    for (let i = 0; i < n; i++) {
      const fx = r(), fy = r(), sp = 0.6 + r() * 0.8, ph = r() * TAU, x = x0 + ((fx * (x1 - x0) + d * wind * sp) % (x1 - x0) + (x1 - x0)) % (x1 - x0), y = y0 + ((fy * (y1 - y0) + d * 9 * sp) % (y1 - y0));
      IB.oval(ctx, x + Math.sin(ph + d * 0.9) * 8, y, 10, 6, { fill: C.lavender, w: 2, seed: seed + i + d * 31, n: 8 });
    }
  };

  /* lamppost(ctx, [x, ground], { h, lit, lw }) — a Paris lamp post: a fluted dark column on a stepped base, a crossbar and one lantern (yellow when lit). */
  IB.lamppost = (ctx, [x, ground], o = {}) => {
    const h = o.h || 420, lw = o.lw || 3, seed = o.seed || 1500;
    poly(ctx, [[x - 18, ground], [x - 12, ground - 50], [x + 12, ground - 50], [x + 18, ground]], C.charcoal, lw, seed);
    IB.tube(ctx, [[x, ground - 50], [x, ground - h + 40]], { w: 12, edge: lw, fill: C.charcoal, seed: seed + 1 });
    IB.seg(ctx, x - 26, ground - h + 60, x + 26, ground - h + 60, { w: lw, seed: seed + 2 });
    poly(ctx, [[x - 18, ground - h + 40], [x - 24, ground - h], [x + 24, ground - h], [x + 18, ground - h + 40]], o.lit ? C.yellow : C.paper, lw, seed + 3);
    poly(ctx, [[x - 28, ground - h], [x, ground - h - 22], [x + 28, ground - h]], C.charcoal, lw, seed + 4);
  };

  /* cafeTable(ctx, [x, ground], { s, lw }) — a round bistro table seen from the side: a marble top (an ellipse) on a single dark stem and a tripod foot; 0.75 m high at s 1 (105 px at 140 px a metre). Returns the top's y. */
  IB.cafeTable = (ctx, [x, ground], o = {}) => {
    const s = o.s || 1, lw = o.lw || 3, seed = o.seed || 1520, top = ground - 105 * s;
    IB.seg(ctx, x, top, x, ground - 6, { w: lw * 1.6, seed });
    IB.ink(ctx, [[x - 36 * s, ground], [x, ground - 14 * s], [x + 36 * s, ground]], { w: lw, seed: seed + 1 });
    IB.oval(ctx, x, top, 55 * s, 9 * s, { fill: C.paper, w: lw, seed: seed + 2, n: 14 });
    return top;
  };

  /* fountainBridge(ctx, [x0, x1, deck], { k, lw, d }) — the Banpo bridge's moonlight rainbow fountain: from nozzles under the deck, jets arc out and fall to the river; k (0..1) is how far they have come on (they start in 4 drawings), d re-rolls the spray every drawing. Draws the deck too. */
  IB.fountainBridge = (ctx, [x0, x1, deck], o = {}) => {
    const lw = o.lw || 3, seed = o.seed || 1540, k = MG.clamp(o.k == null ? 1 : o.k, 0, 1), d = o.d || 0, r = MG.rng(seed + d * 7);
    for (let x = x0 + 60; x < x1; x += 180) { IB.seg(ctx, x, deck + 30, x, deck + 220, { w: 12, seed: seed + x }); }   // the piers
    poly(ctx, [[x0, deck], [x1, deck], [x1, deck + 30], [x0, deck + 30]], C.paper, lw, seed);
    if (k <= 0) return;
    for (let x = x0 + 30; x < x1 - 20; x += 46) {   // each jet leaves the deck toward the viewer and falls in a curve: seen broadside, a hanging arc
      const drop = 210 * k, out = 26 * k, pts = [];
      for (let q = 0; q <= 8; q++) { const u = q / 8; pts.push([x + out * Math.sin(u * Math.PI * 0.8), deck + 34 + drop * u * u]); }
      IB.ink(ctx, pts, { w: 4, color: C.blue, seed: seed + x, taper: true });
      if (k >= 1) for (let q = 0; q < 2; q++) IB.oval(ctx, x - 6 + r() * 30, deck + 30 + drop - r() * 40, 2.5, 3.5, { fill: C.blue, w: 0, n: 6 });
    }
  };

  /* flapper(ctx, [x, y], { wing, s, dir, color, lw }) — a pigeon or gull in flight as the reference draws far birds: an M of two wings over a small body, the tips up (wing 0) or down (wing 1); alternate the two drawings on twos while it flaps. */
  IB.flapper = (ctx, [x, y], o = {}) => {
    const s = o.s || 1, d = o.dir || 1, lw = o.lw || 2.6, seed = o.seed || 1560, up = !o.wing;
    const tip = up ? -18 : 10, mid = up ? -6 : 2;   // the wing tips up or down, the elbows a little less
    IB.ink(ctx, [[x - 30 * s, y + tip * s], [x - 14 * s, y + mid * s], [x, y], [x + 14 * s, y + mid * s], [x + 30 * s, y + tip * s]], { w: lw * 1.2, seed: seed + 2 });
    IB.oval(ctx, x + 2 * s * d, y + 2 * s, 8 * s, 4 * s, { fill: o.color || '#d9d9d9', w: lw * 0.8, seed, n: 8 });
  };

})(window);
