#!/usr/bin/env node
/* Contract of every <ref>/kit/ file and every scene that loads them, checked without a browser. Run: node tools/test_kit.js (exit 1 on failure).
   1. A kit file's first comment says what else it needs ("Needs ink.js, time.js and marks.js"): every IB.* name it uses and does not define itself must be defined by one of those files. A part that calls another file's part only on some path (a candle's relight burst) breaks a new scene that loads the file on the strength of its comment alone.
   2. A scene or part sample loads, with its <script src> tags, every file that each kit file it loads needs, and every IB.* name the scene itself uses is defined by a file it loads.
   3. Only ink.js (which creates IB) and time.js load first; every other kit file may load in any order, so none of them may read another file's IB.* name while it loads (const F = IB.FIG at the top of a file is undefined if figure.js comes later): outside a function body, a file reads only its own names and those of ink.js and time.js.
   4. Every character's MOVE (a move it can play: IB.folder.MOVE.kick) is a list of [frame, state] rows from the move's first drawing, frames ascending, so a scene places any of them with IB.play and reads it with IB.held.
   5. Every IB.* part a kit file exports is used in the code of at least one part sample (<ref>/parts/), so the part sheet is the whole kit; naming a part in a sample's comment does not count. The few names with nothing to draw are listed in NOT_SHOWN with the reason.
   Comments are stripped before names are read: kit comments name parts of other files on purpose (a torch's light is IB.darkness). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const names = (src) => new Set([...strip(src).matchAll(/\bIB\.(\w+)/g)].map((m) => m[1]));
const defines = (src) => new Set([...strip(src).matchAll(/\bIB\.(\w+)\s*=(?!=)/g)].map((m) => m[1]));
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []));

let failed = 0;
// 5: kit names that no part sample has to use, each with the reason
const NOT_SHOWN = { IBM: {} };
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
  const pages = [];   // scenes and part samples load kit files the same way
  for (const kind of ['scenes', 'parts']) {
    const dir = path.join(ROOT, ref, kind);
    if (!fs.existsSync(dir)) continue;
    for (const fam of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())) for (const s of fs.readdirSync(path.join(dir, fam)).filter((x) => x.endsWith('.html'))) pages.push([kind, fam, s]);
  }
  for (const [kind, fam, s] of pages) {
    const html = fs.readFileSync(path.join(ROOT, ref, kind, fam, s), 'utf8'), name = `${ref}/${kind}/${fam}/${s}`;
    const loaded = [...html.matchAll(/<script src="\.\.\/\.\.\/kit\/([^"]+)"><\/script>/g)].map((m) => m[1]);
    for (const f of loaded) {
      if (!kit[f]) { fail(`${name} loads kit/${f}, which does not exist`); continue; }
      for (const n of kit[f].needs) if (!loaded.includes(n)) fail(`${name} loads kit/${f} but not kit/${n}, which it needs`);
    }
    const script = html.split('<script>').slice(1).join('\n');
    for (const n of names(script)) {
      const o = owner[n];
      if (!o) fail(`${name} uses IB.${n}, which no kit file defines`);
      else if (!loaded.includes(o)) fail(`${name} uses IB.${n} from kit/${o} without loading it`);
    }
  }
  // 3. nothing but ink.js and time.js is read while a file loads: look at the lines at the file's top level (inside its (function (g) { ... })(window) wrapper, outside any function body)
  for (const [f, k] of Object.entries(kit)) {
    if (f === 'ink.js' || f === 'time.js') continue;
    let depth = 0;
    for (const line of strip(k.src).split('\n')) {
      if (depth === 1) for (const m of line.matchAll(/\bIB\.(\w+)/g)) {
        const n = m[1], o = owner[n];
        if (o && o !== f && o !== 'ink.js' && o !== 'time.js' && !line.slice(0, m.index).match(/=>|function/)) fail(`${ref}/kit/${f} reads IB.${n} from ${o} while it loads; read it inside the function that needs it`);
      }
      for (const c of line) depth += c === '{' ? 1 : c === '}' ? -1 : 0;
    }
  }

  // 4. MOVE tables: load the whole kit (no canvas is needed to load it) and look at every IB.<part>.MOVE
  const vm = require('vm'), box = { console };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'core', 'motion.js'), 'utf8'), box);
  const first = ['ink.js', 'time.js'], rest = Object.keys(kit).filter((f) => !first.includes(f)).sort();
  for (const f of [...first, ...rest]) vm.runInContext(kit[f].src, box, { filename: f });
  for (const [part, v] of Object.entries(box.IB)) {
    if (!v || !v.MOVE) continue;
    for (const [move, table] of Object.entries(v.MOVE)) {
      const tables = Array.isArray(table) ? { '': table } : table;   // a move a cast plays one way per member (IB.rider.MOVE.handsOff.vents)
      for (const [who, rows] of Object.entries(tables)) {
        const name = `IB.${part}.MOVE.${move}${who ? '.' + who : ''}`;
        if (!Array.isArray(rows) || !rows.length) { fail(`${name} is not a list of [frame, state] rows`); continue; }
        rows.forEach((r, i) => {
          if (!Array.isArray(r) || r.length !== 2 || typeof r[0] !== 'number' || r[1] == null) fail(`${name} row ${i} is not [frame, state]`);
          else if (i && r[0] < rows[i - 1][0]) fail(`${name} row ${i}: frame ${r[0]} comes before the previous row's ${rows[i - 1][0]}`);
        });
        if (Array.isArray(rows[0]) && rows[0][0] !== 0) fail(`${name} starts at frame ${rows[0][0]}: a move counts from its own first drawing, 0`);
      }
    }
  }
  // 5. every exported part is on the part sheet (named in a sample's code or comment)
  const sampleDir = path.join(ROOT, ref, 'parts');
  if (fs.existsSync(sampleDir)) {
    const shown = new Set(pages.filter(([kind]) => kind === 'parts').flatMap(([, fam, s]) => [...names(fs.readFileSync(path.join(sampleDir, fam, s), 'utf8'))]));
    const missing = Object.keys(owner).filter((n) => !shown.has(n) && !(NOT_SHOWN[ref] || {})[n]).sort();
    if (missing.length) fail(`${ref}: ${missing.length} parts are on no part sample: ${missing.map((n) => 'IB.' + n + ' (' + owner[n] + ')').join(', ')}`);
  }
}

console.log(failed ? `${failed} failed` : 'ok');
process.exit(failed ? 1 : 0);
