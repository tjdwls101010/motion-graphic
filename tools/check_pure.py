#!/usr/bin/env python3
"""Check that every scene's render(t) is a pure function of time.

For each scene the same three moments are captured twice: once seeking forward (25%, 50%, 75% of the duration) and once after jumping to the end and coming back in a different order (75%, 25%, 50%). A scene that keeps state between calls, or uses wall-clock time or unseeded randomness, draws something different for the same t and fails. Also fails a scene that raises a JavaScript error.

Chrome does not rasterise the same frame bit-identically twice (gradients and antialiased edges move by 1-3 levels, up to ~16 on a pixel or two), so two captures count as different only when more than LIMIT pixels differ by more than LEVEL.

  check_pure.py                         every scene of every reference
  check_pure.py pstack/scenes/ui/*.html only these

Exit 0 when all scenes pass, 1 otherwise. Requires: pip install playwright pillow, Google Chrome.
"""
import sys
from pathlib import Path

from PIL import ImageChops
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import capture  # noqa: E402
import library  # noqa: E402

LEVEL, LIMIT = 40, 30


def differs(a, b):
    """True when the two captures differ by more than rasterisation noise."""
    hist = ImageChops.difference(a, b).convert('L').histogram()
    return sum(hist[LEVEL + 1:]) > LIMIT


def main():
    if any(a in ('-h', '--help') for a in sys.argv[1:]):
        print(__doc__)
        return 0
    paths = [Path(a) for a in sys.argv[1:]] or library.scenes()
    failed = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        for path in paths:
            errors = []
            page = browser.new_page(viewport={'width': capture.W, 'height': capture.H}, device_scale_factor=1)
            page.on('pageerror', lambda e: errors.append(str(e)))
            try:
                page.goto(path.resolve().as_uri() + '?capture')
                page.wait_for_function('window.__mg && window.__mg.ready', timeout=20000)
                dur = page.evaluate('__mg.duration')
                times = [dur * f for f in (0.25, 0.5, 0.75)]
                first = {t: capture.shot(page, t) for t in times}
                capture.shot(page, dur)
                capture.shot(page, 0)
                for t in (times[2], times[0], times[1]):
                    if differs(first[t], capture.shot(page, t)):
                        errors.append(f'frame at t={t:.2f}s depends on what was rendered before it')
            except Exception as e:  # a scene that never becomes ready is a failure, not a crash of the check
                errors.append(f'{type(e).__name__}: {e}'.splitlines()[0])
            page.close()
            name = '/'.join(library.parts(path))
            print(('FAIL ' if errors else 'ok   ') + name + ''.join(f'\n       {e}' for e in errors))
            if errors:
                failed.append(name)
        browser.close()
    print(f'{len(paths) - len(failed)}/{len(paths)} scenes pure')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
