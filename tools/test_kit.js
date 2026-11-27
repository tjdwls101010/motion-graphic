#!/usr/bin/env node
/* Contract of every <ref>/kit/ file and every scene that loads them, checked without a browser. Run: node tools/test_kit.js (exit 1 on failure).
   1. A kit file's first comment says what else it needs ("Needs ink.js, time.js and marks.js"): every IB.* name it uses and does not define itself must be defined by one of those files. A part that calls another file's part only on some path (a candle's relight burst) breaks a new scene that loads the file on the strength of its comment alone.
   2. A scene loads, with its <script src> tags, every file that each kit file it loads needs, and every IB.* name the scene itself uses is defined by a file it loads.
   Comments are stripped before names are read: kit comments name parts of other files on purpose (a torch's light is IB.darkness). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const names = (src) => new Set([...strip(src).matchAll(/\bIB\.(\w+)/g)].map((m) => m[1]));
const defines = (src) => new Set([...strip(src).matchAll(/\bIB\.(\w+)\s*=(?!=)/g)].map((m) => m[1]));
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []));

let failed = 0;
const fail = (msg) => { failed++; console.log('FAIL ' + msg); };

for (const ref of fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, 'kit')))) {
  const kitDir = path.join(ROOT, ref, 'kit');
  const kit = {};   // 'cast/paper.js' -> { src, defines, uses, needs }
  for (const f of files(kitDir)) {
    const rel = path.relative(kitDir, f), src = fs.readFileSync(f, 'utf8');
    const head = (src.match(/^\/\*([\s\S]*?)\*\//) || ['', ''])[1];
    const said = (head.match(/Needs ([^;]*?)(?:;|\. |\.?\s*\*\/|$)/) || ['', ''])[1];
    kit[rel] = { src, defines: defines(src), uses: names(src), needs: [...said.matchAll(/[\w/]+\.js/g)].map((m) => m[0]) };
  }
  if (!Object.keys(kit).some((k) => kit[k].needs.length)) continue;   // a reference whose kit does not state its needs (pstack) is not held to this
  const owner = {};
  for (const [f, k] of Object.entries(kit)) for (const n of k.defines) owner[n] = f;

  // 1. each kit file's needs cover what it uses
  for (const [f, k] of Object.entries(kit)) {
    for (const n of k.needs) if (!kit[n]) fail(`${ref}/kit/${f} says it needs ${n}, which does not exist`);
    for (const n of k.uses) {
      if (k.defines.has(n)) continue;
      const o = owner[n];
      if (!o) { fail(`${ref}/kit/${f} uses IB.${n}, which no kit file defines`); continue; }
      if (!k.needs.includes(o)) fail(`${ref}/kit/${f} uses IB.${n} from ${o} but its first comment does not say it needs ${o}`);
    }
  }

  // 2. each scene loads what its kit files need and what it uses
  const sceneDir = path.join(ROOT, ref, 'scenes');
  for (const fam of fs.readdirSync(sceneDir)) for (const s of fs.readdirSync(path.join(sceneDir, fam)).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(sceneDir, fam, s), 'utf8'), name = `${ref}/scenes/${fam}/${s}`;
    const loaded = [...html.matchAll(/<script src="\.\.\/\.\.\/kit\/([^"]+)"><\/script>/g)].map((m) => m[1]);
    for (const f of loaded) {
      if (!kit[f]) { fail(`${name} loads kit/${f}, which does not exist`); continue; }
      for (const n of kit[f].needs) if (!loaded.includes(n)) fail(`${name} loads kit/${f} but not kit/${n}, which it needs`);
    }
    const script = html.split('<script>').slice(1).join('\n');
    for (const n of names(script)) { const o = owner[n]; if (o && !loaded.includes(o)) fail(`${name} uses IB.${n} from kit/${o} without loading it`); }
  }
}

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
