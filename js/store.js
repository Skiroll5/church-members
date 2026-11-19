/**
 * store.js - data model, autosave persistence, and attendance statistics.
 *
 * Data shape (church_data.json):
 *   members:  [{ id, name, gender, isMarried, dob, phone, fatherPhone, motherPhone,
 *                education, serviceType, withFamily, notes, groups:[groupId], createdAt, updatedAt }]
 *   groups:   [{ id, name, type: 'group' | 'course', color }]
 *   sessions: [{ id, groupId, date: 'YYYY-MM-DD', title, present:[memberId] }]
 */
export const COLORS = ['indigo', 'emerald', 'amber', 'rose', 'sky', 'purple', 'teal', 'orange'];

/*
 * Persistence model
 *  - server mode (local node server): every change is written straight to church_data.json on disk.
 *  - local mode (no server, e.g. the public page): browser storage is ONLY a fast-access cache.
 *      LS_CACHE = last confirmed copy (downloaded or imported file)
 *      LS_DRAFT = unconfirmed edits. A draft is never "saved": the admin must download it or discard it.
 */
const LS_CACHE = 'church_cache_v4';
const LS_DRAFT = 'church_draft_v4';
const LS_OLD = 'church_data_v3'; // earlier builds saved straight into the browser; treated as a draft

export const db = { members: [], groups: [], sessions: [] };
// state: saved | saving | error (server mode) ; dirty: unconfirmed edits exist (local mode)
export const status = { mode: 'local', state: 'saved', dirty: false, pendingDraft: null };

const listeners = new Set();
const statusListeners = new Set();
export const onChange = (fn) => listeners.add(fn);
export const onStatus = (fn) => statusListeners.add(fn);
const emitStatus = () => statusListeners.forEach((f) => f(status));

export const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- loading & migration ---------- */

const readLS = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };

export async function load() {
  let data = null;
  try {
    const r = await fetch('/api/data', { cache: 'no-store' });
    if (r.ok) { data = await r.json(); status.mode = 'server'; }
  } catch (e) { /* static hosting: local mode */ }

  if (status.mode === 'server') {
    replaceAll(data);
    // a freshly migrated database should be written right away
    if (data && (Array.isArray(data) || data.legacyMembers)) scheduleSave();
    return;
  }

  replaceAll(readLS(LS_CACHE));
  let draft = readLS(LS_DRAFT);
  if (!draft) {
    const old = readLS(LS_OLD);
    if (old) draft = { savedAt: null, data: old };
  }
  if (draft && draft.data && (draft.data.members || Array.isArray(draft.data))) status.pendingDraft = draft;
}

/** Keep the pending draft's edits and continue working on them (still unconfirmed). */
export function adoptDraft() {
  const d = status.pendingDraft;
  if (!d) return;
  replaceAll(d.data);
  status.pendingDraft = null;
  status.dirty = true;
  persistDraft();
  emitStatus();
}

/** Throw away unconfirmed edits and go back to the last confirmed copy. */
export function discardDraft() {
  baseMap = null;
  try { localStorage.removeItem(LS_DRAFT); localStorage.removeItem(LS_OLD); } catch (e) { /* ignore */ }
  status.pendingDraft = null;
  status.dirty = false;
  replaceAll(readLS(LS_CACHE));
  emitStatus();
}

/** The current data has just been written to a file (or came from one): it is now the confirmed copy. */
export function markConfirmed() {
  baseMap = null;
  try { localStorage.setItem(LS_CACHE, exportJson()); localStorage.removeItem(LS_DRAFT); localStorage.removeItem(LS_OLD); } catch (e) { /* ignore */ }
  status.dirty = false;
  status.pendingDraft = null;
  status.state = 'saved';
  emitStatus();
}

/** Load data from a file the admin chose. */
export function importData(data) {
  replaceAll(data);
  if (status.mode === 'server') saveNow(); else markConfirmed();
}

function persistDraft() {
  try { localStorage.setItem(LS_DRAFT, JSON.stringify({ savedAt: new Date().toISOString(), data: JSON.parse(exportJson()) })); } catch (e) { /* quota */ }
}

export function replaceAll(data) {
  const norm = normalize(data);
  db.members = norm.members;
  db.groups = norm.groups;
  db.sessions = norm.sessions;
  emit();
}

function normalize(data) {
  const legacy = Array.isArray(data) ? data : (data && data.legacyMembers) || null;
  if (legacy) return migrateLegacy(legacy);
  const d = data || {};
  const groups = (d.groups || []).map((g, i) => ({
    id: g.id || uid('g'), name: g.name || '', type: g.type === 'course' ? 'course' : 'group',
    color: g.color || COLORS[i % COLORS.length],
  }));
  const members = (d.members || []).map(cleanMember);
  const sessions = (d.sessions || []).map((s) => ({
    id: s.id || uid('s'), groupId: s.groupId, date: s.date || today(), title: s.title || '',
    present: Array.isArray(s.present) ? s.present : [],
  }));
  return { members, groups, sessions };
}

function cleanMember(m) {
  return {
    id: m.id || uid('m'), name: m.name || '', gender: m.gender === 'Female' ? 'Female' : 'Male',
    isMarried: !!m.isMarried, dob: m.dob || '', phone: m.phone || '', fatherPhone: m.fatherPhone || '',
    motherPhone: m.motherPhone || '', education: m.education || '', serviceType: m.serviceType || '',
    withFamily: typeof m.withFamily === 'boolean' ? m.withFamily : null, notes: m.notes || '',
    groups: Array.isArray(m.groups) ? m.groups : [], createdAt: m.createdAt || new Date().toISOString(),
    updatedAt: m.updatedAt || m.lastUpdated || m.createdAt || new Date().toISOString(),
  };
}

function migrateLegacy(list) {
  const byName = new Map();
  const groups = [];
  const gid = (name) => {
    name = String(name).trim();
    if (!byName.has(name)) {
      const g = {
        id: uid('g'), name, type: name.startsWith('كورس') ? 'course' : 'group',
        color: COLORS[groups.length % COLORS.length],
      };
      byName.set(name, g);
      groups.push(g);
    }
    return byName.get(name).id;
  };
  const members = list.map((m) => cleanMember({ ...m, groups: (m.groups || []).filter(Boolean).map(gid) }));
  return { members, groups, sessions: [] };
}

/* ---------- per-member pending changes (local mode: edits vs the last confirmed copy) ---------- */

const memberSig = (m) => JSON.stringify({ ...m, updatedAt: 0, groups: [...m.groups].sort() });
/** Confirmed copy of every member, read lazily from the confirmed cache; reset whenever that copy changes. */
let baseMap = null;
const baseline = () => {
  if (!baseMap) baseMap = new Map(normalize(readLS(LS_CACHE)).members.map((m) => [m.id, m]));
  return baseMap;
};

/** 'new' | 'edited' when this member has unconfirmed changes, otherwise null (always null in server mode). */
export function pendingOf(m) {
  if (status.mode !== 'local' || !status.dirty) return null;
  const base = baseline().get(m.id);
  if (!base) return 'new';
  return memberSig(base) === memberSig(m) ? null : 'edited';
}

/** Drop one member's unconfirmed changes: a new member is removed, an edited one goes back to the confirmed copy. */
export function discardMemberChanges(id) {
  const m = getMember(id);
  if (!m) return;
  const base = baseline().get(id);
  if (!base) { deleteMember(id); return; }
  Object.assign(m, JSON.parse(JSON.stringify(base)));
  commit();
}

/* ---------- persistence (autosave) ---------- */

let timer = null;
function emit() { listeners.forEach((f) => f()); }

export function commit() {
  emit();
  scheduleSave();
}

function scheduleSave() {
  if (status.mode === 'local') status.dirty = true;
  status.state = 'saving';
  emitStatus();
  clearTimeout(timer);
  timer = setTimeout(saveNow, 400);
}

export async function saveNow() {
  clearTimeout(timer);
  try {
    if (status.mode === 'server') {
      const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: exportJson() });
      if (!r.ok) throw new Error('save failed');
    } else {
      persistDraft(); // a draft only: not confirmed until downloaded
    }
    status.state = 'saved';
  } catch (e) {
    status.state = 'error';
  }
  emitStatus();
}

export function clearLocal() {
  baseMap = null;
  try { localStorage.removeItem(LS_CACHE); localStorage.removeItem(LS_DRAFT); localStorage.removeItem(LS_OLD); } catch (e) { /* ignore */ }
  status.dirty = false;
}

export function exportJson() {
  return JSON.stringify({ version: 3, members: db.members, groups: db.groups, sessions: db.sessions }, null, 2);
}

/* ---------- helpers ---------- */

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const getMember = (id) => db.members.find((m) => m.id === id);
export const getGroup = (id) => db.groups.find((g) => g.id === id);
export const getSession = (id) => db.sessions.find((s) => s.id === id);
export const isCourse = (g) => g && g.type === 'course';
export const rosterOf = (groupId) => db.members.filter((m) => m.groups.includes(groupId));
export const sessionsOf = (groupId) =>
  db.sessions.filter((s) => s.groupId === groupId).sort((a, b) => a.date.localeCompare(b.date));

export function parseDob(str) {
  const s = (str || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const day = +m[1] || 1, mon = (+m[2] || 1) - 1;
    return new Date(+m[3], mon, day);
  }
  if (/^\d{4}$/.test(s)) return new Date(+s, 0, 1);
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

/** Day / month / year of birth when the day and month are really known (otherwise null). */
export function birthdayOf(dob) {
  const t = (dob || '').trim();
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return +m[1] >= 1 && +m[2] >= 1 && +m[2] <= 12 ? { day: +m[1], month: +m[2], year: +m[3] } : null;
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? { day: +m[3], month: +m[2], year: +m[1] } : null;
}

export function ageOf(dob) {
  const d = parseDob(dob);
  if (!d) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}

/* ---------- mutations ---------- */

export function saveMember(data, id) {
  const now = new Date().toISOString();
  if (id) {
    const m = getMember(id);
    Object.assign(m, data, { updatedAt: now });
  } else {
    id = uid('m');
    db.members.unshift(cleanMember({ ...data, id, createdAt: now, updatedAt: now }));
  }
  commit();
  return id;
}

export function deleteMember(id) {
  db.members = db.members.filter((m) => m.id !== id);
  db.sessions.forEach((s) => { s.present = s.present.filter((x) => x !== id); });
  commit();
}

export function saveGroup(data, id) {
  if (id) Object.assign(getGroup(id), data);
  else {
    id = uid('g');
    db.groups.push({ id, name: data.name, type: data.type, color: data.color || COLORS[db.groups.length % COLORS.length] });
  }
  commit();
  return id;
}

/** Move a group up (-1) or down (1) among the groups of the same kind (course / plain group). */
export function moveGroup(id, dir) {
  const g = getGroup(id); if (!g) return;
  const same = db.groups.filter((x) => isCourse(x) === isCourse(g));
  const j = same.indexOf(g) + dir;
  if (j < 0 || j >= same.length) return;
  const a = db.groups.indexOf(g), b = db.groups.indexOf(same[j]);
  [db.groups[a], db.groups[b]] = [db.groups[b], db.groups[a]];
  commit();
}

export function deleteGroup(id) {
  db.groups = db.groups.filter((g) => g.id !== id);
  db.members.forEach((m) => { m.groups = m.groups.filter((x) => x !== id); });
  db.sessions = db.sessions.filter((s) => s.groupId !== id);
  commit();
}

export function setMembership(memberIds, groupId, add) {
  memberIds.forEach((id) => {
    const m = getMember(id);
    if (!m) return;
    const has = m.groups.includes(groupId);
    if (add && !has) m.groups.push(groupId);
    if (!add && has) m.groups = m.groups.filter((x) => x !== groupId);
  });
  commit();
}

export function createSession(groupId, date) {
  const s = { id: uid('s'), groupId, date: date || today(), title: '', present: [] };
  db.sessions.push(s);
  commit();
  return s;
}

export function deleteSession(id) {
  db.sessions = db.sessions.filter((s) => s.id !== id);
  commit();
}

/* ---------- statistics ---------- */

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

/** Per-course report: per-member attendance and per-session turnout. */
export function courseReport(groupId) {
  const roster = rosterOf(groupId);
  const sessions = sessionsOf(groupId);
  const rosterIds = new Set(roster.map((m) => m.id));
  const rows = roster.map((m) => {
    const attended = sessions.filter((s) => s.present.includes(m.id)).length;
    const last = [...sessions].reverse().find((s) => s.present.includes(m.id));
    return { member: m, attended, total: sessions.length, pct: pct(attended, sessions.length), lastDate: last ? last.date : null };
  });
  const perSession = sessions.map((s) => {
    const n = s.present.filter((id) => rosterIds.has(id)).length;
    return { session: s, present: n, outside: s.present.length - n, pct: pct(n, roster.length) };
  });
  const totalAtt = rows.reduce((a, r) => a + r.attended, 0);
  const avg = pct(totalAtt, roster.length * sessions.length);
  return { roster, sessions, rows, perSession, avg };
}

/** Attendance of one member in each course they belong to. */
export function memberReport(memberId) {
  const m = getMember(memberId);
  if (!m) return [];
  return m.groups
    .map(getGroup).filter(isCourse)
    .map((g) => {
      const sessions = sessionsOf(g.id);
      const attended = sessions.filter((s) => s.present.includes(memberId));
      return {
        group: g, total: sessions.length, attended: attended.length, pct: pct(attended.length, sessions.length),
        dots: sessions.slice(-10).map((s) => s.present.includes(memberId)),
      };
    });
}
