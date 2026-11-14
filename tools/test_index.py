#!/usr/bin/env python3
"""Contract of build_index.py that scene files rely on: what `--check` accepts as a complete scene and what a gallery card shows for it. Run: python3 tools/test_index.py (exit 1 on failure).

Each case builds a throwaway library (a copy of tools/ beside one reference with one scene) and runs the real command in it, so the checks go through the same entry point a session uses.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
SCENE = """<!doctype html>
<script>
/* 상자가 왼쪽에서 들어와 멈춘다. Motion notes: outCubic 0.4 s. %s */
MG.scene({
  title: 'demo',
  duration: 4, %s fps: 24,
  render() {},
});
</script>
"""


def run(ref_line, *args, note=''):
    """Run build_index.py in a library whose only scene declares `ref_line` and whose top comment also says `note`; returns (exit code, index.html text or '')."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
        (root / 'demo' / 'scenes' / 'fam').mkdir(parents=True)
        (root / 'demo' / 'thumbs').mkdir()
        (root / 'demo' / 'families.json').write_text('{"fam": "계열"}')
        (root / 'demo' / 'scenes' / 'fam' / 'one.html').write_text(SCENE % (note, ref_line))
        (root / 'demo' / 'thumbs' / 'fam-one.jpg').write_bytes(b'')
        done = subprocess.run([sys.executable, str(root / 'tools' / 'build_index.py'), *args], capture_output=True, text=True)
        index = root / 'index.html'
        return done.returncode, index.read_text() if index.exists() else ''


failed = 0


def check(name, got, want):
    global failed
    if got != want:
        failed += 1
        print(f'FAIL {name}: got {got!r}, want {want!r}')


check('a scene with a reference range is complete', run('ref: [1.5, 5.5],', '--check')[0], 0)
check('an original scene (ref: null) is complete', run('ref: null,', '--check')[0], 0)
check('a scene that says nothing about ref is incomplete', run('', '--check')[0], 1)

code, page = run('ref: [1.5, 5.5],')
check('index builds for a reproduced scene', code, 0)
check('its card shows the reference range', '0:01.5–0:05.5 · 4s' in page, True)
code, page = run('ref: null,')
check('index builds for an original scene', code, 0)
check('its card says it is original instead of a range', '창작 · 4s' in page, True)

# only the declaration inside MG.scene({...}) counts: the top comment is prose and may quote any of these
check('a comment saying ref: null does not stand in for the declaration', run('', '--check', note='ref: null')[0], 1)
check('a comment quoting a range does not stand in for the declaration', run('', '--check', note='ref: [1, 5]')[0], 1)
check('a comment quoting a range does not make an original scene a reproduced one', '창작 · 4s' in run('ref: null,', note='ref: [1, 5]')[1], True)
check('a comment quoting a duration does not replace the declared one', '창작 · 4s' in run('ref: null,', note='duration: 9')[1], True)

print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
