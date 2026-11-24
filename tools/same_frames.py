#!/usr/bin/env python3
"""Check that scenes render exactly the same frames as in another copy of the library: the evidence that a change meant to keep behaviour (moving drawing code into kit parts) kept it.

Every frame of each scene is rendered from the current tree and from the base tree at two moments, its first instant (where capture.py --mp4 samples it) and its middle (where capture.py --frames does), plus the scene's last instant, and compared pixel for pixel. Both moments matter: a slip that moves a frame boundary by a hair (a lost 1e-6 in a frame counter, >= turned into >) changes nothing mid-frame. The scene fails on any differing pixel, a JavaScript error on either side, a changed duration, fps or ref, or a scene present in only one tree. Comparing a tree with itself fails: it proves nothing.

Make the base tree from the commit the change started from, outside the repository's tracked files (start from an empty directory, or files of an older base stay behind):
  rm -rf out/base && mkdir -p out/base && git archive <commit> | tar -x -C out/base

  same_frames.py --base out/base IBM/scenes/*/*.html                the scenes a change touched (paths in the current tree)
  same_frames.py --base out/base                                     every scene of both trees (pstack felt scenes fail, see below)
  same_frames.py --base out/base --diff out/diff IBM/scenes/...     also write the first differing frame of each failing scene, base | current | difference (enlarged marks)

Measured 2026-11-23 on the 23 IBM scenes (3976 frames), two separate headless Chrome instances, one seeking forward and one backward: no pixel differed in any frame, so the comparison is exact rather than thresholded (check_pure.py keeps its own tolerance). Sampling every frame's first instant as well later turned up one pixel that differed once in about 16,000 renders, at a different frame on each run: Chrome very rarely rasterises a pixel differently. So a moment that differs is drawn again on both sides (twice, after a seek elsewhere) and counts only if it still differs: a real change differs on every render. Noise that went away is printed under the scene. That holds for canvas scenes. Three pstack felt scenes (SVG with filtered textures) did not hold: against a byte-identical base tree they differed by scattered texture specks on the frames where the sign or board moves, so run the tool on canvas scenes, or read a felt failure's --diff image before believing it. Rendering takes about 0.07 s per capture, so the 23 IBM scenes take about 18 minutes.

Exit 0 when every scene matches, 1 otherwise. Requires: pip install playwright pillow, Google Chrome.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import capture  # noqa: E402
import library  # noqa: E402

# 성진: comparison is exact because canvas scenes rasterise reproducibly; SVG scenes with filters (pstack felt) do not and fail against an identical tree. Add a tolerance only when a behaviour-preserving change to such scenes needs this evidence.

META = '({duration: __mg.duration, fps: __mg.fps, ref: __mg.ref})'
RETRIES = 2


def open_page(browser, path, errors, pages):
    page = browser.new_page(viewport={'width': capture.W, 'height': capture.H}, device_scale_factor=1)
    pages.append(page)
    page.on('pageerror', lambda e: errors.append(f'{path}: {e}'))
    page.goto(path.resolve().as_uri() + '?capture')
    page.wait_for_function('window.__mg && window.__mg.ready', timeout=20000)
    return page


def moments(duration, fps):
    """(label, t) of every frame's first instant and middle, then the scene's last instant."""
    out = []
    for f in range(round(duration * fps)):
        out += [(f'{f}', f / fps), (f'{f}.5', capture.frame_time(f, fps))]
    return out + [('end', duration)]


def save_diff(diff_dir, cur, label, x, y):
    diff_dir.mkdir(parents=True, exist_ok=True)
    marks = ImageChops.difference(x, y).convert('L').point(lambda v: 255 if v else 0).filter(ImageFilter.MaxFilter(9))  # grown so a 1 px difference survives the half-size sheet
    sheet = Image.new('RGB', (capture.W * 3, capture.H))
    for i, im in enumerate((x, y, marks.convert('RGB'))):
        sheet.paste(im, (capture.W * i, 0))
    sheet.resize((capture.W * 3 // 2, capture.H // 2)).save(diff_dir / f'{library.name(cur)}-f{label}.png')


def compare(browser, cur, base, diff_dir):
    """Problems found comparing one scene in the two trees; empty when every moment is identical."""
    if not base.exists():
        return [f'not in the base tree: {base}']
    if not cur.exists():
        return [f'not in the current tree: {cur}']
    errors, pages = [], []
    try:
        a, b = open_page(browser, base, errors, pages), open_page(browser, cur, errors, pages)
        ma, mb = a.evaluate(META), b.evaluate(META)
        if ma != mb:
            return errors + [f'duration, fps or ref changed: base {ma}, current {mb}']
        times = moments(mb['duration'], mb['fps'])
        if len(times) < 2:
            return errors + ['the scene has no frames to compare']
        bad, noise = [], []
        for label, t in times:
            x, y = capture.shot(a, t), capture.shot(b, t)
            box = ImageChops.difference(x, y).getbbox()
            if box:
                for _ in range(RETRIES):   # a real change differs on every render; noise does not repeat
                    capture.shot(a, 0), capture.shot(b, 0)
                    x2, y2 = capture.shot(a, t), capture.shot(b, t)
                    if not ImageChops.difference(x2, y2).getbbox():
                        noise.append(f'{label} {box}')
                        break
                else:
                    if not bad and diff_dir:
                        save_diff(diff_dir, cur, label, x, y)
                    bad.append(f'{label} {box}')
        if noise:
            print(f'       noise, gone when drawn again: {", ".join(noise)}', flush=True)
        if bad:
            errors.append(f'{len(bad)}/{len(times)} moments differ (frame, bounding box): ' + ', '.join(bad[:8]) + (' …' if len(bad) > 8 else ''))
    except Exception as e:  # a scene that never becomes ready is a failure, not a crash of the check
        errors.append(f'{type(e).__name__}: {e}'.splitlines()[0])
    finally:
        for page in pages:
            page.close()
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('scenes', nargs='*', type=Path, help='scene files in the current tree (default: every scene of both trees)')
    ap.add_argument('--base', type=Path, required=True, help='root of the other copy of the library')
    ap.add_argument('--diff', type=Path, help='directory for an image of the first differing frame of each failing scene')
    args = ap.parse_args()
    base = args.base.resolve()
    # 성진: only the current tree itself is refused; a base archived from the same commit as the working tree also passes everything. Catch it if a session ever relies on such a run, by comparing the scenes' files and their core/ and kit/ sources byte for byte.
    if base == library.ROOT:
        print(f'--base {args.base} is the current tree: comparing it with itself proves nothing')
        return 1
    if args.scenes:
        rels = [p.resolve().relative_to(library.ROOT) for p in args.scenes]
    else:
        rels = sorted({p.relative_to(library.ROOT) for p in library.scenes()} | {p.relative_to(base) for p in base.glob('*/scenes/*/*.html')})
    if not rels:
        print('no scenes to compare')
        return 1
    failed = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        for rel in rels:
            errors = compare(browser, library.ROOT / rel, base / rel, args.diff)
            print(('FAIL ' if errors else 'ok   ') + str(rel) + ''.join(f'\n       {e}' for e in errors), flush=True)
            if errors:
                failed.append(rel)
        browser.close()
    print(f'{len(rels) - len(failed)}/{len(rels)} scenes render the same frames')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
