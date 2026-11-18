/**
 * columns.js - one registry of member columns, shared by the members table, the course roster and the print sheet.
 */
import { getGroup, ageOf, pendingOf } from './store.js';
import { esc, groupTag } from './ui.js';

const yesNo = (v) => (v === true ? 'نعم' : v === false ? 'لا' : '');
const fmtUpdated = (m) => (m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('ar-EG-u-nu-latn') : '');
const groupNames = (m) => m.groups.map((id) => (getGroup(id) || {}).name).filter(Boolean);

/** key, Arabic label, plain-text getter, optional html renderer (screen only), numeric/ltr hint. */
export const COLS = [
  { key: 'groups', label: 'المجموعات', text: (m) => groupNames(m).join(' + '), html: (m) => `<div class="tags">${m.groups.map(getGroup).filter(Boolean).map(groupTag).join('')}</div>` },
  { key: 'age', label: 'السن', text: (m) => ageOf(m.dob) ?? '', num: true },
  { key: 'dob', label: 'تاريخ الميلاد', text: (m) => m.dob, num: true },
  { key: 'gender', label: 'النوع', text: (m) => (m.gender === 'Female' ? 'أنثى' : 'ذكر') },
  { key: 'married', label: 'الحالة الاجتماعية', text: (m) => (m.isMarried ? 'متزوج' : 'أعزب') },
  { key: 'phone', label: 'الهاتف', text: (m) => m.phone, num: true },
  { key: 'fatherPhone', label: 'هاتف الأب', text: (m) => m.fatherPhone, num: true },
  { key: 'motherPhone', label: 'هاتف الأم', text: (m) => m.motherPhone, num: true },
  { key: 'education', label: 'المؤهل / الدراسة', text: (m) => m.education },
  { key: 'serviceType', label: 'نوع الخدمة', text: (m) => m.serviceType },
  { key: 'withFamily', label: 'مع الأسرة', text: (m) => yesNo(m.withFamily) },
  { key: 'notes', label: 'ملاحظات', text: (m) => m.notes },
  { key: 'updatedAt', label: 'آخر تحديث', text: fmtUpdated, num: true },
];
export const COL = Object.fromEntries(COLS.map((c) => [c.key, c]));

export const colText = (key, m) => String(COL[key].text(m) ?? '');
export const colCell = (key, m) => {
  const c = COL[key];
  if (c.html) return c.html(m);
  const t = String(c.text(m) ?? '');
  if (!t) return '<span class="muted">—</span>';
  return c.num ? `<span class="phone num">${esc(t)}</span>` : esc(t);
};

/** Badge + discard button shown next to a person's name in any row, when they have unconfirmed changes. */
export function pendTag(m) {
  const pd = pendingOf(m);
  if (!pd) return '';
  return `<span class="pend-badge">${pd === 'new' ? 'جديد · غير مؤكد' : 'تعديل معلّق'}</span><button type="button" class="btn sm quiet pend-undo" data-discard="${esc(m.id)}" title="تجاهل تعديلات ${esc(m.name)}">${pd === 'new' ? 'حذف' : 'تجاهل التعديل'}</button>`;
}

/* ----- remembered choice of visible columns (a display preference only, not member data) ----- */
const DEFAULT_VISIBLE = ['groups', 'age', 'phone'];
export function visibleColumns(scope = 'members') {
  try {
    const raw = JSON.parse(localStorage.getItem('church_cols_' + scope));
    if (Array.isArray(raw)) return raw.filter((k) => COL[k]);
  } catch (e) { /* ignore */ }
  return [...DEFAULT_VISIBLE];
}
export function setVisibleColumns(keys, scope = 'members') {
  try { localStorage.setItem('church_cols_' + scope, JSON.stringify(keys)); } catch (e) { /* ignore */ }
}
export const resetVisibleColumns = (scope = 'members') => {
  try { localStorage.removeItem('church_cols_' + scope); } catch (e) { /* ignore */ }
  return [...DEFAULT_VISIBLE];
};
