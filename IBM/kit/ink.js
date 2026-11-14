/* ink.js — the brush-pen look of the IBM spots on a 2D canvas: flat grey stage, black ink outlines over white fills, one or two flat colours, the blue chalk smear that stands in for the floor, copy that slides in and settles, and the speed-line whip between shots. Immediate mode: a scene's render(t) repaints everything. Every measured number in ../STYLE.md lives here once. Exposes the global IB. */
(function (g) {
  const MG = g.MG;
  const IB = (g.IB = {});

  /* Palette sampled from the reference frames (STYLE.md "공통 팔레트"). */
  IB.C = {
    bg: '#f0f0f0', ink: '#050505', paper: '#fdfdfd', charcoal: '#373737',
    royal: '#1e66f0', smear: '#2f6bea', blue: '#5cacf5', sky: '#c3e5fd', navy: '#0b2895',
    lavender: '#e5dbf9', yellow: '#fadb67', mustard: '#d2a005', green: '#42be64', mint: '#c1ecc0',
    skin: ['#f6c398', '#ddbb9c', '#d2b99b', '#b59674', '#a07d5a'],
  };
  IB.FONT = 'Pretendard';

  /* ---------- time ---------- */
  /* Drawn animation updates every 2 frames of the 24 fps reference (12 fps) and holds dead still in between; slow acting drops to every 3 frames (8 fps). Copy, pans and scrolls stay on ones: pass them the raw t. */
  IB.FPS = 24;
  IB.twos = (t) => MG.onTwos(t, 12);
  IB.threes = (t) => MG.onTwos(t, 8);
  IB.frame = (t) => Math.floor(t * IB.FPS + 1e-6);
  /* settle(dt, tau, stop) — 0..1, the curve copy and the end card arrive on: an exponential approach (time constant tau) rescaled so it lands exactly on 1 at `stop` seconds and is truly still afterwards. Fitted to the reference frame by frame: 71 px of head copy closes 60, 48, 38, 31, 25, 20, 16, 13, 10 ... px and is still after 0.79 s with tau 0.2. */
  IB.settle = (dt, tau = 0.2, stop = tau * 4) => (dt <= 0 ? 0 : dt >= stop ? 1 : (1 - Math.exp(-dt / tau)) / (1 - Math.exp(-stop / tau)));

  /* ---------- stage ---------- */
  IB.bg = (ctx, color = IB.C.bg) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, MG.W, MG.H);
  };

  /* ---------- dust ---------- */
  /* Every grain of dust (edge dust, graphite shading, chalk) goes through here, for two reasons found the hard way with tools/check_pure.py.
     1. Chrome draws canvas paths with 4x MSAA, so an edge pixel has only five possible values and one sample flipping is a 62-level jump; which draws get MSAA depends on how the frame's operations are batched, and a frame with tens of thousands of operations is split into batches at points that vary from one capture to the next. Specks drawn one fillRect at a time (10,000 for one end-card smear) made a dense frame differ from itself by up to 63 pixels over the check's 40-level threshold (it allows 30).
     2. So dust is collected and filled as five paths per call, and every speck is a whole-pixel square at an integer device position: it has no partial coverage, so it comes out the same under any anti-aliasing.
     Tone comes from density, not from per-speck opacity: put()'s `alpha` is the chance the speck is kept, kept specks are dealt round-robin into five layers, and each layer is one fill at the same low opacity, so where specks crowd the layers stack up (1, 2 ... 5 deep) and where they thin out the paper shows through. Filling each speck at its own alpha in one union per level made a smear read as flat pixel blocks.
     put() takes stage coordinates under the current transform. */
  function dust(ctx, layerAlpha = 0.42) {
    const m = ctx.getTransform(), k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1, a0 = ctx.globalAlpha, LAYERS = 5;
    const bins = Array.from({ length: LAYERS }, () => []);
    let n = 0;
    return {
      put(x, y, w, h, alpha) {
        n++;
        if (alpha < 1 && MG.hash(n, 977) >= alpha) return;
        bins[n % LAYERS].push(Math.round(m.a * x + m.c * y + m.e), Math.round(m.b * x + m.d * y + m.f), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
      },
      done() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = a0 * layerAlpha;
        for (const r of bins) {
          if (!r.length) continue;
          ctx.beginPath();
          for (let j = 0; j < r.length; j += 4) ctx.rect(r[j], r[j + 1], r[j + 2], r[j + 3]);
          ctx.fill();
        }
        ctx.restore();
      },
    };
  }

  /* ---------- ink ---------- */
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  /* Catmull-Rom through control points, sampled every ~`step` px. */
  function spline(cp, closed, step) {
    const n = cp.length, out = [];
    const at = (i) => (closed ? cp[((i % n) + n) % n] : cp[Math.max(0, Math.min(n - 1, i))]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const per = Math.max(2, Math.round(dist(p1, p2) / step));
      for (let k = 0; k < per; k++) {
        const u = k / per, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
      }
    }
    if (!closed) out.push(cp[n - 1]);
    return out;
  }
  /* Points every ~`step` px along a polyline, corners kept. */
  function resample(pts, closed, step) {
    const out = [], n = pts.length, segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % n], k = Math.max(1, Math.round(dist(a, b) / step));
      for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  /* Smooth 1-D value noise in [-1, 1] along a stroke: the hand's drift, fixed by the seed so a held drawing never boils. */
  function drift(seed, x) {
    const i = Math.floor(x), u = x - i, s = u * u * (3 - 2 * u);
    return (MG.hash(seed, i) * (1 - s) + MG.hash(seed, i + 1) * s) * 2 - 1;
  }

  /* ink(ctx, pts, opts) — one brush-pen stroke through pts ([[x, y], ...]), drawn as a filled ribbon so its width can swell and its ends can taper.
     w       stroke width in px: 3 for a wide shot, 5-8 for a medium, 1-2 for small figures (STYLE.md)
     closed  close the outline; fill paints the inside first (white fills are how figures cover what is behind them)
     smooth  true: curve through the points; false: straight sides with crisp corners
     wob     how far the hand drifts off the true line, px
     seed    fixes the drift; give every stroke its own
     grain   0 = clean edge; 1 (default) = rough edge and dry-brush dust, applied to strokes 2.2 px and wider
     from,to draw only this fraction of the stroke (0..1), for a line that is drawn on. They cut the outline only: a fill is always painted whole, even when from >= to leaves no outline */
  IB.ink = (ctx, pts, o = {}) => {
    const { w = 3, color = IB.C.ink, closed = false, smooth = true, fill = null, seed = 1, wob = 0.7, taper = !closed, from = 0, to = 1, grain = 1 } = o;
    if (pts.length < 2) return;
    const step = Math.min(6, Math.max(2.4, w));   // sample spacing follows the width, but a wide band is still sampled finely
    let p = smooth ? spline(pts, closed, step) : resample(pts, closed, step);
    const n = p.length;
    // drift each point off its place, slowly along the stroke
    const q = p.map(([x, y], i) => [x + drift(seed, i * step * 0.033) * wob, y + drift(seed + 7, i * step * 0.033) * wob]);
    if (fill) {
      ctx.beginPath();
      q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (w <= 0 || to <= from) return;
    // a partial stroke is cut at the exact fraction, not at the nearest sample; on a closed outline the fraction runs all the way round to the start
    const ring = closed ? q.concat([q[0]]) : q, last = ring.length - 1;
    const at = (u) => { const x = Math.min(last, Math.max(0, u * last)), i = Math.min(last - 1, Math.floor(x)), v = x - i; return [ring[i][0] + (ring[i + 1][0] - ring[i][0]) * v, ring[i][1] + (ring[i + 1][1] - ring[i][1]) * v]; };
    const a = Math.ceil(from * last + 1e-9), b = Math.floor(to * last - 1e-9);
    const pick = closed && from === 0 && to === 1 ? q.concat([q[0], q[1]]) : [at(from), ...ring.slice(a, b + 1), at(to)];
    const m = pick.length;
    if (m < 2) return;
    const L = [], R = [], rough = grain > 0 && w >= 2.2;
    for (let i = 0; i < m; i++) {
      const p0 = pick[Math.max(0, i - 1)], p1 = pick[Math.min(m - 1, i + 1)];
      const d = dist(p0, p1) || 1, nx = -(p1[1] - p0[1]) / d, ny = (p1[0] - p0[0]) / d;
      // pressure: the width breathes (±9% of the width, at most 1.2 px), and an open stroke thins toward both ends like a lifted brush
      let half = w / 2 + Math.min(w * 0.09, 1.2) * drift(seed + 13, (from * last + i) * step * 0.023);
      if (rough) half += (MG.hash(seed + 29, a + i) - 0.5) * 0.8;   // tooth of the paper: the edge is never a clean curve, by the same fraction of a pixel at any width
      if (taper) half *= 0.45 + 0.55 * Math.min(1, Math.min(i, m - 1 - i) / 3);
      L.push([pick[i][0] + nx * half, pick[i][1] + ny * half]);
      R.push([pick[i][0] - nx * half, pick[i][1] - ny * half]);
    }
    ctx.beginPath();
    L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = m - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // round the ends and hide the hairline joins of the ribbon
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.lineWidth = Math.min(1, w * 0.3);
    ctx.strokeStyle = color;
    ctx.stroke();
    if (rough) {
      // dry-brush dust: specks straddling both edges, so the line reads as charcoal on paper rather than vector
      const r = MG.rng(seed * 7 + 11), d0 = dust(ctx, 0.5);
      ctx.fillStyle = color;
      for (let i = 0; i < m - 1; i++) {
        const [x0, y0] = pick[i], [x1, y1] = pick[i + 1], d = dist(pick[i], pick[i + 1]) || 1, nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
        for (let k = Math.max(1, Math.round(d * 0.9 * grain)); k > 0; k--) {
          const u = r(), off = (r() < 0.5 ? -1 : 1) * (w / 2 - 0.7 + r() * 1.8), sz = 0.7 + r() * 1.1;   // a 1.8 px band on the edge, whatever the width
          d0.put(x0 + (x1 - x0) * u + nx * off - sz / 2, y0 + (y1 - y0) * u + ny * off - sz / 2, sz, sz, 0.25 + 0.5 * r());
        }
      }
      d0.done();
    }
  };

  /* Point lists for the common shapes, ready for IB.ink. */
  IB.line = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
  IB.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  IB.ellipse = (cx, cy, rx, ry = rx, n = 14, a0 = 0, a1 = Math.PI * 2) => {
    const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6, out = [];
    for (let i = 0; i < (full ? n : n + 1); i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  };
  /* Shorthands: outline shapes the way the reference inks them (straight things straight, round things round). */
  IB.box = (ctx, x, y, w, h, o = {}) => IB.ink(ctx, IB.rect(x, y, w, h), { closed: true, smooth: false, ...o });
  IB.oval = (ctx, cx, cy, rx, ry, o = {}) => IB.ink(ctx, IB.ellipse(cx, cy, rx, ry, o.n || 14), { closed: true, ...o });
  IB.seg = (ctx, x1, y1, x2, y2, o = {}) => IB.ink(ctx, [[x1, y1], [x2, y2]], { smooth: false, ...o });

  /* tube(ctx, pts, opts) — a coloured band with an ink edge on both sides: limbs, bike frames, pipes. Straight segments with round joints unless smooth. w is the full width including the edge. */
  IB.tube = (ctx, pts, o = {}) => {
    const { w = 12, edge = 2.5, fill = IB.C.paper, smooth = false, seed = 1, wob = 0.4 } = o;
    IB.ink(ctx, pts, { w, smooth, seed, wob, taper: false });
    IB.ink(ctx, pts, { w: Math.max(0.5, w - edge * 2), color: fill, smooth, seed, wob, taper: false, grain: 0 });   // no dust from the fill: it would eat the ink edge
  };

  /* ---------- chalk ---------- */
  /* smear(ctx, cx, y, w, opts) — the blue chalk floor mark under feet and under the end-card line: a crisp top edge at y, a dense core, dust falling away below and thinning toward both ends. w is the width of the dense core (dust feathers out ~15% further on each side); the end-card smear is w=1000, h=34, a foot smear w≈110, h≈10. */
  IB.smear = (ctx, cx, y, w, o = {}) => {
    const { h = Math.max(6, w * 0.034), color = IB.C.smear, seed = 5, alpha = 1 } = o;
    const r = MG.rng(seed), d0 = dust(ctx, 0.4 * alpha);
    ctx.fillStyle = color;
    // core: short 1 px dashes packed against the top edge, thinning with depth and toward both ends
    const rows = Math.max(3, h * 0.5);
    for (let i = Math.round(w * rows * 0.45); i > 0; i--) {
      const v = Math.pow(r(), 1.5), u = (r() + r()) / 2 - 0.5, len = 5 + r() * 14;
      const reach = (w / 2) * (0.98 - 0.4 * v);
      d0.put(cx + u * 2 * reach - len / 2, y + v * rows, len, 1, (0.95 - 0.55 * v) * (1 - Math.pow(Math.abs(u) * 2, 3)));
    }
    // dust: 1-2 px specks falling away below the core and feathering out past both ends
    for (let i = Math.round(w * h * 1.7); i > 0; i--) {
      const u = (r() + r() + r()) / 3 - 0.5;             // bell around the centre
      const v = Math.pow(r(), 1.35);                      // crowded toward the top edge
      const edge = Math.max(0, 1 - Math.pow(Math.abs(u) * 2, 2));
      d0.put(cx + u * w * 1.38, y - 2 + v * h * (0.5 + 0.9 * edge), 1 + r() * 1.2, 1, (0.3 + 0.6 * r()) * (1 - v * 0.85) * (0.25 + 0.75 * edge));
    }
    d0.done();
  };

  /* shade(ctx, x, y, w, h, opts) — soft graphite shading, the only tone the reference adds to its flat fills: densest along one edge of the w x h box and fading to nothing at the opposite one. `from` names the dense edge ('top' | 'bottom' | 'left' | 'right'). Legs get it under the body, arms where they leave it, objects where they meet the floor. Stippled, so it sits on any fill colour. */
  IB.shade = (ctx, x, y, w, h, o = {}) => {
    const { from = 'top', color = IB.C.ink, alpha = 0.55, seed = 9, reach = 1.6 } = o;
    const r = MG.rng(seed * 3 + 1), n = Math.round(w * h * 1.1), d0 = dust(ctx, 0.5);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const u = r(), v = Math.pow(r(), reach), s = 0.8 + r() * 1.2;   // v crowds toward the dense edge
      const px = from === 'left' ? x + v * w : from === 'right' ? x + w - v * w : x + u * w;
      const py = from === 'top' ? y + v * h : from === 'bottom' ? y + h - v * h : y + u * h;
      d0.put(px, py, s, s, alpha * 1.4 * (0.3 + 0.7 * r()) * (1 - v));
    }
    d0.done();
  };

  /* ---------- copy ---------- */
  /* Copy type sizes, measured as ascender-to-descender height / line pitch / left margin / first-line top (STYLE.md). `px` is the Pretendard size that gives that glyph height. */
  IB.TYPE = {
    spot: { px: 80, pitch: 95, x: 90, top: 351, from: 37, tau: 0.21, stop: 0.7 },    // the 15 s single-shot spots
    head: { px: 118, pitch: 128, x: 200, top: 412, from: 71, tau: 0.2, stop: 0.79 },  // first copy card: the big question
    body: { px: 80, pitch: 108, x: 200, top: 447, from: 71, tau: 0.2, stop: 0.79 },   // following copy cards
    tag: { px: 64, pitch: 0, x: 960, top: 508, from: 39, tau: 0.152, stop: 0.5 },     // end-card line, centred on x
  };
  /* copy(ctx, lines, t, at, opts) — a block of copy that arrives at time `at`: fully opaque from its first frame, `from` px left of its place, sliding in on IB.settle; each further line shows one frame later than the one above. Never fades. Call it again with a new `at` when a line is added or the wording changes: the whole block re-enters.
     size   'spot' | 'head' | 'body' | 'tag', or an object like IB.TYPE's
     color, x, top, align, from, tau, stop  overrides; stagger = frames between one line and the next (default 1) */
  IB.copy = (ctx, lines, t, at, o = {}) => {
    const ty = { ...(typeof o.size === 'object' ? o.size : IB.TYPE[o.size || 'spot']), ...o };
    if (t < at) return 0;
    const dx = -ty.from * (1 - IB.settle(t - at, ty.tau, ty.stop));
    ctx.save();
    ctx.font = `${ty.weight || 300} ${ty.px}px ${IB.FONT}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = ty.align || (o.size === 'tag' ? 'center' : 'left');
    ctx.fillStyle = ty.color || IB.C.ink;
    const shown = Math.min(lines.length, 1 + Math.floor(IB.frame(t - at) / (ty.stagger || 1)));
    for (let i = 0; i < shown; i++) ctx.fillText(lines[i], ty.x + dx, ty.top + ty.px * 0.8 + i * ty.pitch);
    ctx.restore();
    return dx;
  };

  /* ---------- flyer ---------- */
  /* flyer(ctx, x, y, size, opts) — a small winged bug, the neutral stand-in for the mascot insect that crosses the reference's establishing shots and lands on the end-card line. `size` is the body length in px; `flap` 0/1 alternates the wing pose (flip it every frame while it flies, hold it once it has landed). */
  IB.flyer = (ctx, x, y, size, o = {}) => {
    const { rot = 0, flap = 0, seed = 3 } = o;
    const s = size / 100, w = Math.max(1.2, size * 0.055);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    const lw = w / s;
    // two wings on the back, swept up or flat on alternate frames
    for (const k of [0, 1]) {
      ctx.save();
      ctx.translate(-6 + k * 14, -26);
      ctx.rotate((flap ? -0.25 : -1.0) + k * (flap ? 0.7 : 0.45));
      IB.oval(ctx, 0, -34, 13, 34, { w: lw, fill: IB.C.paper, seed: seed + k, n: 10 });
      ctx.restore();
    }
    IB.oval(ctx, 0, 0, 50, 34, { w: lw, fill: IB.C.lavender, seed, n: 12 });
    IB.oval(ctx, 42, -6, 20, 19, { w: lw, fill: IB.C.ink, seed: seed + 3, n: 10 });
    ctx.restore();
  };

  /* ---------- whip ---------- */
  /* whip(ctx, frame, opts) — one frame of the speed-line whip that joins two shots: thin black streaks, thin royal streaks and wide pale chalk bands, re-rolled completely on every frame. `tint` adds streaks in the colours of the shot that is leaving or arriving (the reference mixes them into the first and last frames). The scene slides its own shots out and in under this; see scenes/insert/mesh-eyes-whip.html. */
  IB.whip = (ctx, frame, o = {}) => {
    const { seed = 1, tint = [], density = 1, alpha = 1 } = o;
    const r = MG.rng(seed * 131 + frame * 17 + 3);
    const W = MG.W, H = MG.H;
    ctx.save();
    ctx.lineCap = 'round';
    const streak = (color, w, a) => {
      const y = 40 + r() * (H - 80), len = 120 + r() * r() * 1100, x = -100 + r() * (W + 100 - len * 0.4);
      ctx.globalAlpha = a * alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    };
    // chalk bands first: wide, grainy, pale
    for (let i = 0; i < Math.round(9 * density); i++) {
      const y = 60 + r() * (H - 120), h = 14 + r() * 10, len = 300 + r() * 700, x = r() * (W - len * 0.5);
      const d0 = dust(ctx, 0.3 * alpha);
      ctx.fillStyle = IB.C.blue;
      for (let k = 0; k < len * h * 0.12; k++) {
        const s = 1.5 + r() * 2.5;
        d0.put(x + r() * len, y + (r() + r() - 1) * h * 0.5, s * 2.4, s, 0.75);
      }
      d0.done();
    }
    for (const c of tint) for (let i = 0; i < Math.round(7 * density); i++) streak(c, 4 + r() * 10, 0.9);
    for (let i = 0; i < Math.round(13 * density); i++) streak(IB.C.royal, 3 + r() * 5, 1);
    for (let i = 0; i < Math.round(16 * density); i++) streak(IB.C.ink, 3 + r() * 4, 1);
    ctx.restore();
  };
})(window);
