#!/usr/bin/env node
/* Contract of IB.drive and IB.trackPose in brushpen/kit/props/racing.js and of the corners in props/racing-corners.js, which racing scenes use to place their cars (along a straight, and on a track that bends). Run: node tools/test_racing.js (exit 1 on failure).
   drive(phases, t, from) runs constant-acceleration phases [{ dur, a }] in order from { x, v }; the last phase never ends; before t = 0 the car is where it started. Expected values are worked by hand from x = x0 + v t + a t² / 2. */
global.window = global;
require('../core/motion.js');
require('../brushpen/kit/ink.js');
require('../brushpen/kit/solid.js');
require('../brushpen/kit/marks.js');
require('../brushpen/kit/props/racing.js');
require('../brushpen/kit/props/racing-corners.js');
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

// trackPose on a straight strip: X along the track less the run, the lane as it is
const p0 = IB.trackPose({ run: 10 }, 30, 2);
near('straight: x', p0.x, 20); near('straight: z', p0.z, 2); near('straight: heading', p0.heading, 0);
// a hairpin of radius 10 m turning toward +z from X = 0: worked from the circle about (0, 10)
const pin = { bend: (X) => (X >= 0 && X < Math.PI * 10 ? 0.1 : 0) };
const end = IB.trackPose(pin, Math.PI * 10, 0), apex = IB.trackPose(pin, Math.PI * 5, 2), out = IB.trackPose(pin, Math.PI * 10 + 20, 0);
near('hairpin end: x', end.x, 0, 0.05); near('hairpin end: z', end.z, 20, 0.05); near('hairpin end: heading', end.heading, Math.PI, 0.01);
near('hairpin apex, 2 m to the inside: x', apex.x, 8, 0.05); near('hairpin apex: z', apex.z, 10, 0.05); near('hairpin apex: heading', apex.heading, Math.PI / 2, 0.01);
near('20 m out of the hairpin: x', out.x, -20, 0.05); near('out of the hairpin: z', out.z, 20, 0.05);
// behind X = 0 the track runs straight back the other way
near('before the hairpin: x', IB.trackPose(pin, -15, 1).x, -15, 1e-6); near('before the hairpin: z', IB.trackPose(pin, -15, 1).z, 1, 1e-6);
// the view sits at run on the curve, lane off it, turned veer: the hairpin's end seen from its apex is 10 m on and 10 m across, heading a quarter turn on
const fromApex = IB.trackPose({ ...pin, run: Math.PI * 5 }, Math.PI * 10, 0);
near('end seen from the apex: x', fromApex.x, 10, 0.05); near('end seen from the apex: z', fromApex.z, 10, 0.05); near('end seen from the apex: heading', fromApex.heading, Math.PI / 2, 0.01);
const turned = IB.trackPose({ veer: Math.PI / 2, lane: 3 }, 10, 0);
near('a view 3 m off the line, turned a quarter: x', turned.x, -3, 1e-6); near('turned: z', turned.z, -10, 1e-6); near('turned: heading', turned.heading, -Math.PI / 2, 1e-6);

// IB.hairpin is that same corner; IB.chicane leaves the track parallel to how it came, 2 k len² / PI to the side (small angles: within 2 %)
const hp = IB.trackPose({ bend: IB.hairpin({ r: 10 }) }, Math.PI * 10 + 20, 0);
near('IB.hairpin: out of it, x', hp.x, -20, 0.05); near('IB.hairpin: z', hp.z, 20, 0.05); near('IB.hairpin: heading', hp.heading, Math.PI, 0.01);
near('IB.hairpin dir -1 turns toward -z', IB.trackPose({ bend: IB.hairpin({ r: 10, dir: -1 }) }, Math.PI * 10, 0).z, -20, 0.05);
const ch = IB.trackPose({ bend: IB.chicane({ at: 10, k: 0.014, len: 30 }) }, 90, 0);
near('IB.chicane: parallel after it', ch.heading, 0, 0.005); near('IB.chicane: the jog', ch.z, (2 * 0.014 * 900) / Math.PI, 0.16);
near('IB.chicane: nothing before it', IB.trackPose({ bend: IB.chicane({ at: 10 }) }, 10, 0).z, 0, 1e-9);

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
