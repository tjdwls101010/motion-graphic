#!/usr/bin/env node
/* Contract of IB.drive in brushpen/kit/props/racing.js, which every racing scene uses to place its cars. Run: node tools/test_racing.js (exit 1 on failure).
   drive(phases, t, from) runs constant-acceleration phases [{ dur, a }] in order from { x, v }; the last phase never ends; before t = 0 the car is where it started. Expected values are worked by hand from x = x0 + v t + a t² / 2. */
global.window = global;
require('../core/motion.js');
require('../brushpen/kit/ink.js');
require('../brushpen/kit/solid.js');
require('../brushpen/kit/marks.js');
require('../brushpen/kit/props/racing.js');
const IB = global.IB;
let failed = 0;
const near = (name, got, want, tol = 1e-6) => { if (Math.abs(got - want) > tol) { failed++; console.log(`FAIL ${name}: got ${got}, want ${want}`); } };

// a launch at 1500 px/s² for 2 s, then flat out
const launch = [{ dur: 2, a: 1500 }, { a: 0 }];
near('launch after 1 s: x', IB.drive(launch, 1).x, 750);
near('launch after 1 s: v', IB.drive(launch, 1).v, 1500);
near('end of the launch', IB.drive(launch, 2).x, 3000);
near('a second at 3000 px/s after it', IB.drive(launch, 3).x, 6000);
near('speed held after it', IB.drive(launch, 3).v, 3000);
// braking from 11 700 px/s at 6900 px/s² for 1 s from x = 100
near('braking: x', IB.drive([{ dur: 1, a: -6900 }, { a: 0 }], 1, { x: 100, v: 11700 }).x, 100 + 11700 - 3450);
near('braking: v', IB.drive([{ dur: 1, a: -6900 }, { a: 0 }], 1, { x: 100, v: 11700 }).v, 4800);
// three phases: the middle one is used whole once t passes it
near('through a middle phase', IB.drive([{ dur: 1, a: 0 }, { dur: 1, a: 200 }, { a: 0 }], 3, { v: 100 }).x, 100 + (100 + 100) + 300);
// before the start the car has not moved
near('before t = 0', IB.drive(launch, -1, { x: 42 }).x, 42);

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
