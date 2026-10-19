/* Dev-only: builds admin_pages/_qa_ws.html — a throwaway harness that renders the
   REAL suggestions.html markup + its REAL render functions inside the REAL admin
   shell, backed by local fixtures so CSS geometry can be measured in a desktop
   viewport. Nothing here runs in the app; delete the harness after measuring. */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'admin_pages');
const src = fs.readFileSync(path.join(dir, 'suggestions.html'), 'utf8');

// strip every <script>…</script> (page logic is re-injected below, verbatim)
const markup = src.replace(/<script[\s\S]*?<\/script>/g, '');
const scriptStart = src.lastIndexOf('<script>');
const pageJs = src.slice(scriptStart + 8, src.lastIndexOf('</script>'));

const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="900" height="500" fill="#17925a"/></svg>');
const IMG = 'data:image/svg+xml;charset=utf-8,' + svg;

const fixtures = `
(function () {
  const d = (h) => new Date(Date.now() - h * 3600e3);
  const S = (o) => Object.assign({
    id: 's' + Math.random().toString(36).slice(2, 8), title: '', company: '', field: '', category: '',
    city: '', area: '', workMode: '', duration: '', stipend: '', deadline: '', notes: '', requirements: '',
    sourceUrl: '', applicationUrl: '', contactEmail: '', contactPhone: '', image: '', whereFound: '',
    status: 'pending', reviewNotes: '', reviewedBy: '', submittedBy: 'u1', submittedByEmail: 'a@b.cm',
    submittedByName: 'A. Student', internshipId: '', createdAt: d(30), updatedAt: null, reviewedAt: null
  }, o);
  const SUG = [
    S({ id: 'sA', title: 'Backend Engineering Intern', company: 'CloudCam Systems', field: 'Software Engineering',
        category: 'Engineering', city: 'Douala', area: 'Bonapriso', workMode: 'Hybrid', duration: '3 months',
        stipend: '120,000 FCFA / month', deadline: '2026-10-20', image: '${IMG}', createdAt: d(2),
        notes: 'Work with the platform team on Node.js services and internal tooling.\\nStudents ship to production from week two.',
        requirements: 'CS fundamentals or a coding portfolio\\nJavaScript / Node basics\\nAvailable 3 days per week',
        sourceUrl: 'https://linkedin.com/jobs/cloudcam', applicationUrl: 'https://cloudcam.cm/careers/se-intern',
        contactEmail: 'careers@cloudcam.cm', contactPhone: '+237 670 123 456', whereFound: 'LinkedIn' }),
    S({ id: 'sB', title: 'Data Analyst Intern', company: 'Orange Cameroun', field: 'Data', category: 'Business',
        city: 'Douala', workMode: 'Hybrid', duration: '6 months', deadline: '2026-10-25', createdAt: d(5),
        notes: 'Join the data team to build reporting dashboards for network performance.',
        requirements: 'SQL basics\\nExcel / Sheets', sourceUrl: 'https://facebook.com/groups/devcameroun',
        applicationUrl: 'https://orange.cm/careers/data', contactEmail: 'jobs@orange.cm' }),
    S({ id: 'sC', title: 'Marketing & Communications Intern', company: 'GreenLeaf Agro', field: 'Marketing',
        category: 'Marketing', city: 'Buea', workMode: 'On-site', duration: '3 months', deadline: '2026-10-10',
        createdAt: d(9), notes: 'Support community outreach and social content for an agro-tech startup.',
        requirements: 'Strong writing', applicationUrl: 'https://greenleaf.cm/join' }),
    S({ id: 'sD', title: 'Lab Technician Intern', company: 'Centre Pasteur', field: 'Health', category: 'Health',
        city: 'Yaoundé', workMode: 'On-site', createdAt: d(26), deadline: '2026-08-01',
        notes: 'Assist senior technicians with sample processing and laboratory documentation.',
        requirements: 'Biology or lab science background', sourceUrl: 'https://pasteur.cm/jobs',
        applicationUrl: 'https://pasteur.cm/jobs', contactPhone: '+237 222 234 010' }),
    S({ id: 'sE', title: 'Finance Analyst Intern', company: 'MTN Cameroun', field: 'Finance', category: 'Finance',
        city: 'Douala', workMode: 'On-site', duration: '6 months', deadline: '2026-09-30', createdAt: d(60),
        status: 'verified', internshipId: 'iMTN', reviewedBy: 'qa-admin', reviewedAt: d(48),
        notes: 'Support budgeting and revenue analysis for the enterprise division.',
        requirements: 'Finance or accounting studies', applicationUrl: 'https://mtn.cm/careers', sourceUrl: 'https://mtn.cm/careers' }),
    S({ id: 'sF', title: 'Crypto Trading Intern', company: 'QuickGain LLC', field: 'Finance', category: 'Finance',
        city: 'Remote', workMode: 'Remote', duration: '1 month', createdAt: d(80), status: 'rejected',
        reviewNotes: 'Invalid source — Telegram channel with no company page', reviewedBy: 'qa-admin', reviewedAt: d(72),
        notes: 'Earn while learning crypto trading signals.', sourceUrl: 'https://t.me/quickgain' })
  ];
  const INTER = [
    { id: 'iMTN', title: 'Finance Analyst Intern', company: 'MTN Cameroun', field: 'Finance', category: 'Finance',
      city: 'Douala', area: '', workMode: 'On-site', duration: '6 months', deadline: '2026-09-30',
      applicationUrl: 'https://mtn.cm/careers', published: true },
    { id: 'iORG', title: 'Data Analyst Intern', company: 'Orange Cameroun', field: 'Data', category: 'Business',
      city: 'Douala', area: '', workMode: 'Hybrid', duration: '6 months', deadline: '2026-09-12',
      applicationUrl: 'https://orange.cm/careers/data', published: true },
    { id: 'iX', title: ' UX Research Intern ', company: 'Nkolbisson Studio', field: 'Design', category: 'Design',
      city: 'Yaoundé', area: 'Nkolbisson', workMode: 'Remote', duration: '2 months', deadline: '2026-11-01',
      applicationUrl: 'https://nkolbisson.design/interns', published: false }
  ];
  const store = SUG;
  const find = (id) => store.find((s) => s.id === id);
  const ok = (o) => Object.assign({ ok: true }, o);
  let seq = 0;
  window.Auth = {
    ready: Promise.resolve(),
    profile: { uid: 'qa-admin', displayName: 'QA Admin', email: 'qa@example.cm', isAdmin: true },
    requireAdmin: async () => true, signOut: () => {}
  };
  window.Settings = { data: { fields: ['Software Engineering', 'Data', 'Design', 'Finance', 'Health', 'Marketing'],
    categories: ['Engineering', 'Design', 'Business', 'Finance', 'Health', 'Marketing'],
    locations: ['Douala', 'Yaoundé', 'Buea', 'Bamenda', 'Remote'],
    workModes: ['On-site', 'Hybrid', 'Remote'] }, load: async () => ({}), save: async () => ({ ok: true }) };
  window.Suggestions = {
    list: async () => store.map((s) => ({ ...s })),
    get: async (id) => { const s = find(id); return s ? { ...s } : null; },
    update: async (id, patch) => { const s = find(id); if (!s) return { ok: false, error: 'missing' }; Object.assign(s, patch); return ok(); },
    setStatus: async (id, status, notes, extra) => { const s = find(id); if (!s) return { ok: false, error: 'missing' };
      Object.assign(s, { status, reviewNotes: notes || '', reviewedBy: 'qa-admin', reviewedAt: new Date() }, extra || {}); return ok(); },
    verifyAndPublish: async (id, edits) => { const s = find(id); if (!s) return { ok: false, error: 'missing' };
      const nid = 'iNew' + (++seq); Object.assign(s, edits || {}, { status: 'verified', internshipId: nid, reviewedBy: 'qa-admin', reviewedAt: new Date() });
      INTER.push({ id: nid, title: s.title, company: s.company, field: s.field, category: s.category, city: s.city,
        area: s.area, workMode: s.workMode, duration: s.duration, deadline: s.deadline, applicationUrl: s.applicationUrl, published: true });
      return ok({ id: nid }); },
    toDraft: async (id) => { const s = find(id); if (!s) return { ok: false, error: 'missing' };
      const nid = 'iDraft' + (++seq); Object.assign(s, { status: 'approved', internshipId: nid, reviewNotes: 'Converted to draft' }); return ok({ id: nid }); },
    remove: async (id) => { const i = store.findIndex((s) => s.id === id); if (i < 0) return { ok: false, error: 'missing' }; store.splice(i, 1); return ok(); }
  };
  window.Internships = { all: async () => INTER.map((x) => ({ ...x })) };
  window.Notifications = undefined; window.NotifyUI = undefined;
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
<script src="../assets/js/lib/shell.js"></script>
<script>${pageJs}</script>
</body>`
);

const out = path.join(dir, '_qa_ws.html');
fs.writeFileSync(out, harness);
console.log('wrote', out, harness.length, 'bytes');
