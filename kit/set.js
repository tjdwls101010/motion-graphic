/* Shared illustrated desk objects for the set family. */
(function (g) {
  const S = g.SET = {};

  /** Draw the wooden desktop, sliding grid paper, coffee cup and pencil. slide offsets the paper vertically in pixels. */
  S.desk = (ctx, pen, slide = 0) => {
    ctx.fillStyle = SET.wood(ctx);
    ctx.fillRect(-2000, -2000, 6000, 5000);
    for (let y = -1000; y < 2500; y += 14) {
      pen.line(-1000, y, 3000, y + 2, { color: 'rgba(100,53,23,.16)', w: 1.2, seed: y });
    }
    pen.hatch([[160, 120 + slide], [1810, 120 + slide], [1810, 1000 + slide], [160, 1000 + slide]], { color: 'rgba(71,47,29,.38)', gap: 8, w: 1.5, seed: 2 });
    pen.rect(140, 100 + slide, 1650, 880, { fill: '#f4efdc', w: 4, seed: 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(145, 105 + slide, 1640, 870);
    ctx.clip();
    ctx.strokeStyle = 'rgba(120,140,132,.2)';
    ctx.lineWidth = 1;
    for (let x = 160; x < 1800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 105 + slide);
      ctx.lineTo(x, 975 + slide);
      ctx.stroke();
    }
    for (let y = 120 + slide; y < 980 + slide; y += 40) {
      ctx.beginPath();
      ctx.moveTo(145, y);
      ctx.lineTo(1790, y);
      ctx.stroke();
    }
    S.grain(ctx, 145, 105 + slide, 1640, 870, 25);
    ctx.restore();
    pen.circle(1790, 96, 90, { fill: '#efe8d5', w: 4, seed: 3 });
    pen.circle(1790, 96, 68, { fill: '#674029', w: 3, seed: 4 });
    SK.pencil(pen, 1550, 1008, { s: 0.85, rot: 35 });
  };

  /** Draw a phone at x,y with scale, outline progress, checklist progress and optional checked boxes. */
  S.phone = (pen, x, y, checked = false, scale = 1, outline = 1, list = 1) => {
    pen.with(x, y, { scale }, () => {
      if (outline >= 1) pen.hatch([[-105, -240], [145, -240], [145, 280], [-105, 280]], { color: 'rgba(62,54,43,.32)', gap: 8, w: 1.4, seed: 19 });   // the cast shadow belongs to a finished phone, not to one still being outlined
      pen.rect(-125, -260, 250, 520, { r: 35, fill: '#bdb9aa', w: 5, p: outline, seed: 21 });
      if (outline < 1) return;
      pen.hatch([[-120, -250], [120, -250], [120, 250], [-120, 250]], { color: 'rgba(55,49,40,.2)', gap: 13, w: 1.5, seed: 20 });
      pen.rect(-103, -220, 206, 410, { r: 20, fill: '#fbf8eb', w: 4, seed: 22 });
      pen.hatch([[-95, -210], [95, -210], [95, 180], [-95, 180]], { color: 'rgba(125,120,105,.13)', gap: 18, w: 1, seed: 27 });
      pen.line(-35, -241, 35, -241, { w: 4, seed: 23 });
      pen.circle(0, 225, 14, { w: 3, seed: 24 });
      pen.text('할 일', -75, -170, { size: 52, p: MG.clamp(list * 4) });
      pen.line(-76, -135, 62, -135, { w: 3, p: MG.clamp(list * 4 - 0.5), seed: 26 });
      for (let i = 0; i < 4; i++) {
        const y = -85 + i * 65;
        const progress = MG.clamp(list * 5 - i - 0.5);
        pen.rect(-76, y, 31, 31, { w: 3, p: progress, seed: 30 + i });
        pen.line(-30, y + 17, 70, y + 17, { color: '#aaa79b', w: 3, p: progress, seed: 40 + i });
        if (checked) pen.poly([[-73, y + 12], [-60, y + 28], [-39, y - 5]], { w: 4, p: progress, seed: 50 + i });
      }
    });
  };

  /** Draw a teal fountain pen with its nib at x,y; scale and rot control its pose. */
  S.fountain = (pen, x, y, scale = 1, rot = 0) => {
    pen.with(x, y, { scale, rot }, () => {
      pen.hatch([[12, 10], [55, -65], [95, -225], [110, -200], [70, -45], [30, 20]], { color: 'rgba(65,54,43,.3)', gap: 7, w: 1.4, seed: 59 });
      pen.poly([[0, 0], [24, -58], [47, -67], [52, -47], [18, -8]], { closed: true, fill: '#eee5cf', w: 4, seed: 60 });
      pen.poly([[15, -40], [45, -79], [75, -68], [44, -25]], { closed: true, fill: '#292725', w: 4, seed: 61 });
      pen.rect(42, -230, 42, 170, { r: 18, fill: '#269b9e', w: 4, seed: 62 });
      pen.line(48, -190, 75, -212, { w: 3, seed: 63 });
      pen.line(48, -223, 48, -90, { color: 'rgba(224,247,236,.4)', w: 2, seed: 65 });
      pen.line(10, -8, 36, -49, { w: 2, seed: 66 });
      pen.circle(34, -48, 4, { w: 2, seed: 67 });
      SK.tag(pen, 118, -110, 'pstack', { w: 150, h: 55, size: 31, rot: 6, seed: 64 });
    });
  };

  /** Add deterministic short paper fibers in the rectangle x,y,w,h with a stable seed. */
  S.grain = (ctx, x, y, w, h, seed = 1) => {
    const random = MG.rng(seed);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.lineWidth = 1;
    for (let i = 0; i < 850; i++) {
      const px = x + random() * w;
      const py = y + random() * h;
      ctx.strokeStyle = i % 3 ? 'rgba(131,114,88,.10)' : 'rgba(255,255,246,.38)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 5 + random() * 15, py - 4 - random() * 12);
      ctx.stroke();
    }
    ctx.restore();
  };

  /** Draw the small blue-topped walker with its feet at x,y, scaled by s (about 300 units tall at s = 1). o.stride (-1..1) swings the legs, o.air (0..1) tucks the legs and lifts the arm for a hop, o.wave (a phase in radians, or undefined) raises the arm and waves it, o.squash (below 1) flattens the figure for a landing. */
  S.walker = (p, x, y, s, o = {}) => {
    const stride = o.stride ?? 0;
    const air = o.air ?? 0;
    const seed = o.seed ?? 200;
    p.with(x, y, { scale: s }, () => {
      p.ctx.scale(1, o.squash ?? 1);
      if (!air) p.ellipse(6, 4, 66, 12, { fill: 'rgba(76,67,54,.2)', color: null, seed: seed + 1 });
      // Navy trousers and brown shoes; in the air the knees tuck up and trail back.
      const hipL = [-16, -128];
      const hipR = [16, -128];
      const footL = [-18 - stride * 34 - air * 22, -air * 62];
      const footR = [18 + stride * 34 + air * 14, -air * 34];
      p.poly([hipL, [(hipL[0] + footL[0]) / 2 + air * 30, -64 + air * 14], footL], { color: '#3b3f6b', w: 17, seed: seed + 2 });
      p.poly([hipR, [(hipR[0] + footR[0]) / 2 + air * 36, -64 + air * 8], footR], { color: '#3b3f6b', w: 17, seed: seed + 3 });
      p.ellipse(footL[0] + 8, footL[1] + 2, 20, 8, { fill: '#5a3a2a', w: 3, seed: seed + 4 });
      p.ellipse(footR[0] + 8, footR[1] + 2, 20, 8, { fill: '#5a3a2a', w: 3, seed: seed + 5 });
      // Light-blue top with hatching and one long loop of an arm.
      const body = p.rect(-46, -250, 92, 130, { r: 34, fill: '#8fc0de', w: 4.5, seed: seed + 6 });
      p.hatch(body, { color: 'rgba(40,80,120,.28)', gap: 7, w: 1.3, angle: -60, seed: seed + 7 });
      const waving = o.wave != null;
      const hand = waving ? [62 + Math.sin(o.wave) * 14, -392] : air ? [78, -268 - air * 24] : [-6 + stride * 8, -146];
      const arm = [[air || waving ? 30 : -22, -238], [air || waving ? 62 : -36, waving ? -300 : air ? -228 : -200], [hand[0] - (air || waving ? 6 : 14), hand[1] + 24], hand];
      p.curve(arm, { color: '#2b2723', w: 26, seed: seed + 8 });
      p.curve(arm, { color: '#8fc0de', w: 17, seed: seed + 8 });
      p.circle(hand[0], hand[1], 11, { fill: '#e8a888', w: 3, seed: seed + 9 });
      // Round freckled head, brown hair, an eye dot and a smile.
      p.circle(2, -304, 54, { fill: '#e8a888', w: 4.5, seed: seed + 10 });
      for (let k = 0; k < 9; k++) p.circle(-26 + MG.hash(seed, k) * 52, -318 + MG.hash(seed, k + 30) * 50, 1.6, { fill: '#b9714d', color: null, seed: seed + 20 + k });
      p.curve([[-52, -300], [-48, -346], [-4, -362], [44, -346], [58, -308], [40, -322], [6, -328], [-24, -316], [-52, -300]], { closed: true, fill: '#5b3a2a', w: 4, seed: seed + 11 });
      p.circle(32, -300, 4.5, { fill: '#2b2723', w: 1.5, seed: seed + 12 });
      p.curve([[18, -284], [30, -276], [44, -286]], { color: '#2b2723', w: 3, seed: seed + 13 });
    });
  };

  /** Apply a camera centered at cx,cy at zoom z to the whole canvas world. */
  S.camera = (ctx, z, cx, cy) => ctx.setTransform(z, 0, 0, z, 960 - cx * z, 540 - cy * z);

  /** Draw a filled, spiky red bug at x,y with radius r and stable seed. */
  S.bug = (pen, x, y, r, seed) => {
    const points = [];
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      const radius = i % 2 ? r * 0.55 : r;
      points.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius]);
    }
    points.push(points[0]);
    pen.poly(points, { closed: true, fill: '#dc4734', w: 3, seed });
  };

  S.route = [[400, 600], [570, 750], [760, 780], [970, 690], [1130, 490], [1280, 450], [1400, 620]];

  const tiles = {};
  /** Build a repeating w x h texture once (draw paints it into a 2D context) and return it as a pattern of ctx; the pattern is anchored in world space, so it scales with the camera. */
  S.pattern = (ctx, key, w, h, draw) => {
    if (!tiles[key]) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      draw(canvas.getContext('2d'), w, h);
      tiles[key] = canvas;
    }
    return ctx.createPattern(tiles[key], 'repeat');
  };

  /** Stroke a segment into a tile so that it wraps around the tile edges and the texture repeats without a seam. */
  const wrapLine = (x, x1, y1, x2, y2, w, h) => {
    for (let dx = -w; dx <= w; dx += w) {
      for (let dy = -h; dy <= h; dy += h) {
        x.beginPath();
        x.moveTo(x1 + dx, y1 + dy);
        x.lineTo(x2 + dx, y2 + dy);
        x.stroke();
      }
    }
  };

  /** Scatter n deterministic strokes of random length in [minLen, maxLen] at the angle returned by angle(random) into a tile. */
  const scatter = (x, w, h, random, n, minLen, maxLen, angle, color, width) => {
    x.strokeStyle = color;
    x.lineWidth = width;
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const px = random() * w;
      const py = random() * h;
      const a = angle(random);
      const len = minLen + random() * (maxLen - minLen);
      wrapLine(x, px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, w, h);
    }
  };

  /** Denim felt: blue ground with dense dark diagonal hatching, lighter cross strokes and a few long scratches, as on the building walls. */
  S.denim = ctx => S.pattern(ctx, 'denim', 384, 384, (x, w, h) => {
    const random = MG.rng(11);
    x.fillStyle = '#6288b3';
    x.fillRect(0, 0, w, h);
    scatter(x, w, h, random, 420, 40, 150, r => 0.95 + (r() - 0.5) * 0.12, 'rgba(24,44,78,.40)', 1.2);
    scatter(x, w, h, random, 210, 40, 130, r => -0.62 + (r() - 0.5) * 0.14, 'rgba(238,244,252,.20)', 1.3);
    scatter(x, w, h, random, 70, 60, 200, r => (r() - 0.5) * 0.08, 'rgba(24,44,78,.16)', 1.2);
    scatter(x, w, h, random, 34, 90, 240, r => 0.9 + (r() - 0.5) * 0.5, 'rgba(18,30,56,.55)', 1.8);
  });

  /** Warm wood: amber ground with long wavy grain lines and a dense diagonal hatching. */
  S.wood = ctx => S.pattern(ctx, 'wood', 480, 240, (x, w, h) => {
    const random = MG.rng(23);
    x.fillStyle = '#dba75d';
    x.fillRect(0, 0, w, h);
    scatter(x, w, h, random, 160, 60, 260, r => (r() - 0.5) * 0.04, 'rgba(120,70,24,.30)', 1.4);
    scatter(x, w, h, random, 90, 60, 220, r => (r() - 0.5) * 0.03, 'rgba(255,230,170,.40)', 2);
    scatter(x, w, h, random, 260, 20, 70, r => 0.9 + (r() - 0.5) * 0.1, 'rgba(96,56,22,.22)', 1.1);
  });

  /** Cream paper with faint pencil dashes in both diagonal directions; draw it over a flat cream fill. */
  S.cream = ctx => S.pattern(ctx, 'cream', 512, 512, (x, w, h) => {
    const random = MG.rng(31);
    scatter(x, w, h, random, 150, 14, 44, r => 0.95 + (r() - 0.5) * 0.3, 'rgba(140,116,80,.13)', 1);
    scatter(x, w, h, random, 110, 14, 40, r => -0.7 + (r() - 0.5) * 0.3, 'rgba(255,255,250,.45)', 1.4);
    scatter(x, w, h, random, 60, 12, 30, r => -0.8 + (r() - 0.5) * 0.3, 'rgba(140,116,80,.12)', 1);
  });

  /** Measure the width of text in the given pen font settings (size, weight, font family). */
  S.measure = (ctx, text, size, weight = 700, font = SK.FONT) => {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const width = ctx.measureText(text).width;
    ctx.restore();
    return width;
  };

  /** Monospace label plaque: a cream tag with a soft shadow, dotted ends and bold code text that types on with p. Returns its width. */
  S.plaque = (pen, x, y, text, o = {}) => {
    const size = o.size ?? 31;
    const width = S.measure(pen.ctx, text, size, 800, '"JetBrains Mono"') + 62;
    const height = o.h ?? size + 24;
    const p = o.p ?? 1;
    if (p <= 0) return width;
    pen.ctx.fillStyle = 'rgba(30,40,60,.25)';
    pen.ctx.fillRect(x + 6, y + 8, width, height);
    pen.rect(x, y, width, height, { r: 9, fill: '#f3ead3', w: 3.5, seed: o.seed ?? 77 });
    pen.hatch([[x + 6, y + 4], [x + width - 6, y + 4], [x + width - 6, y + height - 4], [x + 6, y + height - 4]], { color: 'rgba(150,125,85,.22)', gap: 7, w: 1, angle: -60, seed: (o.seed ?? 77) + 1 });
    pen.circle(x + 18, y + height / 2, 3.5, { fill: '#3b2f27', w: 1, seed: (o.seed ?? 77) + 2 });
    pen.circle(x + width - 18, y + height / 2, 3.5, { fill: '#3b2f27', w: 1, seed: (o.seed ?? 77) + 3 });
    pen.text(text, x + 31, y + height / 2 + 1, { size, weight: 800, font: '"JetBrains Mono"', p });
    return width;
  };

  /** Round numbered floor medallion. kind: blue (pale ring on felt), wood (brown disc), paper (ink ring on cream) or ghost (lavender outline for a floor that is not built yet). */
  S.medallion = (pen, x, y, r, label, kind = 'blue', seed = 1) => {
    const look = {
      blue: { fill: '#9db4d0', line: '#2b2723', text: '#37506f', hatch: 'rgba(255,255,255,.25)' },
      wood: { fill: '#8d5a2b', line: '#2b2723', text: '#f6ead2', hatch: 'rgba(40,20,5,.3)' },
      paper: { fill: '#f1ead7', line: '#2b2723', text: '#2b2723', hatch: 'rgba(120,100,70,.2)' },
      ghost: { fill: null, line: '#a9a1e0', text: '#a9a1e0', hatch: null },
    }[kind];
    pen.circle(x, y, r, { fill: look.fill, color: look.line, w: kind === 'ghost' ? 2.5 : 4.5, seed });
    if (look.hatch) {
      pen.hatch(pen.circle(x, y, r - 5, { color: null, seed }), { color: look.hatch, gap: 6, w: 1.2, angle: 50, seed: seed + 1 });
      pen.circle(x, y, r - 9, { color: look.line, w: 1.4, alpha: 0.5, seed: seed + 2 });
    }
    pen.text(label, x, y + 4, { size: r * 1.15, align: 'center', color: look.text });
  };

  /** Spiky red burst centred on x,y with outer radius r: a drop shadow, irregular points, red fill with hatching and a dark outline. o.points sets the spike count. */
  S.burst = (pen, x, y, r, seed, o = {}) => {
    const n = o.points ?? 12;
    const points = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n + (MG.hash(seed, 99) - 0.5);
      const outer = i % 2 === 0;
      const radius = outer ? r * (0.88 + MG.hash(seed, i) * 0.22) : r * (0.46 + MG.hash(seed, i + 40) * 0.14);
      points.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius]);
    }
    points.push(points[0]);
    pen.ctx.fillStyle = 'rgba(40,50,70,.26)';
    pen.ctx.beginPath();
    pen.ctx.arc(x + r * 0.3, y + r * 0.3, r * 0.72, 0, Math.PI * 2);
    pen.ctx.fill();
    pen.poly(points, { closed: true, fill: '#e2422f', w: o.w ?? 4, seed });
    pen.hatch(points, { color: 'rgba(110,18,12,.40)', gap: Math.max(4, r / 9), w: 1.3, angle: 40, seed: seed + 1 });
    pen.hatch(points, { color: 'rgba(255,190,160,.16)', gap: Math.max(5, r / 7), w: 1.2, angle: -55, seed: seed + 2 });
  };

  /** Short dark impact lines radiating from x,y between radii r0 and r1; grow is 0..1 and scales how far they reach. */
  S.rays = (pen, x, y, r0, r1, count, seed, grow = 1) => {
    for (let k = 0; k < count; k++) {
      const a = (k * Math.PI * 2) / count + (MG.hash(seed, k) - 0.5) * 0.35;
      const start = r0 * (1 + MG.hash(seed, k + 20) * 0.1);
      const end = start + (r1 - r0) * (0.45 + MG.hash(seed, k + 60) * 0.55) * grow;
      pen.line(x + Math.cos(a) * start, y + Math.sin(a) * start, x + Math.cos(a) * end, y + Math.sin(a) * end, { color: '#2e211d', w: 3.2, seed: seed + k });
    }
  };

  /** Slate-blue felt for machine bodies: pale blue-grey with long dark and light crossing scratches. */
  S.slate = ctx => S.pattern(ctx, 'slate', 420, 420, (x, w, h) => {
    const random = MG.rng(41);
    x.fillStyle = '#8ba4bd';
    x.fillRect(0, 0, w, h);
    scatter(x, w, h, random, 120, 80, 260, r => 0.85 + (r() - 0.5) * 0.5, 'rgba(26,44,74,.34)', 1.3);
    scatter(x, w, h, random, 90, 60, 220, r => -0.7 + (r() - 0.5) * 0.5, 'rgba(240,246,252,.30)', 1.3);
    scatter(x, w, h, random, 60, 20, 70, r => 0.95 + (r() - 0.5) * 0.2, 'rgba(26,44,74,.28)', 1.1);
  });

  /** Brass: warm gold with dense diagonal strokes in dark amber and pale yellow. */
  S.gold = ctx => S.pattern(ctx, 'gold', 360, 360, (x, w, h) => {
    const random = MG.rng(53);
    x.fillStyle = '#dca843';
    x.fillRect(0, 0, w, h);
    scatter(x, w, h, random, 260, 30, 110, r => 0.95 + (r() - 0.5) * 0.2, 'rgba(150,90,20,.34)', 1.2);
    scatter(x, w, h, random, 160, 20, 80, r => -0.7 + (r() - 0.5) * 0.3, 'rgba(255,232,150,.36)', 1.3);
    scatter(x, w, h, random, 40, 80, 220, r => 1.1 + (r() - 0.5) * 0.9, 'rgba(120,70,15,.40)', 1.5);
  });

  /** Brass gear at x,y with outer radius r, turned by angle degrees: scalloped teeth, a thin inner ring, four spokes and a dark hub with a white dot. */
  S.gear = (pen, x, y, r, angle, seed = 1) => {
    pen.with(x, y, { rot: angle }, () => {
      const teeth = Math.max(8, Math.round(r / 10));
      const points = [];
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * Math.PI * 2;
        points.push([Math.cos(a) * r * (0.91 + 0.09 * Math.tanh(2.4 * Math.cos(teeth * a))), Math.sin(a) * r * (0.91 + 0.09 * Math.tanh(2.4 * Math.cos(teeth * a)))]);
      }
      points.push(points[0]);
      pen.poly(points, { closed: true, sharp: false, fill: S.gold(pen.ctx), w: 4, seed });
      pen.hatch(points, { color: 'rgba(110,60,10,.35)', gap: Math.max(5, r / 14), w: 1.2, angle: 50, seed: seed + 1 });
      pen.circle(0, 0, r * 0.68, { color: '#5a3a18', w: 2, seed: seed + 2 });
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + 0.15;
        pen.line(0, 0, Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68, { color: '#7a4d1c', w: 4, seed: seed + 3 + k });
      }
      pen.circle(0, 0, r * 0.14, { fill: '#3e4e68', w: 3, seed: seed + 8 });
      pen.circle(0, 0, r * 0.04, { fill: '#f4eedc', w: 1, seed: seed + 9 });
    });
  };

  /** Four-pointed cream sparkle of radius r at x,y. */
  S.sparkle = (pen, x, y, r, seed = 1) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      const radius = i % 2 ? r * 0.22 : r;
      pts.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius]);
    }
    pts.push(pts[0]);
    pen.poly(pts, { closed: true, fill: '#fbf1c8', w: 3, seed });
  };
})(window);
