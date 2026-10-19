/* Dev-only static scanner for the CSS cleanup pass (directive §16): lists every
   class selector in ui.css / app.css whose class name never appears in the
   shipped markup or JS, so dead rules can be removed without touching anything
   a page still renders. Not part of the app; safe to delete after the cleanup. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const CSS = ['assets/css/ui.css', 'assets/css/app.css'];

// shipped pages + code (skips the design spec and the throwaway QA harnesses)
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_qa') || e.name === 'mandatory design' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js)$/.test(e.name)) out.push(p);
  }
  return out;
}
const all = walk(root, []);

const used = new Map();
const text = all.map((p) => fs.readFileSync(p, 'utf8')).join('\n');
const mark = (tok) => used.set(tok, (used.get(tok) || 0) + 1);
for (const m of text.matchAll(/[A-Za-z_][-\w]*/g)) mark(m[0]);

const dead = new Map();
for (const p of CSS) {
  const src = fs.readFileSync(path.join(root, p), 'utf8');
  const lines = src.split('\n');
  let block = null;
  lines.forEach((line, i) => {
    if (line.includes('{')) {
      const sel = line.slice(0, line.indexOf('{')).trim();
      const cls = [...sel.matchAll(/\.(-?[A-Za-z][-\w]*)/g)].map((m) => m[1]);
      const miss = cls.filter((c) => !used.has(c));
      if (cls.length && miss.length === cls.length) {
        const key = p.replace(/^assets\/css\//, '');
        if (!dead.has(key)) dead.set(key, []);
        dead.get(key).push({ line: i + 1, sel, miss });
      }
    }
  });
}

for (const [file, rows] of dead) {
  console.log(`\n### ${file} — ${rows.length} rule(s) whose every class is unreferenced`);
  rows.forEach((r) => console.log(`  ${String(r.line).padStart(5)}  ${r.sel.slice(0, 120)}`));
}
