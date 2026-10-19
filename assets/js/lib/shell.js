/* ============================================================
   SHELL · one reusable app frame (topbar + collapsible sidebar
   + footer) for the student and admin experiences. Pages opt in
   with <body data-app="student|admin" data-nav="<key>">.
   ============================================================ */

const Shell = (() => {
  const LS = 'internhub.nav.collapsed';

  const STUDENT_NAV = [
    { key: 'dashboard', href: 'student_pages/dashboard.html', icon: 'home', label: 'Dashboard' },
    { key: 'browse', href: 'student_pages/browse.html', icon: 'search', label: 'Browse internships' },
    { key: 'whats-new', href: 'student_pages/whats-new.html', icon: 'sparkles', label: "What's New", badge: 'new' },
    { key: 'suggest', href: 'student_pages/suggest.html', icon: 'send', label: 'Suggest an internship' }
  ];
  const ADMIN_NAV = [
    { key: 'dashboard', href: 'admin_pages/dashboard.html', icon: 'grid', label: 'Dashboard', group: 'Overview' },
    { key: 'analytics', href: 'admin_pages/analytics.html', icon: 'chart', label: 'Analytics', group: 'Overview' },
    { key: 'internships', href: 'admin_pages/internships.html', icon: 'briefcase', label: 'Manage internships', group: 'Manage' },
    { key: 'suggestions', href: 'admin_pages/suggestions.html', icon: 'shield', label: 'Suggestions & verification', badge: 'pending', group: 'Manage' },
    { key: 'users', href: 'admin_pages/users.html', icon: 'users', label: 'Manage users', group: 'Manage' },
    { key: 'add', href: 'admin_pages/internship-editor.html', icon: 'plus', label: 'Add internship', group: 'Manage' },
    { key: 'settings', href: 'admin_pages/settings.html', icon: 'settings', label: 'Settings', group: 'System' }
  ];

  function brand(mode) {
    return `<a class="brand" href="${H(mode === 'admin' ? 'admin_pages/dashboard.html' : 'student_pages/dashboard.html')}">
      <span class="brand-mark">${UI.icon('bookmark', 16, true)}</span><span class="brand-txt">InternHub</span>
      ${mode === 'admin' ? '<span class="brand-tag">ADMIN</span>' : ''}</a>`;
  }

  function navList(items, active) {
    let group = null;
    return items.map((it) => {
      let head = '';
      if (it.group && it.group !== group) { group = it.group; head = `<p class="sb-label">${UI.esc(it.group)}</p>`; }
      return `${head}
      <a class="nav-item${it.key === active ? ' is-active' : ''}" href="${H(it.href)}" data-nav-item="${it.key}">
        <span class="nav-ic">${UI.icon(it.icon, 19)}</span><span class="nav-label">${UI.esc(it.label)}</span>
        ${it.badge ? `<span class="nav-badge" data-${it.badge}-badge hidden>0</span>` : ''}
      </a>`;
    }).join('');
  }

  function syncSavedBadge() {
    const n = Auth.profile && typeof Saved !== 'undefined' ? Saved.ids.size : 0;
    document.querySelectorAll('[data-saved-badge]').forEach((el) => {
      el.hidden = !n;
      el.textContent = n;
    });
  }

  function markNav(key) {
    document.querySelectorAll('[data-nav-item]').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.navItem === key);
    });
  }

  async function syncPendingBadge() {
    const els = document.querySelectorAll('[data-pending-badge]');
    if (!els.length || typeof Suggestions === 'undefined') return;
    let n = 0;
    try { n = (await Suggestions.list('pending', 200)).length; } catch (_) { return; }
    els.forEach((el) => { el.hidden = !n; el.textContent = n > 99 ? '99+' : String(n); });
  }

  function accountMenu(mode) {
    const p = Auth.profile;
    if (!p) {
      return `<a class="btn btn-ghost btn-sm" href="${H('signin.html')}">Sign in</a>
              <a class="btn btn-primary btn-sm" href="${H('register.html')}">Create account</a>`;
    }
    return `
      <div class="menu-wrap">
        <button type="button" class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${UI.esc(UI.initials(p.displayName))}</span>
          ${UI.icon('chevron-down', 14)}
        </button>
        <div class="menu-pop" data-menu-pop>
          <div class="menu-head"><b>${UI.esc(p.displayName || 'Student')}</b><span>${UI.esc(p.email || '')}</span></div>
          ${mode === 'admin'
            ? `<a class="menu-item" href="${H('admin_pages/settings.html')}?tab=account">${UI.icon('user', 16)} Account</a>
               <a class="menu-item" href="${H('index.html')}" target="_blank" rel="noopener">${UI.icon('external', 16)} View site</a>`
            : `<a class="menu-item" href="${H('student_pages/account.html')}">${UI.icon('user', 16)} Account</a>
               <a class="menu-item" href="${H('student_pages/dashboard.html')}?view=saved">${UI.icon('bookmark', 16)} Saved internships</a>`}
          <hr class="menu-sep">
          <button type="button" class="menu-item is-danger" data-signout>${UI.icon('logout', 16)} Sign out</button>
        </div>
      </div>`;
  }

  function bell() {
    return `
      <div class="menu-wrap bell-wrap">
        <button type="button" class="icon-btn" data-bell aria-label="Notifications">
          ${UI.icon('bell', 19)}<span class="bell-dot" data-notif-badge hidden></span>
        </button>
        <div class="notif-pop" data-notif-panel>
          <div class="notif-head"><b>Notifications</b><button type="button" class="notif-mark" data-mark-all>Mark all read</button></div>
          <div class="notif-list" data-notif-list></div>
        </div>
      </div>`;
  }

  function buildStudent(active) {
    const p = Auth.profile;
    return `
    <div class="app app--student" id="app">
      <button class="scrim" data-scrim aria-hidden="true"></button>
      <aside class="sidenav" id="sidenav">
        <div class="sidenav-top">${brand('student')}
          <button type="button" class="collapse-btn" data-collapse aria-label="Collapse sidebar">${UI.icon('panel-left', 18)}</button>
        </div>
        <nav class="sidenav-list"><p class="sb-label">My space</p>${navList(STUDENT_NAV, active)}</nav>
        <div class="sidenav-extra" id="sidenav-extra"></div>
        <div class="sidenav-foot"><a class="nav-item" href="${H('student_pages/account.html')}" title="Account">
          <span class="nav-ic">${UI.icon('user', 19)}</span><span class="nav-label">Account</span></a></div>
      </aside>
      <div class="app-main">
        <header class="topbar">
          <button type="button" class="icon-btn only-mobile" data-scrim-open aria-label="Open menu">${UI.icon('menu', 20)}</button>
          <div class="topbar-title" data-page-title></div>
          <div class="topbar-actions">${p ? bell() : ''}${accountMenu('student')}</div>
        </header>
        <div class="app-content" id="view-slot"></div>
        <footer class="app-footer student-footer">
          <div class="ft-cols">
            <div class="ft-brand">${brand('student')}<p>Verified internships across Cameroon, matched to your field and city.</p></div>
            <div class="ft-col"><h5>Explore</h5><a href="${H('student_pages/browse.html')}">Browse internships</a><a href="${H('student_pages/whats-new.html')}">What's New</a><a href="${H('student_pages/suggest.html')}">Suggest an internship</a></div>
            <div class="ft-col"><h5>Account</h5><a href="${H('student_pages/dashboard.html')}">Dashboard</a><a href="${H('student_pages/account.html')}">Profile & preferences</a></div>
            <div class="ft-col"><h5>Legal</h5><a href="${H('privacy.html')}">Privacy Policy</a><a href="${H('terms.html')}">Terms & Conditions</a></div>
          </div>
          <div class="ft-bar"><span>© ${new Date().getFullYear()} InternHub · Cameroon</span><span>Free for students, always</span></div>
        </footer>
      </div>
    </div>`;
  }

  function buildAdmin(active) {
    const p = Auth.profile;
    return `
    <div class="app app--admin" id="app">
      <button class="scrim" data-scrim aria-hidden="true"></button>
      <aside class="sidenav" id="sidenav">
        <div class="sidenav-top">${brand('admin')}
          <button type="button" class="collapse-btn" data-collapse aria-label="Collapse sidebar">${UI.icon('panel-left', 18)}</button>
        </div>
        <nav class="sidenav-list">${navList(ADMIN_NAV, active)}</nav>
        <div class="sidenav-extra" id="sidenav-extra"></div>
        <div class="sidenav-foot">
          <a class="nav-item" href="${H('index.html')}" target="_blank" rel="noopener"><span class="nav-ic">${UI.icon('external', 19)}</span><span class="nav-label">View site</span></a>
          ${p ? `<a class="acct" href="${H('admin_pages/settings.html')}?tab=account">
              <span class="av">${UI.esc(UI.initials(p.displayName))}</span>
              <span class="acct-inf"><span class="nm">${UI.esc(p.displayName || 'Admin')}</span><span class="rl">${p.isAdmin ? 'Administrator' : 'Signed in'}</span></span></a>
            <button type="button" class="alogout" data-signout><span class="nav-ic">${UI.icon('logout', 17)}</span><span class="nav-label">Logout</span></button>` : ''}
        </div>
      </aside>
      <div class="app-main">
        <header class="topbar">
          <button type="button" class="icon-btn only-mobile" data-scrim-open aria-label="Open menu">${UI.icon('menu', 20)}</button>
          <div class="topbar-title" data-page-title></div>
          <div class="topbar-actions">
            ${p ? bell() : ''}
            <a class="btn btn-ghost btn-sm only-desktop" href="${H('index.html')}" target="_blank" rel="noopener">${UI.icon('external', 15)} View Site</a>
            ${accountMenu('admin')}
          </div>
        </header>
        <div class="app-content" id="view-slot"></div>
        <footer class="app-footer admin-footer">
          <span>© ${new Date().getFullYear()} InternHub Admin</span>
          <span>Signed in as ${UI.esc(p ? p.email : '—')}</span>
        </footer>
      </div>
    </div>`;
  }

  /* Collapsed-rail tooltips. The sidebar is a scroll container, so a
     CSS-positioned child would clip; one shared body-level tip is used. */
  function railTips(app) {
    let tip = document.querySelector('.nav-tip');
    if (!tip) {
      tip = document.createElement('span');
      tip.className = 'nav-tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
    }
    const hide = () => { tip.classList.remove('is-shown'); };
    const show = (item) => {
      if (!app.classList.contains('is-collapsed') || matchMedia('(max-width: 960px)').matches) return;
      const label = item.querySelector('.nav-label');
      if (!label) return;
      tip.textContent = label.textContent;
      const r = item.getBoundingClientRect();
      tip.style.top = `${r.top + r.height / 2}px`;
      tip.style.left = `${r.right + 10}px`;
      tip.classList.add('is-shown');
    };
    app.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('mouseenter', () => show(item));
      item.addEventListener('mouseleave', hide);
      item.addEventListener('focus', () => show(item));
      item.addEventListener('blur', hide);
    });
    app.addEventListener('click', hide);
  }

  function wire(mode) {
    const app = document.getElementById('app');
    const sidenav = document.getElementById('sidenav');
    const mq = matchMedia('(max-width: 960px)');

    if (!mq.matches && localStorage.getItem(LS) === '1') app.classList.add('is-collapsed');

    const toggleCollapse = () => {
      if (mq.matches) {
        const open = app.classList.toggle('nav-open');
        document.body.style.overflow = open ? 'hidden' : '';
      } else {
        const c = app.classList.toggle('is-collapsed');
        localStorage.setItem(LS, c ? '1' : '0');
      }
    };
    const openDrawer = () => { app.classList.add('nav-open'); document.body.style.overflow = 'hidden'; };
    const closeDrawer = () => { app.classList.remove('nav-open'); document.body.style.overflow = ''; };

    app.querySelectorAll('[data-collapse]').forEach((b) => b.addEventListener('click', toggleCollapse));
    app.querySelectorAll('[data-scrim-open]').forEach((b) => b.addEventListener('click', openDrawer));
    app.querySelectorAll('[data-scrim]').forEach((b) => b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
    mq.addEventListener('change', () => { closeDrawer(); });

    // Account dropdown
    app.querySelectorAll('[data-menu-btn]').forEach((btn) => {
      const pop = btn.parentElement.querySelector('[data-menu-pop]');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = pop.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (e) => { if (!pop.contains(e.target)) { pop.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
    });
    app.querySelectorAll('[data-signout]').forEach((b) => b.addEventListener('click', () => Auth.signOut()));
    railTips(app);

    // Page title — the content header owns it while it is on screen, so the
    // sticky bar only takes over once that header has scrolled away.
    const navKey = document.body.dataset.nav;
    const items = mode === 'admin' ? ADMIN_NAV : STUDENT_NAV;
    const titleEl = app.querySelector('[data-page-title]');
    const cur = items.find((i) => i.key === navKey);
    if (titleEl) {
      titleEl.textContent = cur ? cur.label : '';
      const h1 = document.querySelector('#view-slot h1');
      if (!h1 || typeof IntersectionObserver !== 'function') titleEl.classList.add('is-shown');
      else new IntersectionObserver(([entry]) => {
        titleEl.classList.toggle('is-shown', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      }, { threshold: 0 }).observe(h1);
    }
  }

  async function initFooterAndReveals() {
    UI.initReveals(document.getElementById('view-slot') || document);
  }

  async function init() {
    const mode = document.body.dataset.app;
    if (!mode) return; // landing/auth pages manage their own chrome
    
    // Hide body content before auth to prevent flash of unstyled content
    const view = document.getElementById('view');
    const sideBlocks = [...document.querySelectorAll('[data-side]')];
    if (view) view.style.visibility = 'hidden';
    
    await Auth.ready;

    const active = document.body.dataset.nav || '';
    document.body.innerHTML = mode === 'admin' ? buildAdmin(active) : buildStudent(active);
    const slot = document.getElementById('view-slot');
    // content injected by page script into #view later is fine — the node survives the rebuild
    if (view && view.children.length) {
      view.style.visibility = '';
      slot.appendChild(view);
    }
    const extra = document.getElementById('sidenav-extra');
    if (extra) sideBlocks.forEach((el) => extra.appendChild(el));

    wire(mode);

    if (Auth.profile && typeof Notifications !== 'undefined' && typeof NotifyUI !== 'undefined') {
      Notifications.load().then(() => NotifyUI.init());
      NotifyUI.render(Notifications.list);
      NotifyUI.updateBadge();
    }
    if (mode === 'student' && Auth.profile && typeof Saved !== 'undefined') {
      Saved.load().then(syncSavedBadge);
      document.addEventListener('saved:changed', syncSavedBadge);
    }
    if (mode === 'admin' && Auth.profile && Auth.profile.isAdmin) syncPendingBadge();
    initFooterAndReveals();
    window.__shellReady = true;
    document.dispatchEvent(new CustomEvent('shell:ready'));
  }

  // Pages using the shared frame run their logic after the shell has
  // rebuilt the DOM. Landing/auth pages (no data-app) run immediately.
  window.onReady = function (cb) {
    if (!document.body.dataset.app || window.__shellReady) cb();
    else document.addEventListener('shell:ready', cb, { once: true });
  };

  document.addEventListener('DOMContentLoaded', init);
  return { init, STUDENT_NAV, ADMIN_NAV, bell, syncSavedBadge, syncPendingBadge, markNav };
})();

/* ============================================================
   Router integration: client-side page transitions
   Load router.js after shell.js in HTML pages
   ============================================================ */
