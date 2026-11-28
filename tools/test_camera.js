#!/usr/bin/env node
/* Contract of brushpen/kit/camera.js that every filmed scene relies on. Run: node tools/test_camera.js (exit 1 on failure).
   IB.shot(keys, f): a key's move starts at its frame from where the camera is and lasts `over` frames; 'cut' changes at once; 'pan' follows the reference's measured pan (291 px in 9, 12, 12, 113, 117, 13, 9, 6 px a drawing, on twos); 'push' is even on ones; 'snap' goes 50, 85, 103, 100 %; zoom is even in log scale; 'whip' slides out 2 frames, is bare between, slides in over 4. jolt shakes 8 frames from an impact and is still outside them.
   IB.film(ctx, cam, world): puts the view's centre at the frame's centre, scaled by 1920 / w and turned by the tilt. Expected values are worked by hand from those rules, not read off the code. */
global.window = global;
require('../core/motion.js');
global.MG.W = 1920; global.MG.H = 1080;
require('../brushpen/kit/ink.js');
require('../brushpen/kit/camera.js');
const IB = global.IB;
let failed = 0;
const near = (name, got, want, tol = 1e-6) => {
  const ok = Array.isArray(want) ? Array.isArray(got) && want.every((w, i) => Math.abs(got[i] - w) <= tol) : Math.abs(got - want) <= tol;
  if (!ok) { failed++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};
const A = { at: [960, 540], w: 1920 }, B = { at: [1251, 540], w: 1920 };

// cut
const cut = [[0, A], [10, { at: [400, 300], w: 960 }, 'cut']];
near('before a cut', IB.shot(cut, 9).at, [960, 540]);
near('on the cut', IB.shot(cut, 10).at, [400, 300]);
near('zoom after the cut', IB.shot(cut, 10).s, 2);

// pan: the measured 291 px pan from frame 20, 16 frames on twos
const pan = [[0, A], [20, B, 'pan']];
near('pan has not moved before its first drawing', IB.shot(pan, 21).at[0], 960);
near('pan after one drawing', IB.shot(pan, 22).at[0], 969);
near('pan halfway in time: 9+12+12+113', IB.shot(pan, 28).at[0], 1106);
near('pan held on twos', IB.shot(pan, 29).at[0], 1106);
near('pan arrives', IB.shot(pan, 36).at[0], 1251);
near('pan stretched to 32 frames, halfway', IB.shot([[0, A], [20, B, 'pan', 32]], 36).at[0], 1106);

// push: even on ones, zoom even in log scale (1920 -> 480 over 48 frames is 960 at frame 24)
const push = [[0, A], [0, { at: [960, 540], w: 480 }, 'push', 48]];
near('push halfway is 2x', IB.shot(push, 24).w, 960);
near('push moves every frame', IB.shot(push, 12).w, 1920 / Math.SQRT2);
near('push ends', IB.shot(push, 60).w, 480);

// snap
const snap = [[0, A], [5, { at: [1060, 540], w: 1920 }, 'snap']];
near('snap first frame', IB.shot(snap, 5).at[0], 1010);
near('snap overshoots', IB.shot(snap, 7).at[0], 1063);
near('snap settles', IB.shot(snap, 8).at[0], 1060);

// a move starts from wherever the camera is (mid-push), not from the previous key
const chain = [[0, A], [0, { at: [1160, 540], w: 1920 }, 'push', 20], [10, { at: [1060, 540], w: 1920 }, 'cut']];
near('a later key overrides a move in progress', IB.shot(chain, 15).at[0], 1060);

// whip from a 1920 view to the right: out by 1150 and 1500 screen px, bare, in from 1500, 1100, 600, 180
const whip = [[0, A], [30, B, 'whip', 8]];
near('whip out, frame 1', IB.shot(whip, 30).at[0], 960 + 1150);
near('whip out, frame 2', IB.shot(whip, 31).at[0], 960 + 1500);
near('whip bare frames', [IB.shot(whip, 32).bare, IB.shot(whip, 33).bare].map(Number), [1, 1]);
near('whip in, first', IB.shot(whip, 34).at[0], 1251 - 1500);
near('whip in, last', IB.shot(whip, 37).at[0], 1251 - 180);
near('whip done', IB.shot(whip, 38).at[0], 1251);
near('no whip flag after it', Number(IB.shot(whip, 38).whip === null), 1);
near('slides scale with the zoom: a 960 view moves half as far', IB.shot([[0, { at: [960, 540], w: 960 }], [30, { at: [2000, 540], w: 960 }, 'whip']], 30).at[0], 960 + 575);

// jolt
const j = (f) => IB.shot([[0, A]], f, { jolt: [[10, 20]] }).jolt;
near('still before the hit', j(9), [0, 0, 0]);
near('shakes on the hit by its amplitude', Math.hypot(j(10)[0], j(10)[1]), 20);
near('decays by 0.62 a frame', Math.hypot(j(11)[0], j(11)[1]), 20 * 0.62);
near('still 8 frames after', j(18), [0, 0, 0]);

// film: the view's centre lands on the frame's centre
const fake = () => { const c = { m: null, calls: 0, save() {}, restore() {}, setTransform(...m) { if (!c.m) c.m = m; } }; return c; };
const map = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
let ctx = fake();
IB.film(ctx, IB.shot([[0, { at: [1000, 600], w: 960 }]], 0), () => {});
near('centre maps to the frame centre', map(ctx.m, [1000, 600]), [960, 540]);
near('2x zoom: 240 stage px is 480 screen px', map(ctx.m, [1240, 600]), [1440, 540]);
ctx = fake();
IB.film(ctx, IB.shot([[0, { at: [1000, 600], w: 960, tilt: Math.PI / 2 }]], 0), () => {});
near('a quarter tilt turns right into down', map(ctx.m, [1010, 600]), [960, 560], 1e-9);
ctx = fake(); let drew = 0, streaks = 0; const realWhip = IB.whip; IB.whip = () => streaks++;   // the streaks themselves are IB.whip's, drawn on a real canvas
IB.film(ctx, IB.shot(whip, 32), () => drew++, {});
near('world is not drawn on a bare whip frame, the streaks are', [drew, streaks], [0, 1]);
IB.film(ctx, IB.shot(whip, 38), () => drew++, {});
near('after the whip the world is drawn and no streaks', [drew, streaks], [1, 1]);
IB.whip = realWhip;

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
