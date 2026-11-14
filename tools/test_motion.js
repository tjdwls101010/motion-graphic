#!/usr/bin/env node
/* Contract of core/motion.js that scenes rely on. Run: node tools/test_motion.js (exit 1 on failure).
   Scenes test `p > 0` for "has this beat started" and `p >= 1` for "has it finished", and re-render any t in any order, so: every ease must be exactly 0 at 0 and exactly 1 at 1, prog must clamp outside its beat and never return NaN, keyframes must hold their end values, and the random helpers must repeat. */
global.window = global;
require('../core/motion.js');
const { ease, prog, kf, rng, hash, onTwos, typed } = MG;
let failed = 0;
const check = (name, got, want) => {
  const ok = Object.is(got, want) || (typeof want === 'number' && Math.abs(got - want) < 1e-12 && want !== 0 && want !== 1);
  if (!ok) { failed++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

for (const name of Object.keys(ease)) {
  check(`ease.${name}(0)`, ease[name](0), 0);
  check(`ease.${name}(1)`, ease[name](1), 1);
}
// outBack is the one ease that overshoots: its peak is above 1 on the way in
check('outBack overshoots', ease.outBack(0.7) > 1, true);

check('prog before the beat', prog(1.9, 2, 0.5, 'outBack'), 0);
check('prog at the start', prog(2, 2, 0.5, 'outBack'), 0);
check('prog halfway, linear', prog(2.25, 2, 0.5), 0.5);
check('prog after the beat', prog(9, 2, 0.5, 'outBack'), 1);
check('zero-length beat before', prog(1.99, 2, 0), 0);
check('zero-length beat at start', prog(2, 2, 0), 1);

const keys = [[1, 10], [2, 20, 'linear'], [4, [0, 100]]];
check('kf holds first value', kf(0, keys), 10);
check('kf at a key', kf(2, [[1, 10], [2, 20, 'linear'], [3, 30, 'linear']]), 20);
check('kf midway, linear', kf(1.5, keys), 15);
check('kf holds last value', kf(99, [[1, 10], [2, 20, 'linear']]), 20);
check('kf arrays, linear midpoint', kf(1.5, [[1, [0, 10]], [2, [10, 30], 'linear']]).join(','), '5,20');

const a = rng(7), b = rng(7), c = rng(8);
const seqA = [a(), a(), a()], seqB = [b(), b(), b()];
check('rng repeats for a seed', seqA.join(','), seqB.join(','));
check('rng differs across seeds', seqA[0] !== c(), true);
check('rng in [0, 1)', seqA.every((x) => x >= 0 && x < 1), true);
check('hash repeats', hash(3, 4), hash(3, 4));
check('hash in [0, 1)', hash(3, 4) >= 0 && hash(3, 4) < 1, true);

// 15 fps: frames 0 and 1 of a 30 fps video share a drawing, frame 2 gets the next one
check('onTwos frame 0', onTwos(0 / 30), 0);
check('onTwos frame 1', onTwos(1 / 30), 0);
check('onTwos frame 2', onTwos(2 / 30), 1 / 15);

check('typed nothing', typed('hello', 0), '');
check('typed part', typed('hello', 0.4), 'he');
check('typed all, past the end', typed('hello', 3), 'hello');

console.log(failed ? `${failed} failed` : 'motion.js: all checks passed');
process.exit(failed ? 1 : 0);
