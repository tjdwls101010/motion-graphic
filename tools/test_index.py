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

# part samples: <ref>/parts/<group>/<name>.html, a page per part or family of parts, gathered on parts.html in a fixed group order
SAMPLE = """<!doctype html>
<script>
/* %s The rest of the comment. */
MG.scene({
  title: 'sample',
  %s %s fps: 24,
  render() {},
});
</script>
"""


def run_parts(sample_ref='ref: null,', comment='소품 견본: IB.crate와 IB.box.', group='props', poster=True, args=(), duration='duration: 6,', extra=()):
    """Run build_index.py in a library with one scene and one part sample (plus a complete sample in each group of `extra`); returns (exit code, stdout, parts.html text or '')."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
        (root / 'demo' / 'scenes' / 'fam').mkdir(parents=True)
        (root / 'demo' / 'parts' / group).mkdir(parents=True)
        (root / 'demo' / 'thumbs').mkdir()
        (root / 'demo' / 'families.json').write_text('{"fam": "계열"}')
        (root / 'demo' / 'scenes' / 'fam' / 'one.html').write_text(SCENE % ('', 'ref: null,'))
        (root / 'demo' / 'thumbs' / 'fam-one.jpg').write_bytes(b'')
        text = SAMPLE % (comment or '', duration, sample_ref)
        (root / 'demo' / 'parts' / group / 'crate.html').write_text(text if comment is not None else text.replace('/*  The rest of the comment. */\n', ''))   # None: no top comment at all
        for g in extra:
            (root / 'demo' / 'parts' / g).mkdir(parents=True, exist_ok=True)
            (root / 'demo' / 'parts' / g / 'more.html').write_text(SAMPLE % (f'견본 {g}.', 'duration: 6,', 'ref: null,'))
            (root / 'demo' / 'thumbs' / f'parts-{g}-more.jpg').write_bytes(b'')
        if poster:
            (root / 'demo' / 'thumbs' / f'parts-{group}-crate.jpg').write_bytes(b'')
        done = subprocess.run([sys.executable, str(root / 'tools' / 'build_index.py'), *args], capture_output=True, text=True)
        page = root / 'parts.html'
        return done.returncode, done.stdout + done.stderr, page.read_text() if page.exists() else ''


code, out, page = run_parts()
check('a library with a part sample builds parts.html', (code, bool(page)), (0, True))
check('the sample gets a card with its first sentence', '소품 견본: IB.crate와 IB.box.' in page, True)
check('the card links to the sample page', 'href="demo/parts/props/crate.html"' in page, True)
check('the card shows the sample poster', 'demo/thumbs/parts-props-crate.jpg' in page, True)
check('parts.html links back to the scene gallery', 'href="index.html"' in page, True)
check('a complete sample passes --check', run_parts(args=('--check',))[0], 0)
check('a sample without a poster fails --check', run_parts(poster=False, args=('--check',))[0], 1)
check('a sample that declares no ref: null fails --check', run_parts(sample_ref='', args=('--check',))[0], 1)
check('a sample in a group the sheet does not know fails --check', run_parts(group='misc', args=('--check',))[0], 1)
check('a sample without a duration fails --check', run_parts(duration='', args=('--check',))[0], 1)
check('a sample without a top comment sentence fails --check', run_parts(comment=None, args=('--check',))[0], 1)
page = run_parts(extra=('marks', 'sets'))[2]
check('groups follow library.GROUPS, not the alphabet: sets before marks', 0 <= page.find('<code>sets</code>') < page.find('<code>marks</code>'), True)
code, out, page = run_parts(group='misc')
check('a sample in an unknown group is reported, left out of the sheet and of its count', ('misc' in out, 'crate.html' in page, '견본 0장' in page), (True, False, True))
idx = run('ref: null,')[1]
check('the scene gallery links to parts.html', 'href="parts.html"' in idx, True)

# --thumbs renders a poster for every scene and every part sample, and deletes posters nothing uses any more. Real pages this time: it opens them in Chrome.
LIVE = """<!doctype html>
<script src="../../../core/motion.js"></script>
<script src="../../../core/stage.js"></script>
<script>
/* %s A page. Motion notes: none. */
MG.scene({ title: 'x', duration: 1, ref: null, fps: 24, setup: (s) => MG.canvas(s), render(t, ctx) { ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 100, 100); } });
</script>
"""
with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    shutil.copytree(TOOLS, root / 'tools', ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copytree(TOOLS.parent / 'core', root / 'core')
    for sub in ('scenes/fam', 'parts/props', 'thumbs'):
        (root / 'demo' / sub).mkdir(parents=True)
    (root / 'demo' / 'families.json').write_text('{"fam": "계열"}')
    (root / 'demo' / 'scenes' / 'fam' / 'one.html').write_text(LIVE % '장면.')
    (root / 'demo' / 'parts' / 'props' / 'crate.html').write_text(LIVE % '견본.')
    (root / 'demo' / 'thumbs' / 'parts-props-gone.jpg').write_bytes(b'')   # the poster of a sample that no longer exists
    done = subprocess.run([sys.executable, str(root / 'tools' / 'build_index.py'), '--thumbs'], capture_output=True, text=True)
    posters = sorted(p.name for p in (root / 'demo' / 'thumbs').glob('*.jpg'))
    check('--thumbs writes the scene and sample posters and deletes the orphan', (done.returncode, posters), (0, ['fam-one.jpg', 'parts-props-crate.jpg']))

print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
