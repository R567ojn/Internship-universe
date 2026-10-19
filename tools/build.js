/* Builds dist/ for deployment. Netlify has no publish-time ignore, so the only safe way to keep
   dev-only folders out of production is to publish a whitelisted copy. Never deletes source files.
   Usage: node tools/build.js  (then: netlify deploy --build --prod) */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');

const FILES = ['index.html', 'internship.html', 'signin.html', 'register.html', 'reset.html',
  'privacy.html', 'terms.html', '404.html', 'favicon.svg', '_redirects'];
const DIRS = ['assets', 'student_pages', 'admin_pages'];

// QA harnesses that generators drop into the page folders must never ship.
const isJunk = (name) => /^_qa_/.test(name);

const missing = FILES.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error('build aborted — expected site files are missing:', missing.join(', '));
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of DIRS) {
  fs.cpSync(path.join(root, d), path.join(out, d), {
    recursive: true,
    filter: (src) => !isJunk(path.basename(src))
  });
}

// A new page added outside the whitelist would 404 in production instead of deploying.
const unshipped = fs.readdirSync(root)
  .filter((f) => f.endsWith('.html') && !FILES.includes(f) && !isJunk(f));
for (const d of DIRS) {
  for (const f of fs.readdirSync(path.join(root, d))) {
    if (f.endsWith('.html') && !fs.existsSync(path.join(out, d, f))) unshipped.push(d + '/' + f);
  }
}

const count = (dir) => fs.readdirSync(dir, { withFileTypes: true, recursive: true })
  .filter((e) => e.isFile()).length;

console.log('dist/ ready:', count(out), 'files from', FILES.length, 'pages +', DIRS.join(', '));
if (unshipped.length) {
  console.warn('WARNING not in dist (add to FILES/DIRS in tools/build.js if it is site content):');
  unshipped.forEach((f) => console.warn('  -', f));
}
