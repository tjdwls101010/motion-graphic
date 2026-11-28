/* sets/schoolhall.js — the school outside the classroom, in the IBM look: the hallway (a classroom's sliding door, a row of lockers whose doors open, the bell on the wall that rings in two drawings), the lunch hall (a divided tray with placeholder food and where two hands hold it, a cafeteria table seen end-on with a bench either side) and the front gate (a sliding grille gate on a rail, drawn in an oblique view so a child can run through it), and the backpack a child wears, which bobs a drawing late. Line drawings in white and grey; the colour of a shot is left to the children and one prop. New, not measured: sized against the child figures (IB.PEOPLE.pupil, h 240-300). Needs ink.js, figure.js and props/office.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* classDoor(ctx, at, opts) — a classroom's sliding door 190 x 400 in its frame: a white panel with a tall window (two panes) and a recessed pull, a blank class sign above the frame (a placeholder, no lettering), graphite under the lintel. `at` = [the frame's left edge, the floor]. `open` 0..1 slides the panel left into the wall (clipped at the frame) and shows the dark doorway behind it, from where a figure drawn after the door steps out (school/bell-locker-rush). */
  IB.classDoor = (ctx, [x, FLOOR], o = {}) => {
    const { open = 0, w = 190, h = 400, fill = C.bg, seed = 900 } = o, top = FLOOR - h;
    ctx.save();
    IB.box(ctx, x - 14, top - 14, w + 28, h + 14, { fill: C.bg, w: 3.2, seed });
    IB.box(ctx, x + w / 2 - 56, top - 74, 112, 40, { fill: C.paper, w: 2.6, seed: seed + 1 });   // the class sign: blank
    IB.box(ctx, x, top, w, h, { fill: C.charcoal, w: 3, seed: seed + 2 });                       // the doorway
    IB.shade(ctx, x + 4, top + 2, w - 8, 60, { from: 'top', seed: seed + 3, alpha: 0.6 });
    if (open < 1) {
      const px = x - open * w;
      ctx.save(); IB.clipRect(ctx, [x - 1, top - 2, w + 2, h + 4]);
      IB.box(ctx, px, top, w, h, { fill, w: 3.2, seed: seed + 4 });
      IB.box(ctx, px + 34, top + 40, w - 68, 150, { fill: C.paper, w: 2.4, seed: seed + 5 });
      IB.seg(ctx, px + w / 2, top + 42, px + w / 2, top + 188, { w: 2, seed: seed + 6 });
      IB.seg(ctx, px + 50, top + 70, px + 72, top + 52, { w: 1.6, seed: seed + 7 });   // a glint on the glass
      IB.box(ctx, px + w - 30, top + 214, 12, 46, { fill: C.bg, w: 2.2, seed: seed + 8 });
      ctx.restore();
    }
    ctx.restore();
  };

  /* lockerRow(ctx, at, opts) — a row of school lockers standing on the floor: `cols` columns of `rows` doors (default 6 x 2), each w x ch px (80 x 120: a child's lockers, two high reach a 240 px child's shoulder), with three vent slits, a blank name tag and a handle near the free edge; a plinth and graphite on the floor under it. `at` = [the row's left edge, the floor]. `open(i)` (or an array) gives door i its swing 0..1 (i counts down each column, then across: column c, row r is c * rows + r): the door turns on its left hinge toward the viewer, its free edge sweeping in and growing a little as it comes nearer (up to 0.1 w), past square at 0.5 and folded back at 1, and the locker behind it is dark with a shelf. Returns the cells [{ x, y, w, h }]. Where a hand takes the door: IB.lockerEdge (school/bell-locker-rush). */
  const LOCK = { cols: 6, rows: 2, w: 80, ch: 120, plinth: 20 };
  const swing = (open) => clamp(open) * 1.75;   // rad: 1 is a door thrown wide, folded back past square
  const lockerCells = ([x0, FLOOR], o = {}) => {
    const { cols = LOCK.cols, rows = LOCK.rows, w = LOCK.w, ch = LOCK.ch, plinth = LOCK.plinth } = o, cells = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) cells.push({ x: x0 + c * w, y: FLOOR - plinth - (rows - r) * ch, w, h: ch });
    return cells;
  };
  IB.lockerRow = (ctx, at, o = {}) => {
    const { fill = C.paper, open = [], seed = 940 } = o, cells = lockerCells(at, o), plinth = o.plinth || LOCK.plinth;
    const share = (i) => (typeof open === 'function' ? open(i) : open[i] || 0);
    const [x0, FLOOR] = at, W = cells.length ? cells[cells.length - 1].x + cells[0].w - x0 : 0;
    ctx.save();
    IB.shade(ctx, x0 - 10, FLOOR - 2, W + 20, 16, { from: 'top', seed: seed + 1, alpha: 0.45 });
    IB.box(ctx, x0, FLOOR - plinth, W, plinth, { fill: C.bg, w: 3, seed: seed + 2 });
    cells.forEach((cl, i) => {
      const s = seed + 10 + i * 7, u = share(i), a = swing(u);
      if (u > 0) {
        IB.box(ctx, cl.x, cl.y, cl.w, cl.h, { fill: C.charcoal, w: 3, seed: s });
        IB.seg(ctx, cl.x + 6, cl.y + cl.h * 0.42, cl.x + cl.w - 6, cl.y + cl.h * 0.42, { w: 3, color: C.bg, seed: s + 1 });   // a shelf
        const ex = cl.x + Math.cos(a) * cl.w, grow = Math.sin(a) * cl.w * 0.1, inside = Math.cos(a) < 0;
        const door = [[cl.x, cl.y], [ex, cl.y - grow], [ex, cl.y + cl.h + grow], [cl.x, cl.y + cl.h]];
        IB.ink(ctx, door, { closed: true, smooth: false, fill: inside ? C.bg : fill, w: 3, seed: s + 2 });
        if (!inside && Math.cos(a) > 0.25) IB.seg(ctx, lerp(cl.x, ex, 0.86), cl.y + cl.h * 0.45, lerp(cl.x, ex, 0.86), cl.y + cl.h * 0.6, { w: 3.2, seed: s + 3 });
        return;
      }
      IB.box(ctx, cl.x, cl.y, cl.w, cl.h, { fill, w: 3, seed: s });
      for (let k = 0; k < 3; k++) IB.seg(ctx, cl.x + 20, cl.y + 16 + k * 8, cl.x + cl.w - 20, cl.y + 16 + k * 8, { w: 1.8, seed: s + 4 + k });
      IB.box(ctx, cl.x + cl.w / 2 - 14, cl.y + 46, 28, 13, { fill: C.bg, w: 1.8, seed: s + 3 });   // name tag, blank
      IB.seg(ctx, cl.x + cl.w - 14, cl.y + cl.h * 0.45, cl.x + cl.w - 14, cl.y + cl.h * 0.6, { w: 3.2, seed: s + 1 });
    });
    ctx.restore();
    return cells;
  };
  /* lockerEdge(at, i, open, opts) — the handle of locker door i of a row at `at` when it is open by `open` (the same opts as IB.lockerRow): the point a hand that swings the door holds, for the pose table, without drawing anything. */
  IB.lockerEdge = (at, i, open, o = {}) => {
    const cl = lockerCells(at, o)[i], a = swing(open);
    return [cl.x + Math.cos(a) * cl.w * 0.86, cl.y + cl.h * 0.52];
  };

  /* schoolBell(ctx, at, opts) — the electric bell on the hallway wall, seen from the front: a round gong of radius r with a rim ring and a centre bolt, the striker's small box under it and the hammer on its arm. `at` is the gong's centre. ring 0 hangs still with the hammer down; ring 1 and 2 are the two drawings a ring alternates (swap them every 2 frames): the gong knocked 3 px and 0.09 rad to one side, the hammer against its rim on the other, and three ringing arcs (IB.shake) flicking out on both sides, re-seeded each drawing by `k` (school/bell-locker-rush). */
  IB.schoolBell = (ctx, [cx, cy], o = {}) => {
    const { ring = 0, r = 46, k = 0, fill = C.bg, seed = 980 } = o, side = ring === 0 ? 0 : ring === 1 ? -1 : 1;
    ctx.save();
    // the striker: a box under the gong, an arm up from it and the hammer's ball against the rim (straight up when still)
    const bx = cx, by = cy + r + 22, hx = cx - side * r * 0.55, hy = cy + r * (side ? 0.78 : 0.98);
    IB.box(ctx, bx - 20, by - 10, 40, 26, { fill: C.paper, w: 2.8, seed });
    IB.seg(ctx, bx, by - 8, hx, hy + 6, { w: 3, seed: seed + 2 });
    ctx.save(); ctx.translate(cx + side * 3, cy); ctx.rotate(side * 0.09);
    IB.oval(ctx, 0, 0, r, r, { fill, w: 3.4, seed: seed + 4, n: 18 });
    IB.oval(ctx, 0, 0, r * 0.7, r * 0.7, { w: 2, seed: seed + 5, n: 14 });
    IB.ink(ctx, IB.ellipse(0, 0, r * 0.82, r * 0.82, 8, Math.PI * 1.1, Math.PI * 1.45), { w: 3.2, color: C.paper, seed: seed + 6 });   // the shine
    IB.oval(ctx, 0, 0, 7, 7, { fill: C.charcoal, w: 2, seed: seed + 7, n: 8 });
    ctx.restore();
    IB.oval(ctx, hx, hy, 8, 8, { fill: C.charcoal, w: 2.4, seed: seed + 3, n: 8 });
    ctx.restore();
    if (side) {
      for (const d of [-1, 1]) IB.shake(ctx, cx + side * 3, cy, r + 16, { a: d < 0 ? Math.PI : 0, n: 3, gap: 11, span: 0.38, w: 2.6, seed: seed + 20 + k * 6 + (d > 0 ? 3 : 0) });
    }
  };

  /* lunchTray(ctx, at, opts) — a divided school lunch tray w px wide (default 130) seen from a little above: a flat paper slab with a raised rim, rice in the big well, a soup bowl and two side dishes as plain placeholder shapes (mint greens, a yellow roll). `at` is the centre of its top face. Drawn between a figure's two passes: IB.figure(..., 'far'), the tray, IB.figure(..., 'near'), so the near hand is over its front rim. Where the hands go: IB.trayGrips (school/lunch-tray-seat). */
  IB.lunchTray = (ctx, [cx, cy], o = {}) => {
    const { w = 130, food = true, side = C.mint, seed = 1000 } = o, d = w * 0.34, rim = Math.max(6, w * 0.06);
    const L = cx - w / 2, R = cx + w / 2, T = cy - d / 2, B = cy + d / 2, skew = d * 0.32;   // the far edge is set back to the right: seen from a little above
    const face = [[L + skew, T], [R + skew, T], [R, B], [L, B]];
    ctx.save();
    IB.shade(ctx, L + 4, B + rim, w - 4, 10, { from: 'top', seed: seed + 1, alpha: 0.4 });
    IB.ink(ctx, [[L, B], [R, B], [R, B + rim], [L, B + rim]], { closed: true, smooth: false, fill: C.paper, w: 2.8, seed: seed + 2 });   // the front rim
    IB.ink(ctx, face, { closed: true, smooth: false, fill: C.paper, w: 2.8, seed: seed + 3 });
    // the wells: one long divider and a short one across the right half
    const at = (u, v) => [lerp(L, R, u) + skew * (1 - v), lerp(T, B, v)];
    IB.seg(ctx, ...at(0.5, 0.06), ...at(0.5, 0.94), { w: 2, seed: seed + 4 });
    IB.seg(ctx, ...at(0.5, 0.48), ...at(0.95, 0.48), { w: 2, seed: seed + 5 });
    if (food) {
      const [rx, ry] = at(0.24, 0.45), [bx, by] = at(0.74, 0.22), [gx, gy] = at(0.64, 0.72), [yx, yy] = at(0.85, 0.74);
      IB.ink(ctx, IB.ellipse(rx, ry + d * 0.12, w * 0.2, d * 0.62, 12, Math.PI, Math.PI * 2), { closed: true, fill: C.paper, w: 2.4, seed: seed + 6 });   // rice, a mound over the rim
      IB.oval(ctx, bx, by - d * 0.05, w * 0.14, d * 0.24, { fill: C.bg, w: 2.4, seed: seed + 7, n: 12 });   // the soup bowl
      IB.oval(ctx, bx, by - d * 0.1, w * 0.1, d * 0.13, { fill: C.paper, w: 1.6, seed: seed + 8, n: 10 });
      IB.ink(ctx, [[gx - w * 0.09, gy + 2], [gx - w * 0.06, gy - d * 0.3], [gx, gy - d * 0.42], [gx + w * 0.06, gy - d * 0.26], [gx + w * 0.07, gy + 2]], { closed: true, fill: side, w: 2.2, seed: seed + 9 });
      IB.box(ctx, yx - w * 0.05, yy - d * 0.22, w * 0.1, d * 0.26, { fill: C.yellow, w: 2.2, seed: seed + 10 });
    }
    ctx.restore();
  };
  /* trayGrips(at, opts) — where the wrists go to hold a lunch tray drawn at `at` with the same w: [far, near] for IB.figure's pose.hands. The far hand is under the tray's back left corner, the near hand over its front rim a little in from the left end (a child carries it close, both hands at the end nearest the body). */
  IB.trayGrips = ([cx, cy], o = {}) => {
    const { w = 130 } = o, d = w * 0.34;
    return [[cx - w * 0.4 + d * 0.2, cy - d * 0.1], [cx - w * 0.36, cy + d * 0.62]];
  };

  /* lunchTable(ctx, at, opts) — a cafeteria table seen end-on, sized for sitters of height h (default 290): a top 0.43 h off the floor and w wide (default 0.95 h), two splayed legs, and a bench on either side whose top is where IB.sit's seat is (IB.SEAT - 0.05), joined to the legs by a low rail. `at` = [the table's centre, the floor]. `layer` 'bench' draws the benches and the rail, 'table' the top and legs (draw benches, the sitters' far pass, the table, then their near pass); omit it for both. Returns { top, seats: [left, right] } — the hip x of a sitter facing the table from either side (IB.sit(x, floor, look) with dir 1 on the left, -1 on the right) (school/lunch-tray-seat). */
  IB.lunchTable = (ctx, [cx, FLOOR], o = {}) => {
    const { h = 290, w = 0.95 * h, layer = null, fill = C.paper, seed = 1040 } = o, lw = 3.2;
    const top = FLOOR - 0.43 * h, thick = 0.045 * h, seatTop = FLOOR - (IB.SEAT - 0.05) * h, bw = 0.3 * h;
    const seats = [cx - w / 2 - 0.1 * h, cx + w / 2 + 0.1 * h];
    ctx.save();
    if (layer !== 'table') {
      IB.shade(ctx, cx - w / 2 - 0.3 * h, FLOOR - 4, w + 0.6 * h, 14, { from: 'top', seed: seed + 1, alpha: 0.4 });
      IB.seg(ctx, seats[0], FLOOR - 0.1 * h, seats[1], FLOOR - 0.1 * h, { w: lw, seed: seed + 2 });
      seats.forEach((sx, i) => {
        IB.box(ctx, sx - 6, seatTop + 10, 12, FLOOR - seatTop - 10, { fill, w: lw * 0.9, seed: seed + 3 + i });
        IB.box(ctx, sx - bw / 2, seatTop, bw, 12, { fill, w: lw, seed: seed + 5 + i });
      });
    }
    if (layer !== 'bench') {
      for (const s of [-1, 1]) IB.ink(ctx, [[cx + s * 0.08 * h - 7, top + thick], [cx + s * 0.22 * h - 7, FLOOR], [cx + s * 0.22 * h + 7, FLOOR], [cx + s * 0.08 * h + 7, top + thick]], { closed: true, smooth: false, fill, w: lw * 0.9, seed: seed + 8 + s });
      IB.shade(ctx, cx - w / 2 + 10, top + thick + 2, w - 20, 22, { from: 'top', seed: seed + 11, alpha: 0.45 });
      IB.box(ctx, cx - w / 2, top, w, thick, { fill, w: lw, seed: seed + 12 });
    }
    ctx.restore();
    return { top, seats };
  };

  /* schoolGate(ctx, at, opts) — the school's sliding gate across the path, in an oblique view so the path runs left to right through it: depth (away from the viewer) goes up and to the right, z px of depth landing (0.8 z, -0.3 z) px from the near post. A near post and a far post `span` (300) apart in depth, a rail on the ground between them, and a yellow grille panel (bars on a top and a bottom rail, two wheels) that slides along it: `open` 1 parks the panel behind the far post, 0 closes the opening. Move `open` on ones: it is a machine. `layer` 'back' draws the rail, the far post and the panel, 'front' the near post (draw a figure crossing the gate in between); omit it for both. `at` = [the foot of the near post, the floor there]. Returns { edge }, the depth of the panel's leading edge (1.04 x span x open); IB.gateLane gives the floor point at a depth (school/late-gate-run). */
  const GZ = [0.8, -0.3];
  /* gateLane(at, z) — the floor point at depth z on the line of a gate whose near post stands at `at`, without drawing: where a figure crossing the gate at that depth puts its feet (its y) and crosses (its x), and where the scene lays its floor smear before the gate is drawn. */
  IB.gateLane = ([gx, gy], z) => [gx + z * GZ[0], gy + z * GZ[1]];
  IB.schoolGate = (ctx, [gx, gy], o = {}) => {
    const { open = 1, span = 300, panelH = 330, postH = 420, fill = C.yellow, layer = null, seed = 1080 } = o;
    const P = (z, up = 0) => { const [x, y] = IB.gateLane([gx, gy], z); return [x, y - up]; }, edge = span * clamp(open) * 1.04;
    const post = (z, sd) => {   // a square brick pillar: its front face and the sliver of its side going back in depth
      const [x, y] = P(z), wd = 46, dep = 28;
      IB.ink(ctx, [[x + wd / 2, y], [x + wd / 2 + dep * GZ[0], y + dep * GZ[1]], [x + wd / 2 + dep * GZ[0], y + dep * GZ[1] - postH], [x + wd / 2, y - postH]], { closed: true, smooth: false, fill: C.bg, w: 3, seed: sd });
      IB.box(ctx, x - wd / 2, y - postH, wd, postH, { fill: C.paper, w: 3.2, seed: sd + 1 });
      IB.ink(ctx, [[x - wd / 2 - 6, y - postH], [x - wd / 2 + 4 + dep * GZ[0], y - postH + dep * GZ[1] - 10], [x + wd / 2 + 8 + dep * GZ[0], y - postH + dep * GZ[1] - 10], [x + wd / 2 + 6, y - postH]], { closed: true, smooth: false, fill: C.paper, w: 3, seed: sd + 2 });   // the cap
      for (let k = 1; k < 6; k++) IB.seg(ctx, x - wd / 2 + 6, y - postH + k * 66, x - wd / 2 + 6 + (k % 2 ? 14 : 22), y - postH + k * 66, { w: 1.6, seed: sd + 3 + k });   // a few brick marks
      IB.shade(ctx, x - wd / 2 - 8, y - 4, wd + 30, 12, { from: 'top', seed: sd + 9, alpha: 0.45 });
    };
    ctx.save();
    if (layer !== 'front') {
      IB.seg(ctx, ...P(-10), ...P(span + 16), { w: 3, seed });   // the rail, across the opening only: a parked panel rides behind the far post on its own wheels (a longer line would cross a figure that has come through)
      post(span, seed + 10);
      // the panel: from its leading edge at depth `edge` back one span
      const z0 = edge, z1 = edge + span, bars = 7;
      for (let i = 0; i <= bars; i++) { const z = lerp(z0 + 8, z1 - 8, i / bars); IB.tube(ctx, [P(z, 22), P(z, panelH - 6)], { w: 10, edge: 2.4, fill, seed: seed + 20 + i }); }
      for (const up of [22, panelH - 12, panelH * 0.55]) IB.tube(ctx, [P(z0, up), P(z1, up)], { w: up === panelH * 0.55 ? 9 : 14, edge: 2.6, fill, seed: seed + 40 + up });
      IB.tube(ctx, [P(z0, 16), P(z0, panelH)], { w: 16, edge: 2.8, fill, seed: seed + 50 });   // the leading stile
      for (const z of [z0 + 34, z1 - 34]) { const [x, y] = P(z, 9); IB.oval(ctx, x, y, 10, 10, { fill: C.charcoal, w: 2.4, seed: seed + 60 + Math.round(z), n: 9 }); }
    }
    if (layer !== 'back') post(0, seed + 70);
    ctx.restore();
    return { edge };
  };

  /* backpack(ctx, pose, look, opts) — a child's school backpack worn on a figure: a rounded bag on its back from 0.06 h to 0.23 h up the spine, a flap and a front pocket, turning with the spine's lean. It bobs a drawing late: give the pose its prev (IB.figure's) and the bag drops by 1.4 times how far the hip rose since the drawing before (and rises when the hip drops), at most 0.06 h, which on a run reads as the bag thumping on every stride. `part` 'bag' (draw before the figure) or 'strap' (the shoulder strap, drawn between the figure's far and near passes); omit it for both (school/late-gate-run). */
  IB.backpack = (ctx, pose, look, o = {}) => {
    const { fill = C.lavender, part = null, seed = 1120 } = o, h = look.h, d = look.dir || 1, lean = pose.lean || 0;
    const lag = pose.prev ? clamp((pose.prev.hip[1] - pose.hip[1]) * 1.4, -0.06 * h, 0.06 * h) : 0;
    const sx = Math.sin(lean) * d, sy = -Math.cos(lean), fx = Math.cos(lean) * d, fy = Math.sin(lean);
    const at = (u, f, dy = 0) => [pose.hip[0] + (sx * u + fx * f) * h, pose.hip[1] + (sy * u + fy * f) * h + dy];
    ctx.save();
    if (part !== 'strap') {
      const b = (u, f) => at(u, f, lag);
      IB.ink(ctx, [b(0.215, -0.07), b(0.23, -0.12), b(0.215, -0.165), b(0.15, -0.178), b(0.07, -0.172), b(0.055, -0.13), b(0.06, -0.07)], { closed: true, fill, w: IB.figLine(h), seed });
      IB.ink(ctx, [b(0.222, -0.09), b(0.2, -0.168), b(0.15, -0.176)], { w: IB.figLine(h) * 0.8, seed: seed + 1 });   // the flap's edge
      IB.ink(ctx, [b(0.13, -0.174), b(0.13, -0.196), b(0.075, -0.19), b(0.072, -0.168)], { closed: true, fill: C.paper, w: IB.figLine(h) * 0.85, seed: seed + 2 });   // the front pocket
    }
    if (part !== 'bag') IB.ink(ctx, [at(0.215, -0.075, lag), at(0.245, -0.01), at(0.215, 0.05), at(0.13, 0.06), at(0.07, -0.02, lag * 0.5)], { w: IB.figLine(h) * 1.3, seed: seed + 3, taper: false });
    ctx.restore();
  };
})(window);
