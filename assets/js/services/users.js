/* ============================================================
   USERS · admin management of users/{uid} profile documents.
   Real Firebase profiles only. Suspension + deletion respect the
   limits of a client-only architecture (documented, not faked).
   ============================================================ */

const Users = (() => {
  const col = () => firebaseDB.collection('users');

  function normalize(doc) {
    const d = doc.data();
    return {
      uid: doc.id,
      email: d.email || '',
      displayName: d.displayName || (d.email || '').split('@')[0],
      username: d.username || '',
      phone: d.phone || '',
      institution: d.institution || '',
      field: d.field || '',
      course: d.course || '',
      academicLevel: d.academicLevel || '',
      bio: d.bio || '',
      role: d.role || 'student',
      status: d.status || 'active',
      suspendReason: d.suspendReason || '',
      preferences: d.preferences || { fields: [], locations: [], workModes: [] },
      notifications: d.notifications || {},
      isAdmin: !!d.admin || d.role === 'admin',
      createdAt: UI.toDate(d.createdAt),
      lastActive: UI.toDate(d.lastActive),
      updatedAt: UI.toDate(d.updatedAt)
    };
  }

  return {
    normalize,

    /** Admin: bounded profile fetch for the manage-users table. */
    async all(limit = 1000) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized', items: [] };
      try {
        const snap = await col().orderBy('createdAt', 'desc').limit(limit).get();
        return { ok: true, items: snap.docs.map(normalize) };
      } catch (err) { console.error('Users.all failed:', err); return { ok: false, error: err.message, items: [] }; }
    },

    async get(uid) {
      try { const doc = await col().doc(uid).get(); return doc.exists ? normalize(doc) : null; }
      catch (_) { return null; }
    },

    /** Admin: edit one profile, tied to the correct uid. */
    async update(uid, patch) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(uid).update({ ...patch, updatedAt: serverTs() });
        Activity.log({ action: 'user.updated', targetType: 'user', targetId: uid, targetTitle: patch.displayName || uid });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    /**
     * Admin: suspend / reactivate. This is a real Firestore state enforced
     * at sign-in (Auth.loadProfile signs a suspended student straight out).
     * NOTE: disabling the Firebase *Auth* record itself requires the Admin
     * SDK on a server — documented in the admin UI, not faked here.
     */
    async setStatus(uid, status, reason = '') {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(uid).update({
          status, suspendReason: status === 'suspended' ? reason : '', updatedAt: serverTs()
        });
        Activity.log({ action: status === 'suspended' ? 'user.suspended' : 'user.reactivated', targetType: 'user', targetId: uid });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    },

    /**
     * Admin: delete the Firestore profile document. The linked Firebase
     * Auth user cannot be removed from the browser (Admin SDK only) — the
     * calling UI must state this clearly rather than claim full deletion.
     */
    async deleteProfile(uid) {
      const user = Auth.profile;
      if (!user || !user.isAdmin) return { ok: false, error: 'Unauthorized' };
      try {
        await col().doc(uid).delete();
        Activity.log({ action: 'user.deleted', targetType: 'user', targetId: uid });
        return { ok: true };
      } catch (err) { return { ok: false, error: err.message }; }
    }
  };
})();
