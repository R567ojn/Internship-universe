/* ============================================================
   AUTH · Firebase Auth + users/{uid} profile + admin custom claim
   Race-free: pages await Auth.ready before gating.
   ============================================================ */

const Auth = (() => {
  let profile = null;
  let settled = false;
  let settle;
  const ready = new Promise((r) => { settle = r; });

  // file:// origins can lag the first auth event; never block UI on it — but a
  // live session must not be misread as signed-out because its first
  // users/{uid} read is still in flight, which would bounce the student to signin.
  setTimeout(() => {
    if (settled) return;
    if (!firebaseAuth.currentUser) { settled = true; settle(); return; }
    setTimeout(() => { if (!settled) { settled = true; settle(); } }, 17500);
  }, 2500);

  const DEFAULT_PREFS = { fields: [], locations: [], workModes: [] };
  const DEFAULT_NOTIFS = { newMatches: true, locationAlerts: true, deadlineReminders: true, suggestionStatus: true };

  async function loadProfile(fbUser) {
    let data = {};
    try {
      const doc = await firebaseDB.collection('users').doc(fbUser.uid).get();
      if (doc.exists) data = doc.data();
      else data = await createUserDoc(fbUser);
    } catch (err) { console.error('Profile load failed:', err); }

    let isAdmin = false;
    try {
      const token = await fbUser.getIdTokenResult();
      isAdmin = token.claims.admin === true;
    } catch (err) { console.error('Claim check failed:', err); }

    const suspended = !isAdmin && data.status === 'suspended';

    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || data.displayName || (fbUser.email || '').split('@')[0],
      username: data.username || '',
      phone: data.phone || '',
      institution: data.institution || '',
      field: data.field || '',
      course: data.course || '',
      academicLevel: data.academicLevel || '',
      bio: data.bio || '',
      preferences: { ...DEFAULT_PREFS, ...(data.preferences || {}) },
      notifications: { ...DEFAULT_NOTIFS, ...(data.notifications || {}) },
      status: data.status || 'active',
      createdAt: UI.toDate(data.createdAt),
      lastActive: UI.toDate(data.lastActive),
      isAdmin,
      suspended
    };
  }

  async function createUserDoc(fbUser) {
    const data = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || (fbUser.email || '').split('@')[0],
      role: 'student',
      status: 'active',
      preferences: DEFAULT_PREFS,
      notifications: DEFAULT_NOTIFS,
      createdAt: serverTs(),
      updatedAt: serverTs(),
      lastActive: serverTs()
    };
    await firebaseDB.collection('users').doc(fbUser.uid).set(data, { merge: true });
    return data;
  }

  function touch() {
    if (!profile) return;
    firebaseDB.collection('users').doc(profile.uid)
      .update({ lastActive: serverTs() }).catch(() => {});
  }

  firebaseAuth.onAuthStateChanged(async (fbUser) => {
    if (fbUser) {
      profile = await loadProfile(fbUser);
      if (profile.suspended) {
        await firebaseAuth.signOut();
        profile = null;
        window.location.replace(H('signin.html') + '?suspended=1');
        if (!settled) { settled = true; settle(); }
        return;
      }
      touch();
    } else {
      profile = null;
    }
    if (!settled) { settled = true; settle(); }
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: profile }));
  });

  function friendly(code) {
    const map = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'That email address looks invalid.',
      'auth/weak-password': 'Please choose a stronger password (6+ characters).',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account matches this email.',
      'auth/wrong-password': 'Incorrect email or password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/invalid-login-credentials': 'Incorrect email or password.',
      'auth/requires-recent-login': 'For your security, please sign in again before changing this.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and retry.',
      'auth/network-request-failed': 'Network error — check your connection.'
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  async function reauth() {
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser) return { ok: false, error: 'You are signed out.' };
    // Email/password is the only provider; require a fresh credential from the caller.
    return { ok: true, fbUser };
  }

  return {
    ready,
    get profile() { return profile; },
    get fbUser() { return firebaseAuth.currentUser; },

    async register(name, email, password) {
      try {
        const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        if (name) await cred.user.updateProfile({ displayName: name });
        profile = await loadProfile(cred.user);
        if (profile) profile.displayName = name || profile.displayName;
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    async signIn(email, password, remember = true) {
      try {
        const P = firebase.auth.Auth.Persistence;
        try { await firebaseAuth.setPersistence(remember ? P.LOCAL : P.SESSION); } catch (_) {}
        await firebaseAuth.signInWithEmailAndPassword(email, password);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    /** Resolve with the profile once onAuthStateChanged has populated it. */
    waitForUser(timeout = 5000) {
      return new Promise((res) => {
        if (profile) return res(profile);
        const h = (e) => { document.removeEventListener('auth:changed', h); res(e.detail); };
        document.addEventListener('auth:changed', h);
        setTimeout(() => { document.removeEventListener('auth:changed', h); res(profile); }, timeout);
      });
    },

    async signOut() {
      try { await firebaseAuth.signOut(); } catch (_) {}
      window.location.href = H('index.html');
    },

    async resetPassword(email) {
      try { await firebaseAuth.sendPasswordResetEmail(email); return { ok: true }; }
      catch (err) { return { ok: false, error: friendly(err.code) }; }
    },

    /** Update the caller's own profile document (owner-scoped by rules). */
    async updateProfile(fields) {
      if (!profile) return { ok: false, error: 'Sign in first.' };
      try {
        await firebaseDB.collection('users').doc(profile.uid)
          .update({ ...fields, updatedAt: serverTs() });
        if (fields.displayName) await firebaseAuth.currentUser.updateProfile({ displayName: fields.displayName });
        profile = { ...profile, ...fields };
        document.dispatchEvent(new CustomEvent('auth:changed', { detail: profile }));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) || err.message };
      }
    },

    /** Change password with reauthentication (credential supplied by caller). */
    async changePassword(credential, newPassword) {
      try {
        const fbUser = firebaseAuth.currentUser;
        if (!fbUser) return { ok: false, error: 'You are signed out.' };
        await fbUser.reauthenticateWithCredential(credential);
        await fbUser.updatePassword(newPassword);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    /** Change the account email (reauthenticate first, then update). */
    async changeEmail(credential, newEmail) {
      try {
        const fbUser = firebaseAuth.currentUser;
        if (!fbUser) return { ok: false, error: 'You are signed out.' };
        await fbUser.reauthenticateWithCredential(credential);
        await fbUser.updateEmail(newEmail);
        await fbUser.sendEmailVerification().catch(() => {});
        profile = { ...profile, email: newEmail };
        document.dispatchEvent(new CustomEvent('auth:changed', { detail: profile }));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    /** Reauthenticate the current user with their password. */
    async reauthWithPassword(password) {
      const fbUser = firebaseAuth.currentUser;
      if (!fbUser) return { ok: false, error: 'You are signed out.' };
      try {
        const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, password);
        await fbUser.reauthenticateWithCredential(cred);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    /**
     * Delete the caller's own account. Firestore profile may require
     * cascade cleanup; we delete the profile doc we can reach, then the
     * Auth user. Auth deletion is scoped to the signed-in user only.
     */
    async deleteAccount(password) {
      const fbUser = firebaseAuth.currentUser;
      if (!fbUser) return { ok: false, error: 'You are signed out.' };
      try {
        if (password) {
          const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, password);
          await fbUser.reauthenticateWithCredential(cred);
        }
        await firebaseDB.collection('users').doc(fbUser.uid).delete().catch(() => {});
        await fbUser.delete();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: friendly(err.code) };
      }
    },

    /** Export the caller's own data as a JSON blob (client-side). */
    async exportData() {
      if (!profile) return null;
      const uid = profile.uid;
      const out = { account: { ...profile }, saved: [], notifications: [], suggestions: [] };
      delete out.account.isAdmin;
      try {
        const saved = await firebaseDB.collection('users').doc(uid).collection('saved').get();
        out.saved = saved.docs.map((d) => ({ internshipId: d.id, savedAt: UI.toDate(d.data().savedAt) }));
      } catch (_) {}
      try {
        const notifs = await firebaseDB.collection('users').doc(uid).collection('notifications').get();
        out.notifications = notifs.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (_) {}
      try {
        const sug = await firebaseDB.collection('suggestions').where('submittedBy', '==', uid).get();
        out.suggestions = sug.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (_) {}
      return out;
    },

    homePath(user = profile) {
      return user && user.isAdmin ? H('admin_pages/dashboard.html') : H('student_pages/dashboard.html');
    },

    afterAuthPath(user = profile) {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && !next.startsWith('//') && !next.includes('://')) return H(next);
      return this.homePath(user);
    },

    async requireSignedIn() {
      await ready;
      if (profile) return profile;
      const base = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
      const dir = /\/(student_pages|admin_pages)\//.test(decodeURIComponent(window.location.pathname))
        ? window.location.pathname.match(/(student_pages|admin_pages)/)[1] + '/' : '';
      const here = dir + base + window.location.search;
      window.location.replace(`${H('signin.html')}?next=${encodeURIComponent(here)}`);
      return null;
    },

    async requireAdmin() {
      await ready;
      if (profile && profile.isAdmin) return profile;
      const slot = document.getElementById('adminMain') || document.querySelector('main') || document.getElementById('view');
      if (slot) {
        slot.innerHTML = `
          <div class="blocked">
            <div class="state-icon">${UI.icon('shield', 22)}</div>
            <h1>${profile ? 'Admin access required' : 'Sign in required'}</h1>
            <p>${profile
              ? 'This account does not have administrator permissions on InternHub.'
              : 'The admin console is restricted to InternHub administrators.'}</p>
            <a class="btn btn-primary" href="${profile ? H('index.html') : H('signin.html') + '?next=' + encodeURIComponent('admin_pages/dashboard.html')}">
              ${profile ? 'Back to site' : 'Sign in'}
            </a>
          </div>`;
      }
      return null;
    }
  };
})();
