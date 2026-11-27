#!/usr/bin/env python3
"""Contract of drawings.py, the count that the acting upgrades are judged by: from what a scene's IB.actors(t) returns frame by frame, it finds where each actor gets a new drawing, the drawing rate while it moves, its longest hold, and the drawings kept longer than the actor's step without being a hold. Run: python3 tools/test_drawings.py (exit 1 on failure). The last case opens a throwaway scene in Chrome.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))
import drawings  # noqa: E402

failed = 0


def check(name, got, want):
    global failed
    if got != want:
        failed += 1
        print(f'FAIL {name}: got {got!r}, want {want!r}')


def frames(*runs):
    """A frame-by-frame list of drawings from (drawing, length) runs."""
    return [d for d, n in runs for _ in range(n)]


# on twos for 12 frames, held 12, on twos again for 8: three moving runs of the hold's neighbours
a = drawings.analyse(frames(('a', 2), ('b', 2), ('c', 2), ('d', 2), ('e', 2), ('f', 2), ('g', 12), ('h', 2), ('i', 2), ('j', 2), ('k', 2)))
check('a new drawing is counted where it first shows', a['changes'], [2, 4, 6, 8, 10, 12, 24, 26, 28, 30])
check('the hold is the run at least `hold` frames long', a['holds'], [[12, 12]])
check('the longest hold', a['longest'], [12, 12])
check('the rate counts drawings over the frames that are not holds: 10 drawings in 20 frames', a['rate'], 12.0)
check('nothing is kept too long on twos', a['stale'], [])

b = drawings.analyse(frames(('a', 2), ('b', 4), ('c', 2), ('d', 5), ('e', 2), ('f', 6)))
check('a drawing kept 3 to hold-1 frames while moving is stale, with its first frame and length', b['stale'], [[2, 4], [8, 5]])
check('a run of exactly `hold` frames is a hold, not stale', b['holds'], [[15, 6]])

c = drawings.analyse(frames(('a', 3), ('b', 3), ('c', 4), ('d', 3)), step=3)
check('on threes a 3-frame drawing is fine and a 4-frame one is stale', c['stale'], [[6, 4]])

d = drawings.analyse(frames(('a', 30)))
check('an actor that never changes: no rate, one hold, nothing stale', (d['changes'], d['rate'], d['holds'], d['stale']), ([], None, [[0, 30]], []))

e = drawings.analyse(list(range(10)))
check('on ones: a new drawing every frame is 24 a second', (e['rate'], e['stale']), (24.0, []))

# the whole tool on a scene: IB.actors from a table, one actor declared heavy (on threes)
SCENE = """<!doctype html>
<meta charset="utf-8">
<script src="../../../core/motion.js"></script>
<script src="../../../core/stage.js"></script>
<script>
var IB = { };
const WALK = [[0, 'a'], [2, 'b'], [4, 'c'], [6, 'd'], [10, 'e'], [12, 'e2'], [24, 'f']];   // a 4-frame drawing at 6, a hold from 12
const LIFT = [[0, 'x'], [3, 'y'], [6, 'z'], [9, 'w']];
const at = (rows, f) => rows.filter(([k]) => k <= f).pop()[1];
IB.actors = (t) => { const f = Math.floor(t * 24 + 1e-6), a = { walker: { pose: at(WALK, f), x: 0.1 + 0.2 }, lifter: at(LIFT, f) }; if (f >= 20) a.late = f >= 22 ? 'q' : 'p'; return a; };   // late enters at frame 20
IB.actors.step = { lifter: 3 };
MG.scene({ title: 'demo', duration: 1, ref: null, fps: 24, setup: (stage) => MG.canvas(stage), render(t, ctx) {} });
</script>
"""
with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copytree(TOOLS.parent / 'core', root / 'core')
    (root / 'demo' / 'scenes' / 'fam').mkdir(parents=True)
    (root / 'demo' / 'scenes' / 'fam' / 'one.html').write_text(SCENE)
    (root / 'demo' / 'scenes' / 'fam' / 'none.html').write_text(SCENE.replace('IB.actors', 'IB.unused'))
    done = subprocess.run([sys.executable, str(root / 'tools' / 'drawings.py'), '--json', str(root / 'demo/scenes/fam/one.html'), str(root / 'demo/scenes/fam/none.html')], capture_output=True, text=True)
    out = json.loads(done.stdout or '{}')
    one, none = out.get('demo/fam/one', {}), out.get('demo/fam/none')
    check('the tool reads every actor of the scene, also one that enters after frame 0', sorted(one), ['late', 'lifter', 'walker'])
    check('before it enters an actor is absent, which counts as one drawing', one.get('late', {}).get('changes'), [20, 22])
    w, li = one.get('walker', {}), one.get('lifter', {})
    check('the walker: changes, its stale 4-frame drawing, its hold', (w.get('changes'), w.get('stale'), w.get('holds')), ([2, 4, 6, 10, 12], [[6, 4]], [[12, 12]]))
    check('the lifter is on threes as the scene declares', (li.get('step'), li.get('stale'), li.get('rate')), (3, [], 8.0))
    check('a scene without IB.actors is reported, not counted', none, None)
    check('a stale drawing is reported, not an error: exit 0', done.returncode, 0)
    check('the scene without IB.actors is named on stderr', 'demo/fam/none' in done.stderr, True)

print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
