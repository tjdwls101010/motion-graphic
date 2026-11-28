/* props/copyroom.js — the copy room and the pantry of an office in the IBM look: a floor-standing printer seen from the front that feeds, jams and spits its paper, a pantry counter with a coffee machine (a cup's place, a stream, a water tank and an empty light) and a water cooler, a stack of papers that leans and bends as one, and loose sheets that fly and settle. Paper-white bodies in the same brush-pen outline as the furniture, graphite where things meet the floor or hide under an overhang; the lights, the water and one folder colour are the only colours. New, not measured: at s = 1 the sizes are set for figures 340 px tall (a printer to the waist, a counter top at 0.53 h); every part takes opts.s to scale with a larger figure (s = h / 340), its lines staying `lw` px on screen. Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* The two lights the room's machines use: 'ok' is lit green, 'warn' lit yellow, anything else unlit. A machine light is a machine: the scene may switch it on ones. */
  const LIGHT = { ok: C.green, warn: C.yellow };
  /* Scale what follows by s about the stage point `at` (until ctx.restore()), and map a point drawn in the part's own px back to the stage. */
  const zoom = (ctx, at, s) => { ctx.save(); ctx.translate(at[0], at[1]); ctx.scale(s, s); ctx.translate(-at[0], -at[1]); };
  const unzoom = (at, s) => ([x, y]) => [at[0] + (x - at[0]) * s, at[1] + (y - at[1]) * s];

  /* printer(ctx, at, state, opts) — a floor-standing office printer seen from the front, 210 x 250: two paper drawers on casters, the print engine with its panel (a blank screen and a status light), and on top a scanner block over the right of it with the output bay under it, where printed sheets slide out to the left onto the top. `at` is the floor under its centre.
     state  out    sheets already lying in the output tray (each 2.5 px of the stack seen edge-on)
            feed   0..1, how far the sheet being printed has slid out of the bay (0: none)
            jam    0 | 1 | 2: no jam, or one of two drawings of a sheet chewed into a zigzag and stuck half out of the bay (alternate them on twos while it chews, then hold one)
            light  'ok' | 'warn' | 'off': the status light (blink it by switching to 'off' every few frames)
            jolt   px the whole body is knocked sideways (a shudder on ones, a thump); tilt rad it rocks about its bottom right corner (- lifts its left caster)
     opts   s (1: 210 x 250), lw (3.2 on screen), seed
     Returns { slot, tray, side, light, top }: the point where paper leaves the bay, the top of the output stack, the middle of its left flank (where a hand thumps it), the status light and the top of the scanner, all in stage px and already moved by jolt (tilt ignored). (work/printer-jam-thump) */
  IB.printer = (ctx, [cx, floor], st = {}, o = {}) => {
    const { out = 0, feed = 0, light = 'ok', tilt = 0, jam = 0 } = st, { s = 1, seed = 900 } = o, lw = (o.lw || 3.2) / s, jolt = (st.jolt || 0) / s, W = 210, H = 250, back = unzoom([cx, floor], s);
    zoom(ctx, [cx, floor], s);
    const x0 = cx - W / 2 + jolt, x1 = cx + W / 2 + jolt, bot = floor - 12, top = bot - H, cab = bot - 0.44 * H, eng = top + 0.26 * H, scanX = x0 + 0.42 * W, scanB = top + 0.14 * H;
    const slot = [scanX - 4, eng - 6], light0 = [x1 - 26, eng + 26];
    IB.shade(ctx, cx - W / 2 - 4, floor - 26, W + 8, 26, { from: 'bottom', seed: seed - 61, alpha: 0.5 });
    ctx.save();
    ctx.translate(x1, bot); ctx.rotate(tilt); ctx.translate(-x1, -bot);
    [x0 + 22, x1 - 22].forEach((x, i) => IB.oval(ctx, x, floor - 6, 7, 6, { fill: C.ink, w: lw * 0.8, seed: seed + 30 + i, n: 9 }));   // casters
    // drawers: two, each with a recessed handle
    IB.box(ctx, x0, cab, W, bot - cab, { fill: C.paper, w: lw, seed });
    const dh = (bot - cab) / 2;
    for (let i = 0; i < 2; i++) {
      if (i) IB.seg(ctx, x0 + 4, cab + dh, x1 - 4, cab + dh, { w: lw * 0.8, seed: seed + 2 });
      IB.box(ctx, cx + jolt - 30, cab + i * dh + 14, 60, 9, { fill: '#d9d9d9', w: lw * 0.7, seed: seed + 3 + i });
    }
    // the engine: a front door and the panel with the status light
    IB.box(ctx, x0, eng, W, cab - eng, { fill: C.paper, w: lw, seed: seed + 6 });
    IB.box(ctx, x0 + 12, eng + 46, W * 0.56, cab - eng - 58, { w: lw * 0.7, seed: seed + 7 });
    IB.box(ctx, x1 - 92, eng + 14, 50, 24, { fill: C.bg, w: lw * 0.75, seed: seed + 8 });
    IB.oval(ctx, light0[0], light0[1], 8, 8, { fill: LIGHT[light] || C.bg, w: lw * 0.75, seed: seed + 9, n: 10 });
    // the bay under the scanner, in shadow; the scanner block over it on its right column
    IB.box(ctx, scanX, scanB, x1 + 6 - scanX, eng - scanB, { fill: C.bg, w: 0, seed: seed + 10 });
    IB.shade(ctx, scanX + 2, scanB + 2, x1 - scanX - 8, eng - scanB - 2, { from: 'top', seed: seed - 62, alpha: 0.7 });
    IB.box(ctx, x1 - 26, scanB, 26, eng - scanB, { fill: C.paper, w: lw * 0.85, seed: seed + 11 });
    IB.box(ctx, scanX, top, x1 + 6 - scanX, scanB - top, { fill: C.paper, w: lw, seed: seed + 12 });
    IB.seg(ctx, scanX + 6, top + 9, x1, top + 9, { w: lw * 0.6, seed: seed + 13 });   // the lid's seam
    // the output: a stack edge-on on the tray, the sheet sliding out over it, or a jammed sheet chewed into a zigzag
    const sy = eng - 2 - out * 2.5, SW = 0.5 * W;
    if (out > 0) { IB.box(ctx, slot[0] - SW, sy, SW, eng - sy, { fill: C.paper, w: lw * 0.75, seed: seed + 14 }); if (out > 2) IB.seg(ctx, slot[0] - SW + 6, lerp(sy, eng, 0.5), slot[0] - 8, lerp(sy, eng, 0.5), { w: 1.4, seed: seed + 15 }); }
    if (feed > 0) IB.box(ctx, slot[0] - SW * clamp(feed), sy - 5, SW * clamp(feed) + 10, 5, { fill: C.paper, w: lw * 0.7, seed: seed + 16 });
    if (jam) {
      const z = jam === 1 ? [[6, 0], [-8, -14], [10, -26], [-14, -40], [4, -52], [-20, -60]] : [[6, 0], [-12, -12], [8, -28], [-18, -36], [2, -54], [-26, -56]];
      const pts = z.map(([dx, dy]) => [slot[0] + dx - 8, slot[1] + dy]);
      IB.ink(ctx, pts.concat(pts.slice().reverse().map(([x, y], i) => [x - 18 + (i % 2) * 6, y + 4])), { closed: true, smooth: false, fill: C.paper, w: lw * 0.8, seed: seed + 17 + jam });
      for (let i = 1; i < 5; i++) IB.seg(ctx, pts[i][0] - 16, pts[i][1] + 2, pts[i][0], pts[i][1], { w: 1.4, seed: seed + 20 + i });   // the fold lines
    }
    ctx.restore();
    ctx.restore();
    return { slot: back(slot), tray: back([slot[0] - SW / 2, sy]), side: back([x0, lerp(eng, cab, 0.4)]), light: back(light0), top: back([cx, top])[1] };
  };

  /* counter(ctx, at, opts) — a pantry counter seen from the front: a worktop slab over a run of cupboard doors with small handles, a toe kick, graphite under the worktop's lip and at the floor. `at` is the floor under its centre; opts w (440), h (180: the worktop at 0.53 of a 340 px figure), both before s, s, lw, seed. Returns the worktop's top y on the stage, where a machine stands (work/coffee-queue-shuffle). */
  IB.counter = (ctx, [cx, floor], o = {}) => {
    const { w: W = 440, h: H = 180, s = 1, seed = 960 } = o, lw = (o.lw || 3.2) / s, top = floor - H, x0 = cx - W / 2, n = Math.max(1, Math.round(W / 140)), dw = (W - 16) / n;
    zoom(ctx, [cx, floor], s);
    IB.shade(ctx, x0, floor - 24, W, 24, { from: 'bottom', seed: seed - 31, alpha: 0.45 });
    IB.box(ctx, x0 + 8, top + 18, W - 16, H - 30, { fill: C.paper, w: lw, seed });
    IB.box(ctx, x0 + 14, floor - 12, W - 28, 12, { fill: '#d9d9d9', w: lw * 0.8, seed: seed + 1 });
    for (let i = 0; i < n; i++) {
      const dx = x0 + 8 + i * dw;
      if (i) IB.seg(ctx, dx, top + 22, dx, floor - 14, { w: lw * 0.8, seed: seed + 2 + i });
      const hx = dx + (i % 2 ? 14 : dw - 14);
      IB.seg(ctx, hx, top + 40, hx, top + 70, { w: lw * 1.3, seed: seed + 10 + i });
    }
    IB.shade(ctx, x0 + 10, top + 18, W - 20, 20, { from: 'top', seed: seed - 32, alpha: 0.5 });
    IB.box(ctx, x0, top, W, 18, { fill: C.paper, w: lw, seed: seed + 20 });
    ctx.restore();
    return floor - H * s;
  };

  /* coffeeMachine(ctx, at, state, opts) — a coffee machine seen from the front, 112 x 168 (half the height of a 340 px figure, its buttons in reach of one standing at the counter), standing on a worktop: a head with two buttons and the empty light, a dark bay under the spout with a drip grate where the cup goes, and a water tank on its right side with the water in it. `at` is the worktop under its centre.
     state  stream 0..1: coffee running from the spout, as a fraction of the way down to `to` (1: a full stream); flick 0 | 1 swaps between its two drawings (on twos while it runs)
            drop   null, or 0..1: one drop on its way from the spout down to `to`
            to     y where the stream and a drop end (a cup's rim; default the grate)
            tank   0..1, the water left; empty: true lights the empty light (yellow); press: true sinks the right button
     opts   s, lw (3.2 on screen), seed; `to` is a stage y
     Returns { spout, grate, button, light }: the spout's tip, the middle of the grate's top (stand a cup on it: IB.cup with its hand 6 px above), the right button and the empty light (work/coffee-queue-shuffle). */
  IB.coffeeMachine = (ctx, [cx, top], st = {}, o = {}) => {
    const { stream = 0, flick = 0, drop = null, to = null, tank = 1, empty = false, press = false } = st, { s = 1, seed = 980 } = o, lw = (o.lw || 3.2) / s, back = unzoom([cx, top], s);
    const W = 112, H = 168, x0 = cx - W / 2, y0 = top - H, bay = [cx - 38, top - 112, 76, 104], spout = [cx, bay[1] + 12], grate = [cx, top - 10], end = to == null ? grate[1] : top + (to - top) / s;
    zoom(ctx, [cx, top], s);
    // the water tank on its right side: a clear box, the water in it
    const tx = x0 + W - 4, ty = y0 + 22, th = H - 54;
    IB.box(ctx, tx, ty, 26, th, { fill: C.paper, w: lw * 0.85, seed: seed + 1 });
    if (tank > 0) IB.box(ctx, tx + 4, ty + th - 4 - (th - 8) * clamp(tank), 18, (th - 8) * clamp(tank), { fill: C.blue, w: 0, seed: seed + 2 });
    IB.seg(ctx, tx + 4, ty + 8, tx + 22, ty + 8, { w: lw * 0.6, seed: seed + 3 });   // the lid
    IB.shade(ctx, x0 - 6, top - 18, W + 32, 18, { from: 'bottom', seed: seed - 40, alpha: 0.45 });
    IB.box(ctx, x0, y0, W, H, { fill: C.paper, w: lw, seed });
    // the head: two buttons (the right one sinks when pressed) and the empty light, a drop sign
    const button = [x0 + 44, y0 + 26], light = [x0 + W - 22, y0 + 26];
    IB.oval(ctx, x0 + 20, y0 + 26, 7, 7, { fill: C.bg, w: lw * 0.75, seed: seed + 4, n: 10 });
    IB.oval(ctx, button[0], button[1] + (press ? 2 : 0), press ? 5.5 : 7, press ? 5.5 : 7, { fill: press ? '#d9d9d9' : C.bg, w: lw * 0.75, seed: seed + 5, n: 10 });
    IB.oval(ctx, light[0], light[1], 10, 10, { fill: empty ? C.yellow : C.bg, w: lw * 0.75, seed: seed + 6, n: 12 });
    IB.ink(ctx, [[light[0], light[1] - 6], [light[0] - 4, light[1] + 1], [light[0], light[1] + 5], [light[0] + 4, light[1] + 1]], { closed: true, w: 1.5, seed: seed + 7 });
    // the bay, in shadow, with the spout and the grate
    IB.box(ctx, bay[0], bay[1], bay[2], bay[3], { fill: '#d9d9d9', w: lw * 0.85, seed: seed + 8 });
    IB.shade(ctx, bay[0] + 3, bay[1] + 3, bay[2] - 6, 34, { from: 'top', seed: seed - 41, alpha: 0.6 });
    IB.box(ctx, cx - 9, bay[1], 18, 12, { fill: C.paper, w: lw * 0.75, seed: seed + 9 });
    IB.box(ctx, cx - 42, grate[1], 84, 8, { fill: C.paper, w: lw * 0.8, seed: seed + 10 });
    for (let i = 1; i < 7; i++) IB.seg(ctx, cx - 42 + i * 12, grate[1] + 2, cx - 42 + i * 12, grate[1] + 6, { w: 1.2, seed: seed + 11 + i });
    // what comes out of the spout
    if (stream > 0) { const y1 = lerp(spout[1], end, clamp(stream)), wd = flick ? 6 : 4, sk = flick ? 1 : -1; IB.ink(ctx, [[cx - wd / 2, spout[1]], [cx + wd / 2, spout[1]], [cx + wd / 2 + sk, y1], [cx - wd / 2 + sk, y1]], { closed: true, smooth: false, fill: C.charcoal, w: 0, seed: seed + 20 + flick }); }
    if (drop != null) { const y = lerp(spout[1] + 6, end - 6, clamp(drop)); IB.ink(ctx, [[cx, y - 8], [cx - 3.5, y + 1], [cx, y + 4], [cx + 3.5, y + 1]], { closed: true, fill: C.charcoal, w: 0, seed: seed + 22 }); }
    ctx.restore();
    return { spout: back(spout), grate: back(grate), button: back(button), light: back(light) };
  };

  /* waterCooler(ctx, at, state, opts) — a water cooler seen from the front, 96 x 250 with its bottle: a white cabinet with two taps over a drip tray and an upturned blue bottle on top. `at` is the floor under its centre. state: level 0..1 (the water left in the bottle), glug 0 | 1 (a bubble rising in it, on twos); opts s, lw, seed (work/coffee-queue-shuffle). */
  IB.waterCooler = (ctx, [cx, floor], st = {}, o = {}) => {
    const { level = 0.7, glug = 0 } = st, { s = 1, seed = 1010 } = o, lw = (o.lw || 3.2) / s, W = 96, body = floor - 170;
    zoom(ctx, [cx, floor], s);
    IB.shade(ctx, cx - W / 2 - 4, floor - 22, W + 8, 22, { from: 'bottom', seed: seed - 51, alpha: 0.45 });
    IB.box(ctx, cx - W / 2, body, W, 170, { fill: C.paper, w: lw, seed });
    IB.box(ctx, cx - 30, body + 30, 60, 40, { fill: '#d9d9d9', w: lw * 0.8, seed: seed + 1 });
    for (const dx of [-14, 14]) IB.box(ctx, cx + dx - 5, body + 30, 10, 12, { fill: C.paper, w: lw * 0.7, seed: seed + 2 + dx });
    IB.box(ctx, cx - 30, body + 64, 60, 6, { fill: C.paper, w: lw * 0.7, seed: seed + 4 });
    // the bottle, neck down into the cabinet's top
    const bt = body - 84, bw = 72;
    IB.box(ctx, cx - 12, body - 10, 24, 12, { fill: C.sky, w: lw * 0.8, seed: seed + 5 });
    IB.ink(ctx, [[cx - 12, body - 8], [cx - bw / 2, body - 26], [cx - bw / 2, bt + 6], [cx - bw / 2 + 8, bt], [cx + bw / 2 - 8, bt], [cx + bw / 2, bt + 6], [cx + bw / 2, body - 26], [cx + 12, body - 8]], { closed: true, smooth: false, fill: C.sky, w: lw, seed: seed + 6 });
    if (level > 0) { const wy = lerp(body - 26, bt + 8, clamp(level)); IB.ink(ctx, [[cx - bw / 2 + 4, wy], [cx + bw / 2 - 4, wy], [cx + bw / 2 - 4, body - 28], [cx + 10, body - 12], [cx - 10, body - 12], [cx - bw / 2 + 4, body - 28]], { closed: true, smooth: false, fill: C.blue, w: 0, seed: seed + 7 }); }
    IB.seg(ctx, cx - bw / 2 + 4, bt + 30, cx + bw / 2 - 4, bt + 30, { w: 1.5, seed: seed + 8 });   // a rib
    if (glug) IB.oval(ctx, cx + 6, lerp(body - 30, bt + 20, 0.45), 6, 6, { fill: C.sky, w: 1.6, seed: seed + 9, n: 8 });
    ctx.restore();
  };

  /* paperStack(ctx, at, state, opts) — a stack of papers and folders seen from the side, the way someone carries it up to the chin: n bundles from the bottom up, each its own thickness (8-13 px) and a few px off true, sheaves white with a line or two, folders in one colour. `at` is the middle of its bottom edge.
     state  n     bundles (11 is 0.37 of a 330 px figure)
            lean  px the top is carried off the bottom, growing with the square of the height (a stack tipping as one)
            wave  px of an S: the lower half bows one way and the upper half the other (sin 2 pi u), the wobble passing up through it
            tilt  rad, the whole stack turned about `at`
     opts   s, w (104 before s), color (the folders' colour, default lavender), lw (2.6 on screen), seed; lean and wave are stage px
     Every bundle turns a third of the way toward the curve it sits on, so a bend reads as the stack bending, not as boxes fanning out or sliding. Returns { top: [x, y] } the middle of the top bundle's upper face (where a loose sheet on top sits or leaves from) (work/files-tower-wobble). */
  IB.paperStack = (ctx, [x, y], st = {}, o = {}) => {
    const { n = 11, tilt = 0 } = st, { w: W = 104, color = C.lavender, s = 1, seed = 1040 } = o, lw = (o.lw || 2.6) / s, lean = (st.lean || 0) / s, wave = (st.wave || 0) / s;
    const th = Array.from({ length: n }, (_, i) => 8 + Math.floor(MG.hash(seed, i) * 6)), total = th.reduce((a, b) => a + b, 0);
    const dx = (u) => lean * u * u + wave * Math.sin(2 * Math.PI * u), slope = (u) => (2 * lean * u + wave * 2 * Math.PI * Math.cos(2 * Math.PI * u)) / Math.max(1, total);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    let h = 0;
    th.forEach((t, i) => {
      const u = (h + t / 2) / Math.max(1, total), jit = (MG.hash(seed + 1, i) - 0.5) * 8, folder = MG.hash(seed + 2, i) < 0.3, bw = W + (folder ? 6 : 0) - (MG.hash(seed + 3, i) < 0.4 ? 6 : 0);
      ctx.save(); ctx.translate(dx(u) + jit, -h - t / 2); ctx.rotate(0.3 * Math.atan(slope(u)));   // a bundle turns only a third of the way with the curve: paper slides more than it tips
      IB.box(ctx, -bw / 2, -t / 2, bw, t, { fill: folder ? color : C.paper, w: lw, seed: seed + 10 + i * 3, wob: 0.5 });
      if (!folder && t > 10) IB.seg(ctx, -bw / 2 + 6, 0, bw / 2 - 10, 0, { w: 1.2, seed: seed + 11 + i * 3 });
      ctx.restore();
      h += t;
    });
    ctx.restore();
    const tx = dx(1) * s, ty = -total * s;
    return { top: [x + Math.cos(tilt) * tx - Math.sin(tilt) * ty, y + Math.sin(tilt) * tx + Math.cos(tilt) * ty] };
  };

  /* looseSheet(ctx, at, state, opts) — one sheet of paper 64 x 84 (the size of IB.flyingSheet's), centred on `at`: in the air, turned by `rot` and seen at `turn` (1 face on with its three lines of type, 0 edge on, below 0 its blank back) and curled by `curl` (-1..1, the two long sides bowing); or lying on the floor (`flat`: true), a thin sliver whose bottom is at `at`. opts s, lw (2.4 on screen), seed (work/printer-jam-thump, work/files-tower-wobble). */
  IB.looseSheet = (ctx, [x, y], st = {}, o = {}) => {
    const { rot = 0, turn = 1, curl = 0, flat = false } = st, { s = 1, seed = 1080 } = o, lw = (o.lw || 2.4) / s, W = 64, H = 84;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    if (flat) { IB.ink(ctx, [[-W / 2 - 4, -7], [W / 2 + 4, -7], [W / 2 + 6, 0], [-W / 2 - 2, 0]], { closed: true, smooth: false, fill: C.paper, w: lw, seed }); ctx.restore(); return; }
    const k = Math.max(0.12, Math.abs(turn)), hw = (W / 2) * k, b = curl * 9, side = (sx) => [0.25, 0.5, 0.75].map((v) => [sx + b * Math.sin(Math.PI * v), lerp(-H / 2, H / 2, v)]);
    IB.ink(ctx, [[-hw, -H / 2], [hw, -H / 2], ...side(hw), [hw, H / 2], [-hw, H / 2], ...side(-hw).reverse()], { closed: true, smooth: false, fill: C.paper, w: lw, seed });
    if (turn > 0.35) for (let i = 0; i < 3; i++) IB.seg(ctx, -hw * 0.62 + b * 0.7, -24 + i * 18, hw * 0.56 + b * 0.7, -24 + i * 18, { w: 1.6, seed: seed + 1 + i });
    ctx.restore();
  };

  /* paperSpray(ctx, from, k, opts) — a printer giving up all its paper at once: n sheets shot out of `from` two at a time, one pair a drawing, each thrown up at its own angle and speed around `a`, slowed by the air, then falling at no more than `vt` px a drawing while it sways and tumbles, and lying flat where it reaches the floor (it stays there). k is the drawing since the first pair left (IB.drawn on twos); before 0 nothing is drawn. Sheets that land behind `from` are the scene's to cover.
     opts n (14), floor (the floor line), a (-2.0 rad, up and to the left), spread (1.6 rad), v ([44, 76] px a drawing at launch), g (7 px a drawing per drawing), vt (16), per (2 a drawing), s (the sheets' size and sway), seed
     Every drawing is computed from the launch, so the spray is a function of k alone (work/printer-jam-thump). */
  IB.paperSpray = (ctx, [fx, fy], k, o = {}) => {
    const { n = 14, floor = 900, a = -2.0, spread = 1.6, v = [44, 76], g: G = 7, vt = 16, per = 2, s = 1, seed = 1100 } = o;
    for (let i = 0; i < n; i++) {
      const kk = k - Math.floor(i / per);
      if (kk < 0) continue;
      const r = (j) => MG.hash(seed + i, j), ang = a + (r(0) - 0.5) * spread, sp = lerp(v[0], v[1], r(1)), ph = r(2) * 6.28, spin = (r(3) - 0.5) * 1.6;
      let x = fx, y = fy, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, rot = r(4) * 3, landed = false;
      for (let j = 0; j < kk && !landed; j++) {
        vx *= 0.9; vy = Math.min(vy + G, vt);
        x += vx + (vy > 0 ? Math.sin(j * 1.1 + ph) * 9 * s : 0); y += vy; rot += spin * (vy > 0 ? 0.6 : 1);
        if (y >= floor - 30 * s) { y = floor; landed = true; }   // a sheet whose middle is 30 px off the floor is down: lower, its edge would cut the floor line
      }
      if (landed) IB.looseSheet(ctx, [x, floor], { flat: true, rot: (r(5) - 0.5) * 0.12 }, { s, seed: seed + i * 7 });
      else IB.looseSheet(ctx, [x, y], { rot, turn: Math.cos(kk * 0.9 + ph), curl: Math.sin(kk * 0.7 + ph) * 0.8 }, { s, seed: seed + i * 7 });
    }
  };
})(window);
