/* props/classroom.js — a classroom in the look of the IBM spots, for the school scenes: a chalkboard hung on the wall (a charcoal face in a paper frame with a chalk tray: no green, which this palette does not have), placeholder chalk writing that a scene draws on stroke by stroke and wipes off along the eraser's path, a stick of chalk, a board eraser, the cloud of chalk dust an eraser raises and a sneeze blows apart, a child's school desk and chair sized from the seated child's height, and the teacher's lectern. Writing is never real text: looped scribbles for words, a few shapes for a drawing. New, not measured: sizes are set against the figure rig (IB.FIG) so a child of h 230 fits its desk the way IB.sit seats it. Needs ink.js, figure.js and props/office.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const CHALK = C.paper, DUST = '#8c8c8c';

  /* chalkScript(at, len, opts) — placeholder handwriting: a row of words written in looped scribbles, starting at `at` = [x, baseline] and running `len` px to the right. Returns the strokes (one point list per word, stage px) for IB.chalkboard's state.strokes; nothing is drawn. size is the height of a small letter's loop (26 px reads as board writing beside a 340 px teacher); about one loop in four is a tall letter. The same seed gives the same words. To put the chalk in a writing hand, read the tip of the stroke being drawn with IB.along(stroke, u). */
  IB.chalkScript = ([x0, y], len, o = {}) => {
    const { size = 26, seed = 1 } = o, P = size * 0.5, k = P / (2 * Math.PI), c = size * 0.16, words = [];
    let x = x0, w = 0;
    while (x < x0 + len - size * 0.6) {
      const wl = Math.min(x0 + len - x, size * (1.4 + 2.6 * MG.hash(seed, w))), n = Math.max(4, Math.round(((wl / P) * 2 * Math.PI) / 0.5)), pts = [];
      for (let i = 0; i <= n; i++) {
        const th = i * 0.5, loop = Math.floor(th / (2 * Math.PI)), tall = MG.hash(seed + 7, w * 31 + loop) < 0.25 ? 1.75 : 1;
        pts.push([x + th * k - c * Math.sin(th), y - size * 0.5 * tall * ((1 - Math.cos(th)) / 2)]);
      }
      words.push(pts);
      x += wl + size * (0.55 + 0.3 * MG.hash(seed + 3, w));
      w++;
    }
    return words;
  };

  /* chalkShape(kind, at, r) — the strokes of a chalk drawing centred on `at`, r px in radius: 'circle', 'triangle', 'box' (an answer blank), 'underline' (a slightly wavy line 2r long from at[0]), 'arrow' (2r long, pointing right: shaft and head as two strokes). Like IB.chalkScript it only returns point lists. */
  IB.chalkShape = (kind, [x, y], r) => {
    if (kind === 'circle') { const p = IB.ellipse(x, y, r, r * 0.94, 16); return [p.concat([p[0], p[1]])]; }
    if (kind === 'triangle') return [[[x - r, y + r * 0.8], [x + r * 0.15, y - r], [x + r, y + r * 0.8], [x - r, y + r * 0.8]]];
    if (kind === 'box') return [[[x - r, y - r * 0.7], [x + r, y - r * 0.7], [x + r, y + r * 0.7], [x - r, y + r * 0.7], [x - r, y - r * 0.7]]];
    if (kind === 'underline') return [[[x, y], [x + r * 0.7, y + 2], [x + r * 1.4, y - 1], [x + r * 2, y + 1]]];
    if (kind === 'arrow') return [[[x - r, y], [x + r, y]], [[x + r * 0.6, y - r * 0.3], [x + r, y], [x + r * 0.6, y + r * 0.3]]];
    return [];
  };

  /* chalk haze: what a wiped board keeps, one broad translucent pass of white along a path and two thin streaks in it */
  function haze(ctx, pts, w, seed, a = 1) {
    if (pts.length < 2) return;
    IB.ink(ctx, pts, { w: w * 0.9, color: `rgba(253, 253, 253, ${0.07 * a})`, grain: 0, taper: false, smooth: false, wob: 2, seed });
    [-0.22, 0.2].forEach((off, i) => IB.ink(ctx, pts.map(([x, y]) => [x, y + off * w]), { w: 1.4, color: `rgba(253, 253, 253, ${0.16 * a})`, grain: 0, smooth: false, wob: 1.5, seed: seed + 5 + i }));
  }

  /* chalkboard(ctx, at, state, opts) — a chalkboard hung on the wall, `at` the centre of its face: a charcoal face w x h in a paper frame, a chalk tray under it with `chalks` sticks lying on it, graphite on the wall under the tray.
       state.strokes  chalk strokes (IB.chalkScript, IB.chalkShape, concatenated) in stage px, written in order
       state.drawn    how many of them are on the board (default all); a fraction draws that much of the next one, so a scene writes on twos by stepping it
       state.wipe     the eraser's path so far, [[x, y], ...] in stage px: the board is wiped clean along it, wipeW px wide (the eraser's long side), leaving a haze
       state.smudges  [[x, y, w, h], ...] old wiped patches, a haze only
     Returns the face [x, y, w, h] (school/hand-up-called, school/chalk-dust-sneeze, school/paper-plane-caught). */
  IB.chalkboard = (ctx, [cx, cy], st = {}, o = {}) => {
    const { strokes = [], drawn = Infinity, wipe = null, smudges = [] } = st, { w = 800, h = 360, frame = 16, chalks = 2, wipeW = 54, lw = 3.4, seed = 600 } = o;
    const x = cx - w / 2, y = cy - h / 2, face = [x, y, w, h];
    ctx.save();
    // the tray's shadow on the wall, the frame, the face
    IB.shade(ctx, x - frame + 10, y + h + frame + 12, w + frame * 2 - 20, 26, { from: 'top', seed: seed + 1, alpha: 0.4 });
    IB.box(ctx, x - frame, y - frame, w + frame * 2, h + frame * 2, { fill: C.paper, w: lw, seed: seed + 2 });
    IB.box(ctx, x, y, w, h, { fill: C.charcoal, w: lw * 0.8, seed: seed + 3 });
    // what is on the face, clipped to it
    ctx.save();
    IB.clipRect(ctx, face);
    smudges.forEach(([sx, sy, sw, sh], i) => [0.3, 0.7].forEach((v, j) => haze(ctx, [[sx + j * 8, sy + sh * v], [sx + sw * 0.5, sy + sh * v + (j ? -2 : 2)], [sx + sw - j * 10, sy + sh * v]], sh * 0.6, seed + 40 + i * 7 + j * 3)));   // sideways sweeps
    strokes.forEach((s, i) => {
      if (i >= drawn) return;
      const part = Math.min(1, drawn - i);
      IB.ink(ctx, s, { w: 2.8, color: CHALK, wob: 0.5, to: part, taper: false, seed: seed + 100 + i * 3 });
    });
    if (wipe && wipe.length) {
      const path = wipe.length > 1 ? wipe : [wipe[0], [wipe[0][0] + 1, wipe[0][1]]];
      IB.ink(ctx, path, { w: wipeW, color: C.charcoal, grain: 0, taper: false, smooth: false, wob: 0.6, seed: seed + 9 });
      haze(ctx, path, wipeW, seed + 20, 1.4);
    }
    ctx.restore();
    // the tray: a ledge under the face, its lip, and chalk lying on it
    const ty = y + h + frame;
    IB.box(ctx, x - frame - 8, ty, w + frame * 2 + 16, 12, { fill: C.paper, w: lw * 0.9, seed: seed + 4 });
    for (let i = 0; i < chalks; i++) IB.chalk(ctx, [x + w * (0.72 + i * 0.07), ty - 4], { rot: i % 2 ? 0.08 : -0.05, seed: seed + 60 + i * 3 });
    ctx.restore();
    return face;
  };

  /* chalk(ctx, at, opts) — a stick of white chalk centred on `at`, len x wd px (18 x 6: a teacher of h 340 holds it in a fist), turned by rot. Draw it after the hand that holds it, its tip on the board (school/paper-plane-caught). */
  IB.chalk = (ctx, [x, y], o = {}) => {
    const { rot = 0, len = 18, wd = 6, seed = 660 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    IB.box(ctx, -len / 2, -wd / 2, len, wd, { fill: C.paper, w: 2, seed, wob: 0.3 });
    ctx.restore();
  };

  /* boardEraser(ctx, at, opts) — a board eraser centred on `at`, w x hgt px (52 x 20): a block in `fill` over a charcoal felt strip on the face it rubs with, turned by rot (the felt is on the +y side before the turn). In a hand, draw it before the near arm so the fingers close over it (school/chalk-dust-sneeze). */
  IB.boardEraser = (ctx, [x, y], o = {}) => {
    const { rot = 0, w = 52, hgt = 20, fill = C.paper, seed = 670 } = o, felt = hgt * 0.32;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    IB.box(ctx, -w / 2, hgt / 2 - felt, w, felt, { fill: C.charcoal, w: 2.4, seed: seed + 1 });
    IB.box(ctx, -w / 2, -hgt / 2, w, hgt - felt, { fill, w: 2.6, seed });
    IB.seg(ctx, -w * 0.32, -hgt * 0.12, w * 0.32, -hgt * 0.12, { w: 1.6, seed: seed + 2 });   // the groove the fingers hold
    ctx.restore();
  };

  /* chalkDust(ctx, at, state, opts) — the cloud of chalk an eraser beats out of a board, rising from `at` (where the eraser rubs). A cloud is dust, not a solid: a scalloped outline in grey (not ink), a translucent white fill and specks crowding toward its bottom (their density is the tone, as with the reference's graphite), a few small puffs leaving its edge.
       state.k     drawings since it started: it grows over 6 (35%, 60%, 78%, 90%, 97%, 100% of r) and climbs `rise` px a drawing for 8, then holds still
       state.blow  drawings since something blew it apart (a sneeze), or -1: then it breaks into seven puffs flung toward `dir` (+1 right, -1 left), further and smaller each drawing, with three wind lines on the first two; gone after 4 drawings
     r is the grown half width (the cloud is 0.62 as tall). Redraw it with a new state every drawing; the seed follows the state, so a held cloud does not boil (school/chalk-dust-sneeze). */
  IB.chalkDust = (ctx, [x, y], st = {}, o = {}) => {
    const { k: k0 = 0, blow = -1 } = st, { r = 70, dir = 1, rise = 6, seed = 900 } = o, k = Math.max(0, Math.min(8, k0));
    const R = r * [0.35, 0.6, 0.78, 0.9, 0.97, 1][Math.min(5, k)], cy = y - k * rise;
    ctx.save();
    if (blow < 0) {
      const pts = [];
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, bump = i % 2 ? 1 : 0.82 + 0.1 * MG.hash(seed, i); pts.push([x + Math.cos(a) * R * bump, cy + Math.sin(a) * R * 0.62 * bump]); }
      IB.ink(ctx, pts, { closed: true, fill: 'rgba(253, 253, 253, 0.78)', w: 2.2, color: DUST, wob: 1.2, seed: seed + k });
      ctx.save();
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip();
      IB.shade(ctx, x - R, cy - R * 0.62, R * 2, R * 1.24, { from: 'bottom', color: '#9a9a9a', alpha: 0.28, reach: 1.3, seed: seed + 20 + k });
      ctx.restore();
      for (let i = 0; i < 3 && k > 0; i++) {   // small puffs coming off the top edge
        const a = -Math.PI / 2 + (i - 1) * 0.9 + (MG.hash(seed + 30, i) - 0.5) * 0.4, d = R * (1.02 + 0.12 * ((k + i) % 3));
        IB.oval(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.62, R * 0.12, R * 0.1, { fill: 'rgba(253, 253, 253, 0.7)', w: 1.6, color: DUST, n: 8, seed: seed + 40 + i + k * 3 });
      }
    } else if (blow <= 3) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 6 - 0.5) * 2.2 + (MG.hash(seed + 50, i) - 0.5) * 0.5, sp = 0.7 + 0.6 * MG.hash(seed + 51, i), d = R * (0.35 + (blow + 1) * 0.5 * sp);
        const px = x + dir * Math.cos(a * 0.55) * d, py = cy + Math.sin(a) * d * 0.5 - blow * 4, s = R * (0.3 - blow * 0.065) * (0.7 + 0.5 * MG.hash(seed + 52, i));
        IB.oval(ctx, px, py, s, s * 0.78, { fill: 'rgba(253, 253, 253, 0.72)', w: 1.8, color: DUST, n: 9, wob: 0.8, seed: seed + 60 + i + blow * 9 });
      }
      if (blow < 2) for (let i = -1; i <= 1; i++) {   // the wind of the blast
        const x0 = x - dir * R * 0.6, yy = cy + i * R * 0.28;
        IB.ink(ctx, [[x0 + dir * R * (0.3 + blow * 0.4), yy], [x0 + dir * R * (1.1 + blow * 0.5), yy + i * 4]], { w: 2.4, color: DUST, seed: seed + 80 + i + blow * 5 });
      }
    }
    ctx.restore();
  };

  /* schoolDesk(ctx, at, opts) — a child's school desk seen from the side, in front of a child sitting with its hip joint at at = [x, floor] facing `dir`, sized from the child's height h (230 for a child beside a 340 px adult): a slab 0.52 h long whose top is 0.43 h off the floor (IB.sit's hands rest on it), a book box under its far half, open toward the child, two tube legs and a foot rail. Draw it in two passes round the child, like IB.figure's: only: 'legs' before the figure (the legs are the desk's far pair, behind the child's shins), then only: 'top' between the figure's far and near passes, so the near arm lies on the desk. Returns { top, near, far }: the top's y and the x of its two ends (school/hand-up-called). */
  IB.schoolDesk = (ctx, [x, floor], o = {}) => {
    const { h = 230, dir = 1, lw = 3, fill = C.paper, only = null, seed = 820 } = o, k = (dx) => x + dx * h * dir, top = floor - 0.43 * h, th = 0.03 * h;
    ctx.save();
    if (only !== 'top') {
      for (const [i, dx] of [[0, 0.16], [1, 0.58]]) IB.tube(ctx, [[k(dx), top + th], [k(dx), floor]], { w: 0.036 * h, edge: lw * 0.8, fill: C.bg, seed: seed + i });
      IB.seg(ctx, k(0.16), floor - 0.07 * h, k(0.58), floor - 0.07 * h, { w: lw * 0.9, seed: seed + 2 });
    }
    if (only !== 'legs') {
      const b0 = Math.min(k(0.32), k(0.62)), b1 = Math.max(k(0.32), k(0.62));
      IB.box(ctx, b0, top + th, b1 - b0, 0.065 * h, { fill, w: lw * 0.9, seed: seed + 3 });
      IB.shade(ctx, b0 + 4, top + th + 0.065 * h + 1, b1 - b0 - 8, 0.06 * h, { from: 'top', seed: seed + 4, alpha: 0.35 });
      const s0 = Math.min(k(0.12), k(0.64)), s1 = Math.max(k(0.12), k(0.64));
      IB.box(ctx, s0, top, s1 - s0, th, { fill, w: lw, seed: seed + 5 });
    }
    ctx.restore();
    return { top, near: k(0.12), far: k(0.64) };
  };

  /* schoolChair(ctx, at, opts) — a child's school chair seen from the side for a child of height h sitting with its hip joint at at = [x, floor] facing `dir`: a seat slab whose top is 0.05 h under the hip (IB.SEAT, as IB.chair), a straight back with a backrest panel behind it, two tube legs. Draw it before the child (school/hand-up-called). */
  IB.schoolChair = (ctx, [x, floor], o = {}) => {
    const { h = 230, dir = 1, lw = 3, fill = C.paper, seed = 840 } = o, k = (dx) => x + dx * h * dir, top = floor - (IB.SEAT - 0.05) * h, th = 0.035 * h;
    ctx.save();
    IB.tube(ctx, [[k(-0.12), top + th], [k(-0.15), floor]], { w: 0.034 * h, edge: lw * 0.8, fill: C.bg, seed });
    IB.tube(ctx, [[k(0.1), top + th], [k(0.13), floor]], { w: 0.034 * h, edge: lw * 0.8, fill: C.bg, seed: seed + 1 });
    IB.tube(ctx, [[k(-0.13), top], [k(-0.17), top - 0.3 * h]], { w: 0.034 * h, edge: lw * 0.8, fill: C.bg, seed: seed + 2 });
    IB.ink(ctx, [[k(-0.135), top - 0.3 * h], [k(-0.205), top - 0.31 * h], [k(-0.19), top - 0.17 * h], [k(-0.125), top - 0.17 * h]], { closed: true, smooth: false, fill, w: lw, seed: seed + 3 });
    IB.shade(ctx, Math.min(k(-0.12), k(0.1)) + 3, top + th + 1, Math.abs(0.22 * h) - 6, 0.06 * h, { from: 'top', seed: seed + 4, alpha: 0.4 });
    IB.box(ctx, Math.min(k(-0.15), k(0.14)), top, 0.29 * h, th, { fill, w: lw, seed: seed + 5 });
    ctx.restore();
  };

  /* lectern(ctx, at, opts) — the teacher's lectern seen from the side, standing on at = [x, floor] (its centre), sized from the teacher's height h (340): a cabinet 0.28 h deep and 0.58 h high on a plinth, a top that overhangs it with a lip on the teacher's side (the side away from dir), an inset side panel, graphite where it meets the floor. Set it behind the teacher, between her and the board (school/hand-up-called). */
  IB.lectern = (ctx, [x, floor], o = {}) => {
    const { h = 340, dir = 1, lw = 3.2, fill = C.paper, seed = 860 } = o, H = 0.58 * h, D = 0.28 * h, top = floor - H;
    ctx.save();
    IB.box(ctx, x - D / 2 - 0.02 * h, floor - 0.04 * h, D + 0.04 * h, 0.04 * h, { fill, w: lw, seed });
    IB.box(ctx, x - D / 2, top + 0.035 * h, D, H - 0.075 * h, { fill, w: lw, seed: seed + 1 });
    IB.box(ctx, x - D / 2 + 0.035 * h, top + 0.09 * h, D - 0.07 * h, H - 0.2 * h, { w: lw * 0.6, seed: seed + 2 });
    IB.shade(ctx, x - D / 2 + 4, top + 0.035 * h + 1, D - 8, 0.05 * h, { from: 'top', seed: seed + 3, alpha: 0.35 });
    IB.box(ctx, x - D / 2 - 0.04 * h, top, D + 0.08 * h, 0.035 * h, { fill, w: lw, seed: seed + 4 });
    IB.box(ctx, dir > 0 ? x - D / 2 - 0.04 * h : x + D / 2 + 0.04 * h - 0.025 * h, top - 0.03 * h, 0.025 * h, 0.03 * h, { fill, w: lw * 0.8, seed: seed + 5 });   // the lip on the teacher's side
    IB.smear(ctx, x, floor - 6, D + 0.12 * h, { h: 10, seed: seed + 6 });
    ctx.restore();
  };
})(window);
