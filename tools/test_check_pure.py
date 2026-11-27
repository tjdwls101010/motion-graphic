#!/usr/bin/env python3
"""Contract of check_pure.py: it passes a scene whose render(t) depends on t alone, and fails one that keeps state between renders (a counter, the time of the previous render) even though it now re-captures a differing moment before calling it impure. Run: python3 tools/test_check_pure.py (exit 1 on failure). Needs Google Chrome.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
SCENE = """<!doctype html>
<meta charset="utf-8">
<script src="../../../core/motion.js"></script>
<script src="../../../core/stage.js"></script>
<script>
%s
MG.scene({ title: 'x', duration: 2, ref: null, fps: 24, setup: (s) => MG.canvas(s), render(t, ctx) {
  ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = '#111'; ctx.fillRect(%s, 400, 200, 200);
} });
</script>
"""
CASES = {
  'pure': ('', '200 + t * 400'),
  'counter': ('let n = 0;', '200 + ((n += 1) % 7) * 150'),        # draws somewhere new on every render
  'history': ('let prev = 0;', '200 + ((p) => (prev = t, p * 400))(prev)'),   # draws where the previous render's t was
}
failed = 0
with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copytree(TOOLS.parent / 'core', root / 'core')
    (root / 'demo' / 'scenes' / 'fam').mkdir(parents=True)
    for name, (pre, x) in CASES.items():
        (root / 'demo' / 'scenes' / 'fam' / f'{name}.html').write_text(SCENE % (pre, x))
    for name, want in [('pure', 0), ('counter', 1), ('history', 1)]:
        done = subprocess.run([sys.executable, str(root / 'tools' / 'check_pure.py'), str(root / 'demo/scenes/fam' / f'{name}.html')], capture_output=True, text=True)
        if done.returncode != want or 'Error' in done.stdout + done.stderr:   # a scene that fails to load would pass for the wrong reason
            failed += 1
            print(f'FAIL {name}: exit {done.returncode}, want {want}\n{done.stdout}{done.stderr}')
print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
