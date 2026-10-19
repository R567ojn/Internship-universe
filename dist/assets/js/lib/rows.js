/* ============================================================
   ROWS · shared internship card + row renderer + save handling
   ============================================================ */

const Rows = (() => {
  function detailHref(id) { return H('internship.html') + '?id=' + encodeURIComponent(id); }

  function media(item) {
    if (item.image && /^https?:/i.test(item.image)) {
      return `<img src="${UI.esc(item.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ic-fallback',textContent:${JSON.stringify((item.company || 'I').trim().charAt(0).toUpperCase())}}))">`;
    }
    const ch = (item.company || 'I').trim().charAt(0).toUpperCase();
    return `<div class="ic-fallback">${UI.esc(ch)}</div>`;
  }

  function badges(item, soonText) {
    const days = UI.daysUntil(item.deadline);
    if (days !== null && days < 0) return '<span class="bdg bdg-closed">Closed</span>';
    let html = '';
    if (UI.isNew(item)) html += '<span class="bdg bdg-new">New</span>';
    if (item.verified) html += `<span class="bdg bdg-ver">${UI.icon('shield', 11)} Verified</span>`;
    else html += '<span class="bdg bdg-pend">Pending</span>';
    if (days !== null && days <= 7) html += `<span class="bdg bdg-soon">${UI.esc(soonText || 'Closing soon')}</span>`;
    return html;
  }

  function metaTags(item, withCity) {
    const bits = [
      item.field ? UI.icon('briefcase', 12) + UI.esc(item.field) : '',
      item.duration ? UI.icon('clock', 12) + UI.esc(item.duration) : '',
      item.workMode ? UI.icon('globe', 12) + UI.esc(item.workMode) : '',
      withCity && item.city ? UI.icon('pin', 12) + UI.esc(item.city) : ''
    ].filter(Boolean);
    return bits.map((b) => `<i>${b}</i>`).join('');
  }

  function deadlineLine(item) {
    const days = UI.daysUntil(item.deadline);
    let label;
    let cls = '';
    if (days === null) label = 'Rolling deadline';
    else if (days < 0) { label = 'Closed'; cls = 'off'; }
    else if (days === 0) { label = 'Closes today'; cls = 'warn'; }
    else if (days === 1) { label = 'Closes tomorrow'; cls = 'warn'; }
    else if (days <= 14) { label = `Closes in ${days} days`; cls = 'warn'; }
    else label = `Closes ${UI.fmtDate(item.deadline, false)}`;
    return `<span class="dead${cls ? ' ' + cls : ''}">${UI.icon('clock', 12)} ${UI.esc(label)}</span>`;
  }

  function saveBtn(item, cls) {
    const saved = Saved.has(item.id);
    return `<button type="button" class="${cls}${saved ? ' on' : ''}" data-save="${UI.esc(item.id)}"
            aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save internship'}">
      ${UI.icon('bookmark', 15, saved)}
    </button>`;
  }

  function card(item) {
    const dl = UI.deadlineInfo(item);
    const href = detailHref(item.id);

    return `<article class="icard">
      <div class="ic-media">${media(item)}
        <div class="ic-badges">${badges(item)}</div>
        ${saveBtn(item, 'save')}
      </div>
      <span class="mono-av">${UI.esc(UI.initials(item.company || 'InternHub'))}</span>
      <div class="ic-body">
        <h3 class="ic-title"><a href="${href}">${UI.esc(item.title || 'Untitled role')}</a></h3>
        <p class="ic-co">${UI.icon('building', 13)} ${UI.esc(item.company || '—')}${item.verified ? `<span class="vcheck">${UI.icon('check', 9)}</span>` : ''}</p>
        <div class="ic-meta">${metaTags(item, true)}</div>
      </div>
      <div class="ic-foot">
        <span class="ic-dead${dl.cls ? ' ' + dl.cls : ''}">${UI.icon('clock', 12)} ${UI.esc(dl.label)}</span>
        <a class="btn btn-ghost btn-sm" href="${href}" data-details="${UI.esc(item.id)}">Details</a>
      </div>
    </article>`;
  }

  function grid(items) {
    if (!items.length) return '';
    return `<div class="icard-grid">${items.map(card).join('')}</div>`;
  }

  /** List view: thumbnail + title + meta + deadline + save, per the mandatory design. */
  function row(item) {
    const href = detailHref(item.id);
    return `<article class="irow">
      <div class="ir-thumb">${media(item)}${UI.isNew(item) ? '<span class="bdg bdg-new">New</span>' : ''}</div>
      <div class="ir-main">
        <h3><a href="${href}">${UI.esc(item.title || 'Untitled role')}</a></h3>
        <p class="ir-co">${UI.icon('building', 13)} ${UI.esc(item.company || '—')}${item.city ? ' · ' + UI.esc(item.city) : ''}${item.verified ? `<span class="vcheck">${UI.icon('check', 9)}</span>` : ''}</p>
        <div class="ic-meta">${metaTags(item, false)}</div>
      </div>
      <div class="ir-side">
        ${deadlineLine(item)}
        ${saveBtn(item, 'ir-save')}
        <a class="btn btn-ghost btn-sm" href="${href}" data-details="${UI.esc(item.id)}">Details</a>
      </div>
    </article>`;
  }

  function rows(items) {
    if (!items.length) return '';
    return `<div class="irow-list">${items.map(row).join('')}</div>`;
  }

  function empty(message = 'No internships found.', sub = '') {
    return `<div class="ic-empty"><b>${UI.esc(message)}</b>${sub ? `<span>${UI.esc(sub)}</span>` : ''}</div>`;
  }

  function error() {
    return `<div class="ic-empty ic-error"><b>Couldn't load internships</b>
      <span>There was a problem reaching the database.</span>
      <button type="button" class="btn btn-ghost" onclick="location.reload()" style="margin-top:14px">Retry</button></div>`;
  }

  function skeletonCells(n = 6) {
    let html = '';
    for (let i = 0; i < n; i++) html += `<div class="icard icard-skel"><div class="ic-media"></div><div class="ic-body"><div class="skel skel-title"></div><div class="skel skel-meta"></div></div></div>`;
    return html;
  }

  function skeleton(n = 6) {
    return `<div class="icard-grid">${skeletonCells(n)}</div>`;
  }

  /** Dark card used by the "New this week" marquee. */
  function darkCard(item) {
    const href = detailHref(item.id);
    return `<article class="dcard">
      <div class="dc-media">${media(item)}
        <div class="dc-badges">${badges(item)}</div>
        ${saveBtn(item, 'save')}
      </div>
      <div class="dc-body">
        <h3><a href="${href}">${UI.esc(item.title || 'Untitled role')}</a></h3>
        <p class="dc-co">${UI.esc(item.company || '—')}${item.city ? ' · ' + UI.esc(item.city) : ''}</p>
        <div class="dc-meta">${metaTags(item, true)}</div>
      </div>
      <div class="dc-foot">
        ${deadlineLine(item)}
        <a class="btn btn-dghost btn-sm" href="${href}" data-details="${UI.esc(item.id)}">View opportunity</a>
      </div>
    </article>`;
  }

  /** Two identical halves so the translateX(-50%) loop is seamless. */
  function darkStrip(items) {
    const half = `<div class="mq-half">${items.map(darkCard).join('')}</div>`;
    return half + `<div class="mq-half dup" aria-hidden="true">${items.map(darkCard).join('')}</div>`;
  }

  function marqueeEmpty(message) {
    return `<div class="mq-empty">${UI.esc(message)}</div>`;
  }

  function trim(text, n) {
    const s = String(text || '').trim();
    return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s;
  }

  /** Featured opportunity panel. */
  function featured(item) {
    const href = detailHref(item.id);
    return `<article class="feat">
      <div class="feat-media">${media(item)}</div>
      <div class="feat-body">
        <p class="eyebrow">${item.verified ? 'Featured · Verified' : 'Featured'}</p>
        <h3>${UI.esc(item.title || 'Untitled role')}</h3>
        <p class="feat-co">${UI.icon('building', 13)} ${UI.esc(item.company || '—')}${item.city ? ' · ' + UI.esc(item.city) : ''}${item.verified ? `<span class="vcheck">${UI.icon('check', 9)}</span>` : ''}</p>
        ${item.description ? `<p class="feat-desc">${UI.esc(trim(item.description, 240))}</p>` : ''}
        <div class="ic-meta">${metaTags(item, true)}</div>
        <div class="feat-actions">
          <a class="btn btn-primary" href="${href}" data-details="${UI.esc(item.id)}">View opportunity</a>
          ${saveBtn(item, 'feat-save')}
          ${deadlineLine(item)}
        </div>
      </div>
    </article>`;
  }

  /** "Closing soon" strip card. */
  function closeCard(item) {
    const days = UI.daysUntil(item.deadline);
    const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
    return `<a class="ccard" href="${detailHref(item.id)}" data-details="${UI.esc(item.id)}">
      <span class="days">${UI.esc(label)}</span>
      <b>${UI.esc(item.title || 'Untitled role')}</b>
      <span class="cc-co">${UI.esc([item.company, item.city].filter(Boolean).join(' · ') || '—')}</span>
    </a>`;
  }

  function initSaveHandling() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-save]');
      if (!btn) return;
      e.preventDefault();
      if (!Auth.profile) {
        UI.toast('Sign in to save internships');
        setTimeout(() => { window.location.href = `${H('signin.html')}?next=${encodeURIComponent(location.pathname + location.search)}`; }, 800);
        return;
      }
      const id = btn.dataset.save;
      btn.disabled = true;
      const res = await Saved.toggle(id);
      btn.disabled = false;
      if (!res.ok) { UI.toast('Could not update your saved list', 'error'); return; }
      const on = res.state === 'saved';
      document.querySelectorAll(`[data-save="${id}"]`).forEach((b) => {
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Remove from saved' : 'Save internship');
        b.innerHTML = UI.icon('bookmark', 15, on);
        b.classList.remove('pop');
        void b.offsetWidth;
        b.classList.add('pop');
      });
      document.dispatchEvent(new CustomEvent('saved:changed', { detail: { id, on } }));
    });
  }

  return {
    card, grid, row, rows, darkCard, darkStrip, marqueeEmpty,
    featured, closeCard, deadlineLine, metaTags, saveBtn,
    empty, error, skeleton, skeletonCells, detailHref, badges, media, initSaveHandling
  };
})();

/* ============================================================
   DETAIL MODAL · quick view for an internship card.
   Pages call DetailModal.init(() => items). Card controls stay
   real links to the full listing, so pages that never init the
   modal (or ids that aren't loaded) simply navigate.
   ============================================================ */

const DetailModal = (() => {
  let backdrop = null;
  let getItems = () => [];
  let currentId = null;
  let lastFocus = null;
  let wired = false;

  const q = (sel) => (backdrop ? backdrop.querySelector(sel) : null);

  function paintSave(on) {
    const btn = q('#dmSave');
    if (!btn) return;
    btn.textContent = on ? 'Saved ✓' : 'Save for later';
    btn.classList.toggle('btn-primary', on);
    btn.classList.toggle('btn-ghost', !on);
    btn.setAttribute('aria-pressed', String(on));
  }

  function build() {
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="dmTitle">
        <button type="button" class="dm-x" data-dm-close aria-label="Close">${UI.icon('x', 16)}</button>
        <div class="dm-media" id="dmMedia"></div>
        <div class="dm-body">
          <div class="dm-badges" id="dmBadges"></div>
          <h3 class="modal-title" id="dmTitle"></h3>
          <p class="dm-company" id="dmCompany"></p>
          <div class="dm-meta" id="dmMeta"></div>
          <p class="dm-desc" id="dmDesc"></p>
          <p class="dm-note">InternHub is a discovery directory — applications happen on the company's own website.</p>
          <div class="modal-actions dm-actions">
            <a class="dm-full" id="dmFull" href="#">Full listing ${UI.icon('arrow-right', 13)}</a>
            <button type="button" class="btn btn-ghost" id="dmSave" aria-pressed="false">Save for later</button>
            <a class="btn btn-primary" id="dmApply" href="#" target="_blank" rel="noopener">Apply</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('[data-dm-close]')) close();
    });

    backdrop.addEventListener('click', async (e) => {
      if (!e.target.closest('#dmSave') || !currentId) return;
      const btn = q('#dmSave');
      btn.disabled = true;
      const res = await Saved.toggle(currentId);
      btn.disabled = false;
      if (!res.ok) { UI.toast('Could not update your saved list', 'error'); return; }
      const on = res.state === 'saved';
      paintSave(on);
      document.querySelectorAll(`[data-save="${currentId}"]`).forEach((b) => {
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Remove from saved' : 'Save internship');
        b.innerHTML = UI.icon('bookmark', 15, on);
        b.classList.remove('pop');
        void b.offsetWidth;
        b.classList.add('pop');
      });
      UI.toast(on ? "Saved — apply later from the company's site." : 'Removed from saved');
      document.dispatchEvent(new CustomEvent('saved:changed', { detail: { id: currentId, on } }));
    });

    backdrop.addEventListener('click', (e) => {
      const apply = e.target.closest('#dmApply');
      if (apply && !apply.hidden && currentId) Internships.bump(currentId, 'clicks');
    });
    return backdrop;
  }

  function paintMedia(item) {
    const box = q('#dmMedia');
    box.innerHTML = `<div class="ic-fallback">${UI.esc(UI.initials(item.company || 'InternHub'))}</div>`;
    const url = UI.safeUrl(item.image);
    if (!url) return;
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    box.appendChild(img);
  }

  function paintMeta(item) {
    const dl = UI.deadlineInfo(item);
    const bits = [
      item.field ? UI.icon('briefcase', 12) + UI.esc(item.field) : '',
      item.duration ? UI.icon('clock', 12) + UI.esc(item.duration) : '',
      item.workMode ? UI.icon('globe', 12) + UI.esc(item.workMode) : '',
      item.stipend ? UI.icon('sparkles', 12) + UI.esc(item.stipend) : '',
      dl.label ? UI.icon('clock', 12) + UI.esc(dl.label) : ''
    ].filter(Boolean);
    q('#dmMeta').innerHTML = bits.map((b) => `<span>${b}</span>`).join('');
  }

  function open(id) {
    const item = getItems().find((x) => String(x.id) === String(id));
    if (!item) return;
    currentId = item.id;
    lastFocus = document.activeElement;
    build();

    paintMedia(item);
    q('#dmBadges').innerHTML = Rows.badges(item);
    q('#dmTitle').textContent = item.title || 'Untitled role';
    q('#dmCompany').textContent = [item.company, item.city].filter(Boolean).join(' · ') || '—';
    paintMeta(item);

    const desc = q('#dmDesc');
    desc.textContent = item.description || '';
    desc.hidden = !item.description;

    const full = q('#dmFull');
    const apply = q('#dmApply');
    const ext = UI.safeUrl(item.applicationUrl);
    full.href = Rows.detailHref(item.id);
    full.classList.toggle('btn', !ext);
    full.classList.toggle('btn-primary', !ext);
    apply.href = ext || '#';
    apply.hidden = !ext;

    const save = q('#dmSave');
    save.hidden = !Auth.profile;
    paintSave(Saved.has(item.id));

    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    q('[data-dm-close]')?.focus();
  }

  function close() {
    if (!backdrop || !backdrop.classList.contains('is-open')) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    currentId = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function init(itemsGetter) {
    if (typeof itemsGetter === 'function') getItems = itemsGetter;
    if (wired) return;
    wired = true;
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-details]');
      if (!trigger) return;
      const known = getItems().some((x) => String(x.id) === String(trigger.dataset.details));
      if (!known) return;                      // nothing to show — follow the link
      e.preventDefault();
      open(trigger.dataset.details);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  return { init, open, close };
})();
