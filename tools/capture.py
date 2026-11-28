#!/usr/bin/env python3
"""Render scene HTML files to stills, contact sheets, mp4 clips, or a side-by-side with the reference video.

A scene exposes window.__mg = {duration, fps, ref, seek(t)} when opened with ?capture (see core/stage.js); this tool seeks to exact times and screenshots the 1920x1080 stage in headless Chrome.

  capture.py IBM/scenes/spot/folder-meets-document.html --at 0.5,2,6 --out out/stills       PNG stills at those seconds
  capture.py IBM/scenes/spot/folder-meets-document.html --sheet out/folder.jpg --n 12       n evenly spaced frames tiled into one image
  capture.py IBM/scenes/spot/folder-meets-document.html --mp4 out/folder.mp4                the whole clip
  capture.py IBM/scenes/spot/folder-meets-document.html --compare out/folder-cmp.jpg --n 6  reference frame above the render at the same moments
  capture.py IBM/scenes/spot/folder-meets-document.html --compare out/kick.jpg --frames 16-36 --box 860,560,1500,1080 --ref-crop 356,60,1564,880
                                                                                 the drawings of one move, enlarged, each above its reference frame
  capture.py --all --sheet-dir out/sheets                                          one contact sheet per scene of every reference

--compare needs the scene's `ref: [start, end]` seconds and its reference video, by default references/<ref>/<ref>.mp4 for a scene under <ref>/scenes/ (local only, not in the repository).

Evenly spaced moments show the composition; they miss the drawings. To check acting, name the frames: --frames takes frame numbers at the scene's fps (18,20,22), ranges that step by 2 because a drawing on twos lasts two frames (16-36), or ranges with their own step (0-278-6). Each cell is then labelled with its frame number, and --compare puts every reference frame directly above its render and wraps at --cols. --box x0,y0,x1,y1 keeps only that region of the 1920x1080 stage in every cell, which is how a 250 px character gets large enough to judge. A scene that shows only part of the reference frame (it enlarges a CROP region) needs --ref-crop x,y,w,h with the same numbers, or the reference cells will not line up with the render.
Requires: pip install playwright pillow, Google Chrome, ffmpeg.
"""
import argparse
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

import library

W, H = 1920, 1080


def open_scene(browser, path):
    page = browser.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
    page.on('pageerror', lambda e: print(f'[page error] {path.name}: {e}', file=sys.stderr))
    page.goto(path.resolve().as_uri() + '?capture')
    page.wait_for_function('window.__mg && window.__mg.ready', timeout=20000)
    meta = page.evaluate('({duration: __mg.duration, fps: __mg.fps, ref: __mg.ref})')
    return page, meta


def shot(page, t):
    page.evaluate('t => window.__mg.seek(t)', t)
    return Image.open(io.BytesIO(page.screenshot(type='png', clip={'x': 0, 'y': 0, 'width': W, 'height': H}))).convert('RGB')


def frame_list(spec):
    """Frame numbers from '18,20,22', '16-36' (every 2nd frame: one drawing on twos) or '0-278-6' (own step), in the order typed."""
    out = []
    for part in spec.split(','):
        nums = [int(x) for x in part.split('-')]
        if len(nums) == 1:
            out.append(nums[0])
        elif len(nums) in (2, 3):
            a, b, step = nums[0], nums[1], nums[2] if len(nums) == 3 else 2
            if b < a or step < 1:
                raise ValueError(f'bad frame range {part!r}: want first-last or first-last-step with last >= first')
            out.extend(range(a, b + 1, step))
        else:
            raise ValueError(f'bad frame range {part!r}')
    return out


def region(spec):
    """(x0, y0, x1, y1) of a region of the stage from 'x0,y0,x1,y1'."""
    nums = tuple(int(x) for x in spec.split(','))
    if len(nums) != 4:
        raise ValueError(f'a region is x0,y0,x1,y1, got {spec!r}')
    x0, y0, x1, y1 = nums
    if not (0 <= x0 < x1 <= W and 0 <= y0 < y1 <= H):
        raise ValueError(f'region {spec!r} is empty or outside the {W}x{H} stage')
    return nums


def frame_time(frame, fps):
    """The middle of a frame, in seconds: a seek to it can never fall on the boundary with its neighbour."""
    return (frame + 0.5) / fps


def ref_seek(frame, fps):
    """Seconds into the reference segment to ask ffmpeg for so that it returns frame `frame`. ffmpeg's seek returns the first frame at or after the time asked for, so the middle of a frame gives the one after it: ask a quarter frame before this one starts."""
    return (frame - 0.25) / fps


def even_times(duration, n):
    return [duration * (i + 0.5) / n for i in range(n)]


def tile(images, cols, cell_w, labels=None):
    """Tile equally sized images, `cols` to a row, each scaled to cell_w wide; labels are drawn in the top-left corner of their cell."""
    cell_h = round(cell_w * images[0].height / images[0].width)
    rows = -(-len(images) // cols)
    sheet = Image.new('RGB', (cols * cell_w + (cols - 1) * 4, rows * cell_h + (rows - 1) * 4), 'black')
    draw = ImageDraw.Draw(sheet)
    for i, im in enumerate(images):
        at = ((i % cols) * (cell_w + 4), (i // cols) * (cell_h + 4))
        sheet.paste(im.resize((cell_w, cell_h), Image.LANCZOS), at)
        if labels:
            draw.text((at[0] + 6, at[1] + 4), labels[i], fill=(220, 0, 0))
    return sheet


def stack(top, bottom):
    """Two equally sized images, one above the other."""
    out = Image.new('RGB', (top.width, top.height * 2))
    out.paste(top, (0, 0))
    out.paste(bottom, (0, top.height))
    return out


def ref_frame(video, t):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', str(video), '-map', '0:v:0', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(out)).convert('RGB')


def save(img, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, quality=90)
    print(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('scene', nargs='?', help='scene HTML file')
    ap.add_argument('--all', action='store_true', help='every scene of every reference (use with --sheet-dir or --mp4-dir)')
    ap.add_argument('--at', help='comma-separated seconds for stills')
    ap.add_argument('--out', default='out/stills', help='directory for --at stills')
    ap.add_argument('--sheet', help='contact sheet output path')
    ap.add_argument('--sheet-dir', help='with --all: directory for one sheet per scene')
    ap.add_argument('--mp4', help='mp4 output path')
    ap.add_argument('--mp4-dir', help='with --all: directory for one mp4 per scene')
    ap.add_argument('--compare', help='reference-vs-render sheet output path')
    ap.add_argument('--ref', help='reference video for --compare (default: references/<ref>/<ref>.mp4 of the scene)')
    ap.add_argument('--n', type=int, default=10, help='frames in a sheet or comparison')
    ap.add_argument('--frames', type=frame_list, help='with --sheet or --compare: these frame numbers instead of --n evenly spaced moments, e.g. 18,20,22 or 16-36 or 0-278-6')
    ap.add_argument('--box', type=region, help='with --sheet or --compare: show only this region x0,y0,x1,y1 of the stage in every cell')
    ap.add_argument('--ref-crop', help='with --compare: the region x,y,w,h of the reference frame the scene shows (its CROP), enlarged to the stage before comparing')
    ap.add_argument('--cell', type=int, default=384, help='cell width in a sheet or comparison, px')
    ap.add_argument('--cols', type=int, default=5)
    args = ap.parse_args()

    if not (args.all or args.scene):
        ap.error('give a scene file or --all')
    if args.all and (args.scene or args.sheet or args.mp4 or args.compare):
        ap.error('--all takes no scene and writes one file per scene: use --sheet-dir / --mp4-dir (--compare takes a single scene)')
    if not (args.at or args.sheet or args.sheet_dir or args.mp4 or args.mp4_dir or args.compare):
        ap.error('nothing to do: give --at, --sheet, --sheet-dir, --mp4, --mp4-dir or --compare')
    scenes = library.scenes() if args.all else [Path(args.scene)]

    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        for path in scenes:
            page, meta = open_scene(browser, path)
            dur, fps = meta['duration'], meta['fps']
            name = library.name(path)
            if args.at:
                for t in [float(x) for x in args.at.split(',')]:
                    save(shot(page, t), Path(args.out) / f'{name}@{t:g}.png')
            times = [frame_time(f, fps) for f in args.frames] if args.frames else even_times(dur, args.n)
            labels = [str(f) for f in args.frames] if args.frames else None
            cut = (lambda im: im.crop(args.box)) if args.box else (lambda im: im)
            sheet_path = args.sheet or (Path(args.sheet_dir) / f'{name}.jpg' if args.sheet_dir else None)
            if sheet_path:
                save(tile([cut(shot(page, t)) for t in times], args.cols, args.cell, labels), sheet_path)
            if args.compare:
                if not meta['ref']:
                    sys.exit(f'{path}: scene has no ref: [start, end]')
                video = Path(args.ref) if args.ref else library.video(library.parts(path)[0])
                if not video.exists():
                    sys.exit(f'reference video not found: {video}')
                r0, r1 = meta['ref']
                rx, ry, rw, rh = [int(x) for x in args.ref_crop.split(',')] if args.ref_crop else (0, 0, W, H)
                framed = lambda im: im.crop((rx, ry, rx + rw, ry + rh)).resize((W, H), Image.LANCZOS) if args.ref_crop else im
                ref_times = [ref_seek(f, fps) for f in args.frames] if args.frames else times   # a named frame must be that very frame of the reference: one frame off hides a cut or a drawing change
                top = [cut(framed(ref_frame(video, r0 + (r1 - r0) * t / dur))) for t in ref_times]
                bottom = [cut(shot(page, t)) for t in times]
                if args.frames:   # every reference frame directly above its render, wrapping at --cols
                    save(tile([stack(a, b) for a, b in zip(top, bottom)], args.cols, args.cell, labels), args.compare)
                else:             # one row of reference frames above one row of renders
                    save(tile(top + bottom, len(times), args.cell), args.compare)
            mp4_path = args.mp4 or (Path(args.mp4_dir) / f'{name}.mp4' if args.mp4_dir else None)
            if mp4_path:
                Path(mp4_path).parent.mkdir(parents=True, exist_ok=True)
                ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', str(mp4_path)], stdin=subprocess.PIPE)
                for i in range(round(dur * fps)):
                    page.evaluate('t => window.__mg.seek(t)', i / fps)
                    ff.stdin.write(page.screenshot(type='jpeg', quality=95, clip={'x': 0, 'y': 0, 'width': W, 'height': H}))
                ff.stdin.close()
                if ff.wait() != 0:
                    sys.exit(f'ffmpeg failed for {path}')
                print(mp4_path)
            page.close()
        browser.close()


if __name__ == '__main__':
    main()
