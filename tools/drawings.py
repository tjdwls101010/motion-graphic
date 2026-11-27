#!/usr/bin/env python3
"""Count each actor's drawings in a scene: where a new drawing shows, how many drawings a second while it moves, its longest hold, and the drawings kept longer than its step without being a hold. This is the number the acting of a scene is judged by (IBM/STYLE.md: acting is a list of drawings, on twos while moving, dead holds between).

The count comes from the scene's own pose tables, not from pixels: a belt or a background that slides on ones would make every frame differ. A scene opts in by defining IB.actors(t), a pure function returning {actor name: the pose or state object that actor is drawn from at t}. Two frames show the same drawing of an actor when that object serialises the same (numbers rounded to 0.01). A heavy actor that moves on threes is declared with IB.actors.step = {name: 3}.

  drawings.py                                  every scene that defines IB.actors
  drawings.py IBM/scenes/acting/*.html         only these
  drawings.py --hold 8 --json <scene>          a hold is a run of at least 8 frames (default 6); print JSON

Per actor:
  drawings   how many different runs of drawings it has
  rate       drawings per second over the frames that are not holds (24 = on ones, 12 = on twos, 8 = on threes)
  longest    its longest run [first frame, frames]
  stale      runs longer than the actor's step and shorter than a hold [first frame, frames]: a drawing kept too long while it moves

It measures and does not judge: the reference's own spot keeps some drawings 4-5 frames while moving (IBM/STYLE.md), so a stale drawing is something to look at, not an error. Exit 0 unless a scene fails to load. Scenes without IB.actors are named on stderr and not counted. Requires: pip install playwright, Google Chrome.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import library  # noqa: E402

HOLD = 6   # frames (a quarter second): a drawing kept this long is a hold, not slow drawing

# Every frame's actors, serialised in the page: the same object gives the same string.
COLLECT = """([n, fps]) => {
  if (!(window.IB && typeof IB.actors === 'function')) return null;
  const round = (k, v) => typeof v === 'number' ? Math.round(v * 100) / 100 : typeof v === 'function' ? undefined : v;
  const out = [];
  for (let f = 0; f < n; f++) {
    const a = IB.actors(f / fps), row = {};
    for (const name of Object.keys(a)) row[name] = JSON.stringify(a[name] === undefined ? null : a[name], round);
    out.push(row);
  }
  return { frames: out, step: IB.actors.step || {} };
}"""


def analyse(states, fps=24, step=2, hold=HOLD):
    """The drawing count of one actor from its drawing at each frame (any comparable values)."""
    runs = []
    for f, s in enumerate(states):
        if runs and runs[-1][2] == s:
            runs[-1][1] += 1
        else:
            runs.append([f, 1, s])
    holds = [[f, n] for f, n, _ in runs if n >= hold]
    moving = [[f, n] for f, n, _ in runs if n < hold]
    frames = sum(n for _, n in moving)
    longest = max(([f, n] for f, n, _ in runs), key=lambda r: r[1], default=None)
    return {
        'step': step,
        'drawings': len(runs),
        'changes': [f for f, _, _ in runs[1:]],
        'rate': round(len(moving) / (frames / fps), 2) if frames else None,
        'longest': longest,
        'holds': holds,
        'stale': [[f, n] for f, n in moving if n > step],
    }


def collect(page, path, hold):
    """{actor: analysis} for one scene, or None when it defines no IB.actors."""
    page.goto(path.resolve().as_uri() + '?capture')
    page.wait_for_function('window.__mg && window.__mg.ready', timeout=20000)
    dur, fps = page.evaluate('[__mg.duration, __mg.fps]')
    got = page.evaluate(COLLECT, [round(dur * fps), fps])
    if got is None:
        return None
    names = list(dict.fromkeys(name for row in got['frames'] for name in row))   # every actor that shows at any frame, in order of first showing
    return {name: analyse([row.get(name) for row in got['frames']], fps, got['step'].get(name, 2), hold) for name in names}


def line(name, a):
    rate = f"{a['rate']:g}/s moving" if a['rate'] is not None else 'never moves'
    longest = f"longest {a['longest'][1] / 24:.2f} s (f {a['longest'][0]})" if a['longest'] else ''
    stale = ', '.join(f'f {f} ({n})' for f, n in a['stale']) or 'none'
    return f"  {name:<14} {a['drawings']:>3} drawings · {rate} · on {'twos' if a['step'] == 2 else 'threes' if a['step'] == 3 else a['step']} · {longest} · stale: {stale}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('scenes', nargs='*', type=Path)
    ap.add_argument('--hold', type=int, default=HOLD, help=f'frames a drawing must be kept to count as a hold (default {HOLD})')
    ap.add_argument('--json', action='store_true', help='print {scene: {actor: analysis}} as JSON')
    args = ap.parse_args()
    from playwright.sync_api import sync_playwright   # imported here so the counting can be tested without a browser
    paths = args.scenes or library.scenes()
    out, missing = {}, []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        for path in paths:
            name = '/'.join(library.parts(path))
            got = collect(page, path, args.hold)
            if got is None:
                missing.append(name)
                continue
            out[name] = got
        browser.close()
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
    else:
        for name, actors in out.items():
            print(name)
            for actor, a in actors.items():
                print(line(actor, a))
    if missing and args.scenes:
        print('no IB.actors (not counted): ' + ', '.join(missing), file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
