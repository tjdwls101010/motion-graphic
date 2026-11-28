#!/usr/bin/env node
/* Contract of the ball physics in brushpen/kit/props/sports.js that the soccer and basketball scenes rely on. Run: node tools/test_sports.js (exit 1 on failure).
   A ball is a point under constant gravity g (px/s², +y down) until its centre reaches the floor line; there its vertical speed is reversed and scaled by e, its horizontal speed by mu; once a bounce would rise less than `settle` px/s it rolls, slowing by `roll` px/s² until it stops. The expected values are worked by hand from the kinematics (y = y0 + vy t + g t²/2), not read from the code. */
global.window = global;
require('../core/motion.js');
require('../brushpen/kit/ink.js');
require('../brushpen/kit/props/sports.js');
const IB = global.IB;
let failed = 0;
const near = (name, got, want, tol = 1e-6) => {
  const ok = Array.isArray(want) ? Array.isArray(got) && want.every((w, i) => Math.abs(got[i] - w) <= tol) : Math.abs(got - want) <= tol;
  if (!ok) { failed++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

// aim: the launch velocity that puts the ball at p1 after T seconds
near('aim level, 1 s', IB.aim([0, 0], [100, 0], 1, 200), [100, -100]);
near('aim to a higher point', IB.aim([0, 100], [60, 0], 2, 100), [30, -150]);   // vy = (0-100)/2 - 100*2/2

// flight: free fall from rest lands after sqrt(2 * 490 / 980) = 1 s
const drop = { p: [0, 0], v: [0, 0], g: 980, floor: 490, e: 0.5, mu: 1 };
near('falls under gravity', IB.flight(drop, 0.5).p, [0, 122.5]);
near('lands at 1 s', IB.flight(drop, 1).p, [0, 490]);
near('bounce count before landing', IB.flight(drop, 0.9).bounces, 0);
// after the bounce it leaves at e x 980 = 490 px/s upward: apex 0.5 s later at 490 - 490*0.5 + 490*0.25 = 367.5, lands again at 2 s
near('first rebound apex', IB.flight(drop, 1.5).p, [0, 367.5]);
near('bounce count after landing', IB.flight(drop, 1.2).bounces, 1);
near('second landing at 2 s', IB.flight(drop, 2).p, [0, 490]);
near('velocity on the way up', IB.flight(drop, 1.25).v, [0, -245]);

// horizontal speed carries through the air and is scaled by mu at a bounce
const skim = { p: [0, 0], v: [100, 0], g: 980, floor: 490, e: 0.5, mu: 0.8 };
near('horizontal before the bounce', IB.flight(skim, 1).p[0], 100);
near('horizontal after the bounce', IB.flight(skim, 1.5).p[0], 140);

// a ball on the floor with no lift rolls and slows by `roll` to a stop: 100 px/s at 50 px/s² stops after 2 s and 100 px
const roller = { p: [0, 490], v: [100, 0], g: 980, floor: 490, e: 0.5, mu: 1, roll: 50 };
near('rolling slows', IB.flight(roller, 1).p, [75, 490]);
near('rolling stops', IB.flight(roller, 2).p, [100, 490]);
near('stays stopped', IB.flight(roller, 5).p, [100, 490]);
near('stopped has no speed', IB.flight(roller, 5).v, [0, 0]);

// a rebound too small to see ends the bouncing: dropped from 490 px with e 0.5 it lands at 980, 490, 245 px/s; with settle 200 px/s it bounces twice (rebounds 490 and 245 px/s) and at the third landing (2.5 s) the rebound would be 122.5 < 200, so it stays on the floor
const settled = { ...drop, settle: 200, roll: 0 };
near('rolls after the rebound falls under settle', IB.flight(settled, 3).p, [0, 490]);
near('no more bounces once settled', IB.flight(settled, 10).bounces, 2);

// no floor: plain projectile
near('no floor is a plain arc', IB.flight({ p: [10, 20], v: [30, -40], g: 100 }, 2).p, [70, 20 - 80 + 200]);

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log('ok');
