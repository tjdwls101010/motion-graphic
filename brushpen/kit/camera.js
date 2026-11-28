/* Needs ink.js.
   The camera: which part of the stage the frame shows, how it gets from one view to the next, and the shake of an impact. A scene stages its actors once in stage px (1920 x 1080, 140 px a metre) and films them through a list of shots, so cutting to a close-up, pushing in or whipping to another place never moves an actor.

   A view is { at: [cx, cy], w, tilt }: the stage point at the centre of the frame, the width of stage it shows (1920 = the whole stage; 640 = 3x, a close-up) and a dutch tilt in radians (positive turns the picture clockwise). [x, y, w] (an IB.crop window, top left and width) is accepted wherever a view is.

   IB.shot(keys, f, opts) — the camera at frame f. keys is a list of [frame, view, how, over], frames ascending; each key starts a move at its frame from wherever the camera is then to `view`, lasting `over` frames (the defaults below). how:
     'cut'   the reference's join: the view changes at that frame.
     'pan'   the reference's measured pan (spot/folder-meets-document 1.75 s): on twos, slow off the mark, two big steps, three to stop; 291 px went 9, 12, 12, 113, 117, 13, 9, 6 px a drawing. Default 16 frames, stretched to `over`.
     'push'  the reference's slow push (establish 2): steady, on ones. Default 48 frames.
     'ease'  a smooth move on ones that starts and stops gently (smoothstep). Default 12 frames.
     'snap'  a punch-in on an impact: on ones, 50 %, 85 %, 103 %, 100 % of the way in 4 frames. Not measured: this camera is ours.
     'whip'  the reference's speed-line whip (insert/mesh-eyes-whip): the old view slides out in 2 frames, a bare stage (opts of IB.whip streaks only) until the last 4, the new view slides in over 4 (1500, 1100, 600, 180 screen px). Default 8 frames (6 between close-ups, 10 between wides).
   Zoom moves are even in log scale (each frame multiplies the width by the same factor), so a push feels steady rather than accelerating.
   opts.jolt is a list of impact frames (or [frame, amp]): from each one the frame shakes for 8 frames on ones, amp screen px (16 by default) falling by 0.62 a frame and turning to a new side each frame, with a slight roll. Not measured either.
   Returns { at, w, tilt, s (the zoom: 1920 / w), jolt: [dx, dy, roll], whip: null | { k, seed, dir }, bare }.

   IB.film(ctx, cam, world, opts) — draw one frame through the camera: puts the view on ctx, calls world(ctx, cam) (skipped on the bare frames of a whip), puts the transform back and draws the whip's streaks over a whip frame (opts.tint: the colours of the shots leaving and arriving, opts.seed). Draw IB.bg first, since a tilted or shaken frame shows past the stage's edges. Lines thicken with the zoom, which is the reference's rule for shot size (3 px wide, 5-8 px in a medium shot, 7-9 px in a close-up). */
(function (window) {
  const IB = window.IB;
  const W = () => (window.MG && MG.W) || 1920, H = () => (window.MG && MG.H) || 1080;

  const view = (v) => (Array.isArray(v) ? { at: [v[0] + v[2] / 2, v[1] + (v[2] * 9) / 32], w: v[2], tilt: 0 } : { at: v.at || [960, 540], w: v.w || 1920, tilt: v.tilt || 0 });
  const PAN = [0, 9, 21, 33, 146, 263, 276, 285, 291].map((v) => v / 291);   // cumulative share of the measured pan after each drawing
  const SNAP = [0.5, 0.85, 1.03, 1];
  const OVER = { cut: 0, pan: 16, push: 48, ease: 12, snap: 4, whip: 8 };
  const OUT = [1150, 1500], IN = [1500, 1100, 600, 180];

  const share = (how, k, over) => {   // how far along (0..1, may overshoot) a move is k frames after it started
    if (k >= over) return 1;
    if (how === 'pan') { const u = (Math.floor(k / 2) * 2) / over * 8, i = Math.min(7, Math.floor(u)); return PAN[i] + (PAN[i + 1] - PAN[i]) * (u - i); }
    if (how === 'push') return k / over;
    if (how === 'ease') { const u = k / over; return u * u * (3 - 2 * u); }
    if (how === 'snap') return SNAP[Math.min(3, k)];
    return 1;
  };
  const mix = (a, b, u) => ({ at: [a.at[0] + (b.at[0] - a.at[0]) * u, a.at[1] + (b.at[1] - a.at[1]) * u], w: a.w * Math.pow(b.w / a.w, u), tilt: a.tilt + (b.tilt - a.tilt) * u });

  IB.shot = (keys, f, o = {}) => {
    let cam = view(keys[0][1]), whip = null, bare = false;
    for (let i = 0; i < keys.length && keys[i][0] <= f; i++) {
      const [f0, v, how = 'cut', over = OVER[how]] = keys[i], to = view(v), k = f - f0;
      if (how === 'whip' && k < over) {
        const dir = Math.sign(to.at[0] - cam.at[0]) || 1;
        whip = { k, seed: 9 + i, dir };
        if (k < 2) cam = { ...cam, at: [cam.at[0] + (dir * OUT[k] * cam.w) / W(), cam.at[1]] };
        else if (k < over - 4) bare = true;
        else cam = { ...to, at: [to.at[0] - (dir * IN[k - (over - 4)] * to.w) / W(), to.at[1]] };
        break;
      }
      cam = how === 'cut' || how === 'whip' ? to : mix(cam, to, share(how, k, over));
    }
    let jolt = [0, 0, 0];
    (o.jolt || []).forEach((h) => {
      const [hf, amp = 16] = Array.isArray(h) ? h : [h], k = f - hf;
      if (k < 0 || k >= 8) return;
      const a = hf * 1.7 + k * 2.4, m = amp * Math.pow(0.62, k) * (k % 2 ? -1 : 1);
      jolt = [jolt[0] + m * Math.cos(a), jolt[1] + m * Math.sin(a), jolt[2] + (m / 16) * 0.006];
    });
    return { ...cam, s: W() / cam.w, jolt, whip, bare };
  };

  IB.film = (ctx, cam, world, o = {}) => {
    const s = cam.s, th = cam.tilt + cam.jolt[2], cs = Math.cos(th) * s, sn = Math.sin(th) * s;
    ctx.save();
    ctx.setTransform(cs, sn, -sn, cs, W() / 2 + cam.jolt[0] - (cs * cam.at[0] - sn * cam.at[1]), H() / 2 + cam.jolt[1] - (sn * cam.at[0] + cs * cam.at[1]));
    if (!cam.bare) world(ctx, cam);
    ctx.restore();
    if (cam.whip) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); IB.whip(ctx, cam.whip.k + cam.whip.seed * 40, { seed: o.seed || cam.whip.seed, tint: o.tint || [] }); ctx.restore(); }
  };
})(window);
