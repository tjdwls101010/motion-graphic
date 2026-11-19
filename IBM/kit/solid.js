/* solid.js — things that turn in depth, drawn with the same brush pen as everything else. The reference's objects are not flat cut-outs: a folder turns round and shows the gap between its covers, a sheet of paper twists on its feet and its top catches up late, a mirror ball's tiles travel across it. This file does the 3-D arithmetic and nothing else: a scene places points in a small local space, IB.space maps them to stage px, and the result is ordinary point lists for IB.ink, so every edge still gets the pen's tooth and dust. No WebGL and no z-buffer: a scene draws its few flat pieces far-to-near, and IB.cast tells it which is which. Needs ink.js; adds to the global IB.

   Axes of a local space: x right, y down (so "up" is negative y, as on the canvas), z away from the viewer. */
(function (g) {
  const IB = g.IB;

  /* space(opts) — a local 3-D frame standing on the stage. Returns map([x, y, z]) -> [X, Y, depth]: stage px plus how far behind the origin the point ended up (larger = further).
     at     [x, y] stage position of the local origin: put it where the thing is held (a character's hip line, a ball's centre)
     yaw    turn about the vertical axis, rad: positive swings the +x side away. PI shows the back
     pitch  tip about the horizontal axis: positive leans the top away
     roll   turn in the picture plane, clockwise, like ctx.rotate
     f      focal length in px: nearer points grow by f / (f + depth). 1500 is a long lens (a 200 px object barely converges); go below 600 only for a deliberate wide-angle look
     look   camera elevation, rad: far points rise on screen by depth x sin(look), which is what lets a back cover peek over a front one. 0 looks straight on
     Turns are applied yaw, then pitch, then roll, so roll is always the tilt seen on screen. */
  IB.space = (o = {}) => {
    const { at = [0, 0], yaw = 0, pitch = 0, roll = 0, f = 1500, look = 0.2 } = o;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), sl = Math.sin(look);
    return ([x, y, z = 0]) => {
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
      const y2l = y2 - z2 * sl;
      const k = f / (f + z2);
      return [at[0] + (x1 * cr - y2l * sr) * k, at[1] + (x1 * sr + y2l * cr) * k, z2];
    };
  };

  /* cast(map, pts) — project a flat piece (3-D points in drawing order) and report how it lies: { pts, z, front }. pts go straight to IB.ink; z is the mean depth, for drawing pieces far-to-near; front is true while the piece shows the face it was authored on (points listed clockwise as seen from the front), false once it has turned its back. */
  IB.cast = (map, pts) => {
    const q = pts.map(map);
    let a = 0, z = 0;
    q.forEach((p, i) => { const n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; z += p[2]; });
    return { pts: q, z: z / q.length, front: a > 0 };
  };

  /* bend(opts) — the flex of a w x h sheet that stands on the middle of its bottom edge (x from -w/2 to w/2, y from -h up to 0, z = 0 flat). Returns fn([x, y, z]) -> [x, y, z] to apply before IB.space; the incoming z lifts a point off the sheet (a note clipped to it), so things attached to a sheet bend with it. sway, arch and twist leave the bottom edge where it is (a sheet that walks is held by its feet and everything above follows late); sag, wave and curl move the bottom edge too, so start the legs a little above it or they show their open ends.
     In the picture plane, which is where a sheet seen from the front shows its flex:
     sway   px the top edge slides sideways, growing with the square of the height (a blade of grass): both side edges curve the same way
     sag    px the middle of the sheet drops below its sides: the top and bottom edges bow like a smile (negative: a frown)
     wave   px one half rides up and the other down: the top and bottom edges take an S
     In depth, which shows once the sheet is turned or tipped (yaw / pitch of its space):
     arch   px the top edge falls back (+) or forward (-), same profile as sway
     curl   px the two side edges curve back (+) or forward (-) relative to the centre line
     twist  rad the top edge is turned about the vertical axis relative to the bottom: the lag of a sheet that turns on its feet */
  IB.bend = ({ w, h, sway = 0, sag = 0, wave = 0, arch = 0, curl = 0, twist = 0 }) => ([x, y, z = 0]) => {
    const v = -y / h, v2 = v * v, a = twist * v, c = Math.cos(a), s = Math.sin(a);
    const u = (2 * x) / w, zz = z + curl * u * u;
    // a bent sheet does not stretch: what the top gains sideways or in depth it loses in height
    return [x * c - zz * s + sway * v2, y + ((sway * sway + arch * arch) / (2.2 * h)) * v2 + sag * (1 - u * u) + wave * Math.sin(Math.PI * u), x * s + zz * c + arch * v2];
  };

  /* rim(x, y, w, h, n) — the outline of a rectangle as 3-D points (z = 0), n per side, clockwise from the top-left corner. Sampled along its sides so that a bend has something to curve; ink it with smooth: false, which keeps the four corners crisp. */
  IB.rim = (x, y, w, h, n = 8) => {
    const out = [], c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let i = 0; i < 4; i++) for (let k = 0; k < n; k++) out.push([c[i][0] + ((c[(i + 1) % 4][0] - c[i][0]) * k) / n, c[i][1] + ((c[(i + 1) % 4][1] - c[i][1]) * k) / n, 0]);
    return out;
  };

  /* crease(ctx, a, b, depth, opts) — graphite along an edge from a to b (stage px), densest on the edge and gone `depth` px to its left as seen walking from a to b (pass side: -1 for the right). The tone inside an open folder, under a lifted note, in any fold. Clip to the surface it lies on first if it must not spill. */
  IB.crease = (ctx, a, b, depth, o = {}) => {
    const { side = 1, alpha = 0.55, seed = 9, reach = 1.6 } = o;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!(len > 1 && depth > 1)) return;
    ctx.save();
    ctx.translate(a[0], a[1]);
    ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
    IB.shade(ctx, 0, side > 0 ? -depth : 0, len, depth, { from: side > 0 ? 'bottom' : 'top', alpha, seed, reach });
    ctx.restore();
  };

  /* clip(ctx, pts) — restrict drawing to a polygon until the matching ctx.restore(). The caller does ctx.save() first. */
  IB.clip = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
  };
})(window);
