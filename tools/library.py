"""Where things live in this library. The tools find references, scenes, posters and source videos only through these paths.

  <ref>/scenes/<family>/<slug>.html   a scene reproducing part of reference video <ref>
  <ref>/families.json                 {family: label, ...} in the order the gallery shows them
  <ref>/thumbs/<family>-<slug>.jpg    the scene's gallery poster
  references/<ref>/<ref>.mp4          the source video (local only, not in the repository)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def scenes():
    """Every scene of every reference, sorted by path."""
    return sorted(ROOT.glob('*/scenes/*/*.html'))


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
    ref, family, slug = parts(scene)
    return ROOT / ref / 'thumbs' / f'{family}-{slug}.jpg'


def video(ref):
    return ROOT / 'references' / ref / f'{ref}.mp4'
