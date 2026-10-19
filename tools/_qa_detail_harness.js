/* Dev-only: builds _qa_dt.html — the REAL internship.html markup, the REAL
   Internships/Saved/Rows/Shell code and the REAL page render function, backed by
   a fake firebaseDB holding synthetic listings, so the populated detail layout
   can be measured in a desktop viewport. The live project currently has zero
   published documents, so this is the only way to see the filled-in state.
   Nothing here runs in the shipped app and it never contacts Firebase;
   delete this file and _qa_dt.html after measuring. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'internship.html'), 'utf8');

const markup = src.replace(/<script[\s\S]*?<\/script>/g, '');
const pageJs = src.slice(src.lastIndexOf('<script>') + 8, src.lastIndexOf('</script>'));

const fixtures = `
(function () {
  var DAY = 86400000;
  function hoursAgo(n) { return new Date(Date.now() - n * 3600000); }
  function daysAhead(n) { return new Date(Date.now() + n * DAY); }

  var MAIN = {
    title: 'Software Engineering Intern — Backend',
    company: 'CloudCam Systems',
    field: 'Software Engineering', category: 'Engineering', city: 'Douala', region: 'Littoral',
    workMode: 'Hybrid', duration: '6 months', stipend: 'FCFA 150 000 / month',
    description: 'CloudCam Systems is building logistics software used by port operators in Douala and Kribi.\\n'
      + 'You will join a squad of four engineers and ship work that reaches production.\\n\\n'
      + 'What the team cares about:\\n- Curiosity over certainty\\n- Writing things down\\n- Small, reviewable pull requests',
    responsibilities: 'Maintain internal REST endpoints written in Node.js.\\n\\n'
      + '- Write and run automated tests for every change\\n- Help triage production alerts during business hours\\n'
      + '- Document every endpoint you touch in the team wiki',
    requirements: 'Final-year or recent graduate in Computer Science or equivalent practical experience.\\n\\n'
      + '- Comfortable with JavaScript or TypeScript\\n- Basic SQL and command-line skills\\n'
      + '- Available at least 24 hours per week for six months',
    applicationUrl: 'https://example.com/careers/backend-intern',
    sourceUrl: 'https://example.com/careers',
    contactEmail: 'careers@cloudcam.example.cm', contactPhone: '+237 6 00 00 00 00',
    deadline: daysAhead(4), verified: true, published: true, featured: true,
    views: 412, saves: 37, clicks: 88,
    createdAt: hoursAgo(9), publishedAt: hoursAgo(8), verifiedAt: hoursAgo(7), updatedAt: hoursAgo(1)
  };

  var RELATED = [
    { title: 'Data Engineering Trainee', company: 'MTN Cameroun', field: 'Software Engineering', city: 'Yaound\\u00e9',
      workMode: 'On-site', duration: '3 months', stipend: 'Unpaid', verified: true, published: true,
      deadline: daysAhead(21), createdAt: hoursAgo(30), publishedAt: hoursAgo(28) },
    { title: 'Frontend Developer Intern', company: 'Nkolbisson Studio', field: 'Software Engineering', city: 'Buea',
      workMode: 'Remote', duration: '4 months', stipend: '\\u2014', verified: false, published: true,
      deadline: null, createdAt: hoursAgo(60), publishedAt: hoursAgo(58) },
    { title: 'QA Automation Intern', company: 'Minka Health', field: 'Software Engineering', city: 'Remote',
      workMode: 'Remote', duration: '6 months', stipend: 'FCFA 90 000 / month', verified: true, published: true,
      deadline: daysAhead(-3), createdAt: hoursAgo(90), publishedAt: hoursAgo(88) },
    { title: 'Finance Analyst Intern', company: 'Orange Cameroun', field: 'Finance', city: 'Yaound\\u00e9',
      workMode: 'Hybrid', duration: '6 months', stipend: 'FCFA 120 000 / month', verified: true, published: true,
      deadline: daysAhead(40), createdAt: hoursAgo(120), publishedAt: hoursAgo(118) }
  ];

  function doc(id, body) {
    var d = { id: id };
    for (var k in body) if (Object.prototype.hasOwnProperty.call(body, k)) d[k] = body[k];
    return d;
  }
  var DOCS = [doc('qa-main', MAIN)].concat(RELATED.map(function (r, i) { return doc('qa-rel' + i, r); }));
  window.__qaWrites = [];

  window.firebaseDB = {
    collection: function (name) {
      function api() { return api; }
      var a = {
        get: function () {
          return Promise.resolve({
            size: DOCS.length,
            docs: DOCS.map(function (d) { return { id: d.id, data: function () { return d; } }; })
          });
        },
        doc: function (id) {
          var found = null;
          for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === id) found = DOCS[i];
          return {
            get: function () {
              return Promise.resolve(found
                ? { exists: true, id: id, data: function () { return found; } }
                : { exists: false, id: id, data: function () { return {}; } });
            },
            update: function (patch) { window.__qaWrites.push({ id: id, patch: patch }); return Promise.resolve(); },
            set: function (v) { window.__qaWrites.push({ id: id, patch: v }); return Promise.resolve(); },
            delete: function () { return Promise.resolve(); },
            onSnapshot: function () { return function () {}; }
          };
        },
        add: function () { return Promise.resolve({ id: 'qa-new' }); },
        onSnapshot: function () { return function () {}; }
      };
      a.where = a.orderBy = a.limit = a.startAfter = function () { return a; };
      return a;
    }
  };
  window.FV = { increment: function (n) { return { inc: n }; } };
  window.serverTs = function () { return new Date('2026-09-07T12:00:00Z'); };
  window.Auth = {
    ready: Promise.resolve(),
    profile: null,
    requireAdmin: function () { return Promise.resolve(false); },
    requireAuth: function () { return Promise.resolve(false); },
    signOut: function () {}
  };
})();
`;

const harness = markup.replace(
  '<link rel="stylesheet" href="assets/css/ui.css">',
  `<script>window.__qaErrors=[];window.addEventListener('error',function(e){window.__qaErrors.push(String(e.message));});window.addEventListener('unhandledrejection',function(e){window.__qaErrors.push('rejection: '+String(e.reason&&e.reason.message||e.reason));});</script>
<link rel="stylesheet" href="assets/css/ui.css">`
).replace(
  '</body>',
  `<script>${fixtures}</script>
<script src="assets/js/lib/ui.js"></script>
<script src="assets/js/services/platform.js"></script>
<script src="assets/js/services/internships.js"></script>
<script src="assets/js/services/saved.js"></script>
<script src="assets/js/services/notifications.js"></script>
<script src="assets/js/lib/rows.js"></script>
<script src="assets/js/lib/notify-ui.js"></script>
<script src="assets/js/lib/shell.js"></script>
<script>${pageJs}</script>
</body>`
);

const out = path.join(root, '_qa_dt.html');
fs.writeFileSync(out, harness);
console.log('wrote', out, harness.length, 'bytes');
