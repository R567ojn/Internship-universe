/* ============================================================
   PLATFORM · settings + dynamic vocab (platform/config doc),
   activity log (activity collection), analytics (real queries).
   Loaded before other services.
   ============================================================ */

const DEFAULT_CONFIG = {
  platformName: 'InternHub',
  platformDescription: 'Verified internships across Cameroon, matched to your field, city and preferences.',
  supportEmail: 'hello@internhub.cm',
  defaultRegion: 'Cameroon',
  newWindowHours: 48,
  requireVerificationBeforePublish: false,
  registrationOpen: true,
  notifyNewMatches: true,
  notifyLocationAlerts: true,
  notifyDeadlineReminders: true,
  notifySuggestionStatus: true,
  fields: [
    'Software Engineering', 'Data & AI', 'Cybersecurity', 'Networking',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Finance', 'Accounting', 'Marketing', 'Agriculture', 'Health',
    'Design', 'Business', 'Education', 'Research', 'Other'
  ],
  categories: [
    'Internship', 'Graduate Programme', 'Volunteer', 'Apprenticeship',
    'Part-time', 'Research Assistant', 'Traineeship'
  ],
  locations: ['Buea', 'Mile 17', 'Bamenda', 'Douala', 'Yaoundé', 'Limbe', 'Kribi', 'Remote'],
  workModes: ['On-site', 'Hybrid', 'Remote']
};

const Settings = (() => {
  let cache = null;
  let unsub = null;

  function merged(data) {
    return { ...DEFAULT_CONFIG, ...(data || {}), settings: { ...DEFAULT_CONFIG, ...(data || {}) } };
  }

  return {
    DEFAULT: DEFAULT_CONFIG,
    get data() { return cache || merged(null); },

    /** Live subscription (admin). Public pages can call load() once. */
    subscribe(cb) {
      if (unsub) return unsub;
      unsub = firebaseDB.collection('platform').doc('config')
        .onSnapshot((snap) => {
          cache = snap.exists ? merged(snap.data()) : merged(null);
          if (cb) cb(cache);
        }, () => { cache = merged(null); if (cb) cb(cache); });
      return unsub;
    },

    async load() {
      if (cache) return cache;
      try {
        const snap = await firebaseDB.collection('platform').doc('config').get();
        cache = merged(snap.exists ? snap.data() : null);
      } catch (_) { cache = merged(null); }
      return cache;
    },

    async save(patch) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await firebaseDB.collection('platform').doc('config')
          .set({ ...patch, updatedAt: serverTs() }, { merge: true });
        cache = merged({ ...cache, ...patch });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    async addVocab(kind, value) {
      const v = String(value || '').trim();
      if (!v || !['fields', 'categories', 'locations'].includes(kind)) return { ok: false, error: 'Invalid field' };
      const data = await this.load();
      const list = new Set(data[kind] || []);
      if (list.has(v)) return { ok: true };
      list.add(v);
      return this.save({ [kind]: [...list] });
    },

    async removeVocab(kind, value) {
      const data = await this.load();
      const list = (data[kind] || []).filter((x) => x !== value);
      return this.save({ [kind]: list });
    }
  };
})();

const Activity = (() => {
  const col = () => firebaseDB.collection('activity');

  function normalize(doc) {
    const d = doc.data();
    return { id: doc.id, ...d, createdAt: UI.toDate(d.createdAt) };
  }

  return {
    /** Admin-only write (enforced by rules). Never blocks the caller's action. */
    async log({ action, targetType, targetId = '', targetTitle = '', summary = '' }) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return;
      try {
        await col().add({
          action, targetType, targetId, targetTitle, summary,
          actor: user.displayName || user.email,
          actorUid: user.uid,
          createdAt: serverTs()
        });
      } catch (err) { console.error('Activity.log failed:', err); }
    },

    async recent(limit = 12) {
      try {
        const snap = await col().orderBy('createdAt', 'desc').limit(limit).get();
        return snap.docs.map(normalize);
      } catch (err) { console.error('Activity.recent failed:', err); return []; }
    },

    subscribe(limit, cb) {
      return col().orderBy('createdAt', 'desc').limit(limit)
        .onSnapshot((snap) => cb(snap.docs.map(normalize)), () => cb([]));
    }
  };
})();

const Analytics = (() => {
  const DAY = 86400000;

  function since(range) {
    if (range === 'all') return null;
    const days = range === '7' ? 7 : range === '30' ? 30 : 90;
    return new Date(Date.now() - days * DAY);
  }

  function inRange(dateObj, from) {
    if (!from) return true;
    const d = UI.toDate(dateObj);
    return d && d >= from;
  }

  /** Oldest → newest buckets for a range: days (7/30), weeks (90), months (all). */
  function makeBuckets(range) {
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (range === 'all') {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
        out.push({ start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1), label: start.toLocaleDateString('en-GB', { month: 'short' }) });
      }
      return out;
    }
    if (range === '90') {
      const monday = new Date(today); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      for (let i = 12; i >= 0; i--) {
        const start = new Date(monday.getTime() - i * 7 * DAY);
        out.push({ start, end: new Date(start.getTime() + 7 * DAY), label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
      }
      return out;
    }
    const days = range === '7' ? 7 : 30;
    const fmtOpts = days === 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' };
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(today.getTime() - i * DAY);
      out.push({ start, end: new Date(start.getTime() + DAY), label: start.toLocaleDateString('en-GB', fmtOpts) });
    }
    return out;
  }

  function timeSeries(items, dateOf, buckets) {
    const counts = buckets.map(() => 0);
    items.forEach((it) => {
      const d = UI.toDate(dateOf(it));
      if (!d) return;
      const i = buckets.findIndex((b) => d >= b.start && d < b.end);
      if (i > -1) counts[i]++;
    });
    return counts;
  }

  /** Sum of a real numeric counter across a list. */
  function total(list, field) {
    return list.reduce((sum, it) => sum + (Number(it[field]) || 0), 0);
  }

  /** Group listings into per-category supply + engagement totals. */
  function aggregate(list, keyFn) {
    const map = {};
    list.forEach((it) => {
      const k = keyFn(it) || 'Unspecified';
      const m = map[k] || (map[k] = { name: k, count: 0, views: 0, saves: 0 });
      m.count++;
      m.views += Number(it.views) || 0;
      m.saves += Number(it.saves) || 0;
    });
    return Object.values(map);
  }

  const sortBy = (list, key, n) => list.slice().sort((a, b) => b[key] - a[key]).slice(0, n);

  /** Top five categories by one counter, as {name, value} rows. Zeroes drop out. */
  const ranked = (list, key) => sortBy(list.filter((x) => x[key] > 0), key, 5)
    .map((x) => ({ name: x.name, value: x[key] }));

  return {
    async internships() {
      try {
        const snap = await firebaseDB.collection('internships').get();
        return snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id, ...d,
            createdAt: UI.toDate(d.createdAt),
            publishedAt: UI.toDate(d.publishedAt),
            verifiedAt: UI.toDate(d.verifiedAt)
          };
        });
      } catch (_) { return []; }
    },
    async users() {
      try {
        const snap = await firebaseDB.collection('users').get();
        return snap.docs.map((doc) => {
          const d = doc.data();
          return { id: doc.id, ...d, createdAt: UI.toDate(d.createdAt) };
        });
      } catch (_) { return []; }
    },
    async suggestions() {
      try {
        const snap = await firebaseDB.collection('suggestions').get();
        return snap.docs.map((doc) => {
          const d = doc.data();
          return { id: doc.id, ...d, createdAt: UI.toDate(d.createdAt) };
        });
      } catch (_) { return []; }
    },

    /** Real metrics for a range: '7' | '30' | '90' | 'all'. */
    async summary(range = '30') {
      const from = since(range);
      const [ints, users, sugg] = await Promise.all([this.internships(), this.users(), this.suggestions()]);
      const published = ints.filter((i) => i.published);
      const verified = ints.filter((i) => i.verified);
      const newInts = ints.filter((i) => inRange(i.createdAt, from));
      const newUsers = users.filter((u) => inRange(u.createdAt, from));
      const buckets = makeBuckets(range);
      const fieldAgg = aggregate(published, (i) => i.field);
      const cityAgg = aggregate(published, (i) => i.city);

      return {
        range,
        totals: {
          internships: ints.length,
          published: published.length,
          verified: verified.length,
          students: users.length,
          suggestions: sugg.length,
          pendingSuggestions: sugg.filter((s) => (s.status || 'pending') === 'pending').length
        },
        growth: {
          internships: newInts.length,
          students: newUsers.length,
          suggestions: sugg.filter((s) => inRange(s.createdAt, from)).length
        },
        engagement: {
          views: total(ints, 'views'),
          clicks: total(ints, 'clicks'),
          saves: total(ints, 'saves')
        },
        series: {
          labels: buckets.map((b) => b.label),
          students: timeSeries(users, (u) => u.createdAt, buckets),
          added: timeSeries(ints, (i) => i.createdAt, buckets),
          published: timeSeries(ints, (i) => i.publishedAt, buckets),
          verified: timeSeries(ints, (i) => i.verifiedAt, buckets)
        },
        fields: sortBy(fieldAgg, 'count', 7),
        locations: sortBy(cityAgg, 'count', 6),
        insights: {
          viewsByField: ranked(fieldAgg, 'views'),
          viewsByLocation: ranked(cityAgg, 'views'),
          savesByField: ranked(fieldAgg, 'saves')
        },
        popular: published.map((i) => ({
          id: i.id,
          title: i.title || 'Untitled',
          company: i.company || '—',
          field: i.field || '',
          city: i.city || '',
          views: Number(i.views) || 0,
          saves: Number(i.saves) || 0
        })).sort((a, b) => b.views - a.views || b.saves - a.saves),
        recentSuggestions: sugg.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 4)
          .map((s) => ({
            id: s.id,
            title: s.title || 'Untitled suggestion',
            company: s.company || '—',
            by: s.submittedByName || 'Student',
            status: s.status || 'pending',
            createdAt: s.createdAt
          }))
      };
    }
  };
})();
