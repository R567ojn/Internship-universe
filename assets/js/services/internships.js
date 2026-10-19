/* ============================================================
   INTERNSHIPS · Firestore collection "internships"
   Public read of published; admin-only writes (rules + claim).
   Students never write here directly — they submit Suggestions.
   ============================================================ */

const Internships = (() => {
  const col = () => firebaseDB.collection('internships');

  function normalize(doc) {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title || '',
      company: d.company || '',
      image: d.imageUrl || d.image || '',
      field: d.field || '',
      category: d.category || '', // NEW: research classification
      opportunityType: d.opportunityType || 'advertised_internship', // NEW: advertised_internship | potential_placement
      city: d.city || '',
      region: d.region || '',
      area: d.area || '',
      workMode: d.workMode || '',
      duration: d.duration || '',
      stipend: d.stipend || '',
      description: d.description || '',
      requirements: d.requirements || '',
      responsibilities: d.responsibilities || '',
      additionalInfo: d.additionalInfo || '', // NEW: caution text for potential placements
      applicationUrl: d.applicationUrl || '',
      sourceUrl: d.sourceUrl || '',
      deadline: d.deadline || null,
      contactEmail: d.contactEmail || '',
      contactPhone: d.contactPhone || '',
      verified: !!d.verified,
      published: !!d.published,
      featured: !!d.featured,
      status: d.status || (d.published ? 'published' : 'draft'),
      views: d.views || 0,
      saves: d.saves || 0,
      clicks: d.clicks || 0,
      createdBy: d.createdBy || '',
      sourceSuggestionId: d.sourceSuggestionId || '',
      createdAt: UI.toDate(d.createdAt),
      publishedAt: UI.toDate(d.publishedAt),
      verifiedAt: UI.toDate(d.verifiedAt),
      updatedAt: UI.toDate(d.updatedAt)
    };
  }

  const byNewest = (list) => list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  async function listQuery(query) {
    const snap = await query.get();
    return snap.docs.map(normalize);
  }

  return {
    normalize,

    /** Published, newest first. Optional limit for landing/carousels.
     *  Falls back to an index-free query (sort client-side) on a fresh
     *  Firestore project whose composite index isn't deployed yet. */
    async published(limit = null) {
      let q = col().where('published', '==', true).orderBy('createdAt', 'desc');
      if (limit) q = q.limit(limit);
      try {
        const items = await listQuery(q);
        return byNewest(items);
      } catch (err) {
        if (err && /requires an index|failed-precondition/i.test(String(err.code || '') + ' ' + String(err.message || ''))) {
          try {
            let fallback = col().where('published', '==', true);
            if (limit) fallback = fallback.limit(limit * 2);
            const snap = await fallback.get();
            console.warn('Internships.published: composite index missing — using index-free fallback. Deploy firestore.indexes.json.');
            return byNewest(snap.docs.map(normalize)).slice(0, limit || undefined);
          } catch (e2) { console.error('Internships.published fallback failed:', e2); throw e2; }
        }
        console.error('Internships.published failed:', err); throw err;
      }
    },

    /** Published, cursor-paginated (pageSize). Returns {items, cursor, more}. */
    async publishedPage(pageSize = 24, cursor = null) {
      let q = col().where('published', '==', true).orderBy('createdAt', 'desc').limit(pageSize);
      if (cursor) q = col().where('published', '==', true).orderBy('createdAt', 'desc')
        .startAfter(cursor).limit(pageSize);
      try {
        const snap = await q.get();
        const items = snap.docs.map(normalize);
        const last = snap.docs[snap.docs.length - 1];
        return { items, cursor: last ? last.data().createdAt : null, more: snap.size === pageSize };
      } catch (err) { console.error('Internships.publishedPage failed:', err); throw err; }
    },

    /** Published + verified within the "New" window (Browse What's New / global). */
    async whatsNew(limit = 24) {
      const all = await this.published(limit * 4);
      return all.filter((i) => UI.isNew(i)).slice(0, limit);
    },

    async featured(limit = 6) {
      try {
        const snap = await col().where('published', '==', true).where('featured', '==', true).limit(limit).get();
        return byNewest(snap.docs.map(normalize));
      } catch (_) { return []; }
    },

    /** Public single fetch — only returns published docs. */
    async get(id) {
      if (!id) return null;
      try {
        const doc = await col().doc(id).get();
        if (!doc.exists) return null;
        const item = normalize(doc);
        return item.published ? item : null;
      } catch (err) { console.error('Internships.get failed:', err); return null; }
    },

    /** Admin: fetch regardless of publish state. */
    async getAny(id) {
      try { const doc = await col().doc(id).get(); return doc.exists ? normalize(doc) : null; }
      catch (_) { return null; }
    },

    /** Admin: everything (for filtering/pagination client-side over a bounded page). */
    async all(limit = 500) {
      try { return byNewest(await listQuery(col().orderBy('createdAt', 'desc').limit(limit))); }
      catch (err) { console.error('Internships.all failed:', err); return []; }
    },

    /** Admin: create. Draft or published. */
    async create(data) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        const now = serverTs();
        const ref = await col().add({
          ...data,
          verified: !!data.verified,
          verifiedAt: data.verified ? now : null,
          featured: !!data.featured,
          published: !!data.published,
          status: data.published ? 'published' : 'draft',
          publishedAt: data.published ? now : null,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now
        });
        Activity.log({ action: data.published ? 'internship.published' : 'internship.created', targetType: 'internship', targetId: ref.id, targetTitle: data.title });
        return { ok: true, id: ref.id };
      } catch (err) { console.error('Internships.create failed:', err); return { ok: false, error: err.message }; }
    },

    async update(id, updates) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(id).update({ ...updates, updatedAt: serverTs(), updatedBy: user.uid });
        return { ok: true };
      } catch (err) { console.error('Internships.update failed:', err); return { ok: false, error: err.message }; }
    },

    async setPublished(id, val) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        const patch = { published: !!val, status: val ? 'published' : 'draft', updatedAt: serverTs() };
        if (val) {
          const doc = await col().doc(id).get();
          if (!doc.exists || !doc.data().publishedAt) patch.publishedAt = serverTs();
        }
        await col().doc(id).update(patch);
        Activity.log({ action: val ? 'internship.published' : 'internship.unpublished', targetType: 'internship', targetId: id, targetTitle: (await col().doc(id).get()).data()?.title || id });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    async setVerified(id, val) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(id).update({ verified: !!val, verifiedAt: val ? serverTs() : null, updatedAt: serverTs() });
        Activity.log({ action: val ? 'internship.verified' : 'internship.unverified', targetType: 'internship', targetId: id });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    async setFeatured(id, val) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try { await col().doc(id).update({ featured: !!val, updatedAt: serverTs() }); return { ok: true }; }
      catch (err) { return { ok: false, error: err.message }; }
    },

    async remove(id) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(id).delete();
        Activity.log({ action: 'internship.deleted', targetType: 'internship', targetId: id });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    /** Best-effort engagement counters (denormalized; no rules dependency). */
    async bump(id, field) {
      if (!['views', 'clicks'].includes(field)) return;
      try { await col().doc(id).update({ [field]: FV.increment(1) }); } catch (_) {}
    }
  };
})();
