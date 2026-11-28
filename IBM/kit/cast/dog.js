/* cast/dog.js — a dog in profile on a leash, drawn like the cats (cast/cat.js): a white coat with a 3 px ink outline, black floppy ears and nose, one coloured collar. It is a jointed rig like the figure's: a pose is a body position and tilt, a neck and head angle, a mouth, ears, a tail and four paws, so poses can be keyed in [frame, pose] tables, mixed (IB.dogMix) and held on twos, and a walk (IB.dogWalk) moves the paws so a planted one stays put. Needs ink.js and figure.js (IB.ik, IB.limb); adds to the global IB. New, not measured: the reference has no dog. Used by street/dog-walk-pull. */
(function (g) {
  const IB = g.IB, C = IB.C;
  const lerp = (a, b, u) => a + (b - a) * u;

  // the rig at s = 1, in px: a medium dog for a figure 330 px tall (shoulder 96 px off the floor, 150 px nose to rump)
  const SH = [50, -2], HIP = [-52, -4], NECK = [54, -22], TAIL = [-70, -20];   // joints on the torso, about its centre, x forward and y down
  const FRONT = [46, 48], BACK = [46, 46], NECK_LEN = 46, PAW = 6;             // bone lengths; the paw's centre is PAW above the floor

  /* dog(ctx, at, pose, opts) — draw the dog. `at` = [x, the floor line]; every number in the pose is in px at s = 1, x forward along the way it faces and y down, about `at`, so the same pose faces either way.
     pose { body: [x, y] the torso's centre (y about -96 standing), tilt (rad, + dips the chest), neck (rad up from forward, in stage terms: 1 looks ahead, 0.5 reaches forward, -1.2 is down at the floor), head (rad, + tips the nose down), mouth 0..1 (open: a bark, a pant), ear -1..1 (0 hanging, 1 pricked up, -1 blown flat back), eye 'dot' | 'wide' | 'closed', tail (rad up from straight back: 1.1 stiff and high, 0.2 level, -0.6 tucked), wag 0 | 1 (two drawings of a wag, swap them on twos; null for a still tail), sniff 0 | 1 (two little lines at the nose; null for none), fold [1, 1, 1, 1] (-1 folds that leg's joint the other way: the hind legs of a sitting dog, knee forward), feet [[x, y] far front, far back, near front, near back] the paws (y 0 on the floor) }.
     opts { s (scale, 1), dir (1 faces right), lw (3), coat (C.paper), ears (C.ink), collar (C.blue), seed }. The far legs are drawn first and a shade greyer; the legs' tops go under the torso.
     Returns, in stage px, { collar: where a leash clips on, nose, head, tail (its tip), feet }. POSE: stand, point (frozen, a front paw up), crouch (weight back before a lunge), pull, sniff, sit. MOVE: freeze, lunge, wag, sniffing, sitDown (frames from each one's first drawing). */
  IB.dog = (ctx, [ax, floor], p, o = {}) => {
    const { s = 1, dir: d = 1, lw = 3, coat = C.paper, ears = C.ink, collar = C.blue, seed = 600 } = o;
    const W = ([x, y]) => [ax + d * s * x, floor + s * y];   // pose units to stage px
    const tilt = p.tilt || 0, ct = Math.cos(tilt), st = Math.sin(tilt), [bx, by] = p.body;
    const T = ([x, y]) => [bx + x * ct - y * st, by + x * st + y * ct];   // torso-local to pose units
    const legs = (p.feet || IB.dog.POSE.stand.feet).map((f, i) => {
      const front = i % 2 === 0, A = W(T(front ? SH : HIP)), E = W([f[0], f[1] - PAW]), [a, b] = front ? FRONT : BACK;
      const [J, end] = IB.ik(A, E, a * s, b * s, (front ? -d : d) * ((p.fold && p.fold[i]) || 1));   // a front leg folds forward at the wrist, a hind leg back at the hock; fold -1 turns it the other way (a sitting dog's haunch)
      return { A, J, E: end, front, far: i < 2 };
    });
    const drawLeg = (L, i) => {
      const w = L.front ? [16, 12, 10] : [24, 13, 10];
      IB.limb(ctx, [L.A, L.J, L.E], w.map((v) => v * s), { fill: L.far ? C.bg : coat, lw, seed: seed + 10 + i * 5 });
      IB.oval(ctx, L.E[0] + d * 4 * s, L.E[1] + 1 * s, 10 * s, 6 * s, { fill: L.far ? C.bg : coat, w: lw * 0.9, seed: seed + 12 + i * 5, n: 9 });
    };
    ctx.save();
    // far legs, the tail, the neck, then near legs: all of them go under the torso, which closes over their roots
    legs.forEach((L, i) => L.far && drawLeg(L, i));
    const ta = (p.tail == null ? 0.7 : p.tail) + (p.wag == null ? 0 : p.wag ? -0.28 : 0.28), root = T(TAIL);
    const tp = [0, 1, 2, 3].map((k) => { const a = ta + k * 0.12, r = k * 17; return W([root[0] - Math.cos(a) * r, root[1] - Math.sin(a) * r]); });
    IB.tube(ctx, tp, { w: 11 * s, edge: lw * 0.85, fill: coat, smooth: true, seed: seed + 30 });
    const nb = T(NECK), na = p.neck == null ? 1 : p.neck, hc = [nb[0] + Math.cos(na) * NECK_LEN, nb[1] - Math.sin(na) * NECK_LEN];
    IB.tube(ctx, [W(T([40, -2])), W(nb), W(hc)], { w: 36 * s, edge: lw, fill: coat, smooth: true, seed: seed + 31 });
    legs.forEach((L, i) => !L.far && drawLeg(L, i));
    IB.ink(ctx, [[-72, -16], [-58, -30], [-20, -30], [20, -31], [50, -34], [70, -24], [80, -6], [74, 14], [52, 24], [20, 18], [-14, 12], [-48, 18], [-70, 8]].map((q) => W(T(q))), { closed: true, fill: coat, w: lw, seed: seed + 32 });
    const belly = W(T([-4, 16]));
    IB.shade(ctx, belly[0] - 50 * s, belly[1] - 14 * s, 100 * s, 14 * s, { from: 'bottom', seed: seed + 33, alpha: 0.25 });   // graphite under the belly where the legs leave it
    // the collar, round the neck a third of the way up
    const cl = [lerp(nb[0], hc[0], 0.42), lerp(nb[1], hc[1], 0.42)], nx = -Math.sin(na), ny = -Math.cos(na);   // across the neck
    IB.seg(ctx, ...W([cl[0] - nx * 17, cl[1] - ny * 17]), ...W([cl[0] + nx * 17, cl[1] + ny * 17]), { w: 7 * s, color: collar, seed: seed + 34, grain: 0 });
    // the head, in its own frame: x along the snout, y down; mirrored for dir -1
    const H = W(hc), ha = p.head || 0, m = Math.max(0, Math.min(1, p.mouth || 0)), e = p.ear || 0;
    ctx.save();
    ctx.translate(H[0], H[1]); ctx.scale(d * s, s); ctx.rotate(ha);
    const w = lw / s;
    const jaw = m * 0.5, hinge = [0, 10], rot = ([x, y]) => [hinge[0] + (x - hinge[0]) * Math.cos(jaw) - (y - hinge[1]) * Math.sin(jaw), hinge[1] + (x - hinge[0]) * Math.sin(jaw) + (y - hinge[1]) * Math.cos(jaw)];
    if (m > 0) IB.ink(ctx, [hinge, [44, 9], rot([38, 13])], { closed: true, smooth: false, fill: C.ink, w: w * 0.6, seed: seed + 40 });   // inside of the open mouth
    IB.ink(ctx, [[0, 8], [38, 10], [42, 14], [30, 19], [8, 21], [-6, 16]].map(rot), { closed: true, fill: coat, w, seed: seed + 41 });   // lower jaw
    IB.ink(ctx, [[-20, -6], [-14, -19], [4, -22], [22, -12], [40, -6], [48, 0], [47, 7], [40, 10], [4, 12], [-12, 14], [-21, 6]], { closed: true, fill: coat, w, seed: seed + 42 });
    IB.oval(ctx, 46, 1, 5.5, 4.5, { fill: C.ink, w: 0, n: 8, seed: seed + 43 });   // nose
    if (p.eye === 'wide') { IB.oval(ctx, 14, -9, 5, 5, { fill: C.paper, w: w * 0.6, n: 8, seed: seed + 44 }); IB.oval(ctx, 15, -9, 2.2, 2.2, { fill: C.ink, w: 0, n: 6 }); }
    else if (p.eye === 'closed') IB.ink(ctx, [[9, -9], [14, -6], [19, -9]], { w: w * 0.8, seed: seed + 44 });
    else IB.oval(ctx, 14, -9, 2.6, 2.6, { fill: C.ink, w: 0, n: 6 });
    // the ear hangs from the back of the skull: 0.3 rad back when it hangs, up past the crown when pricked, flat back when blown
    const ea = e >= 0 ? lerp(0.3, 2.5, e) : lerp(0.3, 1.45, -e);
    ctx.save(); ctx.translate(-6, -15); ctx.rotate(ea);
    IB.ink(ctx, [[-2, -2], [9, 4], [8, 26], [-2, 36], [-12, 30], [-11, 6]], { closed: true, fill: ears, w: w * 0.8, seed: seed + 45 });
    ctx.restore();
    if (p.sniff != null) for (let k = 0; k < 2; k++) IB.seg(ctx, 56 + p.sniff * 4, -6 + k * 12, 64 + p.sniff * 6, -9 + k * 18, { w: w * 0.7, seed: seed + 46 + k + p.sniff * 3 });
    ctx.restore();
    ctx.restore();
    const at = (x, y) => { const c = Math.cos(ha), sn = Math.sin(ha); return [H[0] + d * s * (x * c - y * sn), H[1] + s * (x * sn + y * c)]; };
    return { collar: W(cl), nose: at(50, 1), head: H, tail: tp[3], feet: legs.map((L) => L.E) };
  };

  /* dogWalk(ph, opts) — one drawing of the dog's walk: ph 0..1 is one cycle (each paw one step). Returns a pose (its feet in the same units as IB.dog's) about a body that stays at x 0, so the scene moves `at` instead: by IB.dogWalkLen(opts) x s a cycle, i.e. len / n a drawing when the cycle is n drawings on twos, and a planted paw stays put on the stage. opts { stride (each paw sweeps 2 x stride under the body while it is down; 30), gait 'walk' (paws one after another round the body, each down 62% of its cycle) | 'trot' (diagonal pairs together, each down half the cycle), base (the pose whose body, head and paws the cycle runs about: POSE.stand, or POSE.pull for a dog that scrabbles while it drags), lift (how high a swinging paw rises, 20) }. To walk beside a person, pick n and solve the stride: stride = pace x n x duty / 2 / s, pace the person's px a drawing (IB.walkLen(look) / 12). */
  const GAITS = { walk: { duty: 0.62, off: [0.75, 0.5, 0.25, 0] }, trot: { duty: 0.5, off: [0, 0.5, 0.5, 0] } };   // offsets: far front, far back, near front, near back
  IB.dogWalk = (ph, o = {}) => {
    const { stride = 30, gait = 'walk', lift = 20 } = o, base = o.base || IB.dog.POSE.stand, G = GAITS[gait];
    const feet = base.feet.map(([cx], i) => {
      const u = (((ph + G.off[i]) % 1) + 1) % 1;
      if (u < G.duty) return [cx + stride * (1 - (2 * u) / G.duty), 0];
      const k = (u - G.duty) / (1 - G.duty);
      return [cx + stride * (-1 + (1 - Math.cos(Math.PI * k))), -lift * Math.sin(Math.PI * k)];
    });
    const bob = Math.cos(ph * 4 * Math.PI);
    return { ...base, body: [base.body[0], base.body[1] + 1.5 * bob], head: (base.head || 0) + 0.04 * bob, feet };
  };
  /* dogWalkLen(opts) — px the body travels in one cycle of IB.dogWalk with the same opts (2 x stride / duty, times opts.s). */
  IB.dogWalkLen = (o = {}) => (2 * (o.stride == null ? 30 : o.stride) * (o.s || 1)) / GAITS[o.gait || 'walk'].duty;

  /* dogMix(a, b, u) — the dog pose a fraction u of the way from a to b; u above 1 overshoots (1.05-1.1) the body, the head and the tail past b while the paws stay on b, as IB.poseMix does for the figure. The eye, wag and sniff drawings switch at the half. */
  IB.dogMix = (a, b, u) => {
    const f = (k, def = 0) => lerp(a[k] == null ? def : a[k], b[k] == null ? def : b[k], u), v = Math.max(0, Math.min(1, u));
    return { ...(u < 0.5 ? a : b), body: [lerp(a.body[0], b.body[0], u), lerp(a.body[1], b.body[1], u)], tilt: f('tilt'), neck: f('neck', 1), head: f('head'), mouth: Math.max(0, f('mouth')), ear: Math.max(-1, Math.min(1, f('ear'))), tail: f('tail', 0.7), feet: a.feet.map((q, i) => [lerp(q[0], b.feet[i][0], v), lerp(q[1], b.feet[i][1], v)]) };
  };

  /* leash(ctx, hand, collar, state, opts) — the lead from a hand to the collar: one ink line that droops between them when slack and pulls straight when taut. state.taut 0..1 (0 hangs a sag of 0.3 x the span plus 30 px, 1 is a straight line); a small loop goes round the hand. Draw it after the figure and the dog. opts { w (3), color (C.ink), seed }. Returns its lowest point (where to put shake marks when it snaps taut). */
  IB.leash = (ctx, hand, collar, st = {}, o = {}) => {
    const { taut = 0 } = st, { w = 3, color = C.ink, seed = 680 } = o;
    const D = Math.hypot(collar[0] - hand[0], collar[1] - hand[1]), sag = Math.pow(1 - Math.max(0, Math.min(1, taut)), 1.3) * (0.3 * D + 30);
    const c = [(hand[0] + collar[0]) / 2, (hand[1] + collar[1]) / 2 + sag * 2], pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([lerp(lerp(hand[0], c[0], u), lerp(c[0], collar[0], u), u), lerp(lerp(hand[1], c[1], u), lerp(c[1], collar[1], u), u)]); }
    ctx.save();
    IB.ink(ctx, pts, { w, color, seed, wob: 0.4, taper: false });
    IB.ink(ctx, IB.ellipse(hand[0], hand[1] + 4, 7, 9, 9), { closed: true, w: w * 0.85, color, seed: seed + 1 });
    ctx.restore();
    return pts[8];
  };

  const stand = { body: [0, -96], tilt: 0, neck: 1, head: 0.1, mouth: 0, ear: 0, eye: 'dot', tail: 0.7, wag: null, sniff: null, feet: [[56, 0], [-46, 0], [44, 0], [-58, 0]] };
  const P = {
    stand,
    point: { ...stand, body: [4, -98], tilt: -0.06, neck: 1.25, head: -0.05, ear: 1, eye: 'wide', tail: 1.15, feet: [[60, 0], [-46, 0], [62, -34], [-58, 0]] },   // frozen at the sight of something: head up, ears up, tail stiff, a front paw lifted
    crouch: { ...stand, body: [-14, -80], tilt: -0.04, neck: 0.85, head: 0.05, ear: 1, eye: 'wide', tail: 0.95, feet: [[60, 0], [-46, 0], [50, 0], [-58, 0]] },   // the weight back before the lunge
    pull: { ...stand, body: [26, -74], tilt: 0.12, neck: 0.45, head: 0.12, mouth: 0.8, ear: -0.7, eye: 'wide', tail: 0.25, feet: [[104, 0], [-74, 0], [90, 0], [-90, 0]] },   // low, straining forward, paws braced wide
    sniff: { ...stand, body: [0, -90], tilt: 0.26, neck: -1.15, head: 0.85, ear: 0.1, tail: 0.6, feet: [[58, 0], [-46, 0], [44, 0], [-58, 0]] },   // nose to the floor
    sit: { ...stand, body: [-16, -76], tilt: -0.62, neck: 1.25, head: 0.05, tail: -0.2, fold: [1, -1, 1, -1], feet: [[34, 0], [-8, 0], [22, 0], [-20, 0]] },
  };
  IB.dog.POSE = P;
  IB.dog.MOVE = {
    // it sees something: one drawing with the head thrown higher than it stays, then the frozen point
    freeze: [[0, IB.dogMix(stand, P.point, 1.12)], [2, P.point]],
    // weight back (held), one drawing thrown past the pull, the pull
    lunge: [[0, IB.dogMix(stand, P.crouch, 0.6)], [2, P.crouch], [6, IB.dogMix(P.crouch, P.pull, 1.1)], [8, P.pull]],
    // the tail's two drawings on twos
    wag: [[0, { ...stand, wag: 0, mouth: 0.4 }], [2, { ...stand, wag: 1, mouth: 0.4 }], [4, { ...stand, wag: 0, mouth: 0.4 }], [6, { ...stand, wag: 1, mouth: 0.4 }]],
    // down to the floor in an in-between, then the nose twitches on twos
    sniffing: [[0, IB.dogMix(stand, P.sniff, 0.55)], [2, { ...P.sniff, sniff: 0 }], [4, { ...P.sniff, head: 0.8, sniff: 1 }], [6, { ...P.sniff, sniff: 0 }], [8, { ...P.sniff, head: 0.8, sniff: 1 }]],
    // the haunches go down through one in-between and settle a drawing past
    sitDown: [[0, IB.dogMix(stand, P.sit, 0.5)], [2, IB.dogMix(stand, P.sit, 1.06)], [4, P.sit]],
  };
})(window);
