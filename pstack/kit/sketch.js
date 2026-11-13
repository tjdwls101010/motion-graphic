/* sketch.js — hand-drawn pen on a 2D canvas, for the notebook stick-figure family and the desk set pieces. Immediate mode: a scene's render(t) repaints everything through a pen made for that t. Lines get their wobble from a seed, and the wobble is re-rolled a few times a second ("boil") so held drawings still feel alive. Exposes the global SK. */
(function (g) {
  const MG = g.MG;
  const SK = (g.SK = {});

  SK.INK = '#2b2723';      // main line
  SK.GREY = '#8f897e';     // secondary pencil line (background tags, stars, ground)
  SK.RED = '#e56f55';      // the one accent: hatching, the hero object, strike marks
  SK.RED_LINE = '#d9482f';
  SK.YELLOW = '#f6d35b';   // highlighter
  SK.WHITE = '#fbf8ef';    // paper-white fills
  SK.FONT = 'Gaegu';

  /* ---------- geometry ---------- */
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  /* Points every `step` px along a polyline. out.corners holds the indices of the original vertices so a sharp shape can keep them sharp. */
  function resample(pts, step) {
    const out = [pts[0]];
    out.corners = new Set([0]);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.round(dist(a, b) / step));
      for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      out.corners.add(out.length - 1);
    }
    return out;
  }
  /* Catmull-Rom through control points, sampled densely. */
  function spline(cp, closed, per = 10) {
    const n = cp.length, out = [];
    const at = (i) => (closed ? cp[((i % n) + n) % n] : cp[Math.max(0, Math.min(n - 1, i))]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let k = 0; k < per; k++) {
        const u = k / per, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
      }
    }
    if (!closed) out.push(cp[n - 1]);
    return out;
  }
  function cut(pts, p) {
    if (p >= 1) return pts;
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
    let left = total * p;
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      if (d >= left) {
        const u = d ? left / d : 0;
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]);
        return out;
      }
      left -= d;
      out.push(pts[i]);
    }
    return out;
  }
  /* Smooth stroke through pts. With `corners` (a Set of indices) the curve passes exactly through those points and bends only between them: wobbly sides, crisp corners. */
  function trace(ctx, pts, closed, corners) {
    ctx.beginPath();
    if (corners && pts.length >= 3) {
      const n = pts.length, last = closed ? n : n - 1;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= last; i++) {
        const cur = pts[i % n];
        const isEnd = (j) => corners.has(j % n) || (!closed && j === n - 1) || (closed && j === n);
        if (isEnd(i)) { ctx.lineTo(cur[0], cur[1]); continue; }
        const nx = pts[(i + 1) % n];
        if (isEnd(i + 1)) { ctx.quadraticCurveTo(cur[0], cur[1], nx[0], nx[1]); i++; }
        else ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nx[0]) / 2, (cur[1] + nx[1]) / 2);
      }
      if (closed) ctx.closePath();
      return;
    }
    if (pts.length < 3) {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      return;
    }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const m0 = mid(pts[pts.length - 1], pts[0]);
      ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < pts.length; i++) {
        const m = mid(pts[i], pts[(i + 1) % pts.length]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const m = mid(pts[i], pts[i + 1]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      const l = pts[pts.length - 1];
      ctx.lineTo(l[0], l[1]);
    }
  }
  SK.spline = spline;
  SK.cut = cut;
  /* pointAt(pts, p) — position and heading at fraction p of a polyline: for a pen tip or a walker following a drawn path. */
  SK.pointAt = (pts, p) => {
    const c = cut(pts, MG.clamp(p, 0.0001, 1));
    const a = c[c.length - 2] || c[0], b = c[c.length - 1];
    return { x: b[0], y: b[1], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };

  /* ---------- pen ---------- */
  /* pen(ctx, t, { boilFps, wob }) — every shape method takes an options object:
       seed   keeps this shape's wobble stable between frames (give one to anything drawn conditionally)
       w      line width (default 4)        color  stroke colour (default SK.INK), or null for no stroke
       fill   fill colour for closed shapes  wob   jitter amplitude in px (default pen.wob)
       p      0..1 draw-on progress          dash  [on, off] dash pattern
       alpha  opacity, multiplied with the opacity of any enclosing pen.with({ alpha }) */
  SK.pen = (ctx, t = 0, cfg = {}) => {
    const boil = Math.floor(t * (cfg.boilFps ?? 7.5));
    const baseWob = cfg.wob ?? 1.6;
    let auto = 1000;
    const pen = { ctx, t, boil, wob: baseWob };

    const wobble = (pts, seed, amp) =>
      pts.map(([x, y], i) => {
        // 65% of the offset is fixed per shape, 35% re-rolls each boil frame: the line shimmers without changing shape
        const jx = (MG.hash(seed * 7 + i, 1) - 0.5) * 1.3 + (MG.hash(seed * 7 + i, 100 + boil) - 0.5) * 0.7;
        const jy = (MG.hash(seed * 13 + i, 2) - 0.5) * 1.3 + (MG.hash(seed * 13 + i, 200 + boil) - 0.5) * 0.7;
        return [x + jx * amp, y + jy * amp];
      });

    function paint(pts, o, closed) {
      const seed = o.seed ?? auto++;
      const amp = o.wob ?? pen.wob;
      const rs = resample(pts, o.step ?? 26);
      let q = wobble(rs, seed, amp);
      const corners = o.sharp ? rs.corners : null;
      if (closed && q.length > 1) q.pop();
      const p = o.p ?? 1;
      if (p <= 0) return q;
      ctx.save();
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (closed && o.fill && p >= (o.fillAt ?? 0.999)) {
        trace(ctx, q, true, corners);
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.color !== null) {
        const part = p < 1 ? cut(closed ? q.concat([q[0]]) : q, p) : q;
        trace(ctx, part, closed && p >= 1, corners);
        ctx.strokeStyle = o.color || SK.INK;
        ctx.lineWidth = o.w ?? 4;
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
      return q;
    }

    pen.line = (x1, y1, x2, y2, o = {}) => paint([[x1, y1], [x2, y2]], o, false);
    /* poly keeps its vertices sharp; pass sharp: false for a soft, rounded-off outline */
    pen.poly = (pts, o = {}) => paint(pts, { sharp: true, ...o }, !!o.closed);
    pen.curve = (cp, o = {}) => paint(spline(cp, !!o.closed), { step: 18, ...o }, !!o.closed);
    pen.rect = (x, y, w, h, o = {}) => {
      const r = Math.min(o.r ?? 0, w / 2, h / 2);
      let pts;
      if (r > 0) {
        const arc = (cx, cy, a0) => [0, 1, 2, 3].map((k) => [cx + r * Math.cos(a0 + (k * Math.PI) / 6), cy + r * Math.sin(a0 + (k * Math.PI) / 6)]);
        pts = [...arc(x + w - r, y + r, -Math.PI / 2), ...arc(x + w - r, y + h - r, 0), ...arc(x + r, y + h - r, Math.PI / 2), ...arc(x + r, y + r, Math.PI)];
      } else pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      pts.push(pts[0]);
      return paint(pts, { sharp: r === 0, ...o }, true);
    };
    pen.ellipse = (cx, cy, rx, ry, o = {}) => {
      const n = Math.max(10, Math.round((rx + ry) / 9));
      const a0 = o.start ?? -2.2;
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push([cx + rx * Math.cos(a0 + (i / n) * Math.PI * 2), cy + ry * Math.sin(a0 + (i / n) * Math.PI * 2)]);
      return paint(pts, { step: 999, ...o }, true);
    };
    pen.circle = (cx, cy, r, o = {}) => pen.ellipse(cx, cy, r, r, o);

    /* hatch(polygon, { angle, gap, color, w }) — parallel scribble clipped to a polygon (pass the points a closed shape method returned, or 4 corners). */
    pen.hatch = (poly, o = {}) => {
      const seed = o.seed ?? auto++;
      const p = o.p ?? 1;
      if (p <= 0) return;
      const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const ang = ((o.angle ?? -45) * Math.PI) / 180, gap = o.gap ?? 9;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
      ctx.save();
      trace(ctx, poly, true);
      ctx.clip();
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.strokeStyle = o.color || SK.RED;
      ctx.lineWidth = o.w ?? 2.2;
      ctx.lineCap = 'round';
      const n = Math.floor((2 * R) / gap), upto = Math.floor(n * p);
      for (let i = 0; i <= upto; i++) {
        const d = -R + i * gap + (MG.hash(seed, i) - 0.5) * gap * 0.5;
        const ox = cx + Math.cos(ang + Math.PI / 2) * d, oy = cy + Math.sin(ang + Math.PI / 2) * d;
        const a = [ox - Math.cos(ang) * R, oy - Math.sin(ang) * R], b = [ox + Math.cos(ang) * R, oy + Math.sin(ang) * R];
        trace(ctx, wobble(resample([a, b], 40), seed * 31 + i, 1.4), false);
        ctx.stroke();
      }
      ctx.restore();
    };

    /* text(str, x, y, { size, weight, color, align, rot, p, font, hl }) — handwriting. p types it on; hl paints a highlighter bar behind it (hl is the bar's own 0..1 progress). */
    pen.text = (str, x, y, o = {}) => {
      const s = MG.typed(str, o.p ?? 1);
      ctx.save();
      ctx.translate(x, y);
      if (o.rot) ctx.rotate((o.rot * Math.PI) / 180);
      ctx.font = `${o.weight ?? 700} ${o.size ?? 48}px ${o.font || SK.FONT}`;
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.baseline || 'middle';
      const baseAlpha = ctx.globalAlpha * (o.alpha ?? 1);   // multiply, so pen.with({ alpha }) fades text too
      ctx.globalAlpha = baseAlpha;
      if (o.hl) {
        const full = ctx.measureText(str).width, h = (o.size ?? 48) * 0.62;
        const left = ctx.textAlign === 'center' ? -full / 2 : ctx.textAlign === 'right' ? -full : 0;
        ctx.fillStyle = o.hlColor || SK.YELLOW;
        ctx.globalAlpha = 0.85 * baseAlpha;
        ctx.fillRect(left - 6, -h * 0.35, (full + 12) * MG.clamp(o.hl), h);
        ctx.globalAlpha = baseAlpha;
      }
      ctx.fillStyle = o.color || SK.INK;
      if (ctx.textAlign !== 'left' && s !== str) {
        // keep typed-on text anchored where the finished text will sit
        const full = ctx.measureText(str).width;
        ctx.textAlign = 'left';
        ctx.fillText(s, o.align === 'center' ? -full / 2 : -full, 0);
      } else ctx.fillText(s, 0, 0);
      ctx.restore();
    };

    pen.star = (cx, cy, r, o = {}) => {
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5 + (o.rot ?? 0);
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return paint(pts, { color: SK.GREY, w: 2.5, step: 999, wob: 1.5, sharp: true, ...o }, false);
    };

    /* arrow(points, o) — a curve with a two-stroke head at its end; the head appears as the draw-on finishes. */
    pen.arrow = (cp, o = {}) => {
      const pts = cp.length > 2 ? spline(cp, false) : cp;
      paint(pts, { step: 18, ...o }, false);
      if ((o.p ?? 1) < 0.95) return;
      const b = pts[pts.length - 1], a = pts[Math.max(0, pts.length - 4)];
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = o.head ?? 18;
      for (const s of [-1, 1]) pen.line(b[0], b[1], b[0] - L * Math.cos(ang + s * 0.5), b[1] - L * Math.sin(ang + s * 0.5), { ...o, p: 1, seed: (o.seed ?? 0) + 50 + s, dash: null });
    };

    /* with(x, y, { rot, scale, alpha }, fn) — draw fn() in a moved/rotated frame. */
    pen.with = (x, y, o, fn) => {
      ctx.save();
      ctx.translate(x, y);
      if (o.rot) ctx.rotate((o.rot * Math.PI) / 180);
      if (o.scale != null) ctx.scale(o.scale, o.scaleY ?? o.scale);
      if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      fn();
      ctx.restore();
    };
    return pen;
  };

  /* ---------- paper ---------- */
  const paperCache = {};
  /* paper(ctx, { spiral, tone }) — cream paper with a warm vignette, a faint dot grid, grain and a couple of compass ghosts. spiral adds the notebook binding along the top edge. Painted once per option set and blitted. view = { z, cx, cy } scales the sheet about a point, so a camera pull-back can bring the binding into frame. */
  SK.paper = (ctx, o = {}, view = null) => {
    const key = JSON.stringify(o);
    if (!paperCache[key]) {
      const c = document.createElement('canvas');
      c.width = MG.W; c.height = MG.H;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(1050, 420, 120, 960, 540, 1250);
      gr.addColorStop(0, o.light || '#f3eddc');
      gr.addColorStop(0.6, o.mid || '#ece5d2');
      gr.addColorStop(1, o.dark || '#d6cbb6');
      x.fillStyle = gr;
      x.fillRect(0, 0, MG.W, MG.H);
      const r = MG.rng(o.seed ?? 7);
      x.fillStyle = 'rgba(110,100,84,0.20)';
      for (let gy = 30; gy < MG.H; gy += 60) for (let gx = 30; gx < MG.W; gx += 60) x.fillRect(gx, gy, 2, 2);
      for (let i = 0; i < 9000; i++) {
        x.fillStyle = r() < 0.5 ? 'rgba(90,80,60,0.035)' : 'rgba(255,255,250,0.05)';
        x.fillRect(r() * MG.W, r() * MG.H, 1 + r() * 2, 1 + r() * 2);
      }
      x.strokeStyle = 'rgba(120,105,85,0.10)';
      x.lineWidth = 2;
      for (const [cx, cy, rad] of [[1890, 880, 130], [1920, 900, 190], [60, 880, 150]]) { x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.stroke(); }
      const sm = x.createRadialGradient(240, 830, 10, 240, 830, 260);
      sm.addColorStop(0, 'rgba(120,110,95,0.10)');
      sm.addColorStop(1, 'rgba(120,110,95,0)');
      x.fillStyle = sm;
      x.fillRect(0, 560, 520, 520);
      if (o.spiral) {
        for (let sx = 22; sx < MG.W; sx += 40) {
          x.strokeStyle = '#4a443c'; x.lineWidth = 3; x.lineCap = 'round';
          x.beginPath(); x.moveTo(sx + 2, 0); x.lineTo(sx, 15); x.stroke();
          x.fillStyle = '#3a352f';
          x.beginPath(); x.arc(sx, 17, 5, 0, 7); x.fill();
        }
      }
      paperCache[key] = c;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    const z = view ? view.z : 1;
    if (view) ctx.setTransform(z, 0, 0, z, view.cx - view.cx * z, view.cy - view.cy * z);
    ctx.drawImage(paperCache[key], 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  /* ground(pen, y) — the long pencil floor line most notebook scenes stand on. */
  SK.ground = (pen, y, o = {}) => pen.line(o.x1 ?? -20, y, o.x2 ?? MG.W + 20, y + (o.tilt ?? -6), { color: SK.GREY, w: 2.5, seed: 9001, wob: 2.2, step: 60, ...o });

  /* ---------- figures ---------- */
  const ARMS = {
    down: { e: [78, -250], h: [66, -168] },
    hips: { e: [92, -238], h: [56, -196] },
    point: { e: [96, -292], h: [176, -318] },
    up: { e: [104, -372], h: [86, -452] },
    hold: { e: [70, -236], h: [104, -206] },
    chin: { e: [70, -262], h: [30, -330] },
  };
  /* man(pen, x, groundY, { s, seed, face, armL, armR, stride, flip, sweat, hair, fill, look }) — the stick figure: round head with spiky hair, boxy torso, two-segment limbs with open circles for hands. Arms take a preset name from ARMS or { e: [dx, dy], h: [dx, dy] } measured from the feet centre at scale 1. stride (−1..1) spreads the legs for a walk cycle. */
  SK.ARMS = ARMS;
  SK.man = (pen, x, gy, o = {}) => {
    const s = o.s ?? 1, seed = o.seed ?? 500, f = o.flip ? -1 : 1;
    const P = (dx, dy) => [x + dx * s * f, gy + dy * s];
    const lw = (o.w ?? 4.5) * Math.max(0.7, s);
    const ink = { w: lw, color: o.color || SK.INK, alpha: o.alpha };
    const arm = (side, def, sd) => {
      const a = typeof def === 'string' ? ARMS[def] : def;
      const sh = P(side * 44, -322), e = P(side * a.e[0], a.e[1]), h = P(side * a.h[0], a.h[1]);
      pen.poly([sh, e, h], { ...ink, seed: seed + sd, step: 40 });
      pen.circle(h[0], h[1], 11 * s, { ...ink, w: lw * 0.8, fill: SK.WHITE, seed: seed + sd + 1 });
      return h;
    };
    const st = o.stride ?? 0;
    for (const side of [-1, 1]) {
      const k = side * st;
      const hip = P(side * 20, -168), knee = P(side * 34 + k * 26, -86), foot = P(side * 36 + k * 62, -Math.max(0, -k) * 14);
      pen.poly([hip, knee, foot, [foot[0] + 30 * s * f * (st ? 1 : side), foot[1]]], { ...ink, seed: seed + 10 + side, step: 50 });
    }
    const body = pen.rect(x - 47 * s, gy - 332 * s, 94 * s, 166 * s, { ...ink, r: 12 * s, fill: o.fill || SK.WHITE, seed: seed + 20 });
    if (o.hatch !== false) pen.hatch([P(-47, -230), P(47, -260), P(47, -166), P(-47, -166)].map((q) => q), { color: o.hatchColor || 'rgba(90,84,74,0.45)', gap: 8 * s, w: 1.6, seed: seed + 21, angle: -50, alpha: o.alpha });
    const handL = arm(-1, o.armL || 'down', 30), handR = arm(1, o.armR || 'down', 40);
    const hc = P(0, -392), r = 52 * s;
    if (o.hair !== false) for (let i = 0; i < 8; i++) {
      const a = -Math.PI * 0.94 + (i / 7) * Math.PI * 0.86;
      pen.line(hc[0] + Math.cos(a) * r * 0.92, hc[1] + Math.sin(a) * r * 0.92, hc[0] + Math.cos(a) * r * 1.3, hc[1] + Math.sin(a) * r * 1.3, { ...ink, w: lw * 0.85, seed: seed + 50 + i, wob: 1 });
    }
    pen.circle(hc[0] - r * 1.02 * f, hc[1] + 6 * s, 9 * s, { ...ink, w: lw * 0.7, seed: seed + 60 });
    pen.circle(hc[0] + r * 1.02 * f, hc[1] + 6 * s, 9 * s, { ...ink, w: lw * 0.7, seed: seed + 61 });
    pen.circle(hc[0], hc[1], r, { ...ink, fill: SK.WHITE, seed: seed + 62 });
    const look = (o.look ?? 0) * 8 * s * f, c = pen.ctx;
    c.save();
    c.globalAlpha *= o.alpha ?? 1;
    c.fillStyle = c.strokeStyle = o.color || SK.INK;
    c.lineWidth = lw * 0.75; c.lineCap = 'round';
    for (const side of [-1, 1]) { c.beginPath(); c.arc(hc[0] + side * 17 * s + look, hc[1] + 2 * s, 5 * s, 0, 7); c.fill(); }
    const face = o.face || 'neutral', my = hc[1] + 24 * s, mx = hc[0] + look;
    c.beginPath();
    if (face === 'happy') c.arc(mx, my - 6 * s, 15 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (face === 'worried') c.arc(mx, my + 10 * s, 13 * s, 1.2 * Math.PI, 1.8 * Math.PI);
    else { c.moveTo(mx - 10 * s, my); c.lineTo(mx + 10 * s, my - (face === 'angry' ? 0 : 1)); }
    c.stroke();
    if (face === 'angry') for (const side of [-1, 1]) { c.beginPath(); c.moveTo(hc[0] + side * 30 * s + look, hc[1] - 20 * s); c.lineTo(hc[0] + side * 8 * s + look, hc[1] - 10 * s); c.stroke(); }
    c.restore();
    if (o.sweat) for (const [dx, dy, k] of [[-70, -12, 0], [-58, -40, 1]]) {
      const q = P(dx, -392 + dy);
      pen.poly([[q[0], q[1] - 12 * s], [q[0] + 8 * s, q[1] + 6 * s], [q[0], q[1] + 12 * s], [q[0] - 8 * s, q[1] + 6 * s], [q[0], q[1] - 12 * s]], { color: SK.GREY, w: 2.2, seed: seed + 70 + k, step: 99, wob: 0.8, alpha: (o.sweat === true ? 1 : o.sweat) * (o.alpha ?? 1) });
    }
    return { head: hc, handL, handR, top: gy - (392 + 52 * 1.3) * s };
  };

  /* robot(pen, x, groundY, { s, seed, face, armL, armR, fill, badge, flip }) — the "AI" character: rounded square head with headphones, dot eyes, a torso carrying a badge. Same arm presets as man(). */
  SK.robot = (pen, x, gy, o = {}) => {
    const s = o.s ?? 1, seed = o.seed ?? 700, f = o.flip ? -1 : 1;
    const P = (dx, dy) => [x + dx * s * f, gy + dy * s];
    const lw = (o.w ?? 4.5) * Math.max(0.7, s);
    const ink = { w: lw, color: SK.INK, alpha: o.alpha };
    for (const side of [-1, 1]) pen.poly([P(side * 22, -150), P(side * 30, -70), P(side * 30, 0), P(side * 58, 0)], { ...ink, seed: seed + side + 5, step: 50 });
    const arm = (side, def, sd) => {
      const a = typeof def === 'string' ? ARMS[def] : def;
      const sh = P(side * 50, -300), e = P(side * (a.e[0] + 6), a.e[1] + 14), h = P(side * (a.h[0] + 6), a.h[1] + 14);
      pen.poly([sh, e, h], { ...ink, seed: seed + sd, step: 40 });
      pen.circle(h[0], h[1], 12 * s, { ...ink, w: lw * 0.8, fill: SK.WHITE, seed: seed + sd + 1 });
      return h;
    };
    const handL = arm(-1, o.armL || 'down', 30), handR = arm(1, o.armR || 'down', 40);
    pen.rect(x - 56 * s, gy - 310 * s, 112 * s, 164 * s, { ...ink, r: 22 * s, fill: o.fill || SK.WHITE, seed: seed + 20 });
    if (o.badge !== false) {
      pen.rect(x - 30 * s, gy - 262 * s, 60 * s, 40 * s, { ...ink, w: lw * 0.7, r: 6 * s, fill: o.badgeFill || '#f3c96a', seed: seed + 22 });
      pen.text(o.badge || 'AI', x, gy - 241 * s, { size: 32 * s, align: 'center', alpha: o.alpha });
    }
    pen.line(x, gy - 332 * s, x, gy - 312 * s, { ...ink, seed: seed + 24 });
    const hy = gy - 400 * s;
    for (const side of [-1, 1]) pen.rect(x + side * 72 * s - 11 * s, hy - 22 * s, 22 * s, 46 * s, { ...ink, r: 8 * s, fill: SK.INK, seed: seed + 26 + side });
    pen.curve([[x - 72 * s, hy - 20 * s], [x - 50 * s, hy - 78 * s], [x, hy - 92 * s], [x + 50 * s, hy - 78 * s], [x + 72 * s, hy - 20 * s]], { ...ink, seed: seed + 29 });
    pen.rect(x - 66 * s, hy - 62 * s, 132 * s, 118 * s, { ...ink, r: 30 * s, fill: o.headFill || SK.WHITE, seed: seed + 30 });
    const c = pen.ctx, look = (o.look ?? 0) * 8 * s * f;
    c.save();
    c.globalAlpha *= o.alpha ?? 1;
    c.fillStyle = c.strokeStyle = SK.INK; c.lineWidth = lw * 0.75; c.lineCap = 'round';
    for (const side of [-1, 1]) { c.beginPath(); c.ellipse(x + side * 24 * s + look, hy - 10 * s, 6 * s, 9 * s, 0, 0, 7); c.fill(); }
    c.beginPath();
    const face = o.face || 'neutral';
    if (face === 'happy') c.arc(x + look, hy + 10 * s, 16 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (face === 'worried') c.arc(x + look, hy + 34 * s, 13 * s, 1.2 * Math.PI, 1.8 * Math.PI);
    else { c.moveTo(x - 11 * s + look, hy + 22 * s); c.lineTo(x + 11 * s + look, hy + 22 * s); }
    c.stroke();
    c.restore();
    return { head: [x, hy], handL, handR, top: hy - 92 * s };
  };

  /* pencil(pen, x, y, { rot, s }) — the yellow pencil whose tip sits at (x, y). rot 0 points the tip down-left, the way a right hand holds it. */
  SK.pencil = (pen, x, y, o = {}) => {
    pen.with(x, y, { rot: (o.rot ?? 0) - 38, scale: o.s ?? 1, alpha: o.alpha }, () => {
      const sd = o.seed ?? 8800, L = 250, hw = 15;
      pen.poly([[0, 0], [34, -hw], [34, hw], [0, 0]], { closed: true, fill: '#f1dcae', w: 3, seed: sd, step: 99 });
      pen.poly([[0, 0], [12, -5], [12, 5], [0, 0]], { closed: true, fill: SK.INK, w: 2, seed: sd + 1, step: 99 });
      pen.rect(34, -hw, L - 64, hw * 2, { fill: '#f2c230', w: 3, seed: sd + 2 });
      pen.line(40, 0, L - 36, 0, { color: '#c99a1c', w: 2, seed: sd + 3 });
      pen.rect(L - 30, -hw, 16, hw * 2, { fill: '#c9c4b8', w: 3, seed: sd + 4 });
      pen.rect(L - 14, -hw, 30, hw * 2, { fill: '#ee8fa0', w: 3, r: 6, seed: sd + 5 });
    });
  };

  /* tag(pen, x, y, label, { w, h, rot, fill, color, size, hole }) — the paper price tag: a box with a clipped left end, a punched hole and a string tail. (x, y) is its centre. */
  SK.tag = (pen, x, y, label, o = {}) => {
    const w = o.w ?? 230, h = o.h ?? 84, c = h * 0.32;
    pen.with(x, y, { rot: o.rot ?? 0, scale: o.scale, alpha: o.alpha }, () => {
      const col = o.color || SK.INK, lw = o.lw ?? 4;
      if (o.string !== false) pen.curve([[-w / 2 + 16, 0], [-w / 2 - 12, -8], [-w / 2 - 30, 6], [-w / 2 - 54, -12]], { color: SK.GREY, w: 2, seed: (o.seed ?? 0) + 3 });
      pen.poly([[-w / 2 + c, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + c, h / 2], [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c], [-w / 2 + c, -h / 2]], { closed: true, fill: o.fill || SK.WHITE, color: col, w: lw, seed: (o.seed ?? 0) + 1, step: 60 });
      pen.circle(-w / 2 + c + 6, 0, o.hole ?? 9, { color: col, w: lw * 0.7, fill: o.holeFill || '#efe9d8', seed: (o.seed ?? 0) + 2 });
      if (o.ring) pen.circle(-w / 2 + c + 56, 0, 22, { color: col, w: lw * 0.7, seed: (o.seed ?? 0) + 4 });
      pen.text(label, o.ring ? 44 : c * 0.6 + 8, 2, { size: o.size ?? 44, align: 'center', color: o.textColor || col });
    });
  };
})(window);
