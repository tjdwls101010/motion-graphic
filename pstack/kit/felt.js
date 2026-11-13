/* Felt paper-craft SVG builders. Coordinates are in the 1920 × 1080 stage; callers animate groups in render. The stage layout at camera zoom 1 follows the reference: wooden board frame at 150–1650 × 65–865, bunting string above it, wall clock top right, shelf right, floor from y 905. Large surfaces (wall, cork, wood, floor) are tiled patterns so they cost nothing per frame; only small pieces (tags, badges, potato, bubbles, people) carry an SVG filter that adds felt fibre, a wobbly edge and a two-layer shadow. Filters are only ever put on shape elements, never on a group holding text, so handwriting stays crisp. */
(function (g) {
  const F = g.Felt = {}, S = MG.svg;
  const H = MG.hash;
  /** Board frame geometry shared by the board and the scenes (outer edge of the wood). */
  F.BOARD = { x: 150, y: 65, w: 1500, h: 800 };
  /** Floor top edge in the stage. */
  F.FLOOR = 905;
  /** Ink colour for handwriting. */
  F.INK = "#2c221c";
  /** Create an SVG node from a tag, attribute map and children. */
  F.node = (tag, a, ...c) => S(tag, a, ...c);
  /** Append an SVG node to parent p from a tag, attribute map and children. */
  F.add = (p, tag, a, ...c) => {
    const n = S(tag, a, ...c);
    p.append(n);
    return n;
  };
  /** Wobbly closed polygon path: n vertices around an ellipse (rx, ry) at cx, cy, each pushed by up to amp pixels, seeded for repeatability. */
  const blob = (cx, cy, rx, ry, n, amp, seed) => {
    let d = "";
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const k = 1 + (H(i, seed) - .5) * 2 * amp / Math.max(rx, ry);
      d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`;
    }
    return d + "Z";
  };
  /** Torn-paper rectangle path of size w × h: each edge is a polyline with small jitter, the look of a hand-ripped strip. */
  const torn = (w, h, seed, amp = 2.4, step = 20) => {
    const pts = [];
    const edge = (x0, y0, x1, y1, nx, ny) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(2, Math.round(len / step));
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const j = (H(pts.length, seed) - .5) * 2 * amp;
        pts.push([x0 + (x1 - x0) * u + nx * j, y0 + (y1 - y0) * u + ny * j]);
      }
    };
    edge(0, 0, w, 0, 0, 1);
    edge(w, 0, w, h, 1, 0);
    edge(w, h, 0, h, 0, 1);
    edge(0, h, 0, 0, 1, 0);
    return "M" + pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L") + "Z";
  };
  F.torn = torn;
  F.blob = blob;
  /** Build a felt filter: a low-frequency displacement for the wobbly edge, an optional second finer one for deckled paper, dark and light fibre noise clipped to the shape, and a two-layer soft shadow. */
  const feltFilter = (id, o) => {
    const fine = o.deckle
      ? `<feTurbulence type="fractalNoise" baseFrequency=".28" numOctaves="2" seed="${o.seed + 3}" result="w2"/><feDisplacementMap in="shapeA" in2="w2" scale="${o.deckle}" xChannelSelector="G" yChannelSelector="B" result="shape"/>`
      : `<feOffset in="shapeA" dx="0" dy="0" result="shape"/>`;
    return `<filter id="${id}" x="-20%" y="-35%" width="140%" height="190%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${o.warpFreq}" numOctaves="2" seed="${o.seed}" result="w1"/>
      <feDisplacementMap in="SourceGraphic" in2="w1" scale="${o.warp}" xChannelSelector="R" yChannelSelector="G" result="shapeA"/>
      ${fine}
      <feTurbulence type="fractalNoise" baseFrequency="${o.fibre}" numOctaves="2" seed="${o.seed + 7}" result="fib"/>
      <feColorMatrix in="fib" type="matrix" values="0 0 0 0 .28  0 0 0 0 .16  0 0 0 0 .06  0 0 0 ${o.dark} ${-o.dark * .38}" result="dark"/>
      <feColorMatrix in="fib" type="matrix" values="0 0 0 0 1  0 0 0 0 .96  0 0 0 0 .84  0 0 0 ${o.light} ${-o.light * .62}" result="light"/>
      <feComposite in="dark" in2="shape" operator="in" result="darkIn"/>
      <feComposite in="light" in2="shape" operator="in" result="lightIn"/>
      <feColorMatrix in="shape" type="matrix" values="0 0 0 0 .3  0 0 0 0 .17  0 0 0 0 .07  0 0 0 ${o.shadow} 0" result="sh"/>
      <feGaussianBlur in="sh" stdDeviation="9" result="shBig"/>
      <feOffset in="shBig" dx="4" dy="11" result="shBigO"/>
      <feGaussianBlur in="sh" stdDeviation="1.8" result="shSm"/>
      <feOffset in="shSm" dx="1.5" dy="3.5" result="shSmO"/>
      <feMerge><feMergeNode in="shBigO"/><feMergeNode in="shSmO"/><feMergeNode in="shape"/><feMergeNode in="darkIn"/><feMergeNode in="lightIn"/></feMerge>
    </filter>`;
  };
  /** Tiled cork: a diagonal lattice of dark dots plus short light and dark scratch strokes on tan. */
  const corkPattern = () => {
    let s = `<pattern id="cork" width="132" height="132" patternUnits="userSpaceOnUse"><rect width="132" height="132" fill="#d3a56d"/>`;
    for (let i = 0; i < 70; i++) {
      const x = H(i, 31) * 132, y = H(i, 32) * 132, a = -.55 - H(i, 33) * .7, len = 9 + H(i, 34) * 12;
      const dark = i % 3 === 0;
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a) * len).toFixed(1)} ${(Math.sin(a) * len).toFixed(1)}" stroke="${dark ? "#b58349" : "#e9c993"}" stroke-width="1.6" stroke-linecap="round" opacity="${dark ? .42 : .5}"/>`;
    }
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        s += `<circle cx="${(c * 22 + (r % 2) * 11 + 5).toFixed(1)}" cy="${(r * 22 + 6).toFixed(1)}" r="1.7" fill="#a8723e" opacity=".7"/>`;
      }
    }
    return s + "</pattern>";
  };
  /** Tiled wood grain: a brown base with long wavy darker and lighter fibres. */
  const woodPattern = (id, base, dark, light, w, h, extra = "") => {
    let s = `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" ${extra}><rect width="${w}" height="${h}" fill="${base}"/>`;
    for (let i = 0; i < 14; i++) {
      const y = H(i, 41) * h, x0 = H(i, 42) * w * .5, len = w * (.35 + H(i, 43) * .6), amp = (H(i, 44) - .5) * 5;
      s += `<path d="M${x0.toFixed(1)} ${y.toFixed(1)} q${(len / 2).toFixed(1)} ${amp.toFixed(1)} ${len.toFixed(1)} 0" fill="none" stroke="${i % 2 ? dark : light}" stroke-width="${(1 + H(i, 45) * 1.4).toFixed(1)}" opacity=".5" stroke-linecap="round"/>`;
    }
    return s + "</pattern>";
  };
  /** Create the full-stage SVG in stage with reusable patterns and felt filters. Returns the svg element. */
  F.root = (stage) => {
    const svg = S("svg", { viewBox: "0 0 1920 1080", width: 1920, height: 1080 });
    const dots = `<pattern id="flagDots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.8" fill="#fff" opacity=".7"/><circle cx="11.5" cy="11.5" r="2.8" fill="#fff" opacity=".7"/></pattern>`;
    const wall = `<pattern id="wall" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#b9e3d3"/><rect x="45" width="45" height="90" fill="#a6d8c6"/><circle cx="12" cy="20" r="1.2" fill="#8fc4b0" opacity=".5"/><circle cx="66" cy="62" r="1.2" fill="#8fc4b0" opacity=".5"/><circle cx="30" cy="75" r="1" fill="#fff" opacity=".35"/></pattern>`;
    const stripeBack = (id, a, b) => `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="30" height="30" fill="${a}"/><rect width="14" height="30" fill="${b}"/></pattern>`;
    svg.innerHTML = `<defs>
      ${feltFilter("felt", { seed: 4, warpFreq: ".03", warp: 6, fibre: ".85", dark: .55, light: .9, shadow: .55 })}
      ${feltFilter("paper", { seed: 11, warpFreq: ".045", warp: 3.5, deckle: 2.6, fibre: ".7", dark: .22, light: .5, shadow: .42 })}
      ${corkPattern()}
      ${woodPattern("woodH", "#8d5226", "#5f3414", "#b97a47", 260, 44)}
      ${woodPattern("woodV", "#8d5226", "#5f3414", "#b97a47", 260, 44, 'patternTransform="rotate(90)"')}
      ${woodPattern("floor", "#cb8a52", "#8f5a2c", "#e2aa72", 400, 56)}
      ${woodPattern("plank", "#d8a06a", "#9a6636", "#efc790", 300, 34)}
      ${wall}${dots}
      ${stripeBack("stripePink", "#f0a6c0", "#f7c3d6")}${stripeBack("stripeNavy", "#34407a", "#46528f")}${stripeBack("stripeGreen", "#79c28a", "#8ed39d")}${stripeBack("stripePurple", "#a78ad2", "#b9a1df")}${stripeBack("stripeCream", "#f1ead7", "#d8cfb8")}
      <clipPath id="potatoClip"><path d="${potatoBody}"/></clipPath>
      <linearGradient id="shadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a10" stop-opacity=".38"/><stop offset="1" stop-color="#4a2a10" stop-opacity="0"/></linearGradient>
      <linearGradient id="shadeLeft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2a10" stop-opacity=".3"/><stop offset="1" stop-color="#4a2a10" stop-opacity="0"/></linearGradient>
    </defs>`;
    stage.append(svg);
    return svg;
  };
  /** Draw handwriting in parent p at x,y with a label, size and extra SVG attributes. The fill is also stroked thinly so the Gaegu strokes read bolder, like the felt-pen lettering in the reference. */
  F.text = (p, x, y, text, size = 48, extra = {}) =>
    F.add(p, "text", {
      x, y, "font-family": "Gaegu", "font-weight": "700", "font-size": size, fill: F.INK,
      stroke: extra.fill || F.INK, "stroke-width": size * .02, "stroke-linejoin": "round", ...extra, text,
    });
  /** Draw the striped wallpaper and the wooden floor with its top edge into parent p. */
  F.wall = (p) => {
    F.add(p, "rect", { width: 1920, height: 1080, fill: "url(#wall)" });
    F.add(p, "rect", { x: 0, y: F.FLOOR, width: 1920, height: 175, fill: "url(#floor)" });
    F.add(p, "rect", { x: 0, y: F.FLOOR, width: 1920, height: 7, fill: "#7a4a22", opacity: .45 });
    F.add(p, "rect", { x: 0, y: F.FLOOR + 7, width: 1920, height: 5, fill: "#e8b987", opacity: .5 });
    // Plank seams on the floor.
    for (let i = 0; i < 3; i++) {
      F.add(p, "path", { d: `M0 ${F.FLOOR + 48 + i * 52} H1920`, stroke: "#8a5527", "stroke-width": 1.5, opacity: .35 });
    }
  };
  /** One bunting flag: a slightly curved triangle hanging from (x, y) with a wobbly tip, tinted fill, optional polka dots. */
  const flag = (p, x, y, ang, fill, dotted, i) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y}) rotate(${ang})` });
    const tip = (H(i, 5) - .5) * 8;
    const d = `M-31 0 Q0 -3 31 0 Q${18 + tip} 36 ${3 + tip} 66 Q${-14 + tip} 34 -31 0Z`;
    F.add(q, "path", { d, fill });
    if (dotted) F.add(q, "path", { d, fill: "url(#flagDots)" });
  };
  /** Draw the wooden framed corkboard, its inner shadow and the bunting string with flags into parent p. */
  F.board = (p) => {
    const B = F.BOARD, t = 25;
    // Cork first so the frame covers its rough edge.
    F.add(p, "rect", { x: B.x + t - 4, y: B.y + t - 4, width: B.w - 2 * t + 8, height: B.h - 2 * t + 8, fill: "url(#cork)" });
    F.add(p, "rect", { x: B.x + t, y: B.y + t, width: B.w - 2 * t, height: 36, fill: "url(#shadeTop)" });
    F.add(p, "rect", { x: B.x + t, y: B.y + t, width: 30, height: B.h - 2 * t, fill: "url(#shadeLeft)" });
    // Frame: four wood strips with a darker outer line and a light inner highlight.
    F.add(p, "path", { d: torn(B.w, t, 3, 1.2, 40), transform: `translate(${B.x} ${B.y})`, fill: "url(#woodH)" });
    F.add(p, "path", { d: torn(B.w, t, 5, 1.2, 40), transform: `translate(${B.x} ${B.y + B.h - t})`, fill: "url(#woodH)" });
    F.add(p, "path", { d: torn(t, B.h, 7, 1.2, 40), transform: `translate(${B.x} ${B.y})`, fill: "url(#woodV)" });
    F.add(p, "path", { d: torn(t, B.h, 9, 1.2, 40), transform: `translate(${B.x + B.w - t} ${B.y})`, fill: "url(#woodV)" });
    F.add(p, "rect", { x: B.x + t, y: B.y + t, width: B.w - 2 * t, height: B.h - 2 * t, fill: "none", stroke: "#5c3213", "stroke-width": 2.5, opacity: .7 });
    F.add(p, "rect", { x: B.x + 2, y: B.y + 2, width: B.w - 4, height: B.h - 4, fill: "none", stroke: "#bd8450", "stroke-width": 1.5, opacity: .55 });
    // Bunting string and 17 flags following its sag.
    const sx = 108, ex = 1672, y0 = 36, sag = 100;
    const yAt = (u) => y0 + sag * u * (1 - u);
    F.add(p, "path", { d: `M${sx} ${y0 - 1} Q${(sx + ex) / 2} ${y0 + sag / 2 * 2 - 1} ${ex} ${y0 - 2}`, fill: "none", stroke: "#2b2622", "stroke-width": 3 });
    const cols = [["#f2a2c0"], ["#f3d067", 1], ["#c3deee"], ["#9d8bd9", 1], ["#37a09c"], ["#a3dccb", 1]];
    const row = F.add(p, "g", { filter: "url(#felt)" });
    for (let i = 0; i < 17; i++) {
      const x = 160 + i * 92.2, u = (x - sx) / (ex - sx);
      const ang = Math.atan(sag * (1 - 2 * u) / (ex - sx)) * 180 / Math.PI;
      flag(row, x, yAt(u) + 1, ang, cols[i % 6][0], cols[i % 6][1], i);
    }
  };
  /** Draw the wall clock (wooden rim, cream face, twelve ticks, hands showing 10:08) into parent p. */
  F.clock = (p) => {
    const cx = 1790, cy = 235;
    F.add(p, "circle", { cx: cx + 5, cy: cy + 9, r: 82, fill: "#5a3418", opacity: .28 });
    F.add(p, "path", { d: blob(cx, cy, 82, 82, 60, 1.4, 21), fill: "url(#woodH)" });
    F.add(p, "circle", { cx, cy, r: 68, fill: "#f6f0e0" });
    F.add(p, "circle", { cx, cy, r: 68, fill: "none", stroke: "#a8693a", "stroke-width": 3 });
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, r0 = i % 3 ? 52 : 47;
      F.add(p, "path", { d: `M${cx + r0 * Math.sin(a)} ${cy - r0 * Math.cos(a)} L${cx + 58 * Math.sin(a)} ${cy - 58 * Math.cos(a)}`, stroke: "#3a2c24", "stroke-width": 3, "stroke-linecap": "round" });
    }
    F.add(p, "path", { d: `M${cx} ${cy} L${cx - 40} ${cy - 14} M${cx} ${cy} L${cx + 6} ${cy - 52}`, stroke: "#2e2420", "stroke-width": 5, fill: "none", "stroke-linecap": "round" });
    F.add(p, "circle", { cx, cy, r: 5, fill: "#2e2420" });
  };
  /** Draw the wall shelf with the blue-potted plant and the yellow mug with steam into parent p. */
  F.shelf = (p) => {
    F.add(p, "rect", { x: 1678, y: 706, width: 246, height: 24, fill: "#5e3418", opacity: .25, transform: "translate(4 6)" });
    F.add(p, "rect", { x: 1678, y: 700, width: 246, height: 24, fill: "url(#woodH)" });
    F.add(p, "rect", { x: 1678, y: 700, width: 246, height: 5, fill: "#d9a06a", opacity: .6 });
    // Plant: five layered paper leaves in two greens above a blue pot.
    const leaves = [[-34, -22, "#4f9a5b"], [34, 24, "#4f9a5b"], [-14, -6, "#3d8a4c"], [16, 8, "#6fb26a"], [0, 0, "#4a9558"]];
    const lf = F.add(p, "g", { filter: "url(#felt)" });
    leaves.forEach(([dx, rot, col], i) => {
      F.add(lf, "path", { d: "M0 0 Q-20 -38 -4 -86 Q22 -44 0 0Z", fill: col, transform: `translate(${1738 + dx * .5} 680) rotate(${rot} 0 0) scale(${1 + i * .02})` });
    });
    F.add(p, "path", { d: "M1716 636 H1778 L1772 690 H1722Z", fill: "#4a6fc2" });
    F.add(p, "path", { d: "M1730 636 V690 M1750 636 V690", stroke: "#6a8fdc", "stroke-width": 4, opacity: .7 });
    F.add(p, "path", { d: "M1716 636 H1778", stroke: "#2f4a94", "stroke-width": 4 });
    // Mug and steam.
    const mug = F.add(p, "g", { filter: "url(#felt)" });
    F.add(mug, "path", { d: "M1843 622 H1893 L1890 700 H1848Z", fill: "#f4cf45" });
    F.add(mug, "path", { d: "M1892 636 Q1914 640 1908 662 Q1904 674 1890 674", fill: "none", stroke: "#f4cf45", "stroke-width": 10 });
    for (let i = 0; i < 3; i++) {
      F.add(p, "path", { d: `M${1852 + i * 14} 596 q-8 -12 0 -22 t0 -24`, fill: "none", stroke: "#fff", "stroke-width": 3, opacity: .75, "stroke-linecap": "round" });
    }
  };
  /** Draw a red push-pin in parent p at x,y: shadow, glossy ball and a small highlight. */
  F.pin = (p, x, y) => {
    F.add(p, "ellipse", { cx: x + 3, cy: y + 6, rx: 11, ry: 9, fill: "#4e2616", opacity: .35 });
    F.add(p, "circle", { cx: x, cy: y, r: 11.5, fill: "#a82c3a" });
    F.add(p, "circle", { cx: x, cy: y, r: 11.5, fill: "none", stroke: "#7f1f2d", "stroke-width": 1.5 });
    F.add(p, "circle", { cx: x - 3.5, cy: y - 3.5, r: 3.6, fill: "#ee8f95" });
  };
  /** Draw a translucent masking-tape strip centred at x,y with width w, height h and rotation rot (degrees). */
  F.tape = (p, x, y, w = 110, h = 36, rot = 0) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y}) rotate(${rot})` });
    F.add(q, "path", { d: `M${-w / 2} ${-h / 2} l5 ${h / 4} -4 ${h / 4} 5 ${h / 4} -5 ${h / 4} H${w / 2} l-5 ${-h / 4} 4 ${-h / 4} -5 ${-h / 4} 5 ${-h / 4}Z`, fill: "#f2e5a8", opacity: .62 });
    F.add(q, "path", { d: `M${-w / 2 + 8} ${-h / 4} H${w / 2 - 8}`, stroke: "#fff7d0", "stroke-width": 2, opacity: .4 });
    return q;
  };
  /** Draw a pinned paper portrait at x,y with width w and height h: deckled cream border, a dark photo window with a neutral silhouette and dust specks, two tape corners and a red pin at the top. Returns the group (pin is local at w/2, 12). */
  F.photo = (p, x, y, w = 420, h = 415, rot = -1.6) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y})` });
    const r = F.add(q, "g", { transform: `rotate(${rot} ${w / 2} ${h / 2})` });
    F.add(r, "path", { d: torn(w, h, 17, 3, 26), fill: "#f6efd8", filter: "url(#paper)" });
    F.add(r, "rect", { x: 22, y: 22, width: w - 44, height: h - 68, fill: "#232726" });
    F.add(r, "circle", { cx: w / 2, cy: h * .34, r: w * .13, fill: "#a99b88" });
    F.add(r, "path", { d: `M${w * .2} ${h * .8} Q${w * .21} ${h * .48} ${w * .5} ${h * .5} Q${w * .79} ${h * .48} ${w * .8} ${h * .8}Z`, fill: "#81796e" });
    for (let i = 0; i < 40; i++) {
      F.add(r, "circle", { cx: 24 + H(i, 61) * (w - 48), cy: 24 + H(i, 62) * (h - 72), r: .9 + H(i, 63) * 1.2, fill: "#fff", opacity: .35 });
    }
    F.tape(r, 24, 18, 120, 38, -38);
    F.tape(r, w - 24, 18, 120, 38, 38);
    F.pin(r, w / 2, 14);
    return q;
  };
  /** Create a drawable red string in parent p along SVG path d (pathLength 1 so MG.draw can reveal it). */
  F.string = (p, d) => F.add(p, "path", { d, fill: "none", stroke: "#b3303c", "stroke-width": 3.6, "stroke-linecap": "round", pathLength: 1 });
  /** Draw a torn paper tag at x,y of width w, height h, with a label and font size. o.tape adds a tape strip on top, o.pin puts a pin on the left edge (or the right edge when it is "right"), o.fill recolours the paper, o.rot tilts it, o.color colours the lettering, o.spacing sets letter-spacing. Returns the outer group; the paper element is q.paper and the tilted inner group (where extra content belongs) is q.inner. */
  F.tag = (p, x, y, w, h, label, size = 48, o = {}) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y})` });
    const r = F.add(q, "g", { transform: `rotate(${o.rot ?? -1} ${w / 2} ${h / 2})` });
    q.inner = r;
    q.paper = F.add(r, "path", { d: torn(w, h, o.seed ?? (label.length * 7 + 3), 3, 22), fill: o.fill || "#f5eedb", filter: "url(#paper)" });
    if (o.tape) F.tape(r, w * (o.tapeAt ?? .5), -2, Math.min(130, w * .4), 38, o.tapeRot ?? 0);
    const extra = { "text-anchor": "middle", "letter-spacing": o.spacing ?? size * .06 };
    if (o.color) extra.fill = o.color;
    if (label) q.label = F.text(r, w / 2 + (o.pin ? (o.pin === "right" ? -14 : 14) : 0), h * .5 + size * .3, label, size, extra);
    if (o.pin) F.pin(r, o.pin === "right" ? w - 16 : 16, h * .5);
    return q;
  };
  /** Draw a felt circle badge at x,y with a letter label and fill colour: scalloped cream rim about 14 px thick, a coloured disc inside and a heavy letter. */
  F.badge = (p, x, y, label, fill = "#cfe5f2") => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y})` });
    F.add(q, "path", { d: blob(0, 0, 90, 90, 70, 2.2, 13), fill: "#f6efe0", filter: "url(#felt)" });
    F.add(q, "path", { d: blob(0, 0, 74, 74, 50, 1.2, 14), fill, opacity: .96 });
    F.add(q, "text", { x: 0, y: 34, "font-family": "Pretendard", "font-weight": 900, "font-size": 100, "text-anchor": "middle", fill: "#231b17", text: label });
    return q;
  };
  /** Lumpy potato silhouette (used by the body, the clip path and the fibre strokes). Centred on 0,0. */
  const potatoBody = "M-104 10 Q-112 -34 -78 -62 Q-48 -86 -8 -80 Q22 -98 58 -82 Q98 -66 104 -22 Q116 14 96 52 Q80 86 30 90 Q-6 96 -40 90 Q-84 86 -98 52 Q-106 34 -104 10Z";
  /** Draw a smiling potato in parent p at x,y and scale s: lumpy tan felt with scratchy darker fibre strokes, dark speckles, rosy cheeks, glossy eyes, a tiny smile, a green sprout and two brown feet. About 210 px wide at s = 1. Eyes carry class potato-eye (see F.blink) and the mouths can be switched with F.mood. */
  F.potato = (p, x, y, s = 1, o = {}) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y}) scale(${s})` });
    F.add(q, "ellipse", { cx: -38, cy: 92, rx: 20, ry: 10, fill: "#a8703c" });
    F.add(q, "ellipse", { cx: 38, cy: 92, rx: 20, ry: 10, fill: "#a8703c" });
    const body = F.add(q, "g", { filter: "url(#felt)" });
    F.add(body, "path", { d: potatoBody, fill: "#e2bd84" });
    const fib = F.add(body, "g", { "clip-path": "url(#potatoClip)" });
    for (let i = 0; i < 90; i++) {
      const bx = (H(i, 71) - .5) * 220, by = (H(i, 72) - .5) * 200, len = 14 + H(i, 73) * 18;
      F.add(fib, "path", {
        d: `M${bx.toFixed(1)} ${by.toFixed(1)} l${(len * .8).toFixed(1)} ${(-len * .8).toFixed(1)}`,
        stroke: i % 4 ? "#c0914f" : "#f0d8a6", "stroke-width": 2.4, "stroke-linecap": "round", opacity: .7,
      });
    }
    [[-66, -30, 7], [62, 38, 6], [-78, 40, 5], [70, -52, 5.5], [-20, 70, 4.5]].forEach(([sx, sy, sr]) => {
      F.add(body, "ellipse", { cx: sx, cy: sy, rx: sr, ry: sr * .8, fill: "#b4803f", opacity: .85 });
    });
    // Sprout: short stem and two leaves.
    const sp = F.add(q, "g", { filter: "url(#felt)" });
    F.add(sp, "path", { d: "M-2 -88 Q-6 -108 -4 -114", stroke: "#5c9a4c", "stroke-width": 5, fill: "none", "stroke-linecap": "round" });
    F.add(sp, "path", { d: "M-4 -112 Q-34 -128 -40 -108 Q-18 -100 -4 -112Z", fill: "#6fae58" });
    F.add(sp, "path", { d: "M-3 -112 Q22 -134 40 -118 Q22 -98 -3 -112Z", fill: "#58a04f" });
    // Face.
    F.add(q, "ellipse", { cx: -50, cy: 20, rx: 14, ry: 9, fill: "#ef9a93", opacity: .8 });
    F.add(q, "ellipse", { cx: 50, cy: 20, rx: 14, ry: 9, fill: "#ef9a93", opacity: .8 });
    [-28, 28].forEach((ex) => {
      const eye = F.add(q, "g", { class: "potato-eye" });
      F.add(eye, "ellipse", { cx: ex, cy: -4, rx: 7.5, ry: 9, fill: "#2d2320" });
      F.add(eye, "circle", { cx: ex - 2.2, cy: -7.5, r: 2.6, fill: "#fff" });
    });
    F.add(q, "path", { class: "potato-smile", d: "M-11 18 Q0 29 11 18", fill: "none", stroke: "#5a392b", "stroke-width": 3.6, "stroke-linecap": "round" });
    F.add(q, "path", { class: "potato-o", d: "M-6 20 a6 8 0 1 0 12 0 a6 8 0 1 0 -12 0Z", fill: "#4d2f26", style: { display: "none" } });
    return q;
  };
  /** Close (closed = true) or open the eyes of a potato made by F.potato by squashing the eye groups; the eye origin is each eye's own centre. */
  F.blink = (potato, closed) => {
    potato.querySelectorAll(".potato-eye").forEach((e, i) => {
      const ex = i ? 28 : -28;
      e.setAttribute("transform", closed ? `translate(${ex} -4) scale(1 .12) translate(${-ex} 4)` : "");
    });
  };
  /** Switch a potato made by F.potato between a smile ("smile") and a small surprised "o" mouth ("o"). */
  F.mood = (potato, mood) => {
    potato.querySelector(".potato-smile").style.display = mood === "o" ? "none" : "";
    potato.querySelector(".potato-o").style.display = mood === "o" ? "" : "none";
  };
  /** Draw a small crown for a potato in parent p at x,y (bottom centre) at scale s: yellow felt with a jewelled band and pom-pom tips. */
  F.crown = (p, x, y, s = 1) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y}) scale(${s})` });
    const body = F.add(q, "g", { filter: "url(#felt)" });
    F.add(body, "path", { d: "M-72 0 L-84 -96 L-38 -54 L0 -112 L38 -54 L84 -96 L72 0Z", fill: "#f3cc59" });
    F.add(body, "path", { d: "M-74 -26 H74 L72 0 H-72Z", fill: "#e8b844" });
    [[-84, -96], [0, -112], [84, -96]].forEach(([tx, ty]) => F.add(q, "circle", { cx: tx, cy: ty - 2, r: 9, fill: "#f6d878" }));
    [[-40, "#ee86ac"], [0, "#3fa7a3"], [40, "#5d87d4"]].forEach(([jx, c]) => F.add(q, "circle", { cx: jx, cy: -13, r: 8, fill: c }));
    return q;
  };
  /** Set the opacity of an SVG element to a clamped progress value. */
  F.visible = (e, p) => {
    e.style.opacity = MG.clamp(p);
  };
  /** Position and scale a group for a spring-like entrance (outBack). The group grows from its own origin at x,y, or from the local point px,py when given (use the centre of a tag so it grows in place). */
  F.pop = (e, p, x, y, scale = 1, px = 0, py = 0) => {
    const q = MG.ease.outBack(MG.clamp(p));
    e.setAttribute("transform", `translate(${x + px} ${y + py}) scale(${Math.max(.001, q) * scale}) translate(${-px} ${-py})`);
    e.style.opacity = p > 0 ? 1 : 0;
  };
  /** Squash-and-stretch entrance for characters: starts flat and wide, overshoots tall and thin, then settles. x,y is the group's centre; the pivot sits at the feet at y + foot so the character grows up from the ground. */
  F.squashPop = (e, p, x, y, scale = 1, foot = 90) => {
    const u = MG.clamp(p);
    const q = MG.ease.outElastic(u);
    const sy = Math.max(.001, q), sx = Math.max(.001, 1 + (1 - q) * .55);
    e.setAttribute("transform", `translate(${x} ${y + foot * scale}) scale(${sx * scale} ${sy * scale}) translate(0 ${-foot})`);
    e.style.opacity = u > 0 ? 1 : 0;
  };
  /** Draw a cloud-shaped speech bubble in parent p whose top-left is x,y with width w, height h (default 130) and a text label; the tail points down at tail (x offset from the left, default 0.55 w). */
  F.bubble = (p, x, y, w, label, h = 130, tail = .55) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y})` });
    const body = F.add(q, "g", { filter: "url(#felt)" });
    F.add(body, "path", { d: blob(w / 2, h / 2, w / 2, h / 2, 22, 4, 29), fill: "#fbf6e6" });
    F.add(body, "path", { d: `M${w * tail - 26} ${h - 14} L${w * tail - 6} ${h + 54} L${w * tail + 30} ${h - 14}Z`, fill: "#fbf6e6" });
    F.text(q, w / 2, h / 2 + h * .17, label, h * .42, { "text-anchor": "middle", "letter-spacing": h * .02 });
    return q;
  };
  /** Set a character's face: closed (true) shows the happy squint arcs instead of dot eyes; mouth is "smile" or "o". */
  F.look = (person, { closed = false, mouth = "smile" }) => {
    person.querySelector(".eyes-open").style.display = closed ? "none" : "";
    person.querySelector(".eyes-closed").style.display = closed ? "" : "none";
    person.querySelector(".mouth-smile").style.display = mouth === "o" ? "none" : "";
    person.querySelector(".mouth-o").style.display = mouth === "o" ? "" : "none";
  };
  /** Draw a worker character in parent p at x,y (centre of the head), scale s. o: skin, hair, shirt (a pattern id such as stripePink or a plain colour), hat ("beret" | "top" | "cap" | none), hatColor, kind ("role" | "phone" | "craft"), closed (start with squinting eyes), mouth ("smile" | "o"). The body runs down to y + 350 so the counter or the screen edge can cut it. Faces are kawaii: dot eyes, rosy cheeks, tiny mouth. */
  F.person = (p, x, y, s = 1, o = {}) => {
    const { skin = "#efb892", hair = "#4a3326", shirt = "stripePurple", hat = "", hatColor = "#a888d4", kind = "role", mouth = "smile" } = o;
    const q = F.add(p, "g", { transform: `translate(${x} ${y}) scale(${s})` });
    const fill = shirt.startsWith("stripe") ? `url(#${shirt})` : shirt;
    const parts = F.add(q, "g", { filter: "url(#felt)" });
    // Neck, shoulders and torso.
    F.add(parts, "path", { d: "M-24 50 H24 V112 H-24Z", fill: skin, transform: "scale(1 1)" });
    F.add(parts, "path", { d: "M-108 118 Q-112 88 -62 82 H62 Q112 88 108 118 V350 H-108Z", fill });
    if (kind === "craft") {
      F.add(parts, "path", { d: "M-62 110 H62 V350 H-62Z", fill: "#8d7b66" });
      for (let i = 0; i < 6; i++) F.add(parts, "path", { d: `M${-50 + i * 20} 124 V350`, stroke: "#6f5f4c", "stroke-width": 3, opacity: .6 });
      F.add(parts, "path", { d: "M-46 84 L-36 118 M46 84 L36 118", stroke: "#6d5b49", "stroke-width": 8, "stroke-linecap": "round" });
    }
    // Hair behind the face, head, then front hair.
    F.add(parts, "path", { d: blob(0, 0, 80, 82, 40, 2.2, 41), fill: skin });
    F.add(parts, "path", { d: "M-82 -12 Q-90 -88 0 -92 Q90 -88 82 -12 Q70 -52 0 -56 Q-70 -52 -82 -12Z", fill: hair });
    if (kind === "craft") {
      F.add(parts, "path", { d: "M-76 6 Q-72 90 0 96 Q72 90 76 6 Q60 40 0 38 Q-60 40 -76 6Z", fill: hair });
      F.add(parts, "path", { d: "M-80 -20 Q-90 -90 0 -96 Q90 -90 80 -20 Q60 -64 0 -66 Q-60 -64 -80 -20Z", fill: hair });
    }
    if (hat === "beret") {
      F.add(parts, "path", { d: "M-84 -48 Q-86 -96 -10 -104 Q70 -104 86 -56 Q40 -68 -84 -48Z", fill: hatColor });
      F.add(parts, "path", { d: "M-84 -48 Q-86 -96 -10 -104 Q70 -104 86 -56 Q40 -68 -84 -48Z", fill: "url(#flagDots)" });
      F.add(parts, "circle", { cx: -6, cy: -108, r: 9, fill: hatColor });
    } else if (hat === "top") {
      F.add(parts, "path", { d: "M-90 -52 H92 Q94 -66 78 -68 H-76 Q-92 -66 -90 -52Z", fill: "#4d4660" });
      F.add(parts, "path", { d: "M-56 -64 L-52 -150 H52 L56 -64Z", fill: "#59516f" });
      F.add(parts, "path", { d: "M-55 -80 H55 V-100 H-53Z", fill: hatColor });
    } else if (hat === "cap") {
      F.add(parts, "path", { d: "M-72 -48 Q-70 -108 8 -106 Q80 -104 82 -48Z", fill: hatColor });
      F.add(parts, "path", { d: "M-10 -48 Q60 -58 126 -36 Q60 -26 -10 -34Z", fill: hatColor });
    }
    // Face details stay crisp; both eye sets and both mouths exist so F.look can switch them.
    const eyeY = -2, eyeDx = kind === "craft" ? 32 : 30;
    const open = F.add(q, "g", { class: "eyes-open" });
    const closed = F.add(q, "g", { class: "eyes-closed", style: { display: "none" } });
    [-1, 1].forEach((sgn) => {
      F.add(open, "circle", { cx: sgn * eyeDx, cy: eyeY, r: 6.5, fill: "#2d2320" });
      F.add(open, "circle", { cx: sgn * eyeDx - 2, cy: eyeY - 2.5, r: 2, fill: "#fff" });
      F.add(closed, "path", { d: `M${sgn * eyeDx - 11} ${eyeY} Q${sgn * eyeDx} ${eyeY + 9} ${sgn * eyeDx + 11} ${eyeY}`, fill: "none", stroke: "#2d2320", "stroke-width": 3.5, "stroke-linecap": "round" });
    });
    [-1, 1].forEach((sgn) => F.add(q, "ellipse", { cx: sgn * 50, cy: 20, rx: 14, ry: 9, fill: "#ee8e8a", opacity: .75 }));
    const mouthInk = kind === "craft" ? "#3a1f14" : "#5a392b";
    F.add(q, "path", { class: "mouth-smile", d: "M-10 22 Q0 32 10 22", fill: "none", stroke: mouthInk, "stroke-width": 3.2, "stroke-linecap": "round" });
    F.add(q, "path", { class: "mouth-o", d: "M-5 26 a5 6.5 0 1 0 10 0 a5 6.5 0 1 0 -10 0Z", fill: mouthInk, style: { display: "none" } });
    F.look(q, { closed: o.closed ?? false, mouth });
    if (kind === "phone") {
      const ph = F.add(q, "g", { transform: "translate(125 96) rotate(9)" });
      F.add(ph, "path", { d: "M-68 150 Q-40 60 -18 40", stroke: skin, "stroke-width": 34, "stroke-linecap": "round", fill: "none" });
      F.add(ph, "rect", { x: -10, y: -120, width: 128, height: 220, rx: 18, fill: "#4a4f86", filter: "url(#felt)" });
      F.add(ph, "rect", { x: 2, y: -108, width: 104, height: 196, rx: 10, fill: "#f4f1ec" });
      for (let i = 0; i < 3; i++) {
        F.add(ph, "rect", { x: 10, y: -98 + i * 62, width: 30, height: 40, rx: 4, fill: "#232726" });
        F.add(ph, "rect", { x: 48, y: -96 + i * 62, width: 46, height: 8, rx: 4, fill: "#c8c3bb" });
        F.add(ph, "rect", { x: 48, y: -80 + i * 62, width: 28, height: 8, rx: 4, fill: "#c4565f" });
      }
    }
    if (kind === "craft") {
      const hm = F.add(q, "g", { transform: "translate(-110 70) rotate(-28)" });
      F.add(hm, "path", { d: "M0 0 L16 -104", stroke: "#a8794a", "stroke-width": 12, "stroke-linecap": "round" });
      F.add(hm, "rect", { x: -26, y: -150, width: 70, height: 54, rx: 6, fill: "#363f6e", filter: "url(#felt)", transform: "rotate(12 8 -123)" });
      F.add(q, "path", { d: "M-84 168 L-90 92", stroke: "#efe7d3", "stroke-width": 44, "stroke-linecap": "round" });
      F.add(q, "circle", { cx: -90, cy: 80, r: 21, fill: skin });
    }
    return q;
  };
  /** Draw the wooden counter on the right of the floor (recap) into parent p: a lighter top edge over a planked front. */
  F.counter = (p, x = 1140, y = 875) => {
    F.add(p, "rect", { x, y: y + 4, width: 1920 - x + 40, height: 30, fill: "#4a2a10", opacity: .2, transform: "translate(0 6)" });
    F.add(p, "rect", { x, y, width: 1920 - x + 40, height: 205, fill: "url(#plank)" });
    F.add(p, "rect", { x, y, width: 1920 - x + 40, height: 26, fill: "#dcaa72" });
    F.add(p, "rect", { x, y: y + 24, width: 1920 - x + 40, height: 4, fill: "#8b5527", opacity: .6 });
  };
  /** Draw a bundle of SKILL.md pages tied with brown twine into parent p at x,y (top-left), 285 × 190: three stacked torn sheets with ruled lines and a bow. Returns the group; q.details holds the ruled lines, title and twine so they can appear after the blank sheets. */
  F.bundle = (p, x, y, w = 285, h = 188) => {
    const q = F.add(p, "g", { transform: `translate(${x} ${y})` });
    [[-10, 14, -1.5], [-5, 7, .8], [0, 0, 0]].forEach(([dx, dy, rot], i) => {
      const r = F.add(q, "g", { transform: `translate(${dx} ${dy}) rotate(${rot} ${w / 2} ${h / 2})` });
      F.add(r, "path", { d: torn(w, h, 50 + i, 3, 22), fill: i === 2 ? "#f6efdb" : "#efe5cf", filter: "url(#paper)" });
    });
    const d = F.add(q, "g", {});
    [88, 126, 152].forEach((ly) => F.add(d, "path", { d: `M24 ${ly} H${w - 24}`, stroke: "#bdb29e", "stroke-width": 2.5 }));
    q.title = F.text(d, 48, 58, "SKILL.md", 46, { "letter-spacing": 2 });
    // Twine: one vertical and one horizontal wrap plus a small bow.
    const tw = { fill: "none", stroke: "#9a6b46", "stroke-width": 5, "stroke-linecap": "round" };
    F.add(d, "path", { d: `M${w * .6} -4 V${h + 4}`, ...tw });
    F.add(d, "path", { d: `M-10 ${h * .66} H${w + 12}`, ...tw });
    F.add(d, "path", { d: `M${w * .6} ${h * .66} q-34 -34 -38 -4 q8 24 38 4 q34 -34 38 -4 q-8 24 -38 4`, ...tw });
    q.details = d;
    return q;
  };
})(window);
