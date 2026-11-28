#!/usr/bin/env node
/* Contract of IB.trackPath in brushpen/kit/props/racing-weather.js, which places the cars of every racing scene on a curved circuit (the helicopter shots). Run: node tools/test_racing_weather.js (exit 1 on failure).
   trackPath(points) rounds a centre line through [x, z] points and measures it: at(s) is the point s metres along it with the heading IB.racer reads (atan2(dz, dx)), held at the ends; side(s, d) is d metres to the left of the way it runs. Expected values are worked by hand on straight lines and from the points the line must pass through. */
global.window = global;
require('../core/motion.js');
require('../brushpen/kit/ink.js');
require('../brushpen/kit/solid.js');
require('../brushpen/kit/props/racing-weather.js');
const IB = global.IB;
let failed = 0;
const near = (name, got, want, tol = 1e-6) => { if (!(Math.abs(got - want) <= tol)) { failed++; console.log(`FAIL ${name}: got ${got}, want ${want}`); } };

// a straight along +x, 20 m
const flat = IB.trackPath([[0, 0], [10, 0], [20, 0]]);
near('straight: length', flat.len, 20);
near('straight: x at 5 m', flat.at(5).x, 5);
near('straight: z at 5 m', flat.at(5).z, 0);
near('straight: heading', flat.at(5).heading, 0);
near('straight: 2 m to the left is +z', flat.side(5, 2)[1], 2);
near('held before the start', flat.at(-3).x, 0);
near('held past the end', flat.at(99).x, 20);
// a straight along +z: heading a quarter turn, its left is -x
const up = IB.trackPath([[0, 0], [0, 30]]);
near('along +z: heading', up.at(10).heading, Math.PI / 2);
near('along +z: left is -x', up.side(10, 1)[0], -1);
// a bend passes through its middle point and ends on its last
const bend = IB.trackPath([[0, 0], [20, 10], [40, 0]]);
let best = Infinity;
for (let s = 0; s <= bend.len; s += 0.05) { const p = bend.at(s); best = Math.min(best, Math.hypot(p.x - 20, p.z - 10)); }
near('bend: passes through its middle point', best, 0, 0.05);
near('bend: heading level at its crest', bend.at(bend.len / 2).heading, 0, 0.02);
near('bend: ends on its last point', bend.at(bend.len).x, 40);
near('bend: longer than its chord', Math.sign(bend.len - 2 * Math.hypot(20, 10)), 1);

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
