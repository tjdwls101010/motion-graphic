/* figure.js — a jointed side-view person in the look of the IBM spots: long legs, a small head in profile, flat garment shapes with an ink outline, graphite only where a limb leaves a garment. A scene gives joint targets (hip, ankles, wrists) in stage px and the rig solves knees and elbows, so a pose is a handful of numbers that can be keyed, mixed and held on twos. Proportions were measured on the reference's wide acting shots and the production stills (../STYLE.md "인물 리그"). Also here: the thin legs of objects that walk (IB.peg), speech bubbles (IB.bubble) and shake marks (IB.shake). Needs ink.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp, clamp } = MG;

  /* Proportions as fractions of the figure's height h (floor to crown, hair not counted). A standing figure is 7.5-8 heads tall and its legs are 57% of it. */
  const F = (IB.FIG = {
    ankle: 0.05, shin: 0.255, thigh: 0.265, torso: 0.235, neck: 0.078, head: 0.062,   // head: profile radius; neck: shoulder joint to head centre
    upper: 0.15, fore: 0.14,
    thighW: 0.1, kneeW: 0.074, cuffW: 0.058, calfW: 0.044,       // trouser widths hip / knee / hem; bare shin
    sleeveW: 0.074, armW: 0.042, wristW: 0.03, cuffArmW: 0.05,   // tee sleeve; bare arm at elbow / wrist; long sleeve at wrist
  });
  /* Outline width for a figure h px tall: 2.7 px at the 250 px of a wide shot, 4 px at 630 px, 6-7 px for a medium shot where the figure is taller than the screen (STYLE.md "선 굵기는 샷 크기를 따른다"). */
  IB.figLine = (h) => 1.8 + h / 280;

  /* Two-bone IK: the middle joint of a limb from A that tries to reach T with bones a and b. `bend` (+1 / -1) picks the side the joint folds to. Returns [joint, end]; the end is pulled in if T is out of reach, and pushed out (straight down when T sits on A itself) if it is closer than the bones can fold. */
  function ik(A, T, a, b, bend) {
    const dx = T[0] - A[0], dy = T[1] - A[1], D = Math.hypot(dx, dy) || 1e-6, d = clamp(D, Math.abs(a - b) + 0.5, a + b - 0.5);
    const ux = D > 1e-3 ? dx / D : 0, uy = D > 1e-3 ? dy / D : 1, k = (a * a + d * d - b * b) / (2 * d), hgt = Math.sqrt(Math.max(0, a * a - k * k));
    return [[A[0] + ux * k - uy * hgt * bend, A[1] + uy * k + ux * hgt * bend], [A[0] + ux * d, A[1] + uy * d]];
  }
  IB.ik = ik;

  /* limb(ctx, joints, widths, opts) — a tapered garment or skin shape along 2 or 3 joints: filled whole, inked along its two sides only, so the root melts into the body it leaves instead of being closed by a line. cap: 'end' draws the hem across the far end (a sleeve, a trouser leg), 'none' leaves it open (skin running on into a hand or a shoe). */
  function limb(ctx, joints, widths, o) {
    const { fill, lw, seed = 1, cap = 'none' } = o;
    // a point halfway along each bone keeps the bones straight and lets only the joint round off
    const pts = [], ws = [];
    joints.forEach((p, i) => {
      if (i) { const q = joints[i - 1]; pts.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); ws.push((widths[i] + widths[i - 1]) / 2); }
      pts.push(p); ws.push(widths[i]);
    });
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d;
      L.push([pts[i][0] + (nx * ws[i]) / 2, pts[i][1] + (ny * ws[i]) / 2]);
      R.push([pts[i][0] - (nx * ws[i]) / 2, pts[i][1] - (ny * ws[i]) / 2]);
    }
    IB.ink(ctx, L.concat(R.slice().reverse()), { closed: true, fill, w: 0, seed, wob: 0.3 });
    if (o.shade) {   // graphite where the limb comes out from under a garment: densest at the root, gone within `shade` px
      const a = joints[0], b = joints[1];
      ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
      IB.shade(ctx, 0, -widths[0] / 2 + 1, o.shade, widths[0] - 2, { from: 'left', seed: seed + 5, alpha: 0.5 });
      ctx.restore();
    }
    IB.ink(ctx, L, { w: lw, seed: seed + 1, wob: 0.4, taper: false });
    IB.ink(ctx, R, { w: lw, seed: seed + 2, wob: 0.4, taper: false });
    if (cap === 'end') IB.ink(ctx, [L[n - 1], R[n - 1]], { w: lw, smooth: false, seed: seed + 3, taper: false });
  }
  IB.limb = limb;

  /* A sneaker in profile, toe toward dir, turned about the ankle by `pitch` (rad, + = toe down). Upper in the shoe colour over a white sole. */
  function shoe(ctx, ankle, pitch, dir, h, color, lw, seed) {
    ctx.save();
    ctx.translate(ankle[0], ankle[1]);
    ctx.rotate(pitch * dir);
    const k = (x, y) => [x * h * dir, y * h];
    IB.ink(ctx, [k(-0.042, -0.012), k(0.012, -0.022), k(0.05, 0.004), k(0.1, 0.02), k(0.128, 0.036), k(0.124, 0.05), k(-0.046, 0.05), k(-0.05, 0.02)], { closed: true, fill: color, w: lw, seed, wob: 0.4 });
    IB.ink(ctx, [k(-0.048, 0.036), k(0.04, 0.037), k(0.126, 0.037)], { w: lw * 0.75, seed: seed + 1, color: color === C.ink || color === C.charcoal || color === C.navy ? C.paper : C.ink, taper: false });
    ctx.restore();
  }

  /* footLift(pitch, h) — how far to raise the ankle of a pitched foot so the lowest point of its sole still touches the floor: the toe when the heel is up (pitch > 0), the heel when the toe is up. */
  IB.footLift = (pitch, h) => Math.max(0, (pitch > 0 ? 0.128 : -0.046) * Math.sin(pitch) + 0.05 * Math.cos(pitch) - 0.05) * h;

  /* A mitten hand at the wrist, pointing along `ang`: a palm oval and a thumb. `grip` closes it into a fist around whatever the scene drew first. */
  function hand(ctx, wrist, ang, h, skin, lw, seed, grip) {
    ctx.save();
    ctx.translate(wrist[0], wrist[1]);
    ctx.rotate(ang);
    const r = h * 0.021;
    if (grip) IB.oval(ctx, r * 0.7, 0, r * 1.05, r * 1.05, { fill: skin, w: lw, seed, n: 9 });
    else {
      IB.ink(ctx, [[-r * 0.4, -r * 0.8], [r * 1.2, -r * 0.95], [r * 2.3, -r * 0.45], [r * 2.4, r * 0.4], [r * 1.1, r * 0.95], [-r * 0.4, r * 0.8]], { closed: true, fill: skin, w: lw, seed });
      IB.ink(ctx, [[r * 0.3, -r * 0.8], [r * 1.0, -r * 1.7], [r * 1.5, -r * 0.9]], { w: lw * 0.8, seed: seed + 1 });
    }
    ctx.restore();
  }

  /* Hair and headgear, in head units (the profile's radius is 21) facing +x. */
  function hairBack(ctx, look, lw, seed) {
    const hair = look.hair || 'short', col = look.hairColor || C.ink;
    if (hair === 'curly') {
      // a mass of curls down to the shoulders: a blob whose outline scallops in and out
      const pts = [];
      for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, bump = i % 2 ? 1.0 : 0.88; pts.push([-13 + Math.cos(a) * 27 * bump, 8 + Math.sin(a) * 40 * bump]); }
      IB.ink(ctx, pts, { closed: true, fill: col, w: lw, color: col === C.ink ? C.ink : C.ink, seed });
    }
    if (hair === 'bun') IB.oval(ctx, -23, -22, 12, 11, { fill: col, w: lw, seed: seed + 1, n: 9 });
    if (hair === 'pony') IB.ink(ctx, [[-18, -8], [-34, -6], [-44, 6], [-40, 24], [-30, 14], [-22, 4]], { closed: true, fill: col, w: lw, seed: seed + 1 });
  }
  function hairFront(ctx, look, lw, seed) {
    const hair = look.hair || 'short', col = look.hairColor || C.ink;
    if (hair === 'bald') return;
    if (hair === 'cap') {
      const dome = IB.ellipse(-3, -5, 23, 22, 9, Math.PI * 0.97, Math.PI * 2.02);
      IB.ink(ctx, [[-20, 12], [-23, -2], [-12, 0], [-8, 12]], { closed: true, fill: col, w: lw * 0.8, seed: seed + 4 });   // hair under the cap
      if (look.tail) IB.ink(ctx, [[-20, 2], [-33, 2], [-39, 12], [-33, 22], [-24, 14]], { closed: true, fill: col, w: lw * 0.8, seed: seed + 5 });
      IB.ink(ctx, look.brim === 'back' ? [[-24, 0], [-47, 3], [-45, -3]].concat(dome, [[20, -2]]) : dome.concat([[42, -3], [21, -1]]), { closed: true, fill: look.hat || C.paper, w: lw, seed: seed + 2 });
      return;
    }
    // the cap of hair every other style shares: from the forehead over the crown to the nape
    const top = hair === 'curly' ? [[13, -16], [8, -27], [-6, -31], [-20, -24], [-27, -10], [-24, 8], [-12, 2], [-5, -11]] : [[12, -17], [-2, -26], [-22, -15], [-23, 9], [-11, 3], [-5, -11]];
    IB.ink(ctx, top, { closed: true, fill: col, w: lw, seed: seed + 3 });
  }

  /* The head in profile: skull, nose and chin as one shape, an eye, a mouth. face: { eye: 'dot' | 'closed' | 'wide' | 'shades', mouth: 'smile' | 'flat' | 'open' | 'frown', brow: -1..1 } */
  function head(ctx, at, ang, dir, h, look, lw, seed) {
    const s = (F.head * h) / 21, face = look.face || {};
    ctx.save();
    ctx.translate(at[0], at[1]);
    ctx.rotate(ang * dir);
    ctx.scale(s * dir, s);
    const w = lw / s;
    hairBack(ctx, look, w, seed + 20);
    IB.ink(ctx, [[-2, -21], [14, -15], [19, -3], [27, 3], [19, 7], [16, 17], [2, 22], [-15, 14], [-20, -4]], { closed: true, fill: look.skin, w, seed });
    IB.ink(ctx, [[-9, -2], [-13, 3], [-8, 7]], { w: w * 0.7, seed: seed + 1 });   // ear
    hairFront(ctx, look, w, seed + 30);
    if (look.phones) {   // headphones: a band over the crown and a cup on the ear
      IB.tube(ctx, [[-4, -29], [-9, -14], [-9, -2]], { w: 7.5, edge: w * 0.8, fill: C.paper, seed: seed + 40 });
      IB.oval(ctx, -9, 3, 8.5, 11, { fill: C.paper, w, seed: seed + 41, n: 10 });
      IB.oval(ctx, -9, 3, 4.5, 6.5, { w: w * 0.6, seed: seed + 42, n: 8 });
    }
    ctx.fillStyle = C.ink;
    if (face.eye === 'shades') { IB.ink(ctx, [[5, -9], [19, -8], [19, -2], [14, 0], [7, -1]], { closed: true, fill: C.ink, w: w * 0.5, seed: seed + 2 }); IB.seg(ctx, 5, -7, -6, -5, { w: w * 0.6, seed: seed + 5 }); }
    else if (face.eye === 'closed') IB.ink(ctx, [[8, -4], [12, -2], [16, -4]], { w: w * 0.8, seed: seed + 2 });
    else if (face.eye === 'wide') { IB.oval(ctx, 12, -4, 4.6, 4.6, { fill: C.paper, w: w * 0.6, seed: seed + 2, n: 8 }); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(13, -4, 1.9, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(12, -4, 2.1, 0, 7); ctx.fill(); }
    if (face.brow != null) IB.ink(ctx, [[7, -10 - face.brow * 1.5], [16, -10 + face.brow * 2.5]], { w: w * 0.8, smooth: false, seed: seed + 3 });
    const m = face.mouth || 'smile';
    if (m === 'open') IB.oval(ctx, 14, 12, 3.2, 3.8, { fill: C.ink, w: 0, n: 8 });
    else IB.ink(ctx, m === 'flat' ? [[9, 11], [17, 11]] : m === 'frown' ? [[9, 13], [13, 10], [17, 12]] : [[9, 9], [13, 12], [18, 9]], { w: w * 0.8, seed: seed + 4 });
    ctx.restore();
  }

  /* figure(ctx, pose, look) — draw one person.
     pose  { hip: [x, y], lean, nod, feet: [[x, y, pitch], [x, y, pitch]], hands: [[x, y], [x, y]], knee: [1, 1], elbow: [1, 1], grip: [false, false] }
           hip is the pelvis joint; feet are ankles and hands are wrists, far side first, all in stage px. lean tips the spine forward (rad), nod tips the head further. knee / elbow flip a joint's fold (-1) for the rare pose that needs it. Start from IB.stand() and move what the pose changes.
     look  { h, dir, skin, top, topKind: 'tee' | 'long', bottom, bottomKind: 'pants' | 'shorts', shoe, hair: 'short' | 'curly' | 'bun' | 'pony' | 'cap' | 'bald', hairColor, hat, brim: 'back', tail, phones, face, seed }
           h is the standing height in px, dir 1 faces right and -1 left. Colours are flat fills from IB.C; a white garment is IB.C.bg, as in the reference.
     Returns the solved joints { hip, sh, headAt, knees, elbows, feet, hands } so the scene can hang props on them (a bag strap on the shoulder, a tool in the hands). Pass `only: 'far' | 'near'` to draw the figure in two passes with a prop between its arms. */
  IB.figure = (ctx, pose, look, only) => {
    const h = look.h, d = look.dir || 1, lw = look.lw || IB.figLine(h), seed = look.seed || 1, skin = look.skin || C.skin[2];
    const top = look.top || C.bg, bottom = look.bottom || C.navy, tee = (look.topKind || 'tee') === 'tee', shorts = look.bottomKind === 'shorts';
    const lean = pose.lean || 0, sx = Math.sin(lean) * d, sy = -Math.cos(lean), fx = Math.cos(lean) * d, fy = Math.sin(lean);   // spine and forward unit vectors
    const hip = pose.hip, at = (u, f) => [hip[0] + sx * u * h + fx * f * h, hip[1] + sy * u * h + fy * f * h];
    const sh = at(F.torso - 0.012, 0.004), headAt = at(F.torso + F.neck, 0.016 + (pose.nod || 0) * 0.03);
    const knee = pose.knee || [1, 1], elbow = pose.elbow || [1, 1], grip = pose.grip || [false, false];
    const roots = [at(0, 0.024), at(0, -0.024)];   // the far leg leaves the pelvis a little ahead of the near one, which gives the trousers their width
    const legs = pose.feet.map((f, i) => { const [k, e] = ik(roots[i], f, F.thigh * h, F.shin * h, -d * knee[i]); return { k, e, pitch: f[2] || 0, root: roots[i] }; });
    const arms = pose.hands.map((w, i) => { const [el, e] = ik(sh, w, F.upper * h, F.fore * h, d * elbow[i]); return { el, e }; });

    const drawLeg = (i) => {
      const L = legs[i], sd = seed + 100 + i * 20;
      if (shorts) {
        const cut = [lerp(L.root[0], L.k[0], 0.62), lerp(L.root[1], L.k[1], 0.62)];
        limb(ctx, [cut, L.k, L.e], [F.calfW * h * 1.35, F.calfW * h * 1.15, F.calfW * h], { fill: skin, lw, seed: sd, shade: h * 0.05 });
        limb(ctx, [L.root, cut], [F.thighW * h * 1.05, F.thighW * h * 1.1], { fill: bottom, lw, seed: sd + 8, cap: 'end' });
      } else limb(ctx, [L.root, L.k, L.e], [F.thighW * h, F.kneeW * h, F.cuffW * h], { fill: bottom, lw, seed: sd, cap: 'end' });
      shoe(ctx, L.e, L.pitch, d, h, look.shoe || C.paper, lw, sd + 12);
    };
    const drawArm = (i) => {
      const A = arms[i], sd = seed + 200 + i * 20, ang = Math.atan2(A.e[1] - A.el[1], A.e[0] - A.el[0]);
      if (tee) {
        const cut = [lerp(sh[0], A.el[0], 0.58), lerp(sh[1], A.el[1], 0.58)];
        limb(ctx, [cut, A.el, A.e], [F.armW * h * 1.15, F.armW * h, F.wristW * h], { fill: skin, lw, seed: sd, shade: h * 0.04 });
        limb(ctx, [sh, cut], [F.sleeveW * h * 0.92, F.sleeveW * h], { fill: top, lw, seed: sd + 8, cap: 'end' });
      } else limb(ctx, [sh, A.el, A.e], [F.sleeveW * h * 0.9, F.armW * h * 1.25, F.cuffArmW * h], { fill: top, lw, seed: sd, cap: 'end' });
      hand(ctx, A.e, ang, h, skin, lw * 0.9, sd + 12, grip[i]);
    };

    if (only !== 'near') {
      drawArm(0);
      drawLeg(0);
      drawLeg(1);
      limb(ctx, [at(F.torso - 0.02, 0.012), headAt], [0.05 * h, 0.044 * h], { fill: skin, lw, seed: seed + 50 });   // neck, tucked under the collar and the jaw
      // torso: one garment shape from the shoulders to a hem below the hip joint (u along the spine, f forward)
      const hem = shorts || look.tuck ? -0.03 : -0.085;
      IB.ink(ctx, [at(F.torso + 0.012, -0.03), at(F.torso + 0.02, 0.012), at(F.torso - 0.03, 0.06), at(F.torso * 0.55, 0.082), at(0.03, 0.08), at(hem, 0.078), at(hem, 0.076), at(hem, -0.076), at(hem, -0.078), at(0.05, -0.078), at(F.torso * 0.7, -0.074), at(F.torso - 0.03, -0.06)], { closed: true, fill: top, w: lw, seed: seed + 60, wob: 0.5 });
      head(ctx, headAt, lean * 0.5 + (pose.nod || 0), d, h, { ...look, skin }, lw, seed + 70);
    }
    if (only !== 'far') drawArm(1);
    return { hip, sh, headAt, knees: legs.map((l) => l.k), elbows: arms.map((a) => a.el), feet: legs.map((l) => l.e), hands: arms.map((a) => a.e) };
  };

  /* stand(x, floor, look) — the neutral pose of a figure standing at x on the floor line: feet together, arms hanging. Every other pose is this with a few joints moved. */
  IB.stand = (x, floor, look) => {
    const h = look.h, d = look.dir || 1, hy = floor - (F.ankle + F.shin + F.thigh) * h + 0.004 * h;
    return {
      hip: [x, hy], lean: 0, nod: 0,
      feet: [[x + 0.04 * h * d, floor - F.ankle * h, 0], [x - 0.036 * h * d, floor - F.ankle * h, 0]],
      hands: [[x + 0.03 * h * d, hy + 0.062 * h], [x - 0.012 * h * d, hy + 0.064 * h]],
    };
  };

  /* poseMix(a, b, u) — the pose a fraction u of the way from a to b, joint by joint. For the one or two in-betweens of a move; a held pose is just a (the reference holds its poses dead still). */
  IB.poseMix = (a, b, u) => {
    const mixPts = (p, q) => p.map((v, i) => v.map((c, j) => lerp(c, q[i][j] == null ? c : q[i][j], u)));
    return { ...(u < 0.5 ? a : b), hip: [lerp(a.hip[0], b.hip[0], u), lerp(a.hip[1], b.hip[1], u)], lean: lerp(a.lean || 0, b.lean || 0, u), nod: lerp(a.nod || 0, b.nod || 0, u), feet: mixPts(a.feet, b.feet), hands: mixPts(a.hands, b.hands) };
  };

  /* peg(ctx, hip, foot, opts) — the thin leg of an object that walks (the reference's folder and document): one narrow trouser leg, graphite where it leaves the body, a small boot. knee bows it sideways (px). The body is drawn after its legs and never deforms. */
  IB.peg = (ctx, hip, foot, o = {}) => {
    const { fill = '#d9d9d9', w = 13, lw = 2.8, seed = 1, knee = 0, dir = 1 } = o;
    const mid = [(hip[0] + foot[0]) / 2 + knee, (hip[1] + foot[1]) / 2];
    limb(ctx, knee ? [hip, mid, foot] : [hip, foot], knee ? [w, w, w * 0.92] : [w, w * 0.92], { fill, lw, seed, shade: 40 });
    IB.ink(ctx, [[foot[0] - 8 * dir, foot[1] - 5], [foot[0] + 8 * dir, foot[1] - 5], [foot[0] + 9 * dir, foot[1] + 2], [foot[0] + 17 * dir, foot[1] + 8], [foot[0] + 14 * dir, foot[1] + 12], [foot[0] - 9 * dir, foot[1] + 12]], { closed: true, smooth: false, fill: C.paper, w: lw * 0.93, seed: seed + 6 });
    IB.seg(ctx, foot[0] - 7 * dir, foot[1] + 2, foot[0] + 8 * dir, foot[1] + 2, { w: lw * 0.65, seed: seed + 7 });
  };

  /* bubble(ctx, lines, t, at, opts) — a speech bubble: a white shape with the same ink outline as everything else and a tail pointing at the speaker. The reference has no bubbles; this one follows its rules for drawn things and for copy: it never fades, it is drawn on twos, growing out of the tail tip in three drawings (55%, 88%, 100%), its words are there from the third drawing, then it holds dead still and leaves on a hard cut at `until`.
     tip    [x, y] where the tail ends, a little off the speaker's mouth
     x, y   centre of the bubble body. The body sizes itself to the words (px 40, weight 400, pad [36, 26]). */
  IB.bubble = (ctx, lines, t, at, o = {}) => {
    const { tip, x, y, px = 40, pad = [36, 26], until = Infinity, seed = 1, fill = C.paper, w = 3, weight = 400, color = C.ink } = o;
    if (t < at || t >= until) return;
    const k = [0.55, 0.88, 1][Math.min(2, Math.floor(IB.frame(t - at + 1e-6) / 2))];
    ctx.save();
    ctx.font = `${weight} ${px}px ${IB.FONT}`;
    const pitch = px * 1.28, bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) / 2 + pad[0], bh = (lines.length * pitch) / 2 + pad[1];
    ctx.translate(tip[0], tip[1]); ctx.scale(k, k); ctx.translate(-tip[0], -tip[1]);
    // body: a squarish oval; the tail leaves it on the side that faces the tip
    const on = (a) => { const c = Math.cos(a), sn = Math.sin(a); return [x + Math.sign(c) * Math.pow(Math.abs(c), 0.62) * bw, y + Math.sign(sn) * Math.pow(Math.abs(sn), 0.62) * bh]; };
    const body = []; for (let i = 0; i < 22; i++) body.push(on((i / 22) * Math.PI * 2));
    IB.ink(ctx, body, { closed: true, fill, w, seed, wob: 0.9 });
    const a = Math.atan2((tip[1] - y) / bh, (tip[0] - x) / bw), b1 = on(a - 0.2), b2 = on(a + 0.2), inset = (q) => [lerp(q[0], x, 0.12), lerp(q[1], y, 0.12)];
    IB.ink(ctx, [inset(b1), tip, inset(b2)], { closed: true, smooth: false, fill, w: 0, wob: 0 });
    IB.ink(ctx, [b1, tip], { w, smooth: false, seed: seed + 1, taper: false });
    IB.ink(ctx, [tip, b2], { w, smooth: false, seed: seed + 2, taper: false });
    if (k === 1) {
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      lines.forEach((l, i) => ctx.fillText(l, x, y - ((lines.length - 1) * pitch) / 2 + px * 0.36 + i * pitch));
    }
    ctx.restore();
  };

  /* shake(ctx, x, y, r, opts) — the two or three short arcs the reference draws beside something that trembles, swings or has just stopped. Centred on (x, y) at distance r, facing angle `a`; `n` arcs, each a little longer than the one inside it. Re-seed it per drawn frame to make it flicker, or leave it to hold. */
  IB.shake = (ctx, x, y, r, o = {}) => {
    const { a = 0, n = 2, w = 2.4, gap = 9, span = 0.42, seed = 1, color = C.ink } = o;
    for (let i = 0; i < n; i++) IB.ink(ctx, IB.ellipse(x, y, r + i * gap, r + i * gap, 5, a - span * (0.8 + i * 0.2), a + span * (0.8 + i * 0.2)), { w, seed: seed + i, color });
  };
})(window);
