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
      if (!Auth.profile) { 
        console.warn('Saved.load: No authenticated user');
        ids = new Set(); 
        loaded = true;
        return; 
      }
      if (inflight) return inflight;
      inflight = (async () => {
        try {
          console.log('Saved.load: Loading for user', Auth.profile.uid);
          const snap = await firebaseDB.collection('users').doc(Auth.profile.uid).collection('saved').get();
          ids = new Set(snap.docs.map((d) => d.id));
          loaded = true;
          console.log('Saved.load: Loaded', ids.size, 'saved internships');
        } catch (err) { 
          console.error('Saved.load failed:', err); 
          ids = new Set();
          loaded = true; // Set loaded to true even on error to prevent infinite waiting
        }
      })();
      try { await inflight; } finally { inflight = null; }
    },

    has(id) { return ids.has(id); },

    async toggle(internshipId) {
      if (!Auth.profile) return { ok: false, error: 'signed-out' };
      try {
        const uid = Auth.profile.uid;
        console.log('Saved.toggle: User', uid, 'toggling internship', internshipId);
        
        if (ids.has(internshipId)) {
          // Unsave operation
          console.log('Saved.toggle: Attempting to delete saved record at path:', `users/${uid}/saved/${internshipId}`);
          const deleteRef = refOf(uid, internshipId);
          await deleteRef.delete();
          console.log('Saved.toggle: Delete operation completed');
          
          ids.delete(internshipId);
          console.log('Saved.toggle: Removed from local Set. Remaining saved:', ids.size);
          
          // Update counter (best effort)
          firebaseDB.collection('internships').doc(internshipId).update({ saves: FV.increment(-1) }).catch((err) => {
            console.warn('Saved.toggle: Could not update saves counter:', err);
          });
          
          return { ok: true, state: 'removed' };
        }
        
        // Save operation
        console.log('Saved.toggle: Attempting to save at path:', `users/${uid}/saved/${internshipId}`);
        await refOf(uid, internshipId).set({ internshipId, savedAt: serverTs() });
        console.log('Saved.toggle: Save operation completed');
        
        ids.add(internshipId);
        console.log('Saved.toggle: Added to local Set. Total saved:', ids.size);
        
        // Update counter (best effort)
        firebaseDB.collection('internships').doc(internshipId).update({ saves: FV.increment(1) }).catch((err) => {
          console.warn('Saved.toggle: Could not update saves counter:', err);
        });
        
        return { ok: true, state: 'saved' };
      } catch (err) { 
        console.error('Saved.toggle FAILED:', err);
        console.error('Saved.toggle error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        });
        return { ok: false, error: err.message }; 
      }
    },

    /** Full internship objects for everything saved, newest-saved first. */
    async list() {
      if (!Auth.profile) return [];
      try {
        const snap = await firebaseDB.collection('users').doc(Auth.profile.uid)
          .collection('saved').orderBy('savedAt', 'desc').get();
        const entries = snap.docs.map((d) => ({ id: d.id, savedAt: UI.toDate(d.data().savedAt) }));
        
        // Update ids Set to include all saved IDs (don't overwrite if already loaded)
        if (!loaded || ids.size === 0) {
          ids = new Set(entries.map((e) => e.id));
          loaded = true;
        } else {
          // Merge new IDs with existing ones to avoid losing state
          entries.forEach((e) => ids.add(e.id));
        }
        
        if (!entries.length) return [];
        const items = [];
        for (let i = 0; i < entries.length; i += 10) {
          const chunk = entries.slice(i, i + 10);
          const docs = await Promise.all(chunk.map((e) => firebaseDB.collection('internships').doc(e.id).get()));
          docs.forEach((doc, j) => {
            if (doc.exists && doc.data().published) {
              const d = doc.data();
              items.push({
                id: doc.id, title: d.title, company: d.company, image: d.image || '',
                field: d.field || '', category: d.category || '', city: d.city || '',
                workMode: d.workMode || '', duration: d.duration || '', stipend: d.stipend || '',
                verified: !!d.verified, deadline: UI.toDate(d.deadline), createdAt: UI.toDate(d.createdAt),
                savedAt: entries[i + j].savedAt
              });
            }
          });
        }
        return items;
      } catch (err) { console.error('Saved.list failed:', err); return []; }
    }
  };
})();
