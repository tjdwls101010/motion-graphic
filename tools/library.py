"""Where things live in this library. The tools find references, scenes, posters and source videos only through these paths.

  <ref>/scenes/<family>/<slug>.html   a scene reproducing part of reference video <ref>
  <ref>/families.json                 {family: label, ...} in the order the gallery shows them
  <ref>/thumbs/<family>-<slug>.jpg    the scene's gallery poster
  <ref>/parts/<group>/<name>.html     a part sample: one page showing kit parts of <ref> in their states and moves (groups in GROUPS)
  <ref>/thumbs/parts-<group>-<name>.jpg  the sample's poster on parts.html
  references/<ref>/<ref>.mp4          the source video (local only, not in the repository)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def scenes():
    """Every scene of every reference, sorted by path."""
    return sorted(ROOT.glob('*/scenes/*/*.html'))


# The groups of the part sheet (parts.html), in its order: what a page of parts shows.
GROUPS = {'look': '선·색·질감', 'cast': '출연진', 'props': '소품', 'sets': '배경 세트', 'marks': '효과 표시', 'time': '박자'}


def samples():
    """Every part sample of every reference, sorted by path."""
    return sorted(ROOT.glob('*/parts/*/*.html'))


def is_sample(path):
    return Path(path).resolve().parents[1].name == 'parts'


def parts(scene):
    """(ref, family, slug) of a scene file."""
    scene = Path(scene).resolve()
    return scene.parents[2].name, scene.parent.name, scene.stem


def name(scene):
    """A file-name stem unique across references: <ref>-<family>-<slug>."""
    return '-'.join(parts(scene))


def families(ref):
    """{family: label} of a reference, in gallery order."""
    return json.loads((ROOT / ref / 'families.json').read_text())


def thumb(scene):
    """The gallery poster of a scene, or of a part sample (parts-<group>-<name>.jpg)."""
    ref, family, slug = parts(scene)
    return ROOT / ref / 'thumbs' / (f'parts-{family}-{slug}.jpg' if is_sample(scene) else f'{family}-{slug}.jpg')


def video(ref):
    return ROOT / 'references' / ref / f'{ref}.mp4'
