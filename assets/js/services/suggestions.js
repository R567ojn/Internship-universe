/* ============================================================
   SUGGESTIONS · Firestore "suggestions" (student → admin queue)
   Students submit (pending / NOT verified). Admin reviews,
   edits, verifies & publishes into internships, notifies owner.
   ============================================================ */

const Suggestions = (() => {
  const col = () => firebaseDB.collection('suggestions');

  function normalize(doc) {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title || '',
      company: d.company || '',
      field: d.field || '',
      category: d.category || '',
      city: d.city || '',
      area: d.area || '',
      workMode: d.workMode || '',
      duration: d.duration || '',
      stipend: d.stipend || '',
      deadline: d.deadline || '',
      notes: d.notes || d.description || '',
      requirements: d.requirements || '',
      sourceUrl: d.sourceUrl || '',
      applicationUrl: d.applicationUrl || '',
      contactEmail: d.contactEmail || '',
      contactPhone: d.contactPhone || '',
      image: d.image || '',
      whereFound: d.whereFound || '',
      status: d.status || 'pending',
      reviewNotes: d.reviewNotes || '',
      reviewedBy: d.reviewedBy || '',
      submittedBy: d.submittedBy || '',
      submittedByEmail: d.submittedByEmail || '',
      submittedByName: d.submittedByName || '',
      internshipId: d.internshipId || '',
      createdAt: UI.toDate(d.createdAt),
      updatedAt: UI.toDate(d.updatedAt),
      reviewedAt: UI.toDate(d.reviewedAt)
    };
  }

  async function notifyOwner(sug, title, message) {
    if (!sug.submittedBy || sug.submittedBy === 'anonymous') return;
    await Notifications.pushTo(sug.submittedBy, {
      type: 'suggestion', title, message,
      suggestionId: sug.id, read: false, createdAt: serverTs()
    });
  }

  return {
    normalize,

    /** Public: submit. Works signed-in or anonymous. Always pending/unverified. */
    async submit(data) {
      try {
        const user = Auth.profile;
        const doc = await col().add({
          ...data,
          status: 'pending',
          submittedBy: user ? user.uid : 'anonymous',
          submittedByEmail: user ? user.email : (data.contactEmail || ''),
          submittedByName: user ? user.displayName : (data.contactName || ''),
          createdAt: serverTs(),
          updatedAt: serverTs()
        });
        console.log('Suggestion created:', doc.id);
        return { ok: true, id: doc.id };
      } catch (err) { 
        console.error('Suggestions.submit failed:', err); 
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        return { ok: false, error: err.message }; 
      }
    },

    /** Student: their own submissions. */
    async mine(uid) {
      const id = uid || (Auth.profile && Auth.profile.uid);
      if (!id) return [];
      try {
        const snap = await col().where('submittedBy', '==', id).orderBy('createdAt', 'desc').limit(50).get();
        return snap.docs.map(normalize);
      } catch (_) { return []; }
    },

    /** Admin: list, optionally by status. */
    async list(status = null, limit = 500) {
      try {
        let q = col().orderBy('createdAt', 'desc').limit(limit);
        if (status) q = col().where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
        const snap = await q.get();
        return snap.docs.map(normalize);
      } catch (err) { console.error('Suggestions.list failed:', err); return []; }
    },

    async get(id) {
      try { const doc = await col().doc(id).get(); return doc.exists ? normalize(doc) : null; }
      catch (_) { return null; }
    },

    async update(id, patch) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try { await col().doc(id).update({ ...patch, updatedAt: serverTs() }); return { ok: true }; }
      catch (err) { return { ok: false, error: err.message }; }
    },

    async setStatus(id, status, notes = '', extra = {}) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(id).update({
          status, reviewNotes: notes, reviewedBy: user.uid,
          reviewedAt: serverTs(), updatedAt: serverTs(), ...extra
        });
        const sug = await this.get(id);
        const map = {
          rejected: ['Suggestion declined', sug ? sug.title : ''],
          'needs-changes': ['Suggestion needs changes', notes || (sug ? sug.title : '')],
          duplicate: ['Marked as duplicate', sug ? sug.title : ''],
          verified: ['Suggestion verified', sug ? sug.title : '']
        };
        const n = map[status];
        if (n && sug) await notifyOwner(sug, n[0], n[1]);
        Activity.log({ action: 'suggestion.' + status, targetType: 'suggestion', targetId: id, targetTitle: sug ? sug.title : id });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    /** Admin: verify + publish — create a verified, published internship. */
    async verifyAndPublish(id, edits = {}) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      const sug = await this.get(id);
      if (!sug) return { ok: false, error: 'Suggestion not found' };

      const merged = { ...sug, ...edits };
      const draft = {
        title: merged.title, company: merged.company, image: merged.image || '',
        field: merged.field, category: merged.category, city: merged.city, area: merged.area,
        workMode: merged.workMode || 'On-site', duration: merged.duration || '',
        stipend: merged.stipend || '', description: merged.notes, requirements: merged.requirements || '',
        responsibilities: merged.responsibilities || '',
        applicationUrl: merged.applicationUrl || merged.sourceUrl || '',
        sourceUrl: merged.sourceUrl || '', deadline: merged.deadline || null,
        contactEmail: merged.contactEmail || '', contactPhone: merged.contactPhone || '',
        verified: true, published: true, featured: false, sourceSuggestionId: id
      };
      const created = await Internships.create(draft);
      if (!created.ok) return created;

      await col().doc(id).update({
        status: 'verified', internshipId: created.id, reviewedBy: user.uid,
        reviewedAt: serverTs(), updatedAt: serverTs()
      });
      await notifyOwner(sug, 'Your suggested internship is live', `${draft.title} at ${draft.company}`);
      return { ok: true, id: created.id };
    },

    /** Admin: convert to a draft internship (edit further before publishing). */
    async toDraft(id) {
      const sug = await this.get(id);
      if (!sug) return { ok: false, error: 'Suggestion not found' };
      const draft = {
        title: sug.title, company: sug.company, image: sug.image || '', field: sug.field,
        category: sug.category, city: sug.city, area: sug.area, workMode: sug.workMode || 'On-site',
        duration: sug.duration || '', description: sug.notes, applicationUrl: sug.applicationUrl || sug.sourceUrl || '',
        sourceUrl: sug.sourceUrl || '', deadline: sug.deadline || null, contactEmail: sug.contactEmail || '',
        verified: false, published: false, sourceSuggestionId: id
      };
      const created = await Internships.create(draft);
      if (created.ok) await this.setStatus(id, 'approved', 'Converted to draft', { internshipId: created.id });
      return created;
    },

    async remove(id) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try { await col().doc(id).delete(); Activity.log({ action: 'suggestion.deleted', targetType: 'suggestion', targetId: id }); return { ok: true }; }
      catch (err) { return { ok: false, error: err.message }; }
    }
  };
})();
