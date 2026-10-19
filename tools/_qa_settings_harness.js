/* Dev-only: builds admin_pages/_qa_set.html — the REAL settings.html markup, the
   REAL Settings service (platform.js) and the REAL page script inside the REAL
   admin shell, backed by a fake platform/config document, so the rebuilt layout
   can be measured and the save/add/remove round-trips exercised without an
   admin session. Nothing here runs in the shipped app; delete this file and
   admin_pages/_qa_set.html after measuring. */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'admin_pages');
const src = fs.readFileSync(path.join(dir, 'settings.html'), 'utf8');

const markup = src.replace(/<script[\s\S]*?<\/script>/g, '');
const pageJs = src.slice(src.lastIndexOf('<script>') + 8, src.lastIndexOf('</script>'));

const fixtures = `
(function () {
  var CFG = {
    platformName: 'InternHub',
    platformDescription: 'Verified internships across Cameroon, matched to your field, city and preferences.',
    supportEmail: 'hello@internhub.cm',
    defaultRegion: 'Cameroon',
    newWindowHours: 72,
    requireVerificationBeforePublish: false,
    registrationOpen: true,
    notifyNewMatches: true,
    notifyLocationAlerts: true,
    notifyDeadlineReminders: false,
    notifySuggestionStatus: true,
    fields: ['Software Engineering', 'Data & AI', 'Cybersecurity', 'Networking', 'Electrical Engineering',
      'Mechanical Engineering', 'Civil Engineering', 'Finance', 'Accounting', 'Marketing', 'Agriculture',
      'Health', 'Design', 'Business', 'Education', 'Research', 'Other'],
    categories: ['Internship', 'Graduate Programme', 'Volunteer', 'Apprenticeship', 'Part-time',
      'Research Assistant', 'Traineeship'],
    locations: ['Buea', 'Mile 17', 'Bamenda', 'Douala', 'Yaoundé', 'Limbe', 'Kribi', 'Remote'],
    workModes: ['On-site', 'Hybrid', 'Remote']
  };
  window.__qaConfig = CFG;
  window.__qaSaved = [];
  window.firebaseDB = {
    collection: function (name) {
      var api = {
        get: function () { return Promise.resolve({ docs: [] }); },
        doc: function () {
          return {
            get: function () { return Promise.resolve({ exists: true, data: function () { return CFG; } }); },
            set: function (patch) {
              window.__qaSaved.push(patch);
              Object.keys(patch).forEach(function (k) { CFG[k] = patch[k]; });
              return Promise.resolve();
            },
            onSnapshot: function () { return function () {}; }
          };
        },
        onSnapshot: function () { return function () {}; }
      };
      api.where = api.orderBy = api.limit = function () { return api; };
      return api;
    }
  };
  window.serverTs = function () { return new Date('2026-09-07T12:00:00Z'); };
  window.firebase = {
    auth: {
      EmailAuthProvider: { credential: function (email, pw) { return { email: email, pw: pw }; } },
      currentUser: { email: 'qa@example.cm' }
    },
    firestore: { FieldValue: { serverTimestamp: function () { return null; } } }
  };
  window.Auth = {
    ready: Promise.resolve(),
    profile: { uid: 'qa-admin', displayName: 'QA Admin', email: 'qa@example.cm', isAdmin: true },
    requireAdmin: function () { return Promise.resolve(true); },
    signOut: function () {},
    updateProfile: function (patch) { window.__qaSaved.push({ profile: patch }); return Promise.resolve({ ok: true }); },
    changePassword: function () { return Promise.resolve({ ok: true }); }
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

const out = path.join(dir, '_qa_set.html');
fs.writeFileSync(out, harness);
console.log('wrote', out, harness.length, 'bytes');
