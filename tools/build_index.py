#!/usr/bin/env python3
"""Rebuild index.html (the scene gallery of every reference) and parts.html (the part sheet: one card per part sample), and print the scene list as a Markdown table.

Reads every <ref>/scenes/<family>/<slug>.html (layout in library.py) and takes its duration, its `ref: [start, end]` range in the reference video and the first sentence of its top comment. A scene that reproduces no part of the video (a new scenario drawn in the reference's style) says so with `ref: null`; its card reads 창작 where the range would be. The gallery groups scenes by reference, then by family in the order of <ref>/families.json. Each card shows the poster <ref>/thumbs/<family>-<slug>.jpg; hovering a card swaps the poster for the live scene in an <iframe> (opened with ?embed), and clicking opens the scene with its player.

  build_index.py            write index.html and parts.html, print a Markdown table
  build_index.py --thumbs   first re-render every poster of scenes and part samples (needs Google Chrome, pip install playwright pillow), then write index.html and parts.html
  build_index.py --check    exit 1 if a scene lacks duration, ref (a range or an explicit null), the "Motion notes:" comment, its poster or a family listed in families.json, or a part sample lacks duration, ref: null, a first sentence, its poster or a known group; writes nothing

A part sample is <ref>/parts/<group>/<name>.html: a page (an MG.scene with ref: null) that lays out kit parts of <ref> in their states and plays their moves. parts.html shows them like the scene gallery, grouped in library.GROUPS order; the first sentence of the sample's top comment is its card text, so name the IB.* parts there.
"""
import argparse
import html
import re
import sys
from pathlib import Path

import library
from library import ROOT

THUMB_SIZE = (640, 360)
THUMB_AT = 0.72   # fraction of the duration the poster is taken at: late enough that most of a scene has arrived


def clock(sec):
    tenths = round(sec * 10)   # round first, so 59.96 s reads 1:00.0 and not 0:60.0
    return f'{tenths // 600}:{(tenths % 600) / 10:04.1f}'


def read_scene(path):
    src = path.read_text()
    call = src[src.find('MG.scene('):] if 'MG.scene(' in src else ''   # the declaration; the comment above it is prose and may quote a duration or a ref
    # 성진: 선언을 파싱하지 않고 첫 `MG.scene(` 뒤의 첫 `duration:`·`ref:`를 읽는다. 주석에 `MG.scene(`를 쓰거나 선언에서 이 둘보다 앞에 같은 키를 가진 코드를 두면 잘못 읽으니, 장면이 title·duration·ref를 선언 맨 앞에 두는 관례를 벗어나면 JS 파서로 바꾼다.
    dur = re.search(r'duration:\s*([\d.]+)', call)
    said = re.search(r'ref:\s*(?:(null)\b|\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\])', call)
    ref = said if said and not said.group(1) else None
    comment = re.search(r'<script>\s*/\*(.*?)\*/', src, re.S)
    text = ' '.join(comment.group(1).split()) if comment else ''
    summary = re.split(r'(?<=[.!?])\s', text, maxsplit=1)[0] if text else ''
    reference, family, slug = library.parts(path)
    return {
        'path': path, 'ref': reference, 'family': family, 'slug': slug, 'href': path.relative_to(ROOT).as_posix(),
        'thumb': library.thumb(path).relative_to(ROOT).as_posix(),
        'duration': float(dur.group(1)) if dur else None,
        'span': (float(ref.group(2)), float(ref.group(3))) if ref else None,
        'original': bool(said and said.group(1)),   # declared to have no range in the reference video
        'summary': summary, 'has_notes': 'Motion notes:' in text,
    }


def card(s, span):
    length = f"{s['duration']:g}s" if s['duration'] is not None else '—'   # an unfinished page still gets listed
    has_poster = (ROOT / s['thumb']).exists()
    if not has_poster:
        print(f"no poster for {s['href']}: run build_index.py --thumbs", file=sys.stderr)
    poster = f'<img src="{s["thumb"]}" alt="" loading="lazy">' if has_poster else ''
    return f'<a class="card" href="{s["href"]}"><div class="thumb">{poster}</div><b>{html.escape(s["slug"])}</b><span>{span} · {length}</span><p>{html.escape(s["summary"])}</p></a>'


def page(title, lead, nav, body):
    return f"""<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<title>{title}</title>
<style>{STYLE}</style>
<h1>{title}</h1>
<p class="lead">{lead} · {nav}</p>
{body}
<script>{SCRIPT}</script>
"""


def render_thumbs(scenes):
    """Capture one poster per scene. Imported here so a plain index build needs no browser."""
    from PIL import Image
    from playwright.sync_api import sync_playwright

    import capture

    wanted = {ROOT / s['thumb'] for s in scenes}
    for ref in {s['ref'] for s in scenes}:
        (ROOT / ref / 'thumbs').mkdir(exist_ok=True)
        for stale in set((ROOT / ref / 'thumbs').glob('*.jpg')) - wanted:   # a renamed or deleted scene leaves no orphan poster behind
            stale.unlink()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        for s in scenes:
            page, meta = capture.open_scene(browser, s['path'])
            capture.shot(page, meta['duration'] * THUMB_AT).resize(THUMB_SIZE, Image.LANCZOS).save(ROOT / s['thumb'], quality=82)
            page.close()
        browser.close()
    print(f'{len(scenes)} posters written', file=sys.stderr)


STYLE = """
  body { margin: 0; padding: 40px 48px 80px; background: #101010; color: #e8e8e8; font: 15px/1.5 system-ui, sans-serif; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 20px; margin: 48px 0 0; } h3 { font-size: 16px; margin: 28px 0 12px; color: #bcb8f8; } code { color: #8a8a8a; font-size: 13px; }
  p.lead { color: #9a9a9a; margin: 0; } p.lead a { color: #bcb8f8; }
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
    ap.add_argument('--check', action='store_true', help='only report scenes missing duration, ref, Motion notes or a poster, and part samples missing duration, ref: null, a first sentence, a poster or a known group; writes nothing')
    ap.add_argument('--thumbs', action='store_true', help='re-render every poster in <ref>/thumbs/ (scenes and part samples) before writing index.html and parts.html')
    args = ap.parse_args()
    scenes = [read_scene(p) for p in library.scenes()]
    samples = [read_scene(p) for p in library.samples()]
    refs = sorted({s['ref'] for s in scenes})
    families = {}
    for ref in refs:
        try:
            families[ref] = library.families(ref)
        except FileNotFoundError:
            sys.exit(f'{ref}/families.json is missing: list the families of {ref} as {{"family": "label", ...}}')
    if args.check:
        bad = [s['href'] for s in scenes if s['duration'] is None or (s['span'] is None and not s['original']) or not s['has_notes']]
        bad += [f"{s['thumb']} (run build_index.py --thumbs)" for s in scenes + samples if not (ROOT / s['thumb']).exists()]
        bad += [f"{s['href']} (family {s['family']} is not in {s['ref']}/families.json)" for s in scenes if s['family'] not in families[s['ref']]]
        bad += [f"{s['href']} (a part sample needs duration, ref: null and a first sentence in its top comment)" for s in samples if s['duration'] is None or not s['original'] or not s['summary']]
        bad += [f"{s['href']} (group {s['family']} is not one of {', '.join(library.GROUPS)})" for s in samples if s['family'] not in library.GROUPS]
        for b in bad:
            print('incomplete:', b)
        sys.exit(1 if bad else 0)
    if args.thumbs:
        render_thumbs(scenes + samples)

    for s in scenes:
        if s['family'] not in families[s['ref']]:
            print(f"{s['href']} is left out of the gallery: add family {s['family']} to {s['ref']}/families.json", file=sys.stderr)
    cards, table = [], ['| 레퍼런스 | 계열 | 장면 | 원본 구간 | 길이 | 내용 |', '|---|---|---|---|---|---|']
    for ref in refs:
        cards.append(f'<h2>{html.escape(ref)}</h2>')
        for fam, label in families[ref].items():
            rows = sorted((s for s in scenes if s['ref'] == ref and s['family'] == fam), key=lambda s: s['span'] or (0, 0))
            if not rows:
                continue
            cards.append(f'<h3>{html.escape(label)} <code>{fam}</code></h3><div class="grid">')
            for s in rows:
                span = f"{clock(s['span'][0])}–{clock(s['span'][1])}" if s['span'] else '창작' if s['original'] else '—'
                cards.append(card(s, span))
                length = f"{s['duration']:g}s" if s['duration'] is not None else '—'
                table.append(f"| {ref} | {fam} | [{s['slug']}]({s['href']}) | {span} | {length} | {s['summary']} |")
            cards.append('</div>')
    lead = f'장면 {len(scenes)}개 · 카드에 마우스를 올리면 재생 · 클릭하면 재생 막대와 함께 열림 (스페이스 = 재생/정지, ←/→ = 한 프레임, 주소에 ?t=3.2 = 그 시각에서 열기)'
    (ROOT / 'index.html').write_text(page('모션그래픽 레퍼런스 장면', lead, '<a href="parts.html">부품 시트</a>', ''.join(cards)))

    # the part sheet: every reference's samples, by group in GROUPS order
    for s in samples:
        if s['family'] not in library.GROUPS:
            print(f"{s['href']} is left out of the part sheet: group {s['family']} is not one of {', '.join(library.GROUPS)}", file=sys.stderr)
    samples = [s for s in samples if s['family'] in library.GROUPS]
    pcards = []
    for ref in sorted({s['ref'] for s in samples}):
        pcards.append(f'<h2>{html.escape(ref)}</h2>')
        for group, label in library.GROUPS.items():
            rows = sorted((s for s in samples if s['ref'] == ref and s['family'] == group), key=lambda s: s['slug'])
            if not rows:
                continue
            pcards.append(f'<h3>{html.escape(label)} <code>{group}</code></h3><div class="grid">')
            pcards += [card(s, '견본') for s in rows]
            pcards.append('</div>')
    plead = f'부품 견본 {len(samples)}장 · 장면을 조립하는 kit 부품의 상태와 동작 · 카드에 마우스를 올리면 재생'
    (ROOT / 'parts.html').write_text(page('모션그래픽 레퍼런스 부품', plead, '<a href="index.html">장면 시트</a>', ''.join(pcards)))
    print('\n'.join(table))


if __name__ == '__main__':
    main()
