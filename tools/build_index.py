#!/usr/bin/env python3
"""Rebuild index.html (the scene gallery) and print the scene list as a Markdown table.

Reads every scenes/<family>/<slug>.html and takes its duration, its `ref: [start, end]` range in the reference video and the first sentence of its top comment. Each card shows the poster thumbs/<family>-<slug>.jpg; hovering a card swaps the poster for the live scene in an <iframe> (opened with ?embed), and clicking opens the scene with its player.

  build_index.py            write index.html, print a Markdown table
  build_index.py --thumbs   first re-render every poster (needs Google Chrome, pip install playwright pillow), then write index.html
  build_index.py --check    exit 1 if a scene lacks duration, ref, the "Motion notes:" comment or its poster; writes nothing
"""
import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THUMBS = ROOT / 'pstack' / 'thumbs'
THUMB_SIZE = (640, 360)
THUMB_AT = 0.72   # fraction of the duration the poster is taken at: late enough that most of a scene has arrived
FAMILIES = [
    ('sketch', '노트 손그림 스틱맨'),
    ('ui', '흰색 UI 카드'),
    ('felt', '펠트 코르크보드'),
    ('terminal', '터미널 목업'),
    ('set', '책상·청사진 세트'),
    ('overlay', '얼굴 캠 위 오버레이'),
    ('bumper', '픽셀 범퍼'),
]


def clock(sec):
    tenths = round(sec * 10)   # round first, so 59.96 s reads 1:00.0 and not 0:60.0
    return f'{tenths // 600}:{(tenths % 600) / 10:04.1f}'


def read_scene(path):
    src = path.read_text()
    dur = re.search(r'duration:\s*([\d.]+)', src)
    ref = re.search(r'ref:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]', src)
    comment = re.search(r'<script>\s*/\*(.*?)\*/', src, re.S)
    text = ' '.join(comment.group(1).split()) if comment else ''
    summary = re.split(r'(?<=[.!?])\s', text, maxsplit=1)[0] if text else ''
    return {
        'path': path, 'family': path.parent.name, 'slug': path.stem, 'href': f'pstack/scenes/{path.parent.name}/{path.name}',
        'thumb': f'pstack/thumbs/{path.parent.name}-{path.stem}.jpg',
        'duration': float(dur.group(1)) if dur else None,
        'ref': (float(ref.group(1)), float(ref.group(2))) if ref else None,
        'summary': summary, 'has_notes': 'Motion notes:' in text,
    }


def render_thumbs(scenes):
    """Capture one poster per scene. Imported here so a plain index build needs no browser."""
    from PIL import Image
    from playwright.sync_api import sync_playwright

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import capture

    THUMBS.mkdir(exist_ok=True)
    wanted = {ROOT / s['thumb'] for s in scenes}
    for stale in set(THUMBS.glob('*.jpg')) - wanted:   # a renamed or deleted scene leaves no orphan poster behind
        stale.unlink()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        for s in scenes:
            page, meta = capture.open_scene(browser, s['path'])
            capture.shot(page, meta['duration'] * THUMB_AT).resize(THUMB_SIZE, Image.LANCZOS).save(ROOT / s['thumb'], quality=82)
            page.close()
        browser.close()
    print(f'{len(scenes)} posters written to {THUMBS}', file=sys.stderr)


STYLE = """
  body { margin: 0; padding: 40px 48px 80px; background: #101010; color: #e8e8e8; font: 15px/1.5 system-ui, sans-serif; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 36px 0 12px; color: #bcb8f8; } code { color: #8a8a8a; font-size: 13px; }
  p.lead { color: #9a9a9a; margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  .card { display: block; padding: 10px 10px 14px; border: 1px solid #2c2c2c; border-radius: 12px; background: #181818; color: inherit; text-decoration: none; }
  .card:hover, .card:focus-visible { border-color: #bcb8f8; outline: none; }
  .thumb { position: relative; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 7px; background: #0b0b0b; margin-bottom: 12px; }
  .thumb img, .thumb iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }
  .thumb iframe { opacity: 0; transition: opacity 0.12s; pointer-events: none; }   /* clicks fall through to the card link */
  .thumb iframe.on { opacity: 1; }
  .card b { display: block; padding: 0 6px; font: 600 14px ui-monospace, monospace; }
  .card span { display: block; padding: 0 6px; color: #8a8a8a; font-size: 12px; }
  .card p { margin: 8px 0 0; padding: 0 6px; color: #b5b5b5; font-size: 13px; }
"""

# Hover preview: the poster stays until the embedded scene reports its first frame, then the iframe fades in over it. One live scene at a time; leaving the card removes the iframe, so an idle gallery runs nothing.
SCRIPT = """
  const live = new Map();   // iframe window -> iframe element, for matching the scene's "ready" message
  addEventListener('message', (e) => {
    const frame = live.get(e.source);
    if (frame && e.data && e.data.mg === 'ready') frame.classList.add('on');
  });
  for (const card of document.querySelectorAll('.card')) {
    const thumb = card.querySelector('.thumb');
    let frame = null;
    const start = () => {
      if (frame) return;
      frame = document.createElement('iframe');
      frame.src = card.getAttribute('href') + '?embed';
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      thumb.append(frame);
      live.set(frame.contentWindow, frame);
    };
    const stop = () => {
      if (!frame) return;
      live.delete(frame.contentWindow);
      frame.remove();
      frame = null;
    };
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focus', start);
    card.addEventListener('blur', stop);
    addEventListener('pagehide', stop);
  }
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', action='store_true', help='only report scenes missing duration, ref, Motion notes or a poster; writes nothing')
    ap.add_argument('--thumbs', action='store_true', help='re-render every poster in thumbs/ before writing index.html')
    args = ap.parse_args()
    scenes = [read_scene(p) for p in sorted((ROOT / 'pstack' / 'scenes').rglob('*.html'))]
    if args.check:
        bad = [s['href'] for s in scenes if s['duration'] is None or s['ref'] is None or not s['has_notes']]
        bad += [f"{s['thumb']} (run build_index.py --thumbs)" for s in scenes if not (ROOT / s['thumb']).exists()]
        for b in bad:
            print('incomplete:', b)
        sys.exit(1 if bad else 0)
    if args.thumbs:
        render_thumbs(scenes)

    cards, table = [], ['| 계열 | 장면 | 원본 구간 | 길이 | 내용 |', '|---|---|---|---|---|']
    for fam, label in FAMILIES:
        rows = sorted((s for s in scenes if s['family'] == fam), key=lambda s: s['ref'] or (0, 0))
        if not rows:
            continue
        cards.append(f'<h2>{html.escape(label)} <code>{fam}</code></h2><div class="grid">')
        for s in rows:
            span = f"{clock(s['ref'][0])}–{clock(s['ref'][1])}" if s['ref'] else '—'
            length = f"{s['duration']:g}s" if s['duration'] is not None else '—'   # an unfinished scene still gets listed
            has_poster = (ROOT / s['thumb']).exists()
            if not has_poster:
                print(f"no poster for {s['href']}: run build_index.py --thumbs", file=sys.stderr)
            poster = f'<img src="{s["thumb"]}" alt="" loading="lazy">' if has_poster else ''
            cards.append(f'<a class="card" href="{s["href"]}"><div class="thumb">{poster}</div><b>{html.escape(s["slug"])}</b><span>{span} · {length}</span><p>{html.escape(s["summary"])}</p></a>')
            table.append(f"| {fam} | [{s['slug']}]({s['href']}) | {span} | {length} | {s['summary']} |")
        cards.append('</div>')

    page = f"""<!doctype html>
<meta charset="utf-8">
<title>pstack reference scenes</title>
<style>{STYLE}</style>
<h1>pstack reference scenes</h1>
<p class="lead">{len(scenes)} scenes · hover a card to play it · click to open it with the player (space = play/pause, ←/→ = one frame, ?t=3.2 opens at a time)</p>
{''.join(cards)}
<script>{SCRIPT}</script>
"""
    (ROOT / 'index.html').write_text(page)
    print('\n'.join(table))


if __name__ == '__main__':
    main()
