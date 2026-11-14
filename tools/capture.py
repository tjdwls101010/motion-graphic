#!/usr/bin/env python3
"""Render scene HTML files to stills, contact sheets, mp4 clips, or a side-by-side with the reference video.

A scene exposes window.__mg = {duration, fps, ref, seek(t)} when opened with ?capture (see core/stage.js); this tool seeks to exact times and screenshots the 1920x1080 stage in headless Chrome.

  capture.py pstack/scenes/ui/flip-counters.html --at 0.5,2,6 --out out/stills     PNG stills at those seconds
  capture.py pstack/scenes/ui/flip-counters.html --sheet out/flip.jpg --n 12       n evenly spaced frames tiled into one image
  capture.py pstack/scenes/ui/flip-counters.html --mp4 out/flip.mp4                the whole clip
  capture.py pstack/scenes/ui/flip-counters.html --compare out/flip-cmp.jpg --n 6  reference frame above the render at the same moments
  capture.py --all --sheet-dir out/sheets                                          one contact sheet per scene of every reference

--compare needs the scene's `ref: [start, end]` seconds and its reference video, by default references/<ref>/<ref>.mp4 for a scene under <ref>/scenes/ (local only, not in the repository).
Requires: pip install playwright pillow, Google Chrome, ffmpeg.
"""
import argparse
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image
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


def even_times(duration, n):
    return [duration * (i + 0.5) / n for i in range(n)]


def tile(images, cols, cell_w):
    cell_h = round(cell_w * H / W)
    rows = -(-len(images) // cols)
    sheet = Image.new('RGB', (cols * cell_w + (cols - 1) * 4, rows * cell_h + (rows - 1) * 4), 'black')
    for i, im in enumerate(images):
        sheet.paste(im.resize((cell_w, cell_h), Image.LANCZOS), ((i % cols) * (cell_w + 4), (i // cols) * (cell_h + 4)))
    return sheet


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
            sheet_path = args.sheet or (Path(args.sheet_dir) / f'{name}.jpg' if args.sheet_dir else None)
            if sheet_path:
                save(tile([shot(page, t) for t in even_times(dur, args.n)], args.cols, 384), sheet_path)
            if args.compare:
                if not meta['ref']:
                    sys.exit(f'{path}: scene has no ref: [start, end]')
                video = Path(args.ref) if args.ref else library.video(library.parts(path)[0])
                if not video.exists():
                    sys.exit(f'reference video not found: {video}')
                r0, r1 = meta['ref']
                times = even_times(dur, args.n)
                top = [ref_frame(video, r0 + (r1 - r0) * t / dur) for t in times]
                save(tile(top + [shot(page, t) for t in times], args.n, 384), args.compare)
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
