/* ============================================================
   NOTIFY UI · bell dropdown (student topbar). Owner-scoped
   notifications; no separate notification page.
   ============================================================ */

const NotifyUI = (() => {
  function render(items) {
    const list = document.querySelector('[data-notif-list]');
    if (!list) return;
    if (!items || !items.length) {
      list.innerHTML = '<div class="notif-empty">You\'re all caught up. Deadline and suggestion alerts appear here.</div>';
      return;
    }
    list.innerHTML = items.map((n) => `
      <button type="button" class="notif-item${n.read ? '' : ' is-unread'}" data-notif="${UI.esc(n.id)}" ${n.internshipId ? `data-goto="${H('internship.html')}?id=${encodeURIComponent(n.internshipId)}"` : ''}>
        <span class="notif-item-title">${UI.esc(n.title || '')}</span>
        <span class="notif-item-msg">${UI.esc(n.message || '')}</span>
        <span class="notif-item-time">${UI.esc(UI.timeAgo(n.createdAt))}</span>
      </button>`).join('');
  }

  function updateBadge() {
    const badge = document.querySelector('[data-notif-badge]');
    if (!badge) return;
    const n = Notifications.unreadCount();
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.hidden = !n;
  }

  function init() {
    const bell = document.querySelector('[data-bell]');
    const panel = document.querySelector('[data-notif-panel]');
    if (!bell || !panel) return;

    render(Notifications.list);
    updateBadge();

    bell.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('is-open'); });
    document.addEventListener('click', (e) => { if (!panel.contains(e.target) && !bell.contains(e.target)) panel.classList.remove('is-open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.classList.remove('is-open'); });

    const markAll = panel.querySelector('[data-mark-all]');
    if (markAll) markAll.addEventListener('click', async () => { await Notifications.markAllRead(); render(Notifications.list); updateBadge(); });

    panel.addEventListener('click', (e) => {
      const item = e.target.closest('[data-notif]');
      if (!item) return;
      Notifications.markRead(item.dataset.notif);
      item.classList.remove('is-unread');
      updateBadge();
      if (item.dataset.goto) window.location.href = item.dataset.goto;
    });
  }

  return { init, render, updateBadge };
})();
