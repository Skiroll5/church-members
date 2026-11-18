/**
 * ui.js - shared UI helpers: DOM shortcuts, icons, modal, popover, toast, small HTML fragments, file download.
 */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const collator = new Intl.Collator('ar');
export const byName = (a, b) => collator.compare(a.name, b.name);
export const norm = (s) => String(s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
export const pctClass = (p) => (p == null ? '' : p >= 75 ? 'hi' : p >= 50 ? 'mid' : 'low');
export const pctText = (p) => (p == null ? '—' : p + '%');

export const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function fmtDate(iso, withYear) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const yr = withYear || y !== new Date().getFullYear() ? '/' + y : '';
  return `${WEEKDAYS[dt.getDay()]} ${d}/${m}${yr}`;
}
export const shortDate = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${d}/${m}`; };

/* ---------- icons (stroke set, 24px grid) ---------- */
export const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  edit: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chevron: '<path d="m15 18-6-6 6-6"/>',
  chevronR: '<path d="m9 18 6-6-6-6"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  up: '<path d="m5 12 7-7 7 7M12 19V5"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
};
export const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- toast / modal / popover ---------- */
export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('#toast-root').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

export function openModal({ title, body, foot = '', wide = false, dismissible = true }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h2>${esc(title)}</h2>${dismissible ? `<button class="btn quiet icon sm" data-close aria-label="إغلاق">${ic('x')}</button>` : ''}</div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  ov.dataset.dismissible = dismissible ? '1' : '';
  $('#modal-root').appendChild(ov);
  const close = () => ov.remove();
  if (dismissible) ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  $$('[data-close]', ov).forEach((b) => b.addEventListener('click', close));
  const first = $('input[type=text],input[type=search]', ov);
  if (first) setTimeout(() => first.focus(), 30);
  return { el: ov, close };
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const pop = $('.popover');
  if (pop) { pop.remove(); return; }
  const m = $$('#modal-root .overlay').pop();
  if (m && m.dataset.dismissible) m.remove();
});

export function confirmBox(message, okLabel = 'تأكيد', danger = true) {
  return new Promise((resolve) => {
    const m = openModal({
      title: 'تأكيد', body: `<p style="font-size:14.5px">${message}</p>`,
      foot: `<button class="btn" data-close>إلغاء</button><button class="btn ${danger ? 'danger solid' : 'primary'}" id="ok">${esc(okLabel)}</button>`,
    });
    let done = false;
    $('#ok', m.el).addEventListener('click', () => { done = true; m.close(); resolve(true); });
    new MutationObserver(() => { if (!m.el.isConnected && !done) { done = true; resolve(false); } })
      .observe($('#modal-root'), { childList: true });
  });
}

/** A small floating panel anchored under a button; closes on outside click. */
export function popover(anchor, html) {
  $$('.popover').forEach((p) => p.remove());
  const pop = document.createElement('div');
  pop.className = 'popover';
  pop.innerHTML = html;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  // anchor the panel's end edge (right in RTL) to the button, clamp inside the viewport
  let left = document.dir === 'rtl' || document.documentElement.dir === 'rtl' ? r.right - w : r.left;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  pop.style.left = left + 'px';
  pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 80) + 'px';
  const off = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) { pop.remove(); document.removeEventListener('mousedown', off, true); } };
  setTimeout(() => document.addEventListener('mousedown', off, true), 0);
  return pop;
}

/* ---------- html fragments ---------- */
export const groupTag = (g) => `<span class="tag"><span class="dot c-${esc(g.color)}"></span>${esc(g.name)}</span>`;
export const bar = (p) => `<div class="bar ${pctClass(p) === 'mid' ? 'mid' : pctClass(p) === 'low' ? 'low' : ''}"><i style="width:${p || 0}%"></i></div>`;
export const meter = (p) => `<div class="meter">${bar(p)}<span class="pct ${pctClass(p)}">${pctText(p)}</span></div>`;
export const emptyState = (icon, title, text, btn = '') => `<div class="empty panel">${ic(icon)}<h3>${esc(title)}</h3><div>${esc(text)}</div>${btn}</div>`;
export const head = ({ title, sub = '', acts = '', crumbs = '' }) => `${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}
  <div class="page-head"><div class="ttl"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="acts">${acts}</div></div>`;
export const crumb = (items) => items.map(([label, href]) => (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join(ic('chevron'));

/* ---------- files ---------- */
export function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function downloadCsv(name, rows) {
  const cell = (c) => `"${String(c ?? '').replace(/"/g, '""')}"`;
  download(name, '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n'), 'text/csv');
}

/* ---------- text direction follows the typed content (Latin text left-to-right, Arabic right-to-left) ---------- */
const AUTO_DIR = 'input[type=text],input[type=search],textarea';
const setAutoDir = (root) => {
  if (root.matches && root.matches(AUTO_DIR) && !root.hasAttribute('dir')) root.setAttribute('dir', 'auto');
  if (root.querySelectorAll) root.querySelectorAll(AUTO_DIR).forEach((i) => { if (!i.hasAttribute('dir')) i.setAttribute('dir', 'auto'); });
};
setAutoDir(document);
new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) setAutoDir(n); })))
  .observe(document.documentElement, { childList: true, subtree: true });
