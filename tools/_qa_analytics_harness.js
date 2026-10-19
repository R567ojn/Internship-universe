/* Dev-only: builds admin_pages/_qa_an.html — the REAL analytics.html markup, the
   REAL Analytics service and the REAL page render functions inside the REAL admin
   shell, backed by a fake firebaseDB so geometry can be measured in a desktop
   viewport without an admin session. Nothing here runs in the shipped app;
   delete this file and admin_pages/_qa_an.html after measuring. */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'admin_pages');
const src = fs.readFileSync(path.join(dir, 'analytics.html'), 'utf8');

const markup = src.replace(/<script[\s\S]*?<\/script>/g, '');
const pageJs = src.slice(src.lastIndexOf('<script>') + 8, src.lastIndexOf('</script>'));

const fixtures = `
(function () {
  var DAY = 86400000;
  var seed = 20260907;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function daysAgo(n) { return new Date(Date.now() - n * DAY); }

  var FIELDS = ['Software Engineering', 'Finance', 'Data & AI', 'Marketing', 'Design', 'Agriculture', 'Health', 'Mechanical Engineering'];
  var CITIES = ['Douala', 'Yaoundé', 'Buea', 'Bamenda', 'Limbe', 'Remote'];
  var TITLES = ['Engineering Intern', 'Analyst Intern', 'Support Intern', 'Research Assistant', 'Design Intern', 'Trainee'];
  var COS = ['CloudCam Systems', 'MTN Cameroun', 'Orange Cameroun', 'GreenLeaf Agro', 'Nkolbisson Studio', 'Centre Pasteur', 'Minka Health', 'AgriPro Cameroon'];

  var INTS = [];
  for (var i = 0; i < 46; i++) {
    var age = Math.floor(rnd() * 200);
    var views = Math.floor(rnd() * rnd() * 900);
    var saves = Math.floor(views * (0.04 + rnd() * 0.12));
    var published = rnd() > 0.12;
    var verified = published && rnd() > 0.3;
    INTS.push({
      id: 'i' + i, title: pick(FIELDS) + ' ' + pick(TITLES), company: pick(COS),
      field: pick(FIELDS), city: pick(CITIES), workMode: pick(['On-site', 'Hybrid', 'Remote']),
      published: published, verified: verified,
      views: views, saves: saves, clicks: Math.floor(views * (0.1 + rnd() * 0.3)),
      createdAt: daysAgo(age),
      publishedAt: published ? daysAgo(Math.max(0, age - 2)) : null,
      verifiedAt: verified ? daysAgo(Math.max(0, age - 3)) : null
    });
  }
  var USERS = [];
  for (var u = 0; u < 64; u++) {
    USERS.push({ id: 'u' + u, displayName: 'Student ' + (u + 1), email: 's' + u + '@example.cm',
      createdAt: daysAgo(Math.floor(rnd() * 200)) });
  }
  var SUGG = [];
  var ST = ['pending', 'pending', 'pending', 'verified', 'rejected', 'needs-changes', 'pending', 'approved', 'duplicate'];
  for (var s = 0; s < 9; s++) {
    SUGG.push({ id: 'sg' + s, title: pick(FIELDS) + ' ' + pick(TITLES), company: pick(COS),
      field: pick(FIELDS), city: pick(CITIES), status: ST[s],
      submittedByName: pick(['M. Ngu', 'A. Che', 'R. Eba', 'S. Tabot']),
      createdAt: daysAgo(Math.floor(rnd() * 60) + s),
      reviewedAt: ST[s] === 'pending' ? null : daysAgo(s) });
  }

  var DATA = { internships: INTS, users: USERS, suggestions: SUGG };
  window.firebaseDB = {
    collection: function (name) {
      var api = {
        get: function () { return Promise.resolve({ docs: (DATA[name] || []).map(function (d) { return { id: d.id, data: function () { return d; } }; }) }); },
        doc: function () { return { get: function () { return Promise.resolve({ exists: false, data: function () { return {}; } }); }, set: function () { return Promise.resolve(); }, onSnapshot: function () { return function () {}; } }; },
        onSnapshot: function () { return function () {}; }
      };
      api.where = api.orderBy = api.limit = function () { return api; };
      return api;
    }
  };
  window.Auth = {
    ready: Promise.resolve(),
    profile: { uid: 'qa-admin', displayName: 'QA Admin', email: 'qa@example.cm', isAdmin: true },
    requireAdmin: function () { return Promise.resolve(true); },
    signOut: function () {}
  };
})();
`;

const harness = markup.replace(
  '<link rel="stylesheet" href="../assets/css/ui.css">',
  `<script>window.__qaErrors=[];window.addEventListener('error',function(e){window.__qaErrors.push(String(e.message));});window.addEventListener('unhandledrejection',function(e){window.__qaErrors.push('rejection: '+String(e.reason&&e.reason.message||e.reason));});</script>
<link rel="stylesheet" href="../assets/css/ui.css">`
).replace(
  '</body>',
  `<script>${fixtures}</script>
<script src="../assets/js/lib/ui.js"></script>
<script src="../assets/js/services/platform.js"></script>
<script src="../assets/js/lib/shell.js"></script>
<script>${pageJs}</script>
</body>`
);

const out = path.join(dir, '_qa_an.html');
fs.writeFileSync(out, harness);
console.log('wrote', out, harness.length, 'bytes');
