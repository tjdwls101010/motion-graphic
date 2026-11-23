#!/usr/bin/env node
/* Contract of IBM/kit/time.js that scenes and kit parts rely on. Run: node tools/test_time.js (exit 1 on failure).
   Drawn acting in the IBM look is a list of drawings, not a curve (IBM/STYLE.md "연기는 곡선이 아니라 그림 목록이다"): a [frame, drawing] table holds each drawing until the next key, beats sit on the 12 fps grid, and in-betweens are a short table of mix ratios. The expected values below are worked by hand from those rules, and the settle values are the ones measured from the reference frames. */
global.window = global;
require('../core/motion.js');
require('../IBM/kit/ink.js');
require('../IBM/kit/time.js');
const IB = global.IB;
let failed = 0;
const check = (name, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) { failed++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

// held: each drawing holds from its key until the frame before the next key; before the first key the first drawing shows
const keys = [[0, 'a'], [4, 'b'], [10, 'c']];
check('held before the first key', IB.held(keys, -1), 'a');
check('held on the first key', IB.held(keys, 0), 'a');
check('held the frame before the next key', IB.held(keys, 3), 'a');
check('held on a key', IB.held(keys, 4), 'b');
check('held between keys', IB.held(keys, 9), 'b');
check('held after the last key', IB.held(keys, 99), 'c');
check('held on a key that does not start at 0', IB.held([[5, 'x'], [8, 'y']], 2), 'x');

// heldRow: the whole row in force, or the given default before the first key
check('heldRow before the first key gives the default', IB.heldRow([[5, 1, 2], [8, 3, 4]], 2, 'none'), 'none');
check('heldRow on a key gives its row', IB.heldRow([[5, 1, 2], [8, 3, 4]], 5), [5, 1, 2]);
check('heldRow after the last key', IB.heldRow([[5, 1, 2], [8, 3, 4]], 30), [8, 3, 4]);

// drawn: whole drawings since a beat on the 12 fps grid (on threes: pass 8)
check('drawn at the beat', IB.drawn(1.5, 1.5), 0);
check('drawn half a second after, on twos', IB.drawn(2.0, 1.5), 6);
check('drawn half a second after, on threes', IB.drawn(2.0, 1.5, 8), 4);
check('drawn before the beat is negative', IB.drawn(1.0, 1.5), -6);
check('T: 6 drawings on twos is half a second', IB.T(6), 0.5);

// inbetween: the mix ratio of drawing n of a short in-between table; past its end the last ratio holds
check('inbetween first drawing', IB.inbetween([0.35, 0.75, 1], 0), 0.35);
check('inbetween last drawing', IB.inbetween([0.35, 0.75, 1], 2), 1);
check('inbetween past the end holds', IB.inbetween([0.35, 0.75, 1], 7), 1);

// alternate: two drawings swapping every `every` frames (a flag, a flame, a tail on threes); with `from`, still (0) before it and the second drawing first
check('alternate on threes, first drawing', [0, 1, 2].map((f) => IB.alternate(f, 3)), [0, 0, 0]);
check('alternate on threes, second drawing', [3, 4, 5, 6].map((f) => IB.alternate(f, 3)), [1, 1, 1, 0]);
check('alternate from a frame: still before it', IB.alternate(151, 3, 152), 0);
check('alternate from a frame: swaps at once', [152, 154, 155, 158].map((f) => IB.alternate(f, 3, 152)), [1, 1, 0, 1]);

// loop: a cycle of drawings on twos (hair streaming, a plant swaying)
check('loop on twos', [0, 1, 2, 3, 4, 5, 6].map((f) => IB.loop(f, ['p', 'q', 'r'])), ['p', 'p', 'q', 'q', 'r', 'r', 'p']);
check('loop on threes', [0, 2, 3, 5, 6].map((f) => IB.loop(f, ['p', 'q'], 3)), ['p', 'p', 'q', 'q', 'p']);

// play: a move written in frames from its own start, placed into a scene's [frame, drawing] table at f0
check('play shifts a move to its start frame', IB.play([[0, 'lift'], [2, 'land'], [6, 'settle']], 40), [[40, 'lift'], [42, 'land'], [46, 'settle']]);

// settle: the measured head copy (71 px, tau 0.2, still after 0.79 s) closes 60, 48, 38, 31, 25, 20, 16, 13, 10 px frame by frame (IBM/STYLE.md); the fitted curve stays within 3 px of every measured frame
const measured = [60, 48, 38, 31, 25, 20, 16, 13, 10];
check('settle stays within 3 px of the measured copy slide', measured.every((px, i) => Math.abs(71 * (1 - IB.settle((i + 1) / 24, 0.2, 0.79)) - px) <= 3), true);
check('settle is exactly still at its stop', IB.settle(0.79, 0.2, 0.79), 1);

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
