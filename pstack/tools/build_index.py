#!/usr/bin/env python3
"""Rebuild index.html (the scene gallery) and print the scene list as a Markdown table.

Reads every scenes/<family>/<slug>.html and takes its duration, its `ref: [start, end]` range in the reference video and the first sentence of its top comment.

  build_index.py            write index.html, print a Markdown table
  build_index.py --check    exit 1 if a scene lacks duration, ref or the "Motion notes:" comment
"""
import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
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
        'family': path.parent.name, 'slug': path.stem, 'href': f'scenes/{path.parent.name}/{path.name}',
        'duration': float(dur.group(1)) if dur else None,
        'ref': (float(ref.group(1)), float(ref.group(2))) if ref else None,
        'summary': summary, 'has_notes': 'Motion notes:' in text,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', action='store_true', help='only report scenes missing duration, ref or Motion notes; writes nothing')
    args = ap.parse_args()
    scenes = [read_scene(p) for p in sorted((ROOT / 'scenes').rglob('*.html'))]
    if args.check:
        bad = [s['href'] for s in scenes if s['duration'] is None or s['ref'] is None or not s['has_notes']]
        for b in bad:
            print('incomplete:', b)
        sys.exit(1 if bad else 0)

    cards, table = [], ['| 계열 | 장면 | 원본 구간 | 길이 | 내용 |', '|---|---|---|---|---|']
    for fam, label in FAMILIES:
        rows = sorted((s for s in scenes if s['family'] == fam), key=lambda s: s['ref'] or (0, 0))
        if not rows:
            continue
        cards.append(f'<h2>{html.escape(label)} <code>{fam}</code></h2><div class="grid">')
        for s in rows:
            span = f"{clock(s['ref'][0])}–{clock(s['ref'][1])}" if s['ref'] else '—'
            length = f"{s['duration']:g}s" if s['duration'] is not None else '—'   # an unfinished scene still gets listed
            cards.append(f'<a class="card" href="{s["href"]}"><b>{html.escape(s["slug"])}</b><span>{span} · {length}</span><p>{html.escape(s["summary"])}</p></a>')
            table.append(f"| {fam} | [{s['slug']}]({s['href']}) | {span} | {length} | {s['summary']} |")
        cards.append('</div>')

    page = f"""<!doctype html>
<meta charset="utf-8">
<title>pstack reference scenes</title>
<style>
  body {{ margin: 0; padding: 40px 48px 80px; background: #101010; color: #e8e8e8; font: 15px/1.5 system-ui, sans-serif; }}
  h1 {{ font-size: 22px; margin: 0 0 4px; }} h2 {{ font-size: 16px; margin: 36px 0 12px; color: #bcb8f8; }} code {{ color: #8a8a8a; font-size: 13px; }}
  p.lead {{ color: #9a9a9a; margin: 0; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }}
  .card {{ display: block; padding: 14px 16px; border: 1px solid #2c2c2c; border-radius: 10px; background: #181818; color: inherit; text-decoration: none; }}
  .card:hover {{ border-color: #bcb8f8; }}
  .card b {{ display: block; font: 600 14px ui-monospace, monospace; }} .card span {{ color: #8a8a8a; font-size: 12px; }} .card p {{ margin: 8px 0 0; color: #b5b5b5; font-size: 13px; }}
</style>
<h1>pstack reference scenes</h1>
<p class="lead">{len(scenes)} scenes · space = play/pause · ←/→ = one frame · add ?t=3.2 to open at a time</p>
{''.join(cards)}
"""
    (ROOT / 'index.html').write_text(page)
    print('\n'.join(table))


if __name__ == '__main__':
    main()
