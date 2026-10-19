/* ============================================================
   UI KIT · portable paths · icons · dates · toast · modal
   ============================================================ */

// One level of nesting: student_pages/ and admin_pages/ resolve back to root.
const ROOT = /\/(student_pages|admin_pages|auth)\//.test(decodeURIComponent(window.location.pathname)) ? '../' : '';
const H = (p) => ROOT + String(p).replace(/^\/+/, '');

const UI = (() => {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.2L5 21V4a1 1 0 0 1 1-1Z"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="12" cy="5.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="18.5" r="1.3"/>',
    'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    pin: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18"/>',
    external: '<path d="M14 4h6v6M20 4 11 13M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13M10 11v5m4-5v5"/>',
    pencil: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M4 4l16 16M9.9 5.2A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.9M6.1 6.6A16.7 16.7 0 0 0 2.5 12S6 19 12 19a9.6 9.6 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    alert: '<path d="M12 8v5m0 3.5v.01M10.3 3.9 1.9 18.4a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    send: '<path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7Z"/>',
    home: '<path d="m3 11 9-8 9 8M5.5 9.5V21h13V9.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17 20a6.5 6.5 0 0 0-2.3-4.9"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    phone: '<path d="M5 4h4l1.5 4L8 10a12 12 0 0 0 6 6l2-2.5 4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 8l4 4-4 4M19 12H9"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    inbox: '<path d="M4 4h16v16H4zM4 13h4.5l1.5 2.5h4L15.5 13H20"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.4 3 8.3 7 9.8 4-1.5 7-5.4 7-9.8V5.8L12 3Z"/><path d="m9 12 2 2 4-4.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4m8-4v4"/>',
    sparkles: '<path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.5 6.5 5 5M19 19l-1.5-1.5M6.5 17.5 5 19M19 5l-1.5 1.5"/><circle cx="12" cy="12" r="3"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 12.6H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3.6h.5A1.6 1.6 0 0 0 11 2.1V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.4 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.5 5.5 13 13"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>',
    code: '<path d="M8 6l-5 6 5 6M16 6l5 6-5 6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2.5 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/>',
    leaf: '<path d="M12 22V8"/><path d="M12 8C12 4 9 2 5 2c0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
    bolt: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    megaphone: '<path d="M3 11l18-8v18L3 13v-2z"/><path d="M7 13v6a2 2 0 0 0 4 0v-4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    history: '<path d="M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5"/><path d="M12 8v4.5l3 1.8"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m4 17 4.5-4.5 3.5 3.5 3-3L20 16"/>'
  };

  function icon(name, size = 20, filled = false) {
    const p = paths[name] || '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${filled ? 0 : 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    const u = String(url || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function toDate(value) {
    if (!value) return null;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fmtDate(date, withYear = true) {
    const d = toDate(date);
    if (!d) return '—';
    return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
  }

  // Whole calendar days, today inclusive: 0 = closes today, negative = past.
  function daysUntil(date) {
    const d = toDate(date);
    if (!d) return null;
    const midnight = (x) => { const c = new Date(x); c.setHours(0, 0, 0, 0); return c.getTime(); };
    return Math.round((midnight(d) - midnight(new Date())) / 86400000);
  }

  function deadlineInfo(item) {
    const days = daysUntil(item.deadline);
    if (days === null) return { label: 'Rolling deadline', cls: '', days: null };
    if (days < 0) return { label: 'Closed', cls: 'is-closed', days };
    if (days === 0) return { label: 'Closes today', cls: 'is-urgent', days };
    if (days <= 7) return { label: `${days} day${days === 1 ? '' : 's'} left`, cls: 'is-urgent', days };
    return { label: `Closes ${fmtDate(item.deadline, false)}`, cls: '', days };
  }

  function isOpen(item) {
    const days = daysUntil(item.deadline);
    return days === null || days >= 0;
  }

  // Timestamp-based "New" window, set in admin Settings (6–168h, ~48h default).
  // Expiry only drops the badge — it never deletes a listing.
  const NEW_WINDOW_DEFAULT_H = 48;
  function newWindowHours() {
    const h = typeof Settings === 'undefined' ? 0 : Number(Settings.data && Settings.data.newWindowHours);
    return h >= 6 && h <= 168 ? h : NEW_WINDOW_DEFAULT_H;
  }
  function isNew(item) {
    const ref = toDate(item.publishedAt) || toDate(item.createdAt);
    if (!ref) return false;
    return Date.now() - ref.getTime() <= newWindowHours() * 3600000;
  }

  function timeAgo(date) {
    const d = toDate(date);
    if (!d) return '';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return fmtDate(d);
  }

  let toastStack = null;
  function toast(message, type = 'success') {
    if (!toastStack) {
      toastStack = document.createElement('div');
      toastStack.className = 'toast-stack';
      toastStack.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastStack);
    }
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
    el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check', 16)}<span>${esc(message)}</span>`;
    toastStack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-shown'));
    setTimeout(() => {
      el.classList.remove('is-shown');
      setTimeout(() => el.remove(), 320);
    }, 2800);
  }

  function confirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal modal-sm" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <h3 class="modal-title">${esc(title)}</h3>
          <p class="modal-msg">${esc(message)}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${esc(confirmLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add('is-open'));
      const close = (value) => {
        backdrop.classList.remove('is-open');
        setTimeout(() => backdrop.remove(), 240);
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = (e) => { if (e.key === 'Escape') close(false); };
      document.addEventListener('keydown', onKey);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'cancel') close(false);
        if (act === 'ok') close(true);
      });
    });
  }

  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  // offsetParent is always null for position:fixed, and drawers are fixed.
  function onScreen(el) {
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }

  /** Topmost dialog layer still on screen — modal backdrops and drawers are
   *  either [hidden] or display:none between opens, so ignore those. */
  function openDialog() {
    const layers = document.querySelectorAll('[role="dialog"]');
    for (let i = layers.length - 1; i >= 0; i--) {
      const el = layers[i];
      if (!el.closest('[hidden]') && onScreen(el)) return el;
    }
    return null;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const dlg = openDialog();
    if (!dlg) return;
    const items = [...dlg.querySelectorAll(FOCUSABLE)].filter(onScreen);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const cur = document.activeElement;
    if (dlg.contains(cur)) {
      if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    } else { e.preventDefault(); first.focus(); }
  });

  function initReveals(root = document) {
    const items = root.querySelectorAll('[data-rev]:not(.in)');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  function skeletonRows(n = 4) {
    let html = '';
    for (let i = 0; i < n; i++) html += `<div class="skel-row"><div style="flex:1"><div class="skel skel-title"></div><div class="skel skel-meta"></div></div><div class="skel skel-chip"></div></div>`;
    return `<div class="state-skeleton" aria-hidden="true">${html}</div>`;
  }

  function initials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '·';
    return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  function daysSince(date) {
    const d = toDate(date);
    if (!d) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  const FIELD_ICONS = [
    [/softwar|comput|develop|programm|web|code|cyber|network/i, 'code'],
    [/data|artificial|machine|analyt|statist|\bai\b/i, 'chart'],
    [/design|creative|graphic|\bux\b|\bui\b|art|media|film/i, 'pencil'],
    [/financ|account|bank|audit|tax|insur|econom/i, 'coin'],
    [/agric|farm|agro|livestock|fish|forestr/i, 'leaf'],
    [/engineer|electric|mechanic|civil|energy|power|manufactur|construct/i, 'bolt'],
    [/health|medic|nurs|pharma|hospital|biolog/i, 'pulse'],
    [/market|sales|growth|communicat|brand|journal|content|\bpr\b/i, 'megaphone'],
    [/law|legal|policy|govern|diploma/i, 'shield'],
    [/educat|teach|train|tutor/i, 'users'],
    [/logistic|supply|transport|ship/i, 'send'],
    [/human resource|admin|manage|business|consult|operation|\bhr\b/i, 'briefcase']
  ];

  function fieldIcon(field) {
    const f = String(field || '');
    const hit = FIELD_ICONS.find(([re]) => re.test(f));
    return hit ? hit[1] : 'briefcase';
  }

  return {
    icon, esc, safeUrl, toDate, fmtDate, daysUntil, deadlineInfo, isOpen, isNew,
    timeAgo, toast, confirm, initReveals, skeletonRows, initials, newWindowHours,
    daysSince, fieldIcon
  };
})();
