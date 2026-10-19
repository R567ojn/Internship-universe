/* ============================================================
   SAVED · users/{uid}/saved  (batched getAll, no N+1)
   ============================================================ */

const Saved = (() => {
  let ids = new Set();
  let loaded = false;
  let inflight = null;

  function refOf(uid, internshipId) {
    return firebaseDB.collection('users').doc(uid).collection('saved').doc(internshipId);
  }

  return {
    get ids() { return ids; },
    get loaded() { return loaded; },

    async load() {
      if (!Auth.profile) { ids = new Set(); return; }
      if (inflight) return inflight;
      inflight = (async () => {
        try {
          const snap = await firebaseDB.collection('users').doc(Auth.profile.uid).collection('saved').get();
          ids = new Set(snap.docs.map((d) => d.id));
          loaded = true;
        } catch (err) { console.error('Saved.load failed:', err); }
      })();
      try { await inflight; } finally { inflight = null; }
    },

    has(id) { return ids.has(id); },

    async toggle(internshipId) {
      if (!Auth.profile) return { ok: false, error: 'signed-out' };
      try {
        const uid = Auth.profile.uid;
        if (ids.has(internshipId)) {
          await refOf(uid, internshipId).delete();
          ids.delete(internshipId);
          firebaseDB.collection('internships').doc(internshipId).update({ saves: FV.increment(-1) }).catch(() => {});
          return { ok: true, state: 'removed' };
        }
        await refOf(uid, internshipId).set({ internshipId, savedAt: serverTs() });
        ids.add(internshipId);
        firebaseDB.collection('internships').doc(internshipId).update({ saves: FV.increment(1) }).catch(() => {});
        return { ok: true, state: 'saved' };
      } catch (err) { console.error('Saved.toggle failed:', err); return { ok: false, error: err.message }; }
    },

    /** Full internship objects for everything saved, newest-saved first. */
    async list() {
      if (!Auth.profile) return [];
      try {
        const snap = await firebaseDB.collection('users').doc(Auth.profile.uid)
          .collection('saved').orderBy('savedAt', 'desc').get();
        const entries = snap.docs.map((d) => ({ id: d.id, savedAt: UI.toDate(d.data().savedAt) }));
        ids = new Set(entries.map((e) => e.id));
        if (!entries.length) return [];
        const items = [];
        for (let i = 0; i < entries.length; i += 10) {
          const chunk = entries.slice(i, i + 10);
          const docs = await firebaseDB.getAll(...chunk.map((e) => firebaseDB.collection('internships').doc(e.id)));
          docs.forEach((doc, j) => {
            if (doc.exists && doc.data().published) {
              const d = doc.data();
              items.push({
                id: doc.id, title: d.title, company: d.company, image: d.image || '',
                field: d.field || '', category: d.category || '', city: d.city || '',
                workMode: d.workMode || '', duration: d.duration || '', stipend: d.stipend || '',
                verified: !!d.verified, deadline: UI.toDate(d.deadline), createdAt: UI.toDate(d.createdAt),
                savedAt: chunk[j].savedAt
              });
            }
          });
        }
        return items;
      } catch (err) { console.error('Saved.list failed:', err); return []; }
    }
  };
})();
