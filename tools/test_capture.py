#!/usr/bin/env python3
"""Contract of capture.py's frame and region arguments, which a session types by hand when it checks drawings against the reference. Run: python3 tools/test_capture.py (exit 1 on failure). Rendering itself needs Chrome and is not covered here."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import capture  # noqa: E402

failed = 0


def check(what, got, want):
    global failed
    if got != want:
        failed += 1
        print(f'FAIL {what}: got {got!r}, want {want!r}')


def refuses(what, fn, arg):
    global failed
    try:
        fn(arg)
    except ValueError:
        return
    failed += 1
    print(f'FAIL {what}: {arg!r} was accepted')


# single frames keep the order they were typed in; a range steps by 2 because a drawing on twos lasts two frames
check('singles', capture.frame_list('18,4,20'), [18, 4, 20])
check('range on twos', capture.frame_list('16-22'), [16, 18, 20, 22])
check('range with its own step', capture.frame_list('0-12-4'), [0, 4, 8, 12])
check('mixed', capture.frame_list('3,10-14,40'), [3, 10, 12, 14, 40])
check('range end not on the step', capture.frame_list('10-15'), [10, 12, 14])
refuses('backwards range', capture.frame_list, '20-10')
refuses('zero step', capture.frame_list, '0-10-0')
refuses('not a number', capture.frame_list, '1,x')
refuses('empty', capture.frame_list, '')

# a region is x0,y0,x1,y1 inside the 1920x1080 stage with some area
check('box', capture.region('860,560,1500,1080'), (860, 560, 1500, 1080))
refuses('box with three numbers', capture.region, '0,0,100')
refuses('box with no area', capture.region, '100,100,100,400')
refuses('box outside the stage', capture.region, '0,0,2000,1080')

# the moment a frame number stands for is the middle of that frame, so a seek never lands on a frame boundary
check('frame to seconds', capture.frame_time(24, 24), 24.5 / 24)

# the reference is cut with ffmpeg, whose seek returns the first frame at or after the time asked for: asking for the middle of frame n returns frame n + 1. The seek time for frame n must fall after frame n - 1 starts and before frame n does, with room for a `ref` start rounded to the millisecond
for n in (0, 1, 78, 2961):
    t = capture.ref_seek(n, 24)
    if not ((n - 1) / 24 + 0.002 < t < n / 24 - 0.002):
        failed += 1
        print(f'FAIL reference seek for frame {n}: {t!r} is not safely inside ({(n - 1) / 24!r}, {n / 24!r})')

print('ok' if not failed else f'{failed} failed')
sys.exit(1 if failed else 0)
