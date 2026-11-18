/**
 * app.js - screens and interactions.
 * Home, Courses & groups, Group detail (sessions / report / members), Attendance,
 * Members, Birthdays, Print & export, Data.
 */
import {
  db, COLORS, status, load, onChange, onStatus, commit, exportJson, clearLocal, saveNow,
  adoptDraft, discardDraft, markConfirmed, importData, replaceAll,
  today, getMember, getGroup, getSession, isCourse, rosterOf, sessionsOf, ageOf, birthdayOf,
  saveMember, deleteMember, saveGroup, deleteGroup, setMembership, createSession, deleteSession,
  courseReport, memberReport,
} from './store.js';
import {
  $, $$, esc, byName, norm, pctClass, pctText, fmtDate, shortDate, WEEKDAYS, MONTHS, ic, toast, openModal, confirmBox,
  popover, groupTag, bar, meter, emptyState, head, crumb, download, downloadCsv,
} from './ui.js';
import { COLS, colCell, visibleColumns, setVisibleColumns, resetVisibleColumns } from './columns.js';
import { viewPrint } from './print.js';

const view = $('#view');

const NAV = [
  ['home', 'الرئيسية', 'home', '#/'], ['groups', 'الكورسات والمجموعات', 'book', '#/groups'], ['members', 'الأعضاء', 'users', '#/members'],
  ['birthdays', 'أعياد الميلاد', 'gift', '#/birthdays'], ['print', 'طباعة وتصدير', 'printer', '#/print'], ['data', 'البيانات', 'database', '#/data'],
];
$('#nav-links').innerHTML = NAV.map(([k, label, icon, href]) => `<a href="${href}" data-nav="${k}">${ic(icon)}<span>${label}</span></a>`).join('');

/* ---------- reusable tables ---------- */
function memberTable(list, { cols, remove = null } = {}) {
  if (!list.length) return '<div class="empty">لا توجد نتائج</div>';
  cols = cols || visibleColumns('members');
  const label = (k) => COLS.find((c) => c.key === k).label;
  return `<div class="table-wrap"><table class="table members"><thead><tr><th>الاسم</th>${cols.map((k) => `<th>${esc(label(k))}</th>`).join('')}${remove ? '<th></th>' : ''}</tr></thead><tbody>
    ${list.map((m) => `<tr data-member="${m.id}" tabindex="0"><td><div class="who"><span class="avatar">${esc((m.name || '؟').trim().charAt(0).toUpperCase())}</span><div class="nm">${esc(m.name)}</div></div></td>
      ${cols.map((k) => `<td>${colCell(k, m)}</td>`).join('')}
      ${remove ? `<td class="shrink end"><button class="btn quiet icon sm" data-remove="${m.id}" title="${esc(remove)}" aria-label="${esc(remove)}">${ic('x', 'sm')}</button></td>` : ''}</tr>`).join('')}
    </tbody></table></div>`;
}

/** "Columns" button: lets the admin hide/show any column of the members table. */
function colButton() {
  return `<button class="btn" id="cols-btn">${ic('columns')}الأعمدة</button>`;
}
function bindColButton(root, onChange) {
  const btn = $('#cols-btn', root);
  if (!btn) return;
  btn.onclick = (e) => {
    e.stopPropagation();
    const draw = () => {
      const vis = new Set(visibleColumns('members'));
      return `<div class="pop-title">الأعمدة الظاهرة</div>
        <label class="chk locked"><input type="checkbox" checked disabled> الاسم</label>
        ${COLS.map((c) => `<label class="chk"><input type="checkbox" data-k="${c.key}" ${vis.has(c.key) ? 'checked' : ''}> ${esc(c.label)}</label>`).join('')}
        <div class="pop-foot"><button class="btn sm quiet" id="cols-reset">إعادة الضبط</button></div>`;
    };
    const pop = popover(btn, draw());
    pop.addEventListener('change', (ev) => {
      const k = ev.target.dataset.k; if (!k) return;
      const next = COLS.map((c) => c.key).filter((x) => (x === k ? ev.target.checked : $(`[data-k="${x}"]`, pop).checked));
      setVisibleColumns(next, 'members');
      onChange();
    });
    pop.addEventListener('click', (ev) => {
      if (ev.target.id !== 'cols-reset') return;
      resetVisibleColumns('members');
      pop.innerHTML = draw();
      onChange();
    });
  };
}

function courseTable(groups) {
  const withAvg = groups.some(isCourse);
  return `<div class="panel table-wrap"><table class="table"><thead><tr><th>الاسم</th><th class="hide-sm">الأعضاء</th>${withAvg ? '<th class="hide-sm">الجلسات</th><th class="hide-sm">آخر جلسة</th><th class="end">متوسط الحضور</th>' : ''}</tr></thead><tbody>
    ${groups.map((g) => {
    const rep = courseReport(g.id);
    const last = rep.sessions.length ? rep.sessions[rep.sessions.length - 1].date : null;
    return `<tr data-href="#/group/${g.id}"><td><div class="who"><span class="dot c-${esc(g.color)}"></span><div><div class="nm">${esc(g.name)}</div>
      <div class="muted small show-sm">${rep.roster.length} عضو${isCourse(g) ? ` · ${rep.sessions.length} جلسة` : ''}</div></div></div></td>
      <td class="hide-sm num">${rep.roster.length}</td>
      ${withAvg ? `<td class="hide-sm num">${isCourse(g) ? rep.sessions.length : ''}</td><td class="hide-sm muted">${last ? fmtDate(last) : '—'}</td>
      <td class="end">${isCourse(g) ? meter(rep.avg) : ''}</td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}

/* ---------- routing ---------- */
let keepOnChange = false; // self-updating views (attendance) skip the global re-render
let memberQuery = '';
let memberGroupFilter = 'all';

function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
  return { name: parts[0] || 'home', a: parts[1], b: parts[2] };
}
export function go(path) { location.hash = '#/' + path; }

function render() {
  const r = route();
  keepOnChange = false;
  $$('[data-nav]').forEach((a) => {
    const n = a.dataset.nav;
    a.classList.toggle('active', n === r.name || (n === 'groups' && (r.name === 'group' || r.name === 'session')));
  });
  const ps = $('#page-style'); if (ps && r.name !== 'print') ps.remove();
  const fn = {
    home: viewHome, groups: viewGroups, group: viewGroup, session: viewSession, members: viewMembers,
    birthdays: viewBirthdays, print: () => viewPrint(view), data: viewData,
  }[r.name] || viewHome;
  const scroll = window.scrollY;
  fn(r);
  if (r.name !== 'session') window.scrollTo(0, scroll);
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
onChange(() => { if (!keepOnChange) render(); });

/* ---------- drafts: nothing is "saved" until it is downloaded as a file ---------- */
function downloadLatest() {
  download(`church_data_${today()}.json`, exportJson(), 'application/json');
  if (status.mode === 'local') markConfirmed();
  toast('تم تحميل الملف — احتفظ به في مكان آمن');
}

async function discardFlow() {
  if (await confirmBox('تجاهل كل التعديلات غير المؤكدة والعودة لآخر نسخة مؤكدة؟ لا يمكن التراجع عن ذلك.', 'تجاهل المسودة')) {
    discardDraft();
    render();
    toast('تم تجاهل المسودة');
  }
}

function draftPrompt() {
  const d = status.pendingDraft;
  const data = d.data || {};
  const members = Array.isArray(data) ? data.length : (data.members || data.legacyMembers || []).length;
  const sessions = Array.isArray(data) ? 0 : (data.sessions || []).length;
  const when = d.savedAt ? new Date(d.savedAt).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'full', timeStyle: 'short' }) : 'غير معروف';
  const m = openModal({
    title: 'وُجدت مسودة غير مؤكدة', dismissible: false,
    body: `<div class="notice" style="margin-top:0">${ic('alert')}<div>هذه تعديلات لم يتم تحميلها كملف، لذلك <b>لم تُحفظ بشكل مؤكد</b>. المتصفح للوصول السريع فقط وليس مكاناً للحفظ.</div></div>
      <p class="muted" style="margin:12px 0 0">آخر تعديل: <b>${esc(when)}</b><br>المحتوى: ${members} عضو، ${sessions} جلسة حضور</p>
      <p style="margin:12px 0 0">اختر: حمّل المسودة كملف لتصبح نسخة مؤكدة، أو تجاهلها.</p>`,
    foot: `<button class="btn danger" id="d-discard">تجاهل المسودة</button><span class="sp"></span><button class="btn primary" id="d-dl">${ic('download')}تحميل المسودة كملف</button>`,
  });
  $('#d-dl', m.el).onclick = () => { adoptDraft(); downloadLatest(); m.close(); render(); };
  $('#d-discard', m.el).onclick = async () => {
    if (await confirmBox('تجاهل المسودة نهائياً؟ ستُفقد هذه التعديلات.', 'تجاهل')) { discardDraft(); m.close(); render(); toast('تم تجاهل المسودة'); }
  };
}

// While there are unconfirmed edits, keep reminding the admin to download the latest file.
setInterval(() => {
  if (status.mode !== 'local' || !status.dirty || $('#modal-root .overlay')) return;
  const m = openModal({
    title: 'تذكير بتحميل أحدث نسخة',
    body: `<p>لديك تعديلات غير مؤكدة (مسودة) محفوظة مؤقتاً في هذا المتصفح فقط. حمّل أحدث نسخة الآن حتى لا تضيع.</p>`,
    foot: `<button class="btn" data-close>لاحقاً</button><button class="btn primary" id="r-dl">${ic('download')}تحميل الآن</button>`,
  });
  $('#r-dl', m.el).onclick = () => { downloadLatest(); m.close(); };
}, 10 * 60 * 1000);

window.addEventListener('beforeunload', (e) => {
  if (status.mode === 'local' && status.dirty) { e.preventDefault(); e.returnValue = ''; }
  if (status.state === 'saving') saveNow();
});

function paintStatus() {
  const el = $('#save-status');
  const banner = $('#draft-banner');
  let cls = 'save-status', txt;
  if (status.mode === 'server') {
    txt = status.state === 'saving' ? 'جارٍ الحفظ…' : status.state === 'error' ? 'تعذّر الحفظ — حمّل نسخة من صفحة «البيانات»' : 'تم الحفظ على هذا الجهاز';
    if (status.state === 'saving') cls += ' saving';
    if (status.state === 'error') cls += ' err';
  } else if (status.dirty) { txt = 'مسودة غير مؤكدة — حمّل نسخة'; cls += ' draft'; }
  else txt = 'لا توجد تعديلات غير محمّلة';
  el.className = cls;
  el.textContent = txt;
  banner.classList.toggle('hidden', !(status.mode === 'local' && status.dirty));
}
onStatus(paintStatus);

/* ---------- birthdays ---------- */
function upcomingBirthdays(days) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const out = [];
  db.members.forEach((m) => {
    const bd = birthdayOf(m.dob);
    if (!bd) return;
    let d = new Date(t0.getFullYear(), bd.month - 1, bd.day);
    if (d < t0) d = new Date(t0.getFullYear() + 1, bd.month - 1, bd.day);
    const diff = Math.round((d - t0) / 864e5);
    if (diff <= days) out.push({ m, bd, date: d, diff, turning: bd.year > 1900 ? d.getFullYear() - bd.year : null });
  });
  return out.sort((a, b) => a.diff - b.diff || byName(a.m, b.m));
}
const whenLabel = (diff) => (diff === 0 ? 'اليوم' : diff === 1 ? 'غداً' : diff === 2 ? 'بعد يومين' : `بعد ${diff} يوماً`);

let bMonth = null;
let bGroup = 'all';
function viewBirthdays() {
  const now = new Date();
  if (bMonth == null) bMonth = now.getMonth() + 1;
  const withBd = db.members.filter((m) => (bGroup === 'all' || m.groups.includes(bGroup)) && birthdayOf(m.dob));
  const missing = db.members.filter((m) => (bGroup === 'all' || m.groups.includes(bGroup)) && !birthdayOf(m.dob)).length;
  const list = withBd.filter((m) => birthdayOf(m.dob).month === bMonth).sort((a, b) => birthdayOf(a.dob).day - birthdayOf(b.dob).day || byName(a, b));
  const year = now.getFullYear();
  const isThisMonth = bMonth === now.getMonth() + 1;

  view.innerHTML = `${head({ title: 'أعياد الميلاد', sub: `${MONTHS[bMonth - 1]} · ${list.length} عضو` })}
    <div class="toolbar"><div class="months" id="months">${MONTHS.map((n, i) => {
    const c = withBd.filter((m) => birthdayOf(m.dob).month === i + 1).length;
    return `<button class="mon ${bMonth === i + 1 ? 'on' : ''} ${i + 1 === now.getMonth() + 1 ? 'cur' : ''}" data-m="${i + 1}">${n}<small class="num">${c}</small></button>`;
  }).join('')}</div></div>
    <div class="toolbar"><select id="b-group" aria-label="تصفية حسب المجموعة"><option value="all">كل الأعضاء</option>${db.groups.map((g) => `<option value="${g.id}" ${bGroup === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
      ${missing ? `<span class="muted small">${missing} عضو بدون تاريخ ميلاد كامل لا يظهرون هنا</span>` : ''}</div>
    ${list.length ? `<div class="panel table-wrap"><table class="table"><thead><tr><th>اليوم</th><th>الاسم</th><th class="hide-sm">يكمل</th><th class="hide-sm">المجموعات</th><th class="end"></th></tr></thead><tbody>
      ${list.map((m) => {
    const bd = birthdayOf(m.dob);
    const date = new Date(year, bMonth - 1, bd.day);
    const diff = Math.round((date - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    const turning = bd.year > 1900 ? year - bd.year : null;
    const badge = isThisMonth ? (diff === 0 ? '<span class="tag today">اليوم</span>' : diff > 0 ? `<span class="muted small">${whenLabel(diff)}</span>` : '') : '';
    return `<tr data-member="${m.id}"><td class="shrink"><div class="bday"><b class="num">${bd.day}</b><span>${WEEKDAYS[date.getDay()]}</span></div></td>
        <td><div class="who"><span class="avatar">${esc(m.name.charAt(0).toUpperCase())}</span><div><div class="nm">${esc(m.name)}</div><div class="muted small show-sm">${turning ? `يكمل ${turning} سنة` : ''}</div></div></div></td>
        <td class="hide-sm num">${turning ? `${turning} سنة` : '—'}</td>
        <td class="hide-sm"><div class="tags">${m.groups.map(getGroup).filter(Boolean).slice(0, 3).map(groupTag).join('')}</div></td><td class="end">${badge}</td></tr>`;
  }).join('')}</tbody></table></div>` : emptyState('gift', 'لا توجد أعياد ميلاد في هذا الشهر', 'اختر شهراً آخر، أو أضف تواريخ الميلاد في بيانات الأعضاء.')}`;
  $('#months').onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { bMonth = +b.dataset.m; viewBirthdays(); } };
  const cur = $('#months .mon.on'); if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#b-group').onchange = (e) => { bGroup = e.target.value; viewBirthdays(); };
  bindCommon(view);
}

/* ---------- HOME ---------- */
function viewHome() {
  const courses = db.groups.filter(isCourse);
  const atRisk = [];
  courses.forEach((g) => {
    const rep = courseReport(g.id);
    if (rep.sessions.length < 3) return;
    rep.rows.filter((r) => r.pct != null && r.pct < 50).forEach((r) => atRisk.push({ ...r, group: g }));
  });
  atRisk.sort((a, b) => a.pct - b.pct);
  const bdays = upcomingBirthdays(14);
  const noData = !db.members.length && !db.groups.length;

  view.innerHTML = `${head({
    title: 'الرئيسية', sub: fmtDate(today(), true),
    acts: `<button class="btn" id="quick-member">${ic('userPlus')}عضو جديد</button><button class="btn primary" id="quick-att">${ic('clipboard')}تسجيل حضور</button>`,
  })}
    ${noData && status.mode === 'local' ? `<div class="panel pad" style="margin-bottom:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:220px"><b>لا توجد بيانات محمّلة</b><p class="muted">استورد ملف البيانات الذي حفظته سابقاً، أو ابدأ بإضافة الأعضاء.</p></div>
      <button class="btn primary" id="home-import">${ic('upload')}استيراد ملف البيانات</button><input type="file" id="home-file" accept=".json" class="hidden"></div>` : ''}
    <div class="panel stats">
      <div class="stat"><span>الأعضاء</span><b>${db.members.length}</b></div>
      <div class="stat"><span>الكورسات</span><b>${courses.length}</b></div>
      <div class="stat"><span>المجموعات</span><b>${db.groups.length - courses.length}</b></div>
      <div class="stat"><span>جلسات مسجّلة</span><b>${db.sessions.length}</b></div>
    </div>
    <div class="h2">الكورسات <span class="sp"></span><a class="btn sm quiet" href="#/groups">عرض الكل</a></div>
    ${courses.length ? courseTable(courses) : emptyState('book', 'لا توجد كورسات بعد', 'أنشئ كورساً (مثل: كورس المشورة) لتبدأ بتسجيل الحضور.', `<button class="btn primary" data-new-group>${ic('plus')}كورس جديد</button>`)}
    <div class="h2">أعياد الميلاد القادمة <small>خلال 14 يوماً</small><span class="sp"></span><a class="btn sm quiet" href="#/birthdays">عرض الكل</a></div>
    ${bdays.length ? `<div class="panel table-wrap"><table class="table"><tbody>
      ${bdays.slice(0, 6).map((b) => `<tr data-member="${b.m.id}"><td class="shrink"><div class="bday"><b class="num">${b.bd.day}</b><span>${MONTHS[b.bd.month - 1]}</span></div></td>
        <td><div class="who"><span class="avatar">${esc(b.m.name.charAt(0).toUpperCase())}</span><div class="nm">${esc(b.m.name)}</div></div></td>
        <td class="hide-sm num muted">${b.turning ? `يكمل ${b.turning} سنة` : ''}</td><td class="end">${b.diff === 0 ? '<span class="tag today">اليوم</span>' : `<span class="muted small">${whenLabel(b.diff)}</span>`}</td></tr>`).join('')}
      </tbody></table></div>${bdays.length > 6 ? `<p class="muted small" style="margin-top:6px">و${bdays.length - 6} آخرين — <a href="#/birthdays" style="color:var(--accent)">عرض الكل</a></p>` : ''}`
    : `<div class="panel pad muted">لا توجد أعياد ميلاد خلال الأسبوعين القادمين.</div>`}
    ${atRisk.length ? `<div class="h2">يحتاجون متابعة <small>حضور أقل من 50%</small></div>
      <div class="panel table-wrap"><table class="table"><thead><tr><th>الاسم</th><th class="hide-sm">الكورس</th><th class="hide-sm">الحضور</th><th class="end">النسبة</th></tr></thead><tbody>
      ${atRisk.slice(0, 8).map((r) => `<tr data-member="${r.member.id}"><td><div class="who"><span class="avatar">${esc(r.member.name.charAt(0).toUpperCase())}</span><div><div class="nm">${esc(r.member.name)}</div><div class="muted small show-sm">${esc(r.group.name)}</div></div></div></td>
        <td class="hide-sm">${groupTag(r.group)}</td><td class="hide-sm num muted">${r.attended} من ${r.total}</td><td class="end"><span class="pct low">${r.pct}%</span></td></tr>`).join('')}
      </tbody></table></div>` : ''}`;
  $('#quick-att').onclick = pickCourseForAttendance;
  $('#quick-member').onclick = () => memberModal();
  const hi = $('#home-import');
  if (hi) { hi.onclick = () => $('#home-file').click(); $('#home-file').onchange = (e) => importFile(e.target); }
  bindCommon(view);
}

function pickCourseForAttendance() {
  const courses = db.groups.filter(isCourse);
  if (!courses.length) { toast('أنشئ كورساً أولاً'); go('groups'); return; }
  if (courses.length === 1) { go(`session/${courses[0].id}/new`); return; }
  const m = openModal({
    title: 'اختر الكورس',
    body: `<div class="panel checklist">${courses.map((g) => `<div class="item" data-pick="${g.id}"><span class="dot c-${esc(g.color)}"></span><span class="nm">${esc(g.name)}</span><span class="muted small">${rosterOf(g.id).length} عضو</span></div>`).join('')}</div>`,
  });
  $$('[data-pick]', m.el).forEach((r) => r.addEventListener('click', () => { m.close(); go(`session/${r.dataset.pick}/new`); }));
}

/* ---------- GROUPS ---------- */
function viewGroups() {
  const courses = db.groups.filter(isCourse);
  const groups = db.groups.filter((g) => !isCourse(g));
  view.innerHTML = `${head({
    title: 'الكورسات والمجموعات', sub: 'الكورسات يُسجَّل لها حضور وغياب، أما المجموعات فهي للتنظيم فقط',
    acts: `<button class="btn primary" data-new-group>${ic('plus')}جديد</button>`,
  })}
    ${db.groups.length === 0 ? emptyState('book', 'لا توجد كورسات أو مجموعات', 'ابدأ بإنشاء كورس لتسجيل الحضور.', `<button class="btn primary" data-new-group>${ic('plus')}إنشاء</button>`) : ''}
    ${courses.length ? `<div class="h2" style="margin-top:0">الكورسات</div>${courseTable(courses)}` : ''}
    ${groups.length ? `<div class="h2">المجموعات</div>${courseTable(groups)}` : ''}`;
  bindCommon(view);
}

function groupModal(id) {
  const g = id ? getGroup(id) : null;
  let type = g ? g.type : 'course';
  let color = g ? g.color : COLORS[db.groups.length % COLORS.length];
  const m = openModal({
    title: g ? 'تعديل' : 'كورس أو مجموعة جديدة',
    body: `<div class="field"><label class="f">الاسم</label><input type="text" id="g-name" value="${esc(g ? g.name : '')}" placeholder="مثال: كورس المشورة"></div>
      <div class="field"><label class="f">النوع</label><div class="seg" id="g-type"><button type="button" data-v="course">كورس (حضور وغياب)</button><button type="button" data-v="group">مجموعة</button></div></div>
      <div class="field" style="margin-bottom:0"><label class="f">اللون</label><div class="swatches" id="g-colors">${COLORS.map((c) => `<button type="button" class="swatch c-${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>`,
    foot: `<button class="btn" data-close>إلغاء</button><button class="btn primary" id="g-save">حفظ</button>`,
  });
  const sync = () => {
    $$('#g-type button', m.el).forEach((b) => b.classList.toggle('on', b.dataset.v === type));
    $$('#g-colors button', m.el).forEach((b) => { const on = b.dataset.c === color; b.classList.toggle('on', on); b.innerHTML = on ? ic('check') : ''; });
  };
  $('#g-type', m.el).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { type = b.dataset.v; sync(); } });
  $('#g-colors', m.el).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { color = b.dataset.c; sync(); } });
  sync();
  const save = () => {
    const name = $('#g-name', m.el).value.trim();
    if (!name) { $('#g-name', m.el).focus(); return; }
    if (db.groups.some((x) => x.name === name && x.id !== id)) { toast('الاسم مستخدم بالفعل'); return; }
    const gid = saveGroup({ name, type, color }, id);
    m.close();
    if (!id) go('group/' + gid);
  };
  $('#g-save', m.el).addEventListener('click', save);
  $('#g-name', m.el).addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
}

/* ---------- GROUP DETAIL ---------- */
let rosterQuery = '';
function viewGroup({ a: id, b: tab }) {
  const g = getGroup(id);
  if (!g) { go('groups'); return; }
  const course = isCourse(g);
  tab = tab || (course ? 'sessions' : 'members');
  const rep = courseReport(id);
  view.innerHTML = `${head({
    crumbs: crumb([['الكورسات والمجموعات', '#/groups'], [g.name]]),
    title: `<span class="dot c-${esc(g.color)}"></span>${esc(g.name)}`,
    sub: `${course ? 'كورس' : 'مجموعة'} · ${rep.roster.length} عضو${course ? ` · ${rep.sessions.length} جلسة` : ''}`,
    acts: `<button class="btn" id="g-edit">${ic('edit')}تعديل</button><button class="btn danger icon" id="g-del" aria-label="حذف" title="حذف">${ic('trash')}</button>`,
  })}
    ${course ? `<div class="tabs">
      <a href="#/group/${id}/sessions" class="${tab === 'sessions' ? 'active' : ''}">${ic('calendar', 'sm')}الجلسات والحضور</a>
      <a href="#/group/${id}/report" class="${tab === 'report' ? 'active' : ''}">${ic('chart', 'sm')}التقرير والنسب</a>
      <a href="#/group/${id}/members" class="${tab === 'members' ? 'active' : ''}">${ic('users', 'sm')}الأعضاء <span class="cnt num">${rep.roster.length}</span></a></div>` : ''}
    <div id="tab"></div>`;
  $('#g-edit').onclick = () => groupModal(id);
  $('#g-del').onclick = async () => {
    if (await confirmBox(`حذف «${esc(g.name)}»؟ ${course ? 'سيتم حذف كل جلسات الحضور المسجّلة له أيضاً. ' : ''}لن يُحذف أي عضو.`, 'حذف')) { deleteGroup(id); go('groups'); toast('تم الحذف'); }
  };
  const t = $('#tab');
  if (tab === 'sessions' && course) tabSessions(t, g, rep);
  else if (tab === 'report' && course) tabReport(t, g, rep);
  else tabMembers(t, g);
  bindCommon(view);
}

function tabSessions(t, g, rep) {
  const list = [...rep.perSession].reverse();
  t.innerHTML = `<div class="toolbar"><span class="muted" style="flex:1">${list.length ? `${list.length} جلسة مسجّلة` : ''}</span>
      <button class="btn primary" id="new-session">${ic('plus')}جلسة جديدة</button></div>
    ${rep.roster.length === 0 ? `<div class="notice">${ic('alert')}لا يوجد أعضاء في هذا الكورس بعد. أضفهم من تبويب «الأعضاء» أولاً.</div>` : ''}
    ${list.length === 0 ? emptyState('calendar', 'لا توجد جلسات بعد', 'اضغط «جلسة جديدة» لتسجيل الحضور واختيار من حضر.') :
      `<div class="panel table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>الحضور</th><th class="end">النسبة</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-session="${p.session.id}"><td><div class="nm">${fmtDate(p.session.date)}</div>${p.session.title ? `<div class="muted small">${esc(p.session.title)}</div>` : ''}</td>
        <td class="num">${p.present} من ${rep.roster.length}${p.outside ? `<span class="muted small"> (+${p.outside} من خارج الكورس)</span>` : ''}</td><td class="end">${meter(p.pct)}</td></tr>`).join('')}
      </tbody></table></div>`}`;
  $('#new-session').onclick = () => go(`session/${g.id}/new`);
  $$('[data-session]', t).forEach((r) => r.addEventListener('click', () => go(`session/${g.id}/${r.dataset.session}`)));
}

let reportSort = 'low';
function tabReport(t, g, rep) {
  if (!rep.sessions.length) { t.innerHTML = emptyState('chart', 'لا يوجد تقرير بعد', 'سجّل جلسة واحدة على الأقل لتظهر النسب.'); return; }
  const rows = [...rep.rows].sort((a, b) =>
    reportSort === 'name' ? byName(a.member, b.member) :
      reportSort === 'high' ? (b.pct ?? -1) - (a.pct ?? -1) || byName(a.member, b.member) :
        (a.pct ?? 101) - (b.pct ?? 101) || byName(a.member, b.member));
  const perfect = rows.filter((r) => r.pct === 100).length;
  const low = rows.filter((r) => r.pct != null && r.pct < 50).length;
  const shown = rep.sessions.slice(-30); // the grid shows the latest 30 sessions
  t.innerHTML = `
    <div class="panel stats">
      <div class="stat"><span>متوسط الحضور</span><b class="${pctClass(rep.avg) ? 'pct ' + pctClass(rep.avg) : ''}" style="text-align:start">${pctText(rep.avg)}</b></div>
      <div class="stat"><span>عدد الجلسات</span><b>${rep.sessions.length}</b></div>
      <div class="stat"><span>حضور كامل</span><b>${perfect}</b></div>
      <div class="stat"><span>أقل من 50%</span><b>${low}</b></div>
    </div>
    <div class="h2">الحضور في كل جلسة</div>
    <div class="panel"><div class="chart">${rep.perSession.map((p) => `<div class="col" data-session="${p.session.id}" title="${fmtDate(p.session.date)}: ${p.present} من ${rep.roster.length}">
      <b>${pctText(p.pct)}</b><i style="height:${Math.max(p.pct || 0, 2) * 0.8}px"></i><small>${shortDate(p.session.date)}</small></div>`).join('')}</div></div>
    <div class="h2">حضور كل عضو <span class="sp"></span>
      <div class="seg no-print" id="rsort"><button data-v="low">الأقل حضوراً</button><button data-v="high">الأعلى</button><button data-v="name">أبجدي</button></div>
      <button class="btn sm no-print" id="csv">${ic('download', 'sm')}Excel</button><button class="btn sm icon no-print" id="print" aria-label="طباعة" title="طباعة">${ic('printer', 'sm')}</button></div>
    <div class="panel matrix-wrap"><table class="matrix"><thead><tr><th class="nm">الاسم</th><th>النسبة</th><th>الحضور</th>
      ${shown.map((s) => `<th><a data-session="${s.id}" title="فتح الجلسة">${shortDate(s.date)}</a></th>`).join('')}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td class="nm"><a href="#" data-member="${r.member.id}">${esc(r.member.name)}</a></td>
        <td><span class="pct ${pctClass(r.pct)}" style="display:inline-block">${pctText(r.pct)}</span></td><td class="num">${r.attended}/${r.total}</td>
        ${shown.map((s) => `<td>${s.present.includes(r.member.id) ? `<span class="yes">${ic('check')}</span>` : '<span class="no">—</span>'}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
    ${rep.sessions.length > 30 ? `<p class="muted small" style="margin-top:8px">يعرض الجدول آخر 30 جلسة، والنسب محسوبة على كل الجلسات.</p>` : ''}`;
  $$('#rsort button', t).forEach((b) => { b.classList.toggle('on', b.dataset.v === reportSort); b.onclick = () => { reportSort = b.dataset.v; render(); }; });
  $$('[data-session]', t).forEach((e) => e.addEventListener('click', () => go(`session/${g.id}/${e.dataset.session}`)));
  $('#print', t).onclick = () => window.print();
  $('#csv', t).onclick = () => {
    const headRow = ['الاسم', 'النسبة %', 'حضر', 'من', ...rep.sessions.map((s) => s.date)];
    const lines = rows.map((r) => [r.member.name, r.pct ?? '', r.attended, r.total, ...rep.sessions.map((s) => (s.present.includes(r.member.id) ? 1 : 0))]);
    downloadCsv(`حضور_${g.name}.csv`, [headRow, ...lines]);
  };
}

function tabMembers(t, g) {
  const draw = () => {
    const q = norm(rosterQuery);
    const list = rosterOf(g.id).filter((m) => !q || norm(m.name + ' ' + m.phone).includes(q)).sort(byName);
    $('#roster', t).innerHTML = list.length ? memberTable(list, { remove: `إزالة من ${g.name}` }) : `<div class="empty">${rosterQuery ? 'لا توجد نتائج' : 'لا يوجد أعضاء بعد'}</div>`;
    bindCommon($('#roster', t));
    $$('[data-remove]', t).forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = getMember(b.dataset.remove);
      setMembership([m.id], g.id, false);
      toast(`أُزيل ${m.name}`);
    }));
  };
  t.innerHTML = `<div class="toolbar"><div class="search">${ic('search')}<input type="search" id="rq" placeholder="بحث في الأعضاء" value="${esc(rosterQuery)}"></div>
    ${colButton()}<button class="btn primary" id="add-members">${ic('userPlus')}إضافة أعضاء</button></div><div class="panel" id="roster"></div>`;
  $('#rq', t).addEventListener('input', (e) => { rosterQuery = e.target.value; draw(); });
  bindColButton(t, draw);
  $('#add-members', t).onclick = () => pickMembers({
    title: `إضافة أعضاء إلى ${g.name}`, exclude: new Set(rosterOf(g.id).map((m) => m.id)), allowNew: g.id,
    onConfirm: (ids) => { setMembership(ids, g.id, true); toast(`تمت إضافة ${ids.length}`); },
  });
  draw();
}

/** Multi-select people picker. */
function pickMembers({ title, exclude = new Set(), onConfirm, allowNew }) {
  const chosen = new Set();
  const m = openModal({
    title, wide: true,
    body: `<div class="search">${ic('search')}<input type="search" id="pq" placeholder="ابحث بالاسم"></div>
      <div class="picklist checklist" id="plist"></div>
      <div class="small muted" style="margin-top:8px;min-height:18px" id="pcount"></div>`,
    foot: `${allowNew ? `<button class="btn" id="p-new">${ic('plus')}عضو جديد</button>` : ''}<span class="sp"></span><button class="btn" data-close>إلغاء</button><button class="btn primary" id="p-ok" disabled>إضافة</button>`,
  });
  const draw = () => {
    const q = norm($('#pq', m.el).value);
    const list = db.members.filter((x) => !exclude.has(x.id) && (!q || norm(x.name + ' ' + x.phone).includes(q))).sort(byName).slice(0, 150);
    $('#plist', m.el).innerHTML = list.length ? list.map((x) => `<div class="item ${chosen.has(x.id) ? 'on' : ''}" data-id="${x.id}"><span class="checkbox">${ic('check')}</span><span class="nm">${esc(x.name)}</span></div>`).join('') : `<div class="empty">لا توجد نتائج</div>`;
    $('#pcount', m.el).textContent = chosen.size ? `تم اختيار ${chosen.size}` : '';
    $('#p-ok', m.el).disabled = !chosen.size;
  };
  $('#pq', m.el).addEventListener('input', draw);
  $('#plist', m.el).addEventListener('click', (e) => {
    const r = e.target.closest('[data-id]'); if (!r) return;
    chosen.has(r.dataset.id) ? chosen.delete(r.dataset.id) : chosen.add(r.dataset.id);
    draw();
  });
  $('#p-ok', m.el).onclick = () => { m.close(); onConfirm([...chosen]); };
  if (allowNew) $('#p-new', m.el).onclick = () => { m.close(); memberModal(null, allowNew); };
  draw();
}

/* ---------- ATTENDANCE (one session) ---------- */
function viewSession({ a: gid, b: sid }) {
  const g = getGroup(gid);
  if (!g) { go('groups'); return; }
  let s = sid === 'new' ? null : getSession(sid);
  if (sid !== 'new' && !s) { go(`group/${gid}`); return; }
  keepOnChange = true;
  let filter = 'all', query = '';
  const roster = () => {
    const ids = new Set(rosterOf(gid).map((m) => m.id));
    if (s) s.present.forEach((id) => ids.add(id));
    return [...ids].map(getMember).filter(Boolean).sort(byName);
  };
  // A new session is only stored once something is actually changed.
  const ensure = () => {
    if (!s) { s = createSession(gid, $('#s-date').value || today()); history.replaceState(null, '', `#/session/${gid}/${s.id}`); $('#s-del').classList.remove('hidden'); }
    return s;
  };

  view.innerHTML = `${head({
    crumbs: crumb([['الكورسات والمجموعات', '#/groups'], [g.name, `#/group/${gid}/sessions`], [s ? 'تعديل جلسة' : 'جلسة جديدة']]),
    title: 'تسجيل الحضور', sub: esc(g.name),
    acts: `<a class="btn primary" href="#/group/${gid}/sessions">${ic('check')}تم</a>`,
  })}
    <div class="att-bar">
      <div class="panel pad">
        <div class="grid2" style="margin-bottom:0">
          <div class="field" style="margin-bottom:10px"><label class="f" for="s-date">تاريخ الجلسة</label><input type="date" id="s-date" value="${s ? s.date : today()}"></div>
          <div class="field" style="margin-bottom:10px"><label class="f" for="s-title">عنوان الجلسة (اختياري)</label><input type="text" id="s-title" value="${esc(s ? s.title : '')}" placeholder="مثال: الدرس الثالث"></div>
        </div>
        <div id="s-warn"></div>
        <div class="att-sum"><b id="s-count"></b><div class="bar" id="s-bar"><i></i></div><span class="pct" id="s-pct"></span></div>
      </div>
    </div>
    <div class="toolbar"><div class="search">${ic('search')}<input type="search" id="sq" placeholder="بحث عن اسم"></div>
      <div class="seg" id="sf"><button data-v="all">الكل</button><button data-v="in">حضروا</button><button data-v="out">غابوا</button></div></div>
    <div class="toolbar"><button class="btn sm" id="all">${ic('check', 'sm')}تحديد الكل</button><button class="btn sm" id="none">مسح التحديد</button>
      <span style="flex:1"></span><button class="btn sm" id="outsider">${ic('userPlus', 'sm')}إضافة شخص من خارج الكورس</button></div>
    <div class="panel checklist" id="alist"></div>
    <div style="margin-top:18px"><button class="btn danger ${s ? '' : 'hidden'}" id="s-del">${ic('trash')}حذف الجلسة</button></div>`;

  const update = () => {
    const r = roster();
    const present = s ? s.present : [];
    const n = r.filter((m) => present.includes(m.id)).length;
    const p = r.length ? Math.round((n / r.length) * 100) : null;
    $('#s-count').textContent = `${n} من ${r.length}`;
    $('#s-bar i').style.width = (p || 0) + '%';
    $('#s-bar').className = 'bar ' + (pctClass(p) === 'mid' ? 'mid' : pctClass(p) === 'low' ? 'low' : '');
    const pe = $('#s-pct'); pe.textContent = pctText(p); pe.className = 'pct ' + pctClass(p);
    const dup = sessionsOf(gid).some((x) => x.date === $('#s-date').value && (!s || x.id !== s.id));
    $('#s-warn').innerHTML = dup ? `<div class="notice" style="margin-top:0">${ic('alert')}توجد جلسة أخرى مسجّلة بنفس التاريخ.</div>` : '';
  };
  const drawList = () => {
    const q = norm(query);
    const present = new Set(s ? s.present : []);
    const all = roster();
    const list = all.filter((m) => (!q || norm(m.name).includes(q)) && (filter === 'all' || (filter === 'in') === present.has(m.id)));
    $('#alist', view).innerHTML = list.length ? list.map((m) => `<div class="item ${present.has(m.id) ? 'on' : ''}" data-id="${m.id}" tabindex="0" role="checkbox" aria-checked="${present.has(m.id)}">
      <span class="checkbox">${ic('check')}</span><span class="nm">${esc(m.name)}</span></div>`).join('')
      : `<div class="empty">${all.length ? 'لا توجد نتائج' : 'لا يوجد أعضاء في هذا الكورس. أضفهم من صفحة الكورس أو استخدم «إضافة شخص من خارج الكورس».'}</div>`;
    $$('#sf button', view).forEach((b) => b.classList.toggle('on', b.dataset.v === filter));
    update();
  };
  const toggle = (id) => {
    ensure();
    s.present = s.present.includes(id) ? s.present.filter((x) => x !== id) : [...s.present, id];
    commit();
    const row = $(`[data-id="${id}"]`, view);
    if (row) { const on = s.present.includes(id); row.classList.toggle('on', on); row.setAttribute('aria-checked', on); }
    update();
  };
  $('#alist', view).addEventListener('click', (e) => { const r = e.target.closest('[data-id]'); if (r) toggle(r.dataset.id); });
  $('#alist', view).addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { const r = e.target.closest('[data-id]'); if (r) { e.preventDefault(); toggle(r.dataset.id); } } });
  $('#sq').addEventListener('input', (e) => { query = e.target.value; drawList(); });
  $('#sf').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { filter = b.dataset.v; drawList(); } });
  $('#s-date').addEventListener('change', (e) => { if (!e.target.value) return; ensure().date = e.target.value; commit(); update(); });
  $('#s-title').addEventListener('input', (e) => { ensure().title = e.target.value; commit(); });
  $('#all').onclick = () => { ensure().present = [...new Set([...s.present, ...roster().map((m) => m.id)])]; commit(); drawList(); };
  $('#none').onclick = () => { ensure().present = []; commit(); drawList(); };
  $('#outsider').onclick = () => pickMembers({
    title: 'إضافة شخص من خارج الكورس', exclude: new Set(roster().map((m) => m.id)), allowNew: gid,
    onConfirm: (ids) => { ensure(); setMembership(ids, gid, true); s.present = [...new Set([...s.present, ...ids])]; commit(); drawList(); toast('أُضيف للكورس وسُجّل حضوره'); },
  });
  $('#s-del').onclick = async () => {
    if (await confirmBox('حذف هذه الجلسة وكل بيانات حضورها؟', 'حذف')) { const id = s.id; keepOnChange = false; deleteSession(id); go(`group/${gid}/sessions`); }
  };
  drawList();
}

/* ---------- MEMBERS ---------- */
function viewMembers() {
  view.innerHTML = `${head({ title: 'الأعضاء', sub: '<span id="m-count"></span>', acts: `<button class="btn primary" id="add">${ic('userPlus')}عضو جديد</button>` })}
    <div class="toolbar"><div class="search">${ic('search')}<input type="search" id="mq" placeholder="ابحث بالاسم أو رقم الهاتف" value="${esc(memberQuery)}"></div>
      <select id="mg" aria-label="تصفية حسب المجموعة"><option value="all">كل الأعضاء</option>
        ${db.groups.map((g) => `<option value="${g.id}" ${memberGroupFilter === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
        <option value="none" ${memberGroupFilter === 'none' ? 'selected' : ''}>بدون مجموعة</option></select>${colButton()}</div>
    <div class="panel" id="mlist"></div>`;
  const draw = () => {
    const q = norm(memberQuery);
    const list = db.members.filter((m) => {
      if (memberGroupFilter === 'none' ? m.groups.length : memberGroupFilter !== 'all' && !m.groups.includes(memberGroupFilter)) return false;
      return !q || norm([m.name, m.phone, m.fatherPhone, m.motherPhone, m.notes, m.education].join(' ')).includes(q);
    }).sort(byName);
    $('#m-count').textContent = list.length === db.members.length ? `${db.members.length} عضو` : `${list.length} من ${db.members.length}`;
    $('#mlist').innerHTML = !db.members.length ? emptyState('users', 'لا يوجد أعضاء', 'أضف عضواً جديداً أو استورد ملف بيانات من صفحة «البيانات».')
      : memberTable(list.slice(0, 300)) + (list.length > 300 ? `<div class="empty small">يُعرض أول 300 — استخدم البحث للتضييق</div>` : '');
    bindCommon($('#mlist'));
  };
  $('#mq').addEventListener('input', (e) => { memberQuery = e.target.value; draw(); });
  $('#mg').addEventListener('change', (e) => { memberGroupFilter = e.target.value; draw(); });
  bindColButton(view, draw);
  $('#add').onclick = () => memberModal(null, memberGroupFilter !== 'all' && memberGroupFilter !== 'none' ? memberGroupFilter : null);
  draw();
}

/** Add / edit a member. Five numbered sections, top to bottom, no hidden fields. */
function memberModal(id, presetGroup) {
  const mem = id ? getMember(id) : null;
  const v = (k) => esc(mem ? mem[k] : '');
  const S = { gender: mem ? mem.gender : 'Male', married: mem ? mem.isMarried : false, family: mem ? (mem.withFamily === true ? 'yes' : mem.withFamily === false ? 'no' : 'unk') : 'unk' };
  const sel = new Set(mem ? mem.groups : presetGroup ? [presetGroup] : []);
  const rep = mem ? memberReport(mem.id) : [];
  const courses = db.groups.filter(isCourse);
  const groups = db.groups.filter((g) => !isCourse(g));
  const tags = (list) => list.map((g) => `<button type="button" class="tag" data-g="${g.id}"><span class="dot c-${esc(g.color)}"></span>${esc(g.name)}</button>`).join('');
  const seg = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([val, lab]) => `<button type="button" data-v="${val}">${lab}</button>`).join('')}</div>`;
  const sec = (n, title, inner) => `<section class="fs"><h3><span class="step">${n}</span>${title}</h3>${inner}</section>`;

  const m = openModal({
    title: mem ? `تعديل بيانات: ${mem.name}` : 'إضافة عضو جديد', wide: true,
    body: `<div class="mform">
      ${sec(1, 'البيانات الأساسية', `
        <div class="field"><label class="f" for="f-name">الاسم الكامل <span class="req">*</span></label><input type="text" id="f-name" class="big" value="${v('name')}" placeholder="مثال: أبانوب رمسيس"></div>
        <div class="grid3">
          <div class="field"><label class="f">النوع</label>${seg('gender', [['Male', 'ذكر'], ['Female', 'أنثى']])}</div>
          <div class="field"><label class="f">الحالة الاجتماعية</label>${seg('married', [['0', 'أعزب'], ['1', 'متزوج']])}</div>
          <div class="field"><label class="f" for="f-dob">تاريخ الميلاد</label><input type="text" id="f-dob" dir="ltr" style="text-align:right" placeholder="DD/MM/YYYY" value="${v('dob')}"><div class="hint" id="f-age"></div></div>
        </div>`)}
      ${sec(2, 'التواصل', `
        <div class="grid3">
          <div class="field"><label class="f" for="f-phone">هاتف العضو</label><input type="tel" id="f-phone" dir="ltr" style="text-align:right" value="${v('phone')}"></div>
          <div class="field"><label class="f" for="f-father">هاتف الأب</label><input type="tel" id="f-father" dir="ltr" style="text-align:right" value="${v('fatherPhone')}"></div>
          <div class="field"><label class="f" for="f-mother">هاتف الأم</label><input type="tel" id="f-mother" dir="ltr" style="text-align:right" value="${v('motherPhone')}"></div>
        </div>`)}
      ${sec(3, 'الكورسات والمجموعات', `
        ${courses.length ? `<div class="field"><label class="f">الكورسات</label><div class="tags" id="f-courses">${tags(courses)}</div></div>` : ''}
        ${groups.length ? `<div class="field" style="margin-bottom:0"><label class="f">المجموعات</label><div class="tags" id="f-groups">${tags(groups)}</div></div>` : ''}
        ${!db.groups.length ? '<p class="muted small">لا توجد كورسات أو مجموعات بعد — أنشئها من صفحة «الكورسات والمجموعات».</p>' : ''}`)}
      ${sec(4, 'الدراسة والخدمة', `
        <div class="grid3">
          <div class="field"><label class="f" for="f-edu">المؤهل / الدراسة</label><input type="text" id="f-edu" value="${v('education')}"></div>
          <div class="field"><label class="f" for="f-service">نوع الخدمة</label><input type="text" id="f-service" value="${v('serviceType')}"></div>
          <div class="field"><label class="f">يعيش مع الأسرة؟</label>${seg('family', [['yes', 'نعم'], ['no', 'لا'], ['unk', 'غير محدد']])}</div>
        </div>`)}
      ${sec(5, 'ملاحظات', `<textarea id="f-notes" placeholder="ملاحظات افتقاد، ظروف خاصة...">${v('notes')}</textarea>`)}
      ${rep.length ? sec(6, 'سجل الحضور', `<div class="panel">${rep.map((r) => `<div class="setting" style="padding:10px 14px">
        <span class="dot c-${esc(r.group.color)}"></span><div class="tx"><b>${esc(r.group.name)}</b><p class="num">حضر ${r.attended} من ${r.total} جلسة</p></div>
        <span class="pips">${r.dots.map((d) => `<i class="${d ? 'on' : ''}"></i>`).join('')}</span><span class="pct ${pctClass(r.pct)}">${pctText(r.pct)}</span></div>`).join('')}</div>`) : ''}
    </div>`,
    foot: `${mem ? `<button class="btn danger" id="f-del">${ic('trash')}حذف العضو</button>` : ''}<span class="sp"></span><button class="btn" data-close>إلغاء</button><button class="btn primary" id="f-save">${mem ? 'حفظ التعديلات' : 'إضافة العضو'}</button>`,
  });
  const segVal = { gender: () => S.gender, married: () => (S.married ? '1' : '0'), family: () => S.family };
  const sync = () => {
    $$('[data-seg]', m.el).forEach((el) => $$('button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === segVal[el.dataset.seg]())));
    $$('[data-g]', m.el).forEach((c) => c.classList.toggle('on', sel.has(c.dataset.g)));
  };
  m.el.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-seg] button');
    if (sb) { const k = sb.parentElement.dataset.seg; if (k === 'gender') S.gender = sb.dataset.v; else if (k === 'married') S.married = sb.dataset.v === '1'; else S.family = sb.dataset.v; sync(); return; }
    const gb = e.target.closest('[data-g]');
    if (gb) { sel.has(gb.dataset.g) ? sel.delete(gb.dataset.g) : sel.add(gb.dataset.g); sync(); }
  });
  const ageHint = () => {
    const val = $('#f-dob', m.el).value.trim();
    const a = ageOf(val);
    $('#f-age', m.el).textContent = !val ? '' : a != null ? `السن: ${a} سنة` : 'الصيغة: يوم/شهر/سنة';
  };
  $('#f-dob', m.el).addEventListener('input', ageHint);
  ageHint(); sync();
  const save = () => {
    const name = $('#f-name', m.el).value.trim();
    if (!name) { const f = $('#f-name', m.el); f.focus(); f.classList.add('invalid'); toast('الاسم مطلوب'); return; }
    saveMember({
      name, gender: S.gender, isMarried: S.married, dob: $('#f-dob', m.el).value.trim(), phone: $('#f-phone', m.el).value.trim(),
      fatherPhone: $('#f-father', m.el).value.trim(), motherPhone: $('#f-mother', m.el).value.trim(), groups: [...sel],
      education: $('#f-edu', m.el).value.trim(), serviceType: $('#f-service', m.el).value.trim(),
      withFamily: S.family === 'yes' ? true : S.family === 'no' ? false : null, notes: $('#f-notes', m.el).value.trim(),
    }, id);
    m.close();
    if (route().name === 'session') render();
    toast(id ? 'تم حفظ التعديلات' : 'تمت إضافة العضو');
  };
  $('#f-save', m.el).onclick = save;
  $$('input[type=text],input[type=tel]', m.el).forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); }));
  if (mem) $('#f-del', m.el).onclick = async () => {
    if (await confirmBox(`حذف «${esc(mem.name)}» نهائياً؟ سيُزال أيضاً من سجلات الحضور.`, 'حذف')) { m.close(); deleteMember(id); toast('تم الحذف'); }
  };
}

/* ---------- DATA ---------- */
async function importFile(input) {
  const f = input.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!(Array.isArray(data) || Array.isArray(data.members))) throw new Error('bad');
    const n = Array.isArray(data) ? data.length : data.members.length;
    const hasData = db.members.length || db.groups.length;
    if (!hasData || await confirmBox(`استبدال كل البيانات الحالية بـ ${n} عضو من الملف؟`, 'استبدال')) { importData(data); render(); toast('تم الاستيراد'); }
  } catch (err) { toast('الملف غير صالح'); }
  input.value = '';
}

function viewData() {
  const local = status.mode === 'local';
  view.innerHTML = `${head({ title: 'البيانات', sub: 'النسخ الاحتياطي والاستيراد' })}
    <div class="notice" style="margin-top:0;${local && status.dirty ? '' : 'background:var(--accent-soft);color:var(--accent)'}">${ic('alert')}<div>${local
      ? (status.dirty ? '<b>لديك مسودة غير مؤكدة.</b> تعديلاتك محفوظة مؤقتاً في هذا المتصفح فقط — حمّل أحدث نسخة الآن.' : 'التطبيق يعمل بدون خادم محلي: المتصفح مخصص للوصول السريع فقط. بعد أي تعديل <b>حمّل أحدث نسخة</b> واحتفظ بها في مكان آمن.')
      : 'الحفظ تلقائي: كل تعديل يُكتب في الملف <code>church_data.json</code> على هذا الجهاز، مع نسخة احتياطية يومية في مجلد <code>backups</code>.'}</div></div>
    <div class="panel">
      <div class="setting"><div class="tx"><b>تحميل أحدث نسخة</b><p>الأعضاء والكورسات وسجلات الحضور في ملف JSON واحد.${local ? ' هذا هو الحفظ المؤكد الوحيد.' : ''}</p></div><button class="btn primary" id="exp-json">${ic('download')}تحميل</button></div>
      <div class="setting"><div class="tx"><b>استعادة من ملف</b><p>يستبدل كل البيانات الحالية. يقبل ملف النسخة أو ملف الأعضاء القديم.</p></div><button class="btn" id="imp">${ic('upload')}اختيار ملف</button><input type="file" id="imp-file" accept=".json" class="hidden"></div>
      <div class="setting"><div class="tx"><b>طباعة وتصدير قوائم</b><p>اختر الأعضاء والأعمدة واطبع نسخة رسمية أو صدّرها إلى Excel.</p></div><a class="btn" href="#/print">${ic('printer')}فتح الصفحة</a></div>
      ${local ? `<div class="setting"><div class="tx"><b>مسح بيانات هذا المتصفح</b><p>لإنهاء الجلسة على جهاز عام. تأكد من تحميل نسخة أولاً.</p></div><button class="btn danger" id="wipe">${ic('trash')}مسح</button></div>` : ''}
    </div>`;
  $('#exp-json').onclick = () => { downloadLatest(); if (local) viewData(); };
  $('#imp').onclick = () => $('#imp-file').click();
  $('#imp-file').onchange = (e) => importFile(e.target);
  const w = $('#wipe');
  if (w) w.onclick = async () => {
    if (await confirmBox(status.dirty ? 'لديك مسودة غير محمّلة وستضيع. مسح كل البيانات من هذا المتصفح؟' : 'مسح كل البيانات من هذا المتصفح؟', 'مسح')) { clearLocal(); replaceAll(null); render(); toast('تم المسح'); }
  };
}

/* ---------- shared bindings ---------- */
function bindCommon(root) {
  $$('[data-member]', root).forEach((e) => {
    if (e.dataset.bound) return; e.dataset.bound = 1;
    const open = (ev) => { ev.preventDefault(); memberModal(e.dataset.member); };
    e.addEventListener('click', open);
    e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target === e) open(ev); });
  });
  $$('[data-href]', root).forEach((e) => e.addEventListener('click', () => { location.hash = e.dataset.href; }));
  $$('[data-new-group]', root).forEach((e) => { e.onclick = () => groupModal(); });
}

$('#draft-dl').onclick = downloadLatest;
$('#draft-discard').onclick = discardFlow;

/* ---------- start ---------- */
load().then(() => {
  render();
  status.state = 'saved';
  paintStatus();
  if (status.pendingDraft) draftPrompt();
});
