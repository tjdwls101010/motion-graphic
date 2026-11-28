/* figure.js — a jointed side-view person in the look of the IBM spots: long legs, a small head in profile, flat garment shapes with an ink outline, graphite only where a limb leaves a garment. A scene gives joint targets (hip, ankles, wrists) in stage px and the rig solves knees and elbows, so a pose is a handful of numbers that can be keyed, mixed and held on twos. Proportions were measured on the reference's wide acting shots and the production stills (../STYLE.md "인물 리그"). Also here: the limbs of objects that walk (IB.peg, IB.hose, IB.boot) and their hands (IB.mitt, IB.clasp), speech bubbles (IB.bubble), the pointing hand from off-screen (IB.pointer) and shake marks (IB.shake). Needs ink.js and time.js; adds to the global IB. */
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
    const none = dx === 0 && dy === 0, ux = none ? 0 : dx / D, uy = none ? 1 : dy / D, k = (a * a + d * d - b * b) / (2 * d), hgt = Math.sqrt(Math.max(0, a * a - k * k));
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

  /* A hand at the wrist, pointing along `ang`, in one of four drawings (r = 0.021 h, so a hand is 2.4 r long: 15 px at h 300, 26 px at h 520). The thumb is on the -y side of the forearm's axis for a figure facing right; dir -1 mirrors it.
       relax  a mitten: palm and a thumb, fingers together (a hanging or resting hand)
       grip   a fist closed round whatever the scene drew first: a rounder block with the thumb laid over the fingers
       open   fingers spread, each its own outlined shape, the palm drawn over their roots (a wave, a hand thrown up, a hand shown)
       point  the fist with the index finger out
     The finger lines are the reference's medium shots (the family at the cake, the woman with the rope); at wide size they would close up into mush, so a fist only gets its knuckle lines from h 400, like the cuff of a long sleeve, and spread fingers are told apart by their silhouette alone. */
  const capsule = ([x0, y0], [x1, y1], wd) => {   // the outline of a finger from its root to its rounded tip
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * wd / 2, ny = Math.cos(a) * wd / 2, pts = [[x0 + nx, y0 + ny]];
    for (let i = 0; i <= 6; i++) { const t = a + Math.PI / 2 - (i / 6) * Math.PI; pts.push([x1 + Math.cos(t) * wd / 2, y1 + Math.sin(t) * wd / 2]); }
    pts.push([x0 - nx, y0 - ny]);
    return pts;
  };
  const FIST = [[-0.4, -0.85], [0.5, -1.05], [1.35, -0.85], [1.75, -0.2], [1.7, 0.5], [1.2, 1.0], [0.3, 1.0], [-0.4, 0.82]];
  const SPREAD = [[-0.55, 1.55], [-0.18, 1.75], [0.18, 1.65], [0.52, 1.3]];   // fingers of an open hand: [angle off the axis, length], index first
  function hand(ctx, wrist, ang, h, skin, lw, seed, kind, dir = 1) {
    ctx.save();
    ctx.translate(wrist[0], wrist[1]);
    ctx.rotate(ang);
    ctx.scale(1, dir);   // a figure facing left is the mirror image of one facing right: its thumb stays on top
    const r = h * 0.021, k = (pts) => pts.map(([x, y]) => [x * r, y * r]), fw = 0.62 * r, fl = Math.max(1, lw * 0.6);   // a finger is thick enough to show skin inside a thinner line
    const fist = () => {
      IB.ink(ctx, k(FIST), { closed: true, fill: skin, w: lw, seed });
      IB.ink(ctx, k([[0.1, -0.95], [0.85, -0.62], [1.25, -0.12]]), { w: lw * 0.8, seed: seed + 1 });   // the thumb laid over the fingers
    };
    if (kind === 'grip') {
      fist();
      if (h >= 400) [[[1.72, 0.12], [1.3, 0.16]], [[1.6, 0.6], [1.22, 0.6]]].forEach((ln, i) => IB.ink(ctx, k(ln), { w: lw * 0.6, seed: seed + 2 + i }));   // knuckles
    } else if (kind === 'point') {
      IB.ink(ctx, capsule([1.2 * r, -0.62 * r], [3.1 * r, -0.66 * r], fw), { closed: true, fill: skin, w: fl, seed: seed + 5 });
      fist();
    } else if (kind === 'open') {
      SPREAD.forEach(([a, len], i) => IB.ink(ctx, capsule([0.7 * r, 0], [0.7 * r + Math.cos(a) * len * r, Math.sin(a) * len * r], fw), { closed: true, fill: skin, w: fl, seed: seed + 5 + i }));
      IB.ink(ctx, capsule([0.3 * r, -0.4 * r], [0.3 * r + Math.cos(-1.35) * 1.15 * r, -0.4 * r + Math.sin(-1.35) * 1.15 * r], fw * 1.05), { closed: true, fill: skin, w: fl, seed: seed + 9 });   // the thumb, well apart
      const palm = IB.ellipse(0.55 * r, 0.05 * r, 0.95 * r, 0.85 * r, 12);
      IB.ink(ctx, palm, { closed: true, fill: skin, w: 0, seed: seed + 10 });   // over the roots of the fingers: no line across them
      IB.ink(ctx, palm, { closed: true, w: lw, seed: seed + 11, from: 0.14, to: 0.84 });   // the outline from the little finger round the heel of the hand to the thumb: none across the roots of the fingers
    } else {
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
  function head(ctx, at, ang, dir, h, look, lw, seed, swing = 0) {
    const s = (F.head * h * (look.headK || 1)) / 21, face = look.face || {};
    ctx.save();
    ctx.translate(at[0], at[1]);
    ctx.rotate(ang * dir);
    ctx.scale(s * dir, s);
    const w = lw / s;
    if (swing) {   // hair behind the head trails the move by one drawing, turned about the nape: + swings a ponytail up and back, and tips a bun back
      ctx.save(); ctx.translate(-15, 5); ctx.rotate(look.hair === 'bun' ? -swing : swing); ctx.translate(15, -5);   // a bun sits above the nape, so trailing back is the other turn
      hairBack(ctx, look, w, seed + 20);
      ctx.restore();
    } else hairBack(ctx, look, w, seed + 20);
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
     pose  { hip: [x, y], lean, nod, feet: [[x, y, pitch], [x, y, pitch]], hands: [[x, y], [x, y]], knee: [1, 1], elbow: [1, 1], hand: ['relax', 'relax'], grip: [false, false], face, prev }
           prev is the pose of the drawing shown just before this one (a plain pose, without a prev of its own). With it the head and the hair behind it trail the move by one drawing: the head keeps the whole tilt the spine's lean gave it in the drawing before and half of the nod it just left, and a ponytail, bun or curls swing against the way the hips moved and the way the spine tipped. The drawing after a move has stopped has prev equal to itself, so the trail settles there and the hold that follows is dead still. Without prev nothing trails. Pass it from the scene's own drawing grid: prev = the pose of the drawing before, e.g. the pose at IB.twos(t) - 1e-4 when the pose function floors raw time to its drawing (it must floor: a function that rounds would give the same drawing back). Do not pass it through a tremble that flips between two poses each drawing (a strain, a shiver): a one-drawing lag averages the two and the tremble dies.
           hip is the pelvis joint; feet are ankles and hands are wrists, far side first, all in stage px. lean tips the spine forward (rad), nod tips the head further. knee / elbow flip a joint's fold (-1) for the rare pose that needs it. hand picks each hand's drawing: 'relax' | 'grip' | 'open' | 'point' (see hand() above); grip: true is the older way to say 'grip'; hand wins over grip. face ({ eye, mouth, brow }, see the head above) is this drawing's expression; it wins over look.face, which is the person's resting one. Start from IB.stand() and move what the pose changes.
     look  { h, dir, skin, top, topKind: 'tee' | 'long' | 'tank', bottom, bottomKind: 'pants' | 'shorts', shortsLen, socks, sockHi, gloves, shoe, hair: 'short' | 'curly' | 'bun' | 'pony' | 'cap' | 'bald', hairColor, hat, brim: 'back', tail, phones, tuck, headK, face, seed }
           h is the standing height in px, dir 1 faces right and -1 left. topKind 'tank' is a sleeveless vest (a basketball jersey); shortsLen is how far down the thigh shorts reach, 0.62 by default and about 0.9 (to the knee) for basketball shorts. gloves (a colour) draws the hands in it. socks (a colour) pulls a sock up a bare shin under shorts, to sockHi of the way from ankle to knee (default 0.85, a football sock; 0.3 for a basketball one). headK scales the head (default 1): a child is a shorter figure (h 0.6-0.75 of an adult's) whose head is a larger part of its height, headK 1.25-1.35, and the head rides up its neck to make room. tuck ends the top at the waist instead of letting its hem hang below the hip: use it for a figure that bends far forward, where a hanging hem sticks out behind like a cape. Colours are flat fills from IB.C; a white garment is IB.C.bg, as in the reference.
     Returns the solved joints { hip, sh, headAt, knees, elbows, feet, hands } so the scene can hang props on them (a bag strap on the shoulder, a tool in the hands), and drag: [dx, dy], half of how far the hips moved since prev and the other way, for a hanging thing (a bag, a cord) to trail by. Pass `only: 'far' | 'near'` to draw the figure in two passes with a prop between its arms. */
  IB.figure = (ctx, pose, look, only) => {
    const h = look.h, d = look.dir || 1, lw = look.lw || IB.figLine(h), seed = look.seed || 1, skin = look.skin || C.skin[2];
    const top = look.top || C.bg, bottom = look.bottom || C.navy, tee = (look.topKind || 'tee') === 'tee', shorts = look.bottomKind === 'shorts';
    const lean = pose.lean || 0, sx = Math.sin(lean) * d, sy = -Math.cos(lean), fx = Math.cos(lean) * d, fy = Math.sin(lean);   // spine and forward unit vectors
    const hip = pose.hip, at = (u, f) => [hip[0] + sx * u * h + fx * f * h, hip[1] + sy * u * h + fy * f * h];
    const sh = at(F.torso - 0.012, 0.004), headAt = at(F.torso + F.neck + ((look.headK || 1) - 1) * F.head * 0.8, 0.016 + (pose.nod || 0) * 0.03);   // a larger head sits higher on the same neck
    const knee = pose.knee || [1, 1], elbow = pose.elbow || [1, 1], grip = pose.grip || [false, false], kinds = [0, 1].map((i) => (pose.hand && pose.hand[i]) || (grip[i] ? 'grip' : 'relax'));
    // follow-through from the previous drawing (none without pose.prev)
    const prev = pose.prev, dl = prev ? (prev.lean || 0) - lean : 0, dn = prev ? (prev.nod || 0) - (pose.nod || 0) : 0;
    const vx = prev ? hip[0] - prev.hip[0] : 0, vy = prev ? hip[1] - prev.hip[1] : 0;
    const swing = prev ? clamp((2.5 * vx * d) / h - 0.8 * (lean - (prev.lean || 0)), -0.5, 0.5) * (look.hair === 'curly' ? 0.4 : 1) : 0;   // a mass of curls is heavy: it swings less
    const roots = [at(0, 0.024), at(0, -0.024)];   // the far leg leaves the pelvis a little ahead of the near one, which gives the trousers their width
    const legs = pose.feet.map((f, i) => { const [k, e] = ik(roots[i], f, F.thigh * h, F.shin * h, -d * knee[i]); return { k, e, pitch: f[2] || 0, root: roots[i] }; });
    const arms = pose.hands.map((w, i) => { const [el, e] = ik(sh, w, F.upper * h, F.fore * h, d * elbow[i]); return { el, e }; });

    const drawLeg = (i) => {
      const L = legs[i], sd = seed + 100 + i * 20;
      if (shorts) {
        const cut = [lerp(L.root[0], L.k[0], look.shortsLen || 0.62), lerp(L.root[1], L.k[1], look.shortsLen || 0.62)];
        limb(ctx, [cut, L.k, L.e], [F.calfW * h * 1.35, F.calfW * h * 1.15, F.calfW * h], { fill: skin, lw, seed: sd, shade: h * 0.05 });
        if (look.socks) { const top = [lerp(L.e[0], L.k[0], look.sockHi || 0.85), lerp(L.e[1], L.k[1], look.sockHi || 0.85)]; limb(ctx, [top, L.e], [F.calfW * h * 1.28, F.calfW * h * 1.08], { fill: look.socks, lw, seed: sd + 4, cap: 'none' }); const ux = L.k[0] - L.e[0], uy = L.k[1] - L.e[1], n = Math.hypot(ux, uy) || 1, hw = F.calfW * h * 0.64; IB.ink(ctx, [[top[0] - (uy / n) * hw, top[1] + (ux / n) * hw], [top[0] + (uy / n) * hw, top[1] - (ux / n) * hw]], { w: lw, smooth: false, seed: sd + 5, taper: false }); }   // a sock pulled up the shin from the shoe, its top edge inked across
        limb(ctx, [L.root, cut], [F.thighW * h * 1.05, F.thighW * h * 1.1], { fill: bottom, lw, seed: sd + 8, cap: 'end' });
      } else limb(ctx, [L.root, L.k, L.e], [F.thighW * h, F.kneeW * h, F.cuffW * h], { fill: bottom, lw, seed: sd, cap: 'end' });
      shoe(ctx, L.e, L.pitch, d, h, look.shoe || C.paper, lw, sd + 12);
    };
    const drawArm = (i) => {
      const A = arms[i], sd = seed + 200 + i * 20, ang = Math.atan2(A.e[1] - A.el[1], A.e[0] - A.el[0]);
      if (look.topKind === 'tank') limb(ctx, [sh, A.el, A.e], [F.armW * h * 1.3, F.armW * h, F.wristW * h], { fill: skin, lw, seed: sd });   // a sleeveless vest: the whole arm is bare
      else if (tee) {
        const cut = [lerp(sh[0], A.el[0], 0.58), lerp(sh[1], A.el[1], 0.58)];
        limb(ctx, [cut, A.el, A.e], [F.armW * h * 1.15, F.armW * h, F.wristW * h], { fill: skin, lw, seed: sd, shade: h * 0.04 });
        limb(ctx, [sh, cut], [F.sleeveW * h * 0.92, F.sleeveW * h], { fill: top, lw, seed: sd + 8, cap: 'end' });
      } else {
        limb(ctx, [sh, A.el, A.e], [F.sleeveW * h * 0.9, F.armW * h * 1.25, F.cuffArmW * h], { fill: top, lw, seed: sd, cap: 'end' });
        if (h >= 400) {   // the cuff band of a long sleeve, as the reference's medium shots draw it (the sweater at the cake, the walker's jacket); at wide size it would crowd the hand
          const L = Math.hypot(A.e[0] - A.el[0], A.e[1] - A.el[1]) || 1, ux = (A.e[0] - A.el[0]) / L, uy = (A.e[1] - A.el[1]) / L, c = [A.e[0] - ux * 0.035 * h, A.e[1] - uy * 0.035 * h], hw = F.cuffArmW * h * 0.47;
          IB.ink(ctx, [[c[0] - uy * hw, c[1] + ux * hw], [c[0] + uy * hw, c[1] - ux * hw]], { w: lw * 0.75, smooth: false, seed: sd + 9, taper: false });
        }
      }
      hand(ctx, A.e, ang, h, look.gloves || skin, lw * 0.9, sd + 12, kinds[i], d);   // gloves: a goalkeeper's hands in their colour
    };

    if (only !== 'near') {
      drawArm(0);
      drawLeg(0);
      drawLeg(1);
      limb(ctx, [at(F.torso - 0.02, 0.012), headAt], [0.05 * h, 0.044 * h], { fill: skin, lw, seed: seed + 50 });   // neck, tucked under the collar and the jaw
      // torso: one garment shape from the shoulders to a hem below the hip joint (u along the spine, f forward)
      const hem = shorts || look.tuck ? -0.03 : -0.085;
      IB.ink(ctx, [at(F.torso + 0.012, -0.03), at(F.torso + 0.02, 0.012), at(F.torso - 0.03, 0.06), at(F.torso * 0.55, 0.082), at(0.03, 0.08), at(hem, 0.078), at(hem, 0.076), at(hem, -0.076), at(hem, -0.078), at(0.05, -0.078), at(F.torso * 0.7, -0.074), at(F.torso - 0.03, -0.06)], { closed: true, fill: top, w: lw, seed: seed + 60, wob: 0.5 });
      head(ctx, headAt, lean * 0.5 + (pose.nod || 0) + (prev ? dl * 0.5 + dn * 0.5 : 0), d, h, { ...look, skin, face: pose.face || look.face }, lw, seed + 70, swing);   // the pose's face (what IB.posed and the scenes' tables set) over the look's
    }
    if (only !== 'far') drawArm(1);
    return { hip, sh, headAt, knees: legs.map((l) => l.k), elbows: arms.map((a) => a.el), feet: legs.map((l) => l.e), hands: arms.map((a) => a.e), drag: [-vx * 0.5, -vy * 0.5] };
  };

  /* joints(pose, look) — where IB.figure will put the shoulder and the two hip roots of a pose, without drawing it: { sh, roots: [far, near], arm, leg } with the arm's and the leg's full reach in px. A scene that places hands and feet by angle and length from these (IB.polar) cannot ask the IK for more than the limb has, which is how an overshoot drawing loses its hand. */
  IB.joints = (pose, look) => {
    const h = look.h, d = look.dir || 1, lean = pose.lean || 0, sx = Math.sin(lean) * d, sy = -Math.cos(lean), fx = Math.cos(lean) * d, fy = Math.sin(lean);
    const at = (u, f) => [pose.hip[0] + sx * u * h + fx * f * h, pose.hip[1] + sy * u * h + fy * f * h];
    return { sh: at(F.torso - 0.012, 0.004), roots: [at(0, 0.024), at(0, -0.024)], arm: (F.upper + F.fore) * h, leg: (F.thigh + F.shin) * h };
  };
  /* polar(from, ang, len) — the point len px from `from` at angle ang (rad, 0 = +x, +y down). */
  IB.polar = (p, ang, len) => [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len];

  /* posed(look, o) — a pose built from the body out: o is a pose ({ hip, lean, nod, hand, face, ... }) whose feet and hands may be given as reach instead of points. A foot { a, l, pitch } sits l x h from its hip root at angle a, a hand { a, l } l x h from the shoulder; a is measured as the figure faces (0 forward, -π/2 straight up, π/2 straight down, π back) so the same numbers work for dir 1 and -1, and l is held inside the limb (0.51 h a leg, 0.285 h an arm) so the IK never has to pull a hand or foot off its mark. A point [x, y(, pitch)] is kept as given (a planted foot). Feet and hands are far side first. */
  IB.posed = (look, o) => {
    const d = look.dir || 1, h = look.h, p = { lean: 0, nod: 0, ...o, feet: [], hands: [[0, 0], [0, 0]] }, j = IB.joints(p, look);
    const ang = (a) => (d === 1 ? a : Math.PI - a);
    p.feet = o.feet.map((f, i) => (Array.isArray(f) ? f : [...IB.polar(j.roots[i], ang(f.a), Math.min(f.l, 0.51) * h), f.pitch || 0]));
    p.hands = o.hands.map((w) => (Array.isArray(w) ? w : IB.polar(j.sh, ang(w.a), Math.min(w.l, 0.285) * h)));
    return p;
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

  /* reach(p, h, d) — lower the hip of a stepping pose just enough that every foot is within its leg's reach, so IB.figure's IK lands each ankle on its target instead of pulling it off. The near leg leaves the pelvis 0.048 h behind the far one, so on its heel strike its foot is the one that would fall short. Returns p. */
  const reach = (p, h, d) => {
    const lean = p.lean || 0, L = (F.thigh + F.shin) * h - 0.5;
    const drop = Math.max(0, ...p.feet.map((f, i) => {
      const r = [p.hip[0] + Math.cos(lean) * d * (i ? -0.024 : 0.024) * h, p.hip[1] + Math.sin(lean) * (i ? -0.024 : 0.024) * h], dx = f[0] - r[0], dy = f[1] - r[1];
      return Math.abs(dx) < L ? dy - Math.sqrt(L * L - dx * dx) : 0;
    }));
    p.hip[1] += drop;
    return p;
  };

  /* walk(x, floor, look, ph, opts) — one drawing of a walk cycle for a figure whose body is at x: ph 0..1 runs through two steps and ph = 0 is the contact with the near foot ahead. Draw 12 of them on twos for the reference's walk (1.0 s per two steps). Each step carries the body 2 x `stride` x h (stride defaults to 0.21: 0.42 h a step, so IB.walkLen = 0.84 h per cycle): either move x by that much per cycle across a still stage, or keep x and scroll the world under the feet.
     Stance foot: heel strike with the toe up 0.35 rad, flat by 15% of the stance, heel peeling up to 0.6 rad over its last 25%. Swing foot: 0.085 h off the floor on a half sine. Hip lowest at each contact, 0.028 h higher at mid-stance, and lowered further wherever a foot would be out of the leg's reach (the near heel strike: up to 0.014 h). Arms swing against the legs by `swing` x h (default 0.11); a scene whose figure carries something overwrites p.hands. */
  IB.walk = (x, floor, look, ph, o = {}) => {
    const h = look.h, d = look.dir || 1, step = (o.stride == null ? 0.21 : o.stride) * h, p = IB.stand(x, floor, look), ay = floor - F.ankle * h;
    const foot = (u) => {   // u: this foot's own phase. 0-0.5 on the floor sliding back under the body, 0.5-1 swinging forward
      if (u < 0.5) { const k = u / 0.5, pitch = k < 0.15 ? -0.35 * (1 - k / 0.15) : k > 0.75 ? (0.6 * (k - 0.75)) / 0.25 : 0; return [step * (1 - 2 * k), -IB.footLift(pitch, h), pitch]; }
      const k = (u - 0.5) / 0.5, pitch = lerp(0.6, -0.35, k);
      return [step * (-1 + 2 * k), -0.085 * h * Math.sin(k * Math.PI) - IB.footLift(pitch, h) * (1 - Math.sin(k * Math.PI)), pitch];
    };
    const near = foot(ph), far = foot((ph + 0.5) % 1), sw = Math.cos(ph * 2 * Math.PI) * (o.swing == null ? 0.11 : o.swing) * h;
    p.feet = [[x + far[0] * d, ay + far[1], far[2]], [x + near[0] * d, ay + near[1], near[2]]];
    p.hip[1] += h * (0.014 + 0.014 * Math.cos(ph * 4 * Math.PI));
    p.lean = o.lean == null ? 0.07 : o.lean;
    p.hands = [[p.hands[0][0] + sw * d, p.hands[0][1] - Math.abs(sw) * 0.25], [p.hands[1][0] - sw * d, p.hands[1][1] - Math.abs(sw) * 0.25]];
    return reach(p, h, d);
  };
  IB.walkLen = (look, stride = 0.21) => 4 * stride * look.h;

  /* run(x, floor, look, ph, opts) — one drawing of a run for a figure whose body is at x: ph 0..1 runs through two steps, ph = 0 is the near foot landing. Draw 8 of them on twos (0.67 s per two steps, 3 steps a second). Unlike the walk each foot is on the floor for only `stance` (0.3) of its cycle, so the body is in the air twice a cycle with both feet up, and it carries the body IB.runLen = 2 x `step` / `stance` = 1.47 h a cycle (2.2 h/s: 2.6 times the walk): move x by IB.runLen / 8 a drawing across a still stage and the planted foot stays put.
     Stance foot: lands flat-ish (toe up 0.15 rad) ahead by `step` x h (0.22) and slides back under the body. Swing foot: the heel kicks up under the seat (0.28 h off the floor, 0.1 h behind the hip, toe down) and the knee comes through high to land. Hips 0.05 h below a stand on the landing (so the leg reaches the foot out ahead), 0.075 h at mid-stance and 0.025 h in the air, and lower still wherever a foot would be out of the leg's reach (the near foot's landing: 0.007 h). Spine tipped forward 0.22 rad; arms bent, the hands pumping against the legs by `swing` x h (0.14) at waist height. */
  IB.run = (x, floor, look, ph, o = {}) => {
    const h = look.h, d = look.dir || 1, step = (o.step == null ? 0.22 : o.step) * h, ST = o.stance == null ? 0.3 : o.stance, p = IB.stand(x, floor, look), ay = floor - F.ankle * h;
    const foot = (u) => {   // u: this foot's own phase; 0-ST on the floor
      if (u < ST) { const k = u / ST, pitch = k < 0.3 ? -0.15 * (1 - k / 0.3) : k > 0.7 ? (0.5 * (k - 0.7)) / 0.3 : 0; return [step * (1 - 2 * k), -IB.footLift(pitch, h), pitch]; }
      const k = (u - ST) / (1 - ST);   // the heel kicks up under the seat first (to 0.1 h behind the hip, 0.28 h up), then the knee drives through and the foot reaches out to land
      const fx = k < 0.4 ? lerp(-step, -0.1 * h, Math.sin((k / 0.4) * Math.PI / 2)) : lerp(-0.1 * h, step, (1 - Math.cos(((k - 0.4) / 0.6) * Math.PI)) / 2);
      const fy = k < 0.4 ? 0.28 * h * Math.sin((k / 0.4) * Math.PI / 2) : 0.28 * h * (1 - Math.pow((k - 0.4) / 0.6, 1.6)), pitch = k < 0.4 ? lerp(0.5, 1.1, k / 0.4) : lerp(1.1, -0.15, (k - 0.4) / 0.6);
      return [fx, -fy - IB.footLift(pitch, h) * (1 - Math.sin(Math.PI * k)), pitch];
    };
    const near = foot(ph), far = foot((ph + 0.5) % 1), sw = Math.cos(ph * 2 * Math.PI) * (o.swing == null ? 0.14 : o.swing) * h;
    const bump = (u) => (u < ST ? Math.sin((Math.PI * u) / ST) : 0);
    p.feet = [[x + far[0] * d, ay + far[1], far[2]], [x + near[0] * d, ay + near[1], near[2]]];
    const down = ph % 0.5 < ST ? 0.05 + 0.025 * Math.max(bump(ph), bump((ph + 0.5) % 1)) : 0.025;
    p.hip[1] += h * down;
    p.lean = o.lean == null ? 0.22 : o.lean;
    const hy = p.hip[1] - 0.1 * h;   // the pumping hands ride at the waist, elbows bent
    p.hands = [[x + (0.06 * h + sw) * d, hy - Math.max(0, sw) * 0.5], [x + (0.06 * h - sw) * d, hy + Math.min(0, sw) * 0.5]];
    p.hand = ['grip', 'grip'];
    return reach(p, h, d);
  };
  IB.runLen = (look, step = 0.22, stance = 0.3) => (2 * step * look.h) / stance;

  /* poseMix(a, b, u) — the pose a fraction u of the way from a to b, joint by joint. For the one or two in-betweens of a move; a held pose is just a (the reference holds its poses dead still). u above 1 is an overshoot drawing (1.05-1.1, the body passing its mark before it settles on b): hip, lean, nod and hands go past b, the feet never do (a foot on the floor does not overshoot). */
  IB.poseMix = (a, b, u) => {
    const mixPts = (p, q, v) => p.map((w, i) => w.map((c, j) => lerp(c, q[i][j] == null ? c : q[i][j], v)));
    return { ...(u < 0.5 ? a : b), hip: [lerp(a.hip[0], b.hip[0], u), lerp(a.hip[1], b.hip[1], u)], lean: lerp(a.lean || 0, b.lean || 0, u), nod: lerp(a.nod || 0, b.nod || 0, u), feet: mixPts(a.feet, b.feet, Math.min(1, Math.max(0, u))), hands: mixPts(a.hands, b.hands, u) };
  };

  /* peg(ctx, hip, foot, opts) — the thin leg of an object that walks (the reference's folder and document): one narrow trouser leg, graphite where it leaves the body, a small boot. knee bows it sideways (px); dir -1 / 1 points the toe left / right. The body is drawn after its legs. For a leg that curves, kicks or shows the foot from the front, use IB.hose and IB.boot directly. */
  IB.peg = (ctx, hip, foot, o = {}) => {
    const { fill = '#d9d9d9', w = 13, lw = 2.8, seed = 1, knee = 0, dir = 1 } = o;
    const mid = [(hip[0] + foot[0]) / 2 + knee, (hip[1] + foot[1]) / 2];
    limb(ctx, knee ? [hip, mid, foot] : [hip, foot], knee ? [w, w, w * 0.92] : [w, w * 0.92], { fill, lw, seed, shade: 40 });
    IB.boot(ctx, foot, { dir, lw: lw * 0.93, seed: seed + 6 });
  };

  /* boot(ctx, at, opts) — the small white boot of an object character, ankle at `at`, sole 12 px below it. dir -1 / 1 points the toe left / right (a foot seen from the side: stepping, kicking); dir 0 is the foot seen from the front, which is how the reference draws a character that just stands. rot turns it about the ankle, for a foot in the air; s enlarges it; laces adds the two ticks that make it a sneaker. */
  IB.boot = (ctx, at, o = {}) => {
    const { dir = 1, rot = 0, s = 1, lw = 2.6, seed = 1, fill = C.paper, laces = false } = o, moved = rot || s !== 1, [x, y] = moved ? [0, 0] : at, w = lw / s;
    if (moved) { ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(rot); ctx.scale(s, s); }
    if (dir) {
      IB.ink(ctx, [[x - 8 * dir, y - 5], [x + 8 * dir, y - 5], [x + 9 * dir, y + 2], [x + 17 * dir, y + 8], [x + 14 * dir, y + 12], [x - 9 * dir, y + 12]], { closed: true, smooth: false, fill, w, seed });
      IB.seg(ctx, x - 7 * dir, y + 2, x + 8 * dir, y + 2, { w: w * 0.7, seed: seed + 1 });
      if (laces) for (const k of [0, 1]) IB.seg(ctx, x + (3 + k * 4) * dir, y - 4, x + (6 + k * 4) * dir, y + 1, { w: w * 0.6, seed: seed + 2 + k });
    } else {
      IB.ink(ctx, [[x - 7, y - 5], [x + 7, y - 5], [x + 8, y + 3], [x + 10, y + 9], [x + 8, y + 12], [x - 8, y + 12], [x - 10, y + 9], [x - 8, y + 3]], { closed: true, smooth: false, fill, w, seed });
      IB.seg(ctx, x - 7, y + 2, x + 7, y + 2, { w: w * 0.7, seed: seed + 1 });
      if (laces) for (const k of [0, 1]) IB.seg(ctx, x - 3, y + 5 + k * 3, x + 3, y + 5 + k * 3, { w: w * 0.6, seed: seed + 2 + k });
    }
    if (moved) ctx.restore();
  };

  /* hose(ctx, a, b, opts) — a rubber-hose limb from a to b: the leg or arm of an object character, which has no fixed bone lengths and curves as a whole. Filled, inked along both sides, open at both ends (the root melts into the body, the far end runs into a boot or a hand), graphite at the root.
     bow   px the middle bulges off the straight line: positive to the right of a limb that hangs down, i.e. to the left of the direction a -> b. One smooth arc
     via   [x, y] a joint to pass through instead: a knee or an elbow, with straight bones either side
     w, w1 width at the root and at the far end
     Returns the direction the limb is heading where it ends, rad, to aim the hand or the boot. */
  IB.hose = (ctx, a, b, o = {}) => {
    const { bow = 0, via = null, w = 13, w1 = w * 0.92, fill = '#d9d9d9', lw = 2.8, seed = 1, shade = 40 } = o;
    let pts = [a, b];
    if (via) pts = [a, via, b];
    else if (bow) {
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, c = [(a[0] + b[0]) / 2 + (dy / d) * bow * 2, (a[1] + b[1]) / 2 - (dx / d) * bow * 2];
      pts = [0, 0.25, 0.5, 0.75, 1].map((u) => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]]);
    }
    const n = pts.length - 1;
    limb(ctx, pts, pts.map((_, i) => lerp(w, w1, i / n)), { fill, lw, seed, shade });
    return Math.atan2(b[1] - pts[n - 1][1], b[0] - pts[n - 1][0]);
  };

  /* mitt(ctx, wrist, ang, opts) — the small hand of an object character: a round palm and separate fingers, pointing along `ang` (use what IB.hose returned). The reference gives these characters real little hands, and the fingers carry the acting once the arm has arrived.
     kind  'rest'  fingers together and curled, a hand that hangs
           'reach' fingers together and straight, a hand held out
           'open'  fingers fanned, a hand thrown up or shown
     flip  -1 puts the thumb on the other side. s scales the hand (1 = 24 px long, a 240 px character).
     Aim it along the forearm for a hand held out, and 0.5-1 rad past it toward the floor for a limp wrist. */
  const MITT = {   // fingers as [angle off the hand's axis, length]; the last entry is the thumb
    rest: [[0.62, 6.5], [0.27, 8], [-0.08, 8], [-0.8, 5.5]],
    reach: [[0.36, 10.5], [0.06, 12.5], [-0.24, 11.5], [-0.95, 7.5]],
    open: [[0.6, 10], [0.2, 12.5], [-0.2, 12.5], [-0.6, 10.5], [-1.25, 8]],
  };
  IB.mitt = (ctx, wrist, ang, o = {}) => {
    const { kind = 'rest', flip = 1, s = 1, lw = 2.2, fill = C.bg, seed = 1 } = o, F = MITT[kind], w = lw / s, r = 2.9;
    ctx.save();
    ctx.translate(wrist[0], wrist[1]);
    ctx.rotate(ang);
    ctx.scale(s, s * flip);
    // each finger is a capsule that starts inside the palm: outline round the tip, open at the root
    const finger = ([a, len], i) => {
      const c = Math.cos(a), sn = Math.sin(a), at = (d, side) => [7 + c * d - sn * r * side, sn * d + c * r * side], L = 5 + len;
      const pts = [at(2, -1), at(L - r, -1), at(L - r * 0.3, -0.72), at(L, 0), at(L - r * 0.3, 0.72), at(L - r, 1), at(2, 1)];
      IB.ink(ctx, pts, { closed: true, fill, w: 0, seed: seed + i, wob: 0.15 });
      IB.ink(ctx, pts, { w, seed: seed + i, wob: 0.15, taper: false });
    };
    F.forEach(finger);
    IB.oval(ctx, 6.5, 0, 7.4, 5.6, { fill, w, seed: seed + 7, n: 10 });
    // the fingers open into the palm: paint their roots back over the palm's outline
    F.forEach(([a], i) => IB.ink(ctx, [[7 + Math.cos(a) * 3, Math.sin(a) * 3], [7 + Math.cos(a) * 9.5, Math.sin(a) * 9.5]], { w: r * 2 - w, color: fill, smooth: false, taper: false, grain: 0, wob: 0, seed: seed + i }));
    ctx.restore();
  };

  /* clasp(ctx, at, opts) — two mitts holding each other, drawn as the one shape they make: a knot of knuckles where two arms meet. `rot` tips it with the arms. */
  IB.clasp = (ctx, at, o = {}) => {
    const { s = 1, rot = 0, lw = 2.4, fill = C.bg, seed = 1 } = o;
    ctx.save();
    ctx.translate(at[0], at[1]);
    ctx.rotate(rot);
    ctx.scale(s, s);
    const w = lw / s;
    IB.ink(ctx, [[-14, -3], [-8, -9], [1, -10], [10, -8], [15, -2], [14, 5], [9, 10], [3, 9], [-2, 12], [-8, 10], [-13, 5]], { closed: true, fill, w, seed });
    IB.ink(ctx, [[-6, -8], [-2, -3], [5, -2]], { w: w * 0.8, seed: seed + 1 });          // the thumb laid over the top
    for (const [x, y] of [[-7, 4], [-1, 5.5], [5, 4.5]]) IB.ink(ctx, [[x, y - 3], [x + 0.8, y + 3.5]], { w: w * 0.7, smooth: false, seed: seed + 2 + x });   // knuckles
    ctx.restore();
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

  /* pointer(ctx, tip, opts) — a hand from off-screen with one finger out: a sleeve, a fist with three folded fingers, the pointing finger and its nail. Drawn at insert size (the finger is 92 px thick at scale 1) with the fingertip at `tip`, pointing left and the sleeve running off to the lower right; `scale` shrinks it for a wide shot, `rot` turns it about the fingertip (-PI / 2 points it down from above), `flip` mirrors it to point right. The mirror is applied after the turn, so with flip the turn runs the other way: a mirrored hand pointing down from above is rot +PI / 2. lw is the outline width on screen, whatever the scale. */
  IB.pointer = (ctx, tip, o = {}) => {
    const { scale = 1, rot = 0, flip = false, sleeve = C.yellow, skin = C.skin[1], lw = 8, seed = 540 } = o, w = lw / scale;
    ctx.save();
    ctx.translate(tip[0], tip[1]); ctx.rotate(rot); ctx.scale(flip ? -scale : scale, scale);
    IB.tube(ctx, [[560, 330], [1500, 640]], { w: 250, edge: w, fill: sleeve, seed });
    IB.ink(ctx, [[250, 10], [420, 40], [600, 180], [640, 330], [520, 440], [330, 400], [220, 270], [200, 110]], { closed: true, fill: skin, w, seed: seed + 1 });
    for (const [x, y] of [[250, 168], [300, 262], [372, 338]]) IB.ink(ctx, [[x, y], [x + 60, y - 44], [x + 130, y - 36]], { w: w * 0.875, seed: seed + 2 + x });
    IB.tube(ctx, [[300, 80], [150, 34], [44, 8]], { w: 92, edge: w, fill: skin, smooth: true, seed: seed + 6 });
    IB.ink(ctx, [[12, -18], [60, -26], [96, -14]], { w: w * 0.75, seed: seed + 7 });
    ctx.restore();
  };

  /* reachArm(ctx, hand, opts) — an arm from off-screen right that holds a string or a small thing: a long sleeve swept in from x `from`, a cuff, and a closed hand with three finger lines, the hand's knuckles at `hand` facing left. Coloured like the other off-screen arm (IB.pointer) but at wide-shot size: sleeve 42 px. Use it only while the arm is used: four drawings in, three out (vignette/balloons-lift-chair). New, not measured. */
  IB.reachArm = (ctx, [hx, hy], o = {}) => {
    const { from = 2700, sleeve = C.bg, skin = C.skin[1], seed = 400 } = o;   // 2700: past the right edge of any frame a camera takes of the stage
    ctx.save();
    IB.tube(ctx, [[from, hy + 70], [hx + 150, hy + 26], [hx + 36, hy + 4]], { w: 42, edge: 3.2, fill: sleeve, smooth: true, seed });
    IB.ink(ctx, [[hx + 44, hy - 20], [hx + 30, hy - 22], [hx + 28, hy + 30], [hx + 44, hy + 30]], { closed: true, smooth: false, fill: C.paper, w: 2.6, seed: seed + 1 });   // cuff
    IB.ink(ctx, [[hx + 30, hy - 16], [hx + 4, hy - 20], [hx - 16, hy - 8], [hx - 18, hy + 10], [hx + 2, hy + 22], [hx + 30, hy + 24]], { closed: true, fill: skin, w: 3, seed: seed + 2 });
    for (const dy of [-6, 4, 13]) IB.ink(ctx, [[hx - 14, hy + dy], [hx + 2, hy + dy - 1]], { w: 2, seed: seed + 4 + dy });
    ctx.restore();
  };

  /* shake(ctx, x, y, r, opts) — the two or three short arcs the reference draws beside something that trembles, swings or has just stopped. Centred on (x, y) at distance r, facing angle `a`; `n` arcs, each a little longer than the one inside it. Re-seed it per drawn frame to make it flicker, or leave it to hold. */
  IB.shake = (ctx, x, y, r, o = {}) => {
    const { a = 0, n = 2, w = 2.4, gap = 9, span = 0.42, seed = 1, color = C.ink } = o;
    for (let i = 0; i < n; i++) IB.ink(ctx, IB.ellipse(x, y, r + i * gap, r + i * gap, 5, a - span * (0.8 + i * 0.2), a + span * (0.8 + i * 0.2)), { w, seed: seed + i, color });
  };
})(window);
