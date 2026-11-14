/* stage.js — the 1920x1080 stage, the player bar and the capture hook. A scene file calls MG.scene({ duration, setup(stage), render(t, refs) }) once; render must draw the frame for time t from scratch (no state carried between calls), which is what makes scrubbing and frame capture exact.

URL parameters:
  ?t=3.2      open paused at 3.2 s
  ?capture    no player bar, stage at 1:1; tools/capture.py drives window.__mg.seek(t)
  ?embed      no player bar, stage fitted to the window, looping: for an <iframe> preview (index.html uses it on hover). Posts { mg: 'ready' } to the parent after the first frame is drawn
*/
(function (g) {
  const MG = (g.MG = g.MG || {});
  const W = (MG.W = 1920), H = (MG.H = 1080);
  const qs = new URLSearchParams(location.search);
  const CAPTURE = qs.has('capture');
  const EMBED = qs.has('embed');

  /* Fonts every scene may draw with. Canvas text does not wait for a font, so they are loaded before the first render. */
  MG.FONTS = ['400 20px Gaegu', '700 20px Gaegu', '400 20px Pretendard', '800 20px Pretendard', '400 20px "JetBrains Mono"', '800 20px "JetBrains Mono"', '20px Jua'];

  /* el('div', { class, style: {...}, text, html, ...attributes }, ...children) */
  MG.el = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'class') e.className = v;
      else e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) e.append(kid);
    return e;
  };
  const NS = 'http://www.w3.org/2000/svg';
  MG.svg = (tag, attrs = {}, ...kids) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) e.append(kid);
    return e;
  };

  /* show(el, p, { dx, dy, scale, rot, keep }) — enter transition driven by an already-eased progress p. The element fades in over the first half of p and travels from the offset to its resting place. `keep` is a transform kept at rest (e.g. 'rotate(-4deg)'). */
  MG.show = (el, p, o = {}) => {
    const { dx = 0, dy = 0, scale = 1, rot = 0, keep = '' } = o;
    const q = 1 - p;
    el.style.opacity = MG.clamp(p * 2);
    el.style.transform = `translate(${dx * q}px, ${dy * q}px) rotate(${rot * q}deg) scale(${scale + (1 - scale) * p}) ${keep}`;
  };

  /* draw(pathEl, p) — stroke an SVG path on from its start. The path needs pathLength="1". */
  MG.draw = (path, p) => {
    path.style.strokeDasharray = '1 1';
    path.style.strokeDashoffset = 1 - MG.clamp(p);
    path.style.visibility = p <= 0 ? 'hidden' : 'visible';
  };

  /* canvas(stage) — a full-stage 2D canvas at device-pixel-ratio 1 and its context. */
  MG.canvas = (stage, w = W, h = H) => {
    const c = MG.el('canvas', { width: w, height: h, style: { position: 'absolute', left: 0, top: 0 } });
    stage.append(c);
    return c.getContext('2d');
  };

  MG.scene = (def) => {
    const boot = async () => {
      if (def.title) document.title = def.title;
      document.body.classList.toggle('mg-capture', CAPTURE);
      document.body.classList.toggle('mg-embed', EMBED);
      const stage = MG.el('div', { id: 'mg-stage' });
      const frame = MG.el('div', { id: 'mg-frame' }, stage);
      document.body.append(frame);
      await Promise.all(MG.FONTS.map((f) => document.fonts.load(f, '가Aa0').catch(() => null)));
      const refs = def.setup ? def.setup(stage) : null;
      const dur = def.duration;
      let t = MG.clamp(parseFloat(qs.get('t')) || 0, 0, dur);
      let playing = !CAPTURE && !qs.has('t');
      let ui = null;
      const oneFrame = 1 / (def.fps || 30);

      const seek = (x) => {
        t = MG.clamp(x, 0, dur);
        def.render(t, refs, stage);
        if (ui) {
          ui.range.value = t;
          ui.time.textContent = `${t.toFixed(2)} / ${dur.toFixed(2)}`;
          ui.btn.textContent = playing ? '❚❚' : '▶';
        }
      };

      if (!CAPTURE && !EMBED) {
        ui = {
          btn: MG.el('button', { type: 'button', 'aria-label': 'play or pause' }),
          range: MG.el('input', { type: 'range', min: 0, max: dur, step: 'any', value: t }),
          time: MG.el('span', { class: 'mg-time' }),
        };
        const bar = MG.el('div', { id: 'mg-bar' }, ui.btn, ui.range, ui.time, MG.el('span', { class: 'mg-title', text: def.title || '' }));
        document.body.append(bar);
        ui.btn.onclick = () => { playing = !playing; if (playing && t >= dur) t = 0; seek(t); };
        ui.range.oninput = () => { playing = false; seek(parseFloat(ui.range.value)); };
        addEventListener('keydown', (e) => {
          if (e.code === 'Space') { e.preventDefault(); ui.btn.onclick(); }
          // preventDefault: a focused scrubber would otherwise also step itself and move two frames
          if (e.code === 'ArrowRight') { e.preventDefault(); playing = false; seek(t + oneFrame); }
          if (e.code === 'ArrowLeft') { e.preventDefault(); playing = false; seek(t - oneFrame); }
        });
      }
      if (!CAPTURE) {
        const barHeight = ui ? 44 : 0;
        const fit = () => {
          const s = Math.min(innerWidth / W, (innerHeight - barHeight) / H);
          stage.style.transform = `scale(${s})`;
          frame.style.width = W * s + 'px';
          frame.style.height = H * s + 'px';
        };
        addEventListener('resize', fit);
        fit();
        let last = null;
        const tick = (now) => {
          if (playing && last != null) {
            t += (now - last) / 1000;
            if (t >= dur) t = def.loop === false ? dur : t % dur;
            if (t >= dur) playing = false;
            seek(t);
          }
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      seek(t);
      g.__mg = { ready: true, duration: dur, fps: def.fps || 30, ref: def.ref || null, title: def.title || '', seek };
      // tells an embedding page the first frame is on screen, so it can swap its poster for the live scene without a blank flash
      if (EMBED && g.parent !== g) g.parent.postMessage({ mg: 'ready' }, '*');
    };
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
    else boot();
  };
})(window);
