const fs = require('fs');

const pairs = [
  ['mandatory design/landingpage.html', 'index.html'],
  ['mandatory design/student_pages/dasboard.html', 'student_pages/dashboard.html'],
  ['mandatory design/student_pages/browse_internship.html', 'student_pages/browse.html'],
  ['mandatory design/student_pages/suggest_internship.html', 'student_pages/suggest.html'],
  ["mandatory design/student_pages/what's_new.html", 'student_pages/whats-new.html'],
  ['mandatory design/student_pages/account(profile).html', 'student_pages/account.html'],
  ['mandatory design/admin_pages/dasboard.html', 'admin_pages/dashboard.html'],
  ['mandatory design/admin_pages/manage_internship.html', 'admin_pages/internships.html'],
  ['mandatory design/admin_pages/add_internship.html', 'admin_pages/internship-editor.html'],
  ['mandatory design/admin_pages/manage_users.html', 'admin_pages/users.html'],
  ['mandatory design/admin_pages/suggestion_verification.html', 'admin_pages/suggestions.html'],
  ['mandatory design/admin_pages/analytics.html', 'admin_pages/analytics.html'],
  ['mandatory design/admin_pages/settings.html', 'admin_pages/settings.html'],
];

function jsTokens(src) {
  const set = new Set();
  for (const m of src.matchAll(/class=\\?["'`]([^"'`]+)["'`]/g)) m[1].split(/\s+/).forEach((c) => c && set.add(c));
  for (const m of src.matchAll(/classList\.(?:add|remove|toggle)\(\s*["']([^"']+)/g)) set.add(m[1]);
  return set;
}

const shared = new Set();
for (const f of ['assets/js/lib/rows.js', 'assets/js/lib/shell.js', 'assets/js/lib/ui.js', 'assets/js/services/auth.js'])
  for (const c of jsTokens(fs.readFileSync(f, 'utf8'))) shared.add(c);

function markup(path) {
  const src = fs.readFileSync(path, 'utf8');
  const classes = new Set();
  const ids = new Set();
  for (const m of src.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => c && classes.add(c));
  for (const m of src.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  for (const c of jsTokens(src)) classes.add(c);
  return { classes, ids };
}

const NOISE = new Set(['btn', 'btn-primary', 'btn-ghost', 'btn-sm', 'btn-lg', 'input', 'select', 'textarea', 'field', 'label', 'muted', 'mono', 'pill', 'chip', 'card', 'grid', 'row', 'container', 'active', 'hidden', 'is-on', 'is-open', 'open', 'close', 'nav', 'wrap', 'inner', 'head', 'body', 'title', 'sub', 'meta', 'info', 'main', 'side', 'left', 'right', 'top', 'bottom', 'sm', 'md', 'lg', 'xl', 'full', 'span-full', 'ghost', 'primary', 'danger', 'amber', 'green', 'red', 'blue', 'orange', 'span2', 'span3']);

for (const [spec, impl] of pairs) {
  if (!fs.existsSync(spec) || !fs.existsSync(impl)) { console.log(`\n### ${spec} -> ${impl}  [MISSING FILE]`); continue; }
  const a = markup(spec), b = markup(impl);
  const covered = (c) => b.classes.has(c) || shared.has(c);
  const missing = [...a.classes].filter((c) => !covered(c) && !NOISE.has(c)).sort();
  const missIds = [...a.ids].filter((i) => !b.ids.has(i) && !shared.has(i)).sort();
  console.log(`\n### ${spec}  ->  ${impl}`);
  console.log(`    spec tokens ${a.classes.size} | impl markup tokens ${b.classes.size} | unresolved ${missing.length} | ids missing ${missIds.length}`);
  if (missing.length) console.log('    MISSING CLASSES: ' + missing.join(', '));
  if (missIds.length) console.log('    MISSING IDS: ' + missIds.join(', '));
}
