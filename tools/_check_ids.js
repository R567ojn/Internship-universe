/* Dev-only lint: for one page, cross-checks element ids against every inline
   script, and checks tag balance. Usage: node tools/_check_ids.js admin_pages/users.html
   - "referenced" means $('#id'), getElementById('id'), document.getElementById("id"),
     querySelector('#id'), plus label for="" / aria-labelledby / aria-describedby.
   - ids kept only for label/aria association are therefore not orphans.
   - still conservative: ids reached only through a combined selector
     (closest('#a, #b')) or built at runtime ('#w' + key) show up as orphans,
     so grep each orphan before ever removing it.
   Nothing here runs in the app. */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('usage: node tools/_check_ids.js <page.html>'); process.exit(1); }
const src = fs.readFileSync(path.resolve(file), 'utf8');

/* markup = everything outside <script> blocks */
const html = src.replace(/<script[\s\S]*?<\/script>/g, '');
const js = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');

const declared = [...html.matchAll(/id="([^"{}]+)"/g)].map((m) => m[1]);
const referenced = new Set();
const add = (id) => { if (id) referenced.add(id); };

for (const m of js.matchAll(/\$\(\s*'#?([A-Za-z0-9_-]+)'\s*\)/g)) add(m[1]);
for (const m of js.matchAll(/\bbyId\(\s*'?([A-Za-z0-9_-]+)'?\s*\)/g)) add(m[1]);
for (const m of js.matchAll(/getElementById\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g)) add(m[1]);
for (const m of js.matchAll(/querySelector(?:All)?\(\s*'#([A-Za-z0-9_-]+)(?![^'"]*[.\[:])/g)) add(m[1]);
for (const m of html.matchAll(/\bfor="([A-Za-z0-9_-]+)"/g)) add(m[1]);
for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) m[1].split(/\s+/).forEach(add);
for (const m of js.matchAll(/\bsetErr\(\s*'([A-Za-z0-9_-]+)'/g)) add(m[1]);
/* el.<id> caches built as `const el = { id: $('#id') }` are already covered above */

const missing = [...referenced].filter((i) => !declared.includes(i)).sort();
const orphan = declared.filter((i) => !referenced.has(i) && i !== 'view').sort();

console.log(file);
console.log('  ids referenced by JS/aria but missing in markup:', missing.length ? missing : 'none');
console.log('  ids declared but never referenced (view is moved by shell):', orphan.length ? orphan : 'none');

const opens = (html.match(/<div\b/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
console.log('  div open/close in markup:', opens, closes, opens === closes ? 'balanced' : 'UNBALANCED');
for (const tag of ['section', 'form', 'aside', 'article', 'label', 'button', 'header', 'p', 'span']) {
  const o = (html.match(new RegExp('<' + tag + '\\b', 'g')) || []).length;
  const c = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (o !== c) console.log('  UNBALANCED <' + tag + '>: ' + o + ' open / ' + c + ' close');
}
