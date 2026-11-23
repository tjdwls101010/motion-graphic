#!/usr/bin/env python3
"""Contract of same_frames.py that a behaviour-preserving refactor relies on as its evidence: it passes a scene whose every frame renders the same in the base tree and the current tree, and fails one that differs anywhere, however little. Run: python3 tools/test_same_frames.py (exit 1 on failure). Needs Google Chrome.

Each case builds a throwaway base tree and current tree (each a copy of core/ beside one reference with one canvas scene; the current tree also gets tools/) and runs the real command in the current tree, so the check goes through the same entry point a session uses.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
CORE = TOOLS.parent / 'core'
# A scene with 12 frames at 24 fps: seeded dots that move each frame, and one small square on the stage colour.
SCENE = """<!doctype html>
<meta charset="utf-8">
<script src="../../../core/motion.js"></script>
<script src="../../../core/stage.js"></script>
<script>
MG.scene({
  title: 'demo', duration: %(dur)s, ref: null, fps: 24,
  setup: (stage) => MG.canvas(stage),
  render(t, ctx) {
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, 1920, 1080);
    const r = MG.rng(%(seed)s);
    ctx.fillStyle = '#050505';
    for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.arc(r() * 1920 + t * 200, r() * 1080, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '%(square)s'; ctx.fillRect(900, 500, 12, 12);
    %(extra)s
  },
});
</script>
"""
BASE = {'seed': 7, 'square': '#f0f0f0', 'extra': '', 'dur': '0.5'}


def tree(root, with_tools, name='one', **scene):
    if not (root / 'core').exists():
        shutil.copytree(CORE, root / 'core')
    if with_tools:
        shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
    (root / 'demo' / 'scenes' / 'fam').mkdir(parents=True, exist_ok=True)
    (root / 'demo' / 'families.json').write_text('{"fam": "계열"}')
    (root / 'demo' / 'scenes' / 'fam' / f'{name}.html').write_text(SCENE % {**BASE, **scene})


def run(base=None, current=None, args=(), name='one'):
    """(exit code, stdout, files written under --diff) of same_frames.py comparing a base scene with a current scene; each differs from BASE by the given fields."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        tree(root / 'base', False, **(base or {}))
        tree(root / 'cur', True, name=name, **(current or {}))
        diff = root / 'diff'
        done = subprocess.run([sys.executable, str(root / 'cur' / 'tools' / 'same_frames.py'), '--base', str(root / 'base'), '--diff', str(diff), *args], capture_output=True, text=True, cwd=root / 'cur')
        return done.returncode, done.stdout + done.stderr, sorted(p.name for p in diff.glob('*')) if diff.exists() else []


failed = 0


def check(name, got, want):
    global failed
    if got != want:
        failed += 1
        print(f'FAIL {name}: got {got!r}, want {want!r}')


def fails_because(name, result, reason):
    """A failing case counts only when it fails for the intended reason: a crashed tool also exits 1."""
    code, out, _ = result
    check(name, (code, reason in out), (1, True))
    if reason not in out:
        print(out)


SAME = '1/1 scenes render the same frames'
code, out, _ = run()
check('the same scene in both trees passes', (code, SAME in out), (0, True))
fails_because('a changed seed fails', run(current={'seed': 8}), 'moments differ')
fails_because('a 12 px square filled paper (#fdfdfd) instead of the stage colour (#f0f0f0) fails', run(current={'square': '#fdfdfd'}), 'moments differ')
fails_because('a difference in the first frame only fails', run(current={'extra': "if (t < 1 / 24) { ctx.fillStyle = '#fdfdfd'; ctx.fillRect(10, 10, 4, 4); }"}), 'moments differ')
fails_because('a difference in the last frame only (not at the end instant) fails', run(current={'extra': "if (t > 11 / 24 && t < 0.5) { ctx.fillStyle = '#fdfdfd'; ctx.fillRect(10, 10, 4, 4); }"}), 'moments differ')
# the refactor moves frame counters such as IB.frame = floor(t * 24 + 1e-6): a slip that moves a boundary by a hair (a lost epsilon, >= turned into >) changes nothing mid-frame and shifts a drawing at the frame's first instant, where an mp4 samples it
fails_because('a difference only at the start of a frame fails', run(base={'extra': "if (t < 0.4 && Math.floor(t * 24 + 1e-6) % 2) { ctx.fillStyle = '#fdfdfd'; ctx.fillRect(10, 10, 4, 4); }"}, current={'extra': "if (t < 0.4 && Math.floor(t * 24 - 1e-6) % 2) { ctx.fillStyle = '#fdfdfd'; ctx.fillRect(10, 10, 4, 4); }"}), 'moments differ')
fails_because('a scene that raises a JavaScript error in the current tree fails', run(current={'extra': 'if (t > 0.3) undefinedName();'}), 'undefinedName')
fails_because('a scene that raises a JavaScript error in the base tree fails', run(base={'extra': 'if (t > 0.3) undefinedName();'}), 'undefinedName')
fails_because('a changed duration fails', run(current={'extra': '', 'dur': '0.75'}), 'changed')
fails_because('a scene missing from the base tree fails', run(name='two'), 'not in the base tree')
fails_because('a scene missing from the current tree fails', run(name='two'), 'not in the current tree')
fails_because('comparing a tree with itself fails: it proves nothing', run(args=('--base', '.')), 'proves nothing')
check('--diff writes an image of the first differing frame', run(current={'seed': 8})[2], ['demo-fam-one-f0.png'])

print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
