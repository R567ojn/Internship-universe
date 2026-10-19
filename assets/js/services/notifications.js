/* ============================================================
   NOTIFICATIONS · users/{uid}/notifications
   Owner-scoped. Admin/suggestions push into a specific user's
   subcollection (allowed by rules). No global notifications.
   ============================================================ */

const Notifications = (() => {
  let cache = [];

  function colOf(uid) {
    return firebaseDB.collection('users').doc(uid).collection('notifications');
  }

  return {
    get list() { return cache; },
    unreadCount() { return cache.filter((n) => !n.read).length; },

    /** Low-level: write one notification to a given user (used by admin flows). */
    async pushTo(uid, payload) {
      if (!uid || uid === 'anonymous') return;
      try { await colOf(uid).add(payload); } catch (err) { console.error('pushTo failed:', err); }
    },

    /** Scan saved internships; raise deadline alerts within 7 days. */
    async sync() {
      if (!Auth.profile) return;
      const prefs = Auth.profile.notifications || {};
      if (!prefs.deadlineReminders) return;
      try {
        const saved = await Saved.list();
        let writes = 0;
        for (const item of saved) {
          const days = UI.daysUntil(item.deadline);
          if (days === null || days < 0 || days > 7) continue;
          const ref = colOf(Auth.profile.uid).doc(`deadline-${item.id}`);
          if ((await ref.get()).exists) continue;
          await ref.set({
            type: 'deadline',
            title: days === 0 ? 'Closes today' : `Closes in ${days} day${days === 1 ? '' : 's'}`,
            message: `${item.title} at ${item.company}`,
            internshipId: item.id, read: false, createdAt: serverTs()
          });
          writes++;
        }
      } catch (err) { console.error('Notifications.sync failed:', err); }
    },

    async load() {
      if (!Auth.profile) { cache = []; return cache; }
      try {
        const snap = await colOf(Auth.profile.uid).orderBy('createdAt', 'desc').limit(30).get();
        cache = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: UI.toDate(d.data().createdAt) }));
      } catch (err) { console.error('Notifications.load failed:', err); cache = []; }
      return cache;
    },

    async markAllRead() {
      if (!Auth.profile) return;
      try {
        const unread = cache.filter((n) => !n.read);
        if (!unread.length) return;
        const batch = firebaseDB.batch();
        unread.forEach((n) => batch.update(colOf(Auth.profile.uid).doc(n.id), { read: true }));
        await batch.commit();
        cache.forEach((n) => { n.read = true; });
      } catch (err) { console.error('markAllRead failed:', err); }
    },

    async markRead(id) {
      const item = cache.find((n) => n.id === id);
      if (!item || item.read) return;
      item.read = true;
      try { await colOf(Auth.profile.uid).doc(id).update({ read: true }); } catch (_) {}
    }
  };
})();
