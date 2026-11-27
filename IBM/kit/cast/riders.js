/* cast/riders.js — the five riders of the reference's fifth spot, who pile onto a tandem one by one: small figures (about 250 px seated) with 1.9 px lines, each told apart by hair or headgear and clothes, not by face. Their own rig, anchored on the bottom bracket they pedal: joint positions were read off the reference, and the poses are numbers (lean, rise, tuck, nod, arms). Needs ink.js, figure.js and props/vehicles.js; adds to the global IB. */
(function (g) {
  const MG = g.MG, IB = g.IB, C = IB.C;
  const { lerp } = MG;
  const PI = Math.PI, LW = 1.9;

  /* The five, by what is on their heads. arm: null = sleeveless; stripes, shorts, bib, watch are details of dress. */
  IB.RIDERS = {
    curls: { who: 'curls', skin: C.skin[4], top: C.paper, arm: C.paper, leg: C.navy, shoe: C.paper },
    visor: { who: 'visor', skin: C.skin[1], top: C.paper, arm: C.paper, leg: C.paper, shoe: C.navy, stripes: true },
    cap: { who: 'cap', skin: C.skin[1], top: C.paper, arm: C.paper, leg: C.navy, shoe: C.skin[2], shorts: true },
    bun: { who: 'bun', skin: C.skin[2], top: C.paper, arm: null, leg: C.sky, shoe: C.paper, bib: true },
    vents: { who: 'vents', skin: C.skin[4], top: C.navy, arm: C.navy, leg: C.paper, shoe: C.paper, watch: true },
  };

  // 성진: face() and parts of HAIR are near-copies (about 1 px apart) of figure.js's private head, hairBack and hairFront. Moving them here kept every pixel; merging the two would redraw one of them, so it waits for the upgrade round (plan 4-3, the tandem figures).
  /* The face every rider shares, in head units (profile radius about 22) facing +x: skull, nose and chin as one shape, an ear, an eye, a mouth. */
  function face(ctx, skin, p, seed) {
    IB.ink(ctx, [[-2, -22], [14, -16], [19, -4], [27, 3], [19, 7], [17, 17], [3, 23], [-15, 15], [-21, -4]], { closed: true, fill: skin, w: LW, seed });
    IB.ink(ctx, [[-8, -3], [-12, 2], [-7, 6]], { w: 1.5, seed: seed + 1 });
    ctx.fillStyle = C.ink;
    if (p.eye === 'closed') IB.ink(ctx, [[8, -5], [12, -2.5], [16, -5]], { w: 1.7, seed: seed + 2 });
    else if (p.eye === 'wide') { IB.oval(ctx, 12, -5, 4.4, 4.6, { fill: C.paper, w: 1.4, seed: seed + 2, n: 8 }); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(13, -5, 1.8, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(12, -5, 2, 0, 7); ctx.fill(); }
    if (p.mouth === 'open') IB.ink(ctx, [[9, 9], [19, 8], [16, 15], [11, 15]], { closed: true, fill: C.ink, w: 1.2, seed: seed + 3 });
    else if (p.mouth === 'o') IB.oval(ctx, 15, 12, 3, 3.6, { fill: C.ink, w: 0, n: 8 });
    else IB.ink(ctx, p.mouth === 'flat' ? [[10, 12], [17, 12]] : [[9, 9], [13, 12.5], [18, 9.5]], { w: 1.6, seed: seed + 3 });
  }
  /* Hair and headgear per rider. `lift` 0..1.25 raises whatever can stream (curls, bun, beard) toward straight up; `alt` (-0.6, 0 or 1) is which of its three drawings a streaming thing is on. Drawn in two passes: what is behind the face, then what is over it. */
  const HAIR = {
    curls: {
      back(ctx, lift, alt, seed) {
        // a mass of curls streaming back; lifted, the same mass stands on end
        const a = lift * 0.5, g = 1 + lift * 0.24, c = Math.cos(a) * g, s = Math.sin(a) * g, wob = 3 * alt, pts = [];
        const body = [[2, -22], [-8, -29], [-20, -27 - wob], [-32, -32], [-44, -25 + wob], [-58, -28], [-68, -16 - wob], [-76, -2], [-71, 12 + wob], [-59, 14], [-50, 22 - wob], [-37, 17], [-27, 22], [-17, 13], [-11, 17]];
        for (const [x, y] of body) pts.push([x * c - y * s * 0.9, x * s + y * c - lift * 10]);
        IB.ink(ctx, pts, { closed: true, fill: C.ink, w: 2, seed });
      },
      front(ctx, lift, alt, seed) { IB.ink(ctx, [[13, -17], [-2, -27], [-22, -16], [-22, 10], [-11, 3], [-5, -12]], { closed: true, fill: C.ink, w: 2, seed: seed + 1 }); },
    },
    bun: {
      back(ctx, lift, alt, seed) { IB.oval(ctx, -23 - lift * 3, -25 - lift * 9, 13, 12 + lift * 3, { fill: '#b08a62', w: 2, seed, n: 9 }); },
      front(ctx, lift, alt, seed) { IB.ink(ctx, [[11, -19], [-4, -28], [-23, -17], [-25, 7], [-13, 3], [-8, -11]], { closed: true, fill: '#b08a62', w: 2, seed: seed + 1 }); },
    },
    cap: {
      back(ctx, lift, alt, seed, bare) {
        // long white hair streaming back in separate strands; without the cap a tuft stands up on top
        for (let i = 0; i < 6; i++) { const y = -8 + i * 5.5, k = 3.5 * alt; IB.ink(ctx, [[-16, y], [-30, y + 1 - lift * 10 + k], [-44, y + 1 - lift * 18 - k], [-56 - (i % 3) * 6, y + 3 - lift * 22 + k]], { w: 1.4, seed: seed + i, color: '#6f6f6f' }); }
        if (bare) for (let i = 0; i < 4; i++) IB.ink(ctx, [[-10 + i * 6, -20], [-22 + i * 4 - 4 * alt, -34 - i * 2], [-38 + i * 3, -38 + 3 * alt]], { w: 1.5, seed: seed + 10 + i });
      },
      front(ctx, lift, alt, seed, bare) {
        // beard: a white shape under the jaw with its tail blown back
        IB.ink(ctx, [[4, 17], [19, 17], [17, 28], [5, 34], [-10, 29 - 3 * alt], [-26, 31 + 2.5 * alt], [-15, 21], [-12, 12], [-4, 14]], { closed: true, fill: C.paper, w: 1.6, seed: seed + 20 });
        if (bare) return;
        IB.ink(ctx, IB.ellipse(-3, -6, 24, 22, 9, PI * 0.98, PI * 2.02).concat([[44, -5], [42, -1], [21, -2]]), { closed: true, fill: C.paper, w: LW, seed: seed + 21 });
      },
    },
    visor: {
      back(ctx, lift, alt, seed) {
        IB.ink(ctx, [[-20, 0], [-25, 10], [-16, 16], [-10, 6]], { closed: true, fill: C.charcoal, w: 1.6, seed });                          // hair at the nape
        IB.ink(ctx, [[-10, 24], [-30, 22 - 5 * alt], [-50, 26 + 5 * alt], [-64, 20 - 3 * alt]], { w: 1.5, seed: seed + 1 });   // hood string
        IB.oval(ctx, -66, 20 - 3 * alt, 3, 3, { fill: C.paper, w: 1.4, seed: seed + 2, n: 6 });
      },
      front(ctx, lift, alt, seed) {
        IB.ink(ctx, IB.ellipse(-3, -6, 25, 23, 9, PI * 0.94, PI * 2.02).concat([[32, -9], [31, -6], [20, -5]]), { closed: true, fill: C.sky, w: LW, seed: seed + 3 });
        IB.oval(ctx, -8, -13, 7.5, 7.5, { fill: C.paper, w: 1.5, seed: seed + 4, n: 9 });
        IB.oval(ctx, -8, -13, 3, 3, { w: 1.2, seed: seed + 5, n: 6 });
        IB.ink(ctx, [[-10, -2], [-5, 14], [5, 23]], { w: 1.7, seed: seed + 6 });                                                              // chin strap
        IB.oval(ctx, 12.5, -5, 5, 4.4, { fill: C.charcoal, w: 1.3, seed: seed + 7, n: 8 });                                                    // glasses
        IB.seg(ctx, 8, -6, -8, -4, { w: 1.2, seed: seed + 8 });
      },
    },
    vents: {
      back(ctx, lift, alt, seed) { IB.ink(ctx, [[-21, -2], [-27, 9], [-18, 15], [-9, 6]], { closed: true, fill: '#8f8f8f', w: 1.6, seed }); },
      front(ctx, lift, alt, seed) {
        IB.ink(ctx, IB.ellipse(-3, -7, 25, 23, 9, PI * 0.95, PI * 2.03).concat([[23, -4]]), { closed: true, fill: C.paper, w: LW, seed: seed + 1 });
        ctx.fillStyle = C.ink;
        for (const [x, y, r] of [[-15, -14, 0.5], [-4, -21, 0.2], [8, -18, -0.3], [-9, -9, 0.3], [4, -10, -0.2]]) { ctx.beginPath(); ctx.ellipse(x, y, 4.2, 2.3, r, 0, 7); ctx.fill(); }
        IB.ink(ctx, [[-11, -3], [-6, 13], [4, 23]], { w: 1.7, seed: seed + 2 });
      },
    },
  };
  function head(ctx, at, r, p, alt, seed, bare) {
    const H = HAIR[r.who];
    ctx.save();
    ctx.translate(at[0], at[1]);
    ctx.rotate(p.nod);
    H.back(ctx, p.hair, alt, seed + 20, bare);
    face(ctx, r.skin, p, seed);
    if (p.look === -1) IB.ink(ctx, [[-4, -8], [-9, -5], [-4, -2]], { w: 1.4, seed: seed + 9 });   // glancing back: a second lid line behind the eye
    H.front(ctx, p.hair, alt, seed + 40, bare);
    ctx.restore();
  }


  /* A rider's pose. lean: how far the spine is tipped from the riding pose, + forward, in units of about 1.2 px at the shoulder; rise: px off the saddle; tuck 0..1 pulls the knees up and the head down (the newcomer in the air); arms [near, far]: 'bar', 'reach' (the bar, with the arm pulled straight), or a hand position relative to the shoulder; open: free hands are open (fanned fingers, or with flat: a flat palm) instead of fists; legs: 'pedal' | 'out'. */
  const RIDE = { lean: 0, rise: 0, tuck: 0, nod: 0, arms: ['bar', 'bar'], legs: 'pedal', eye: 'dot', mouth: 'smile', hair: 0, sc: 1 };
  const po = (o) => ({ ...RIDE, ...o });

  /* Joints relative to the bottom bracket bb they pedal: hip 24 px behind and 112 above it (read off the reference), hands on a grip 56 px ahead and 118 above; the riding pose then has the shoulder 181 above and the head centre 218 above. */
  /* rider(ctx, look, bb, pose, opts) — one rider on the saddle above the bottom bracket bb. look is one of IB.RIDERS; opts.crank is the crank angle (every crank of a tandem turns in phase), opts.alt (-0.6, 0 or 1) which of three drawings whatever streams in the wind is on (IB.loop(f, [0, 1, -0.6])): the only thing redrawn over a held pose; opts.bare draws the cap rider without the cap. */
  IB.rider = (ctx, r, bb, p, o = {}) => {
    const { crank = 0, alt = 0, seed = 200, bare = false } = o, CRANK = IB.TANDEM.crank;
    ctx.save();
    const k = p.sc, hip = [bb[0] - 24, bb[1] - 112 - p.rise], lean = p.lean - p.tuck * 4;
    // the spine turns about the hip: 0.37 rad forward when riding, and `lean` px of shoulder travel either way from there, so leaning back also brings the shoulders down
    const L = (74 - p.tuck * 14) * k, tilt = (22 + lean) / 60, sh = [hip[0] + L * Math.sin(tilt), hip[1] - L * Math.cos(tilt)], headAt = [sh[0] + (18 + p.tuck * 8) * Math.cos(tilt * 0.6) + 37 * k * Math.sin(tilt * 0.6) * 0.5, sh[1] - 37 * k * Math.cos(tilt * 0.5) + p.tuck * 16];
    const grip = [bb[0] + 56, bb[1] - 118];
    const limb = (pts, widths, fill, sd, cap) => IB.limb(ctx, pts, widths.map((w) => w * k), { fill, lw: LW, seed: sd, cap });
    const leg = (a, sd) => {
      const pedal = [bb[0] + CRANK * Math.cos(a), bb[1] + CRANK * Math.sin(a)];
      let ankle = [pedal[0] - 4, pedal[1] - 11], pitch = 0.25 * Math.sin(a);
      if (p.legs === 'out') { ankle = [hip[0] + 112 + 8 * Math.cos(a), hip[1] + 74 + 5 * Math.sin(a)]; pitch = -0.5; }
      if (p.tuck) ankle = [lerp(ankle[0], hip[0] + 34, p.tuck), lerp(ankle[1], hip[1] + 48, p.tuck)];
      const [knee, end] = IB.ik(hip, ankle, 74 * k, 70 * k, -1);
      if (r.shorts) { const cut = [lerp(hip[0], knee[0], 0.8), lerp(hip[1], knee[1], 0.8)]; limb([cut, knee, end], [17, 15, 12], r.skin, sd + 1); limb([hip, cut], [30, 28], r.leg, sd, 'end'); }
      else limb([hip, knee, end], [30, 25, 21], r.leg, sd, 'end');
      ctx.save(); ctx.translate(end[0], end[1]); ctx.rotate(pitch);
      IB.ink(ctx, [[-10, -7], [4, -8], [12, -3], [22, 0], [22, 5], [-10, 5]], { closed: true, fill: r.shoe, w: 1.8, seed: sd + 2 });
      if (r.shorts) IB.seg(ctx, 1, -7, 6, 4, { w: 1.5, seed: sd + 3 }); else IB.seg(ctx, -9, 1.5, 21, 2, { w: 1.2, seed: sd + 3, color: r.shoe === C.navy ? C.paper : C.ink });
      ctx.restore();
    };
    const arm = (i, sd) => {
      const want = p.arms[i], root = [sh[0] + 2, sh[1] + 6];
      let hand = want === 'bar' || want === 'reach' ? [grip[0] + (i ? 5 : 0), grip[1] - (i ? 3 : 0)] : [sh[0] + want[0], sh[1] + want[1]];
      const [elbow, end] = IB.ik(root, hand, 50 * k, 50 * k, want === 'reach' ? 0.02 : hand[1] < sh[1] - 20 ? -1 : 1);
      const sleeveless = r.arm == null;
      if (sleeveless) { const cut = [lerp(root[0], elbow[0], 0.4), lerp(root[1], elbow[1], 0.4)]; limb([cut, elbow, end], [13, 12, 10], r.skin, sd); limb([root, cut], [19, 18], r.top, sd + 5, 'end'); }
      else limb([root, elbow, end], [18, 15, 12], r.arm, sd, 'end');
      if (r.stripes) for (let s = 1; s < 5; s++) { const u = s / 5, x = lerp(elbow[0], end[0], u), y = lerp(elbow[1], end[1], u), d = Math.atan2(end[1] - elbow[1], end[0] - elbow[0]) + PI / 2; IB.seg(ctx, x - Math.cos(d) * 6, y - Math.sin(d) * 6, x + Math.cos(d) * 6, y + Math.sin(d) * 6, { w: 1.4, seed: sd + 10 + s }); }
      if (r.watch && !sleeveless) { const d = Math.atan2(end[1] - elbow[1], end[0] - elbow[0]); ctx.save(); ctx.translate(end[0], end[1]); ctx.rotate(d); IB.box(ctx, -5, -7, 6, 14, { fill: C.paper, w: 1.4, seed: sd + 16 }); ctx.restore(); }
      const ang = Math.atan2(end[1] - elbow[1], end[0] - elbow[0]);
      if (p.open && want !== 'bar' && want !== 'reach') IB.mitt(ctx, end, ang, { kind: p.flat ? 'reach' : 'open', s: 1.45, lw: 1.7, fill: r.skin, flip: i ? -1 : 1, seed: sd + 20 });
      else { const hx = end[0] + 5 * Math.cos(ang), hy = end[1] + 5 * Math.sin(ang) + (want === 'bar' ? 2 : 0); IB.oval(ctx, hx, hy, 8.5, 7.5, { fill: r.skin, w: 1.8, seed: sd + 20, n: 8 }); for (const d of [-3, 1.5]) IB.seg(ctx, hx + d, hy + 1, hx + d + 1, hy + 6, { w: 1.1, seed: sd + 22 + d }); }
    };
    arm(1, seed + 60);
    leg(crank + PI, seed);
    // torso: a pelvis in the trouser colour, a neck, then one boxy garment from the collar to a hem at the waist, all built on the spine so that they lean as one
    const ux = (sh[0] - hip[0]) / L, uy = (sh[1] - hip[1]) / L, T = (along, across) => [hip[0] + (ux * along - uy * across) * k, hip[1] + (uy * along + ux * across) * k];
    IB.ink(ctx, [T(26, -15), T(26, 28), T(-8, 24), T(-12, -12)], { closed: true, fill: r.leg, w: LW, seed: seed + 29 });
    IB.limb(ctx, [T(76, 4), [headAt[0] - 4, headAt[1] + 8]], [14 * k, 13 * k], { fill: r.skin, lw: LW, seed: seed + 28 });
    IB.ink(ctx, [T(86, -10), T(88, 6), T(78, 19), T(54, 27), T(30, 31), T(20, 30), T(19, -16), T(48, -21), T(72, -19)], { closed: true, fill: r.top, w: LW, seed: seed + 30 });
    if (r.bib) {   // overalls: a bib up the front and a strap over the shoulder
      IB.ink(ctx, [T(62, 2), T(58, 26), T(30, 31), T(20, 30), T(19, -16), T(36, -19), T(46, -8)], { closed: true, fill: r.leg, w: 1.7, seed: seed + 31 });
      IB.ink(ctx, [T(60, 6), T(76, 0), T(85, -9)], { w: 5, color: r.leg, seed: seed + 32, taper: false, grain: 0 });
      IB.ink(ctx, [T(60, 3), T(75, -3), T(86, -12)], { w: 1.5, seed: seed + 33 });
      IB.oval(ctx, ...T(56, 9), 2.4, 2.4, { fill: C.paper, w: 1.1, seed: seed + 34, n: 6 });
    } else IB.ink(ctx, [T(84, 6), T(76, 14), T(66, 16)], { w: 1.4, seed: seed + 35 });   // collar
    leg(crank, seed + 10);
    arm(0, seed + 80);
    head(ctx, headAt, r, p, alt, seed + 100, bare);
    ctx.restore();
  };
  IB.rider.pose = po;
  IB.rider.POSE = { ride: RIDE };
  /* MOVE. A join is four drawings on twos, and it throws every rider about: joinNew is the newcomer (curled up in the air, landing, sitting up with hands off, settled), joinBehind those behind it (lifted off the saddle, arms pulled straight, hair standing), joinAhead those ahead (pitched forward, then thrown back). Like every MOVE they are [frame, pose] lists in frames from the move's first drawing; a join's four drawings are on twos (0, 2, 4, 6). */
  IB.rider.MOVE = {
    joinNew: [
      [0, po({ rise: 44, tuck: 1, nod: 0.5, arms: [[16, 34], [10, 36]], eye: 'closed', mouth: 'flat', sc: 0.86 })],
      [2, po({ rise: -5, tuck: 0.75, nod: 0.6, lean: 6, arms: [[20, 30], [14, 34]], eye: 'closed', mouth: 'flat' })],
      [4, po({ rise: 7, nod: -0.12, lean: -6, arms: [[30, 18], [24, 24]], eye: 'wide', mouth: 'o', hair: 0.8 })],
      [6, po({ rise: 2, nod: -0.05, hair: 0.4 })],
    ],
    joinBehind: [
      [0, po({ rise: 5, lean: 8, nod: 0.1, hair: 0.4, eye: 'wide' })],
      [2, po({ rise: 21, lean: -8, nod: -0.15, hair: 1, eye: 'wide', mouth: 'o', arms: ['reach', 'reach'] })],
      [4, po({ rise: 8, lean: -4, nod: -0.08, hair: 1.25, eye: 'wide', mouth: 'o', arms: [[44, 14], 'bar'], open: true })],
      [6, po({ rise: 1, hair: 0.55 })],
    ],
    joinAhead: [
      [0, po({ lean: 9, nod: 0.22, eye: 'closed' })],
      [2, po({ lean: 13, rise: -2, nod: 0.3, eye: 'closed', mouth: 'flat' })],
      [4, po({ lean: -5, rise: 10, nod: -0.1, eye: 'wide', mouth: 'o' })],
      [6, po({ rise: 3 })],
    ],
    // glances back over the shoulder with a laugh: the front rider answering a call from behind
    lookBack: [
      [0, po({ nod: -0.2, eye: 'closed' })], [2, po({ nod: -0.42, lean: -4, eye: 'closed', mouth: 'open', look: -1 })], [12, po({ nod: -0.36, lean: -3, eye: 'closed', mouth: 'open', look: -1 })], [20, po({ nod: -0.1 })], [22, RIDE],
    ],
    // calls forward with a hand by the mouth
    call: [
      [0, po({ lean: 4, arms: [[40, -6], 'bar'], mouth: 'open' })], [2, po({ lean: 8, nod: -0.08, arms: [[46, -26], 'bar'], mouth: 'open', open: true })], [8, po({ lean: 10, nod: -0.1, arms: [[48, -32], 'bar'], mouth: 'o', open: true })], [14, po({ lean: 8, nod: -0.08, arms: [[46, -26], 'bar'], mouth: 'open', open: true })], [20, po({ lean: 2, arms: [[40, 2], 'bar'] })], [22, RIDE],
    ],
    // sings, head back, the mouth changing every six frames
    sing: [
      [0, po({ nod: -0.25, mouth: 'open', eye: 'closed' })], [6, po({ nod: -0.3, mouth: 'o', eye: 'closed' })], [12, po({ nod: -0.25, mouth: 'open', eye: 'closed' })], [18, po({ nod: -0.3, mouth: 'o', eye: 'closed' })], [24, po({ nod: -0.2, mouth: 'smile', eye: 'closed' })],
    ],
    // sings on, the mouth changing every eight frames
    singOn: [
      [0, po({ nod: -0.25, mouth: 'open', eye: 'closed' })], [8, po({ nod: -0.3, mouth: 'o', eye: 'closed' })], [16, po({ nod: -0.25, mouth: 'open', eye: 'closed' })], [24, po({ nod: -0.3, mouth: 'o', eye: 'closed' })], [32, po({ nod: -0.25, mouth: 'open', eye: 'closed' })], [40, po({ nod: -0.3, mouth: 'o', eye: 'closed' })],
    ],
    // holds the bar until the cap goes: a start, a grab at the air, a hand clapped on the bare head, a look after it, and then the arm goes up with everyone else's
    loseCap: [
      [0, po({ lean: -6, nod: -0.1, mouth: 'open' })],
      [8, po({ lean: -20, nod: -0.32, eye: 'wide', mouth: 'o' })],
      [10, po({ lean: -22, nod: -0.36, eye: 'wide', mouth: 'o', arms: [[-10, -70], [38, 28]], open: true })],
      [14, po({ lean: -16, nod: 0.08, eye: 'closed', mouth: 'flat', arms: [[16, -54], [38, 28]] })],
      [24, po({ lean: -22, nod: -0.3, eye: 'wide', mouth: 'open', arms: [[14, -56], [38, 28]] })],
      [30, po({ lean: -30, nod: -0.24, mouth: 'open', arms: [[-6, -84], [38, 28]], open: true })],
      [32, po({ lean: -42, nod: -0.28, mouth: 'open', eye: 'closed', arms: [[-28, -80], [38, 28]], open: true })],
      [40, po({ lean: -40, nod: -0.27, mouth: 'open', eye: 'closed', arms: [[-20, -84], [38, 28]], open: true })],
    ],
    // the finale, each rider's own way of letting go of the bar: they do not let go together (the front rider first, the rest 2 to 14 frames later), and once leaning back each keeps two drawings going, 8 frames apart, so the raised hands flick
    handsOff: {
      vents: [
        [0, po({ lean: -14, rise: 3, nod: -0.1, arms: [[34, -10], 'bar'], eye: 'wide' })],
        [2, po({ lean: -26, rise: 4, nod: -0.15, arms: [[26, -58], [40, 8]], open: true, mouth: 'open' })],
        [4, po({ lean: -40, nod: -0.22, arms: [[6, -90], [44, 10]], open: true, mouth: 'open', eye: 'closed' })],
        [6, po({ lean: -56, nod: -0.3, arms: [[-22, -84], [34, 24]], open: true, mouth: 'open', eye: 'closed', legs: 'out' })],
        [8, po({ lean: -66, nod: -0.36, arms: [[-36, -76], [34, 26]], open: true, mouth: 'open', eye: 'closed', legs: 'out' })],
        ...[10, 26, 42].flatMap((f) => [
          [f, po({ lean: -58, nod: -0.32, arms: [[-26, -82], [34, 26]], open: true, mouth: 'open', eye: 'closed', legs: 'out' })],
          [f + 8, po({ lean: -60, nod: -0.33, arms: [[-36, -76], [34, 26]], open: true, mouth: 'open', eye: 'closed', legs: 'out' })],
        ]),
      ],
      bun: [
        [0, po({ lean: -8, nod: -0.2, eye: 'wide' })],
        [2, po({ lean: -18, nod: -0.28, mouth: 'open', eye: 'closed', arms: [[66, 24], 'bar'], open: true, flat: true })],
        [4, po({ lean: -28, nod: -0.34, mouth: 'open', eye: 'closed', arms: [[72, 28], [68, 36]], open: true, flat: true })],
        [6, po({ lean: -38, nod: -0.42, mouth: 'open', eye: 'closed', arms: [[74, 30], [70, 38]], open: true, flat: true })],
        ...[8, 24, 40].flatMap((f) => [
          [f, po({ lean: -32, nod: -0.38, mouth: 'open', eye: 'closed', arms: [[78, 34], [72, 42]], open: true, flat: true })],
          [f + 8, po({ lean: -33, nod: -0.4, mouth: 'o', eye: 'closed', arms: [[76, 30], [72, 40]], open: true, flat: true })],
        ]),
      ],
      visor: [
        [0, po({ lean: -8, nod: -0.1, arms: [[34, -4], 'bar'] })],
        [2, po({ lean: -20, nod: -0.18, arms: [[12, -70], 'bar'], open: true, mouth: 'open' })],
        [4, po({ lean: -44, nod: -0.26, arms: [[-24, -84], [36, 32]], open: true, mouth: 'open' })],
        ...[6, 22, 38].flatMap((f) => [
          [f, po({ lean: -38, nod: -0.22, arms: [[-14, -90], [36, 32]], open: true, mouth: 'open' })],
          [f + 8, po({ lean: -40, nod: -0.23, arms: [[-26, -84], [36, 32]], open: true, mouth: 'open' })],
        ]),
      ],
      curls: [
        [0, po({ lean: -8, nod: -0.1, eye: 'wide' })],
        [2, po({ lean: -26, nod: -0.2, arms: [[52, -10], [-40, 6]], open: true, flat: true, mouth: 'open' })],
        [4, po({ lean: -48, nod: -0.3, arms: [[90, -10], [-84, -2]], open: true, flat: true, mouth: 'open', eye: 'closed', hair: 0.3 })],
        ...[6, 22, 38].flatMap((f) => [
          [f, po({ lean: -42, nod: -0.27, arms: [[86, -2], [-80, 8]], open: true, flat: true, mouth: 'open', eye: 'closed' })],
          [f + 8, po({ lean: -44, nod: -0.28, arms: [[88, -8], [-82, 2]], open: true, flat: true, mouth: 'open', eye: 'closed' })],
        ]),
      ],
    },
  };

  /* flyingCap(ctx, at, rot) — the cap that blows off a rider's head, turning as it goes: up and back on twos (spot/tandem-riders-join: 330 px back over 36 frames, 6.5 rad). */
  IB.flyingCap = (ctx, [x, y], rot = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    IB.ink(ctx, IB.ellipse(0, 0, 24, 20, 8, PI, PI * 2).concat([[44, 2], [20, 3]]), { closed: true, fill: C.paper, w: LW, seed: 900 });
    ctx.restore();
  };
})(window);
