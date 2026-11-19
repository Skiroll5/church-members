/**
 * print.js - "Print & export" page: choose who (everyone / groups / hand-picked), which columns
 * (including attendance rate for courses), and get an official letterhead sheet (church logo)
 * that prints to paper or PDF, or exports to Excel (CSV).
 */
import { db, ageOf, today, getGroup, isCourse, courseReport } from './store.js';
import { $, $$, esc, ic, byName, norm, head, downloadCsv, toast } from './ui.js';
import { COLS, COL, colText, pendTag } from './columns.js';

const LS = 'church_print_cols';
const DEFAULT_ORDER = ['name', ...COLS.map((c) => c.key)];
const isDyn = (k) => k.includes(':'); // rate:<courseId> / att:<courseId>

function loadCols() {
  try {
    const s = JSON.parse(localStorage.getItem(LS));
    if (s && Array.isArray(s.order) && Array.isArray(s.on)) {
      const order = [...s.order.filter((k) => DEFAULT_ORDER.includes(k)), ...DEFAULT_ORDER.filter((k) => !s.order.includes(k))];
      return { order, on: new Set([...s.on.filter((k) => DEFAULT_ORDER.includes(k)), 'name']) };
    }
  } catch (e) { /* ignore */ }
  return { order: [...DEFAULT_ORDER], on: new Set(['name', 'age', 'phone']) };
}

// Page state lives for the whole session, so coming back to the page keeps your choices.
const P = {
  mode: 'all', groups: new Set(), excl: new Set(), custom: new Set(), q: '', split: false, pageBreak: false,
  alias: {}, // groupId -> name to print instead of the saved group name
  rate: new Set(), showCounts: false, // courses whose attendance is printed as columns
  title: '', subtitle: '', logo: true, numbers: true, banded: true, sign: 'أمين الخدمة، الأب الكاهن',
  orient: 'portrait', size: 'md', sort: 'name', sortDir: 1, sort2: '', sortDir2: 1, cols: loadCols(),
};
// Only the ordinary columns are remembered between visits; attendance columns depend on the chosen courses.
const saveCols = () => {
  try { localStorage.setItem(LS, JSON.stringify({ order: P.cols.order.filter((k) => !isDyn(k)), on: [...P.cols.on].filter((k) => !isDyn(k)) })); } catch (e) { /* ignore */ }
};

const FONT = { sm: 10, md: 11.5, lg: 13 };
const disp = (g) => (P.alias[g.id] || '').trim() || g.name;
const gname = (id) => { const g = getGroup(id); return g ? disp(g) : ''; };

function LABEL(k) {
  if (k === 'name') return 'الاسم';
  if (k.startsWith('rate:')) return `نسبة الحضور — ${gname(k.slice(5))}`;
  if (k.startsWith('att:')) return `مرات الحضور — ${gname(k.slice(4))}`;
  return COL[k].label;
}

/* ----- attendance columns ----- */
let RM = {};
function buildRates() {
  RM = {};
  P.rate.forEach((id) => {
    const rep = courseReport(id);
    RM[id] = { map: new Map(rep.rows.map((r) => [r.member.id, r])), total: rep.sessions.length };
  });
}
/** Keep the column list in step with the chosen courses (add new ones at the end, drop removed ones). */
function syncRateCols() {
  const o = P.cols.order, on = P.cols.on;
  const valid = new Set();
  [...P.rate].forEach((id) => {
    if (!getGroup(id)) { P.rate.delete(id); return; }
    valid.add('rate:' + id);
    if (P.showCounts) valid.add('att:' + id);
  });
  for (let i = o.length - 1; i >= 0; i--) if (isDyn(o[i]) && !valid.has(o[i])) { on.delete(o[i]); o.splice(i, 1); }
  valid.forEach((k) => { if (!o.includes(k)) { o.push(k); on.add(k); } });
}
function colValue(k, m) {
  if (k === 'name') return m.name;
  if (isDyn(k)) {
    const [t, id] = k.split(':');
    const r = RM[id] && RM[id].map.get(m.id);
    if (!r) return '—';
    if (t === 'rate') return r.pct == null ? '—' : r.pct + '%';
    return `${r.attended} من ${r.total}`;
  }
  return colText(k, m);
}
const isNumCol = (k) => isDyn(k) || (COL[k] && COL[k].num);

const activeCols = () => P.cols.order.filter((k) => P.cols.on.has(k));

/** Sort by a primary column, then an optional secondary one (e.g. gender, then age). Empty values go last; ties fall back to name. */
function sorter() {
  const valid = (k) => DEFAULT_ORDER.includes(k) || (isDyn(k) && P.cols.order.includes(k));
  const dobKey = (m) => { const p = String(m.dob || '').split(/[/\-.]/).map(Number); return p.length === 3 && p[2] ? p[2] * 10000 + p[1] * 100 + p[0] : null; };
  const cmpBy = (k, dir) => {
    if (k === 'name') return (a, b) => byName(a, b) * dir;
    const val = (m) => {
      if (isDyn(k)) {
        const [t, id] = k.split(':'); const r = RM[id] && RM[id].map.get(m.id);
        return !r ? null : t === 'rate' ? r.pct : r.attended;
      }
      if (k === 'age') return ageOf(m.dob) ?? null;
      if (k === 'dob') return dobKey(m);
      if (k === 'gender') return m.gender === 'Female' ? 0 : 1; // females first when ascending
      if (k === 'updatedAt') return m.updatedAt ? Date.parse(m.updatedAt) : null;
      const t = colText(k, m); return t === '' ? null : t;
    };
    return (a, b) => {
      const x = val(a), y = val(b);
      if (x == null || y == null) return (x == null) - (y == null);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ar', { numeric: true });
      return c * dir;
    };
  };
  const k1 = valid(P.sort) ? P.sort : 'name';
  const list = [cmpBy(k1, P.sortDir)];
  if (P.sort2 && P.sort2 !== k1 && valid(P.sort2)) list.push(cmpBy(P.sort2, P.sortDir2));
  return (a, b) => { for (const f of list) { const c = f(a, b); if (c) return c; } return byName(a, b); };
}

/** The people to print, as one or more titled sections. */
function sections() {
  buildRates();
  const cmp = sorter();
  if (P.mode === 'custom') return [{ title: '', members: db.members.filter((m) => P.custom.has(m.id)).sort(cmp) }];
  if (P.mode === 'group') {
    const gs = db.groups.filter((g) => P.groups.has(g.id));
    const keep = (m) => !P.excl.has(m.id);
    if (P.split) return gs.map((g) => ({ title: disp(g), members: db.members.filter((m) => keep(m) && m.groups.includes(g.id)).sort(cmp) }));
    const set = new Set(gs.map((g) => g.id));
    return [{ title: '', members: db.members.filter((m) => keep(m) && m.groups.some((id) => set.has(id))).sort(cmp) }];
  }
  return [{ title: '', members: [...db.members].sort(cmp) }];
}

function autoTitle() {
  if (P.mode === 'group' && P.groups.size) return 'كشف أسماء — ' + db.groups.filter((g) => P.groups.has(g.id)).map(disp).join(' + ');
  if (P.mode === 'custom') return 'كشف أسماء مختارة';
  return 'كشف أسماء المخدومين';
}

const longDate = () => new Date().toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function sheetHtml() {
  syncRateCols();
  const secs = sections();
  const cols = activeCols();
  const total = new Set(secs.flatMap((s) => s.members.map((m) => m.id))).size;
  const title = P.title.trim() || autoTitle();
  const signs = P.sign.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  const ready = total > 0;

  const table = (members) => `<table class="sh-table ${P.banded ? 'banded' : ''}"><thead><tr>${P.numbers ? '<th class="c-n">م</th>' : ''}${cols.map((k) => `<th>${esc(LABEL(k))}</th>`).join('')}</tr></thead><tbody>
    ${members.map((m, i) => `<tr>${P.numbers ? `<td class="c-n">${i + 1}</td>` : ''}${cols.map((k) => `<td class="${k === 'name' ? 'c-name' : isNumCol(k) ? 'c-num' : ''}">${esc(colValue(k, m))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  const sessWord = (n) => (n === 0 ? 'لا جلسات' : n === 1 ? 'جلسة واحدة' : n === 2 ? 'جلستان' : n >= 3 && n <= 10 ? `${n} جلسات` : `${n} جلسة`);
  const rateInfo = [...P.rate].map((id) => `<span>${esc(gname(id))}: <b>${sessWord(RM[id] ? RM[id].total : 0)}</b></span>`).join('');

  return `<div class="sheet ${P.orient}" style="font-size:${FONT[P.size]}px">
    <header class="sh-head">
      ${P.logo ? '<img class="sh-logo" src="img/logo.png" alt="شعار الكنيسة">' : ''}
      <div class="sh-rule"></div>
      <h2 class="sh-title">${esc(title)}</h2>
      ${P.subtitle.trim() ? `<div class="sh-sub">${esc(P.subtitle.trim())}</div>` : ''}
      <div class="sh-meta"><span>التاريخ: ${longDate()}</span><span>عدد الأسماء: <b class="num">${total}</b></span></div>
      ${rateInfo ? `<div class="sh-meta sh-meta2">${rateInfo}</div>` : ''}
    </header>
    ${!ready ? `<div class="sh-empty">${P.mode === 'group' ? 'اختر مجموعة أو أكثر لتظهر القائمة' : P.mode === 'custom' ? 'حدّد الأعضاء المطلوبين لتظهر القائمة' : 'لا يوجد أعضاء'}</div>` :
      secs.map((s, i) => `${s.title ? `<h3 class="sh-sec ${P.pageBreak && i > 0 ? 'break' : ''}">${esc(s.title)} <span class="num">(${s.members.length})</span></h3>` : ''}${s.members.length ? table(s.members) : '<div class="sh-empty">لا يوجد أعضاء</div>'}`).join('')}
    ${ready && signs.length ? `<div class="sh-sign">${signs.map((t) => `<div><span>${esc(t)}</span><i></i></div>`).join('')}</div>` : ''}
    <footer class="sh-foot">كنيسة القديس أثناسيوس الرسولي · بولونيا، إيطاليا — نسخة رسمية مستخرجة من سجل الخدمة</footer>
  </div>`;
}

function setPageStyle() {
  let st = $('#page-style');
  if (!st) { st = document.createElement('style'); st.id = 'page-style'; document.head.appendChild(st); }
  st.textContent = `@page { size: A4 ${P.orient}; margin: 12mm 12mm 14mm; @bottom-center { content: "صفحة " counter(page) " من " counter(pages); font: 9pt Cairo, sans-serif; color: #555; } }`;
}

let ro = null;

export function viewPrint(view) {
  if (ro) ro.disconnect();
  syncRateCols();
  const courses = db.groups.filter(isCourse);
  view.innerHTML = `${head({
    title: 'طباعة وتصدير', sub: 'اختر من تريد طباعته والأعمدة المطلوبة، وستظهر لك النسخة الرسمية مباشرة',
    acts: `<button class="btn" id="opts-toggle">${ic('panel')}<span>إخفاء الخيارات</span></button><button class="btn" id="do-csv">${ic('download')}تصدير Excel</button><button class="btn primary" id="do-print">${ic('printer')}طباعة / حفظ PDF</button>`,
  })}
  <div class="print-layout">
    <div class="print-opts no-print" id="print-opts">
      <section class="panel pad ps">
        <h3><span class="step">1</span>من تريد أن تطبع؟</h3>
        <div class="seg" id="p-mode"><button data-v="all">الجميع</button><button data-v="group">مجموعة / كورس</button><button data-v="custom">اختيار يدوي</button></div>
        <div id="p-who"></div>
      </section>

      <section class="panel pad ps">
        <h3><span class="step">2</span>الشكل</h3>
        <div class="field"><div class="lbl-row"><label class="f" for="p-title">عنوان الكشف</label><button type="button" class="btn sm quiet" id="p-title-reset">العنوان التلقائي</button></div><input type="text" id="p-title"></div>
        <div class="field"><label class="f" for="p-sub">سطر فرعي (اختياري)</label><input type="text" id="p-sub" placeholder="مثال: خدمة الشباب — عام 2026"></div>
        <div class="field"><label class="f" for="p-sign">التوقيعات <span class="muted">(افصل بفاصلة، فارغ = بدون)</span></label><input type="text" id="p-sign"></div>
        <div class="grid2">
          <div class="field"><label class="f">اتجاه الصفحة</label><div class="seg" id="p-orient"><button data-v="portrait">عمودي</button><button data-v="landscape">أفقي</button></div></div>
          <div class="field"><label class="f">حجم الخط</label><div class="seg" id="p-size"><button data-v="sm">صغير</button><button data-v="md">متوسط</button><button data-v="lg">كبير</button></div></div>
        </div>
        <div class="field"><label class="f" for="p-sort">الترتيب حسب</label><div style="display:flex;gap:8px"><select id="p-sort" style="flex:1"></select><button type="button" class="btn" id="p-sortdir" title="عكس الاتجاه" aria-label="عكس الاتجاه"></button></div></div>
        <div class="field"><label class="f" for="p-sort2">ثم الترتيب حسب</label><div style="display:flex;gap:8px"><select id="p-sort2" style="flex:1"></select><button type="button" class="btn" id="p-sortdir2" title="عكس الاتجاه" aria-label="عكس الاتجاه"></button></div></div>
        <label class="chk"><input type="checkbox" id="p-logo"> إظهار شعار الكنيسة</label>
        <label class="chk"><input type="checkbox" id="p-banded"> تلوين الصفوف بالتناوب</label>
      </section>

      <section class="panel pad ps ps-cols">
        <h3><span class="step">3</span>الأعمدة</h3>
        <div class="f2">الأعمدة الظاهرة <span class="muted">(رتّبها بالأسهم، أو احذفها بـ ✕)</span></div>
        <div class="chipbar" id="p-active"></div>
        <div class="f2" style="margin-top:12px">أعمدة أخرى <span class="muted">(اضغط للإضافة)</span></div>
        <div class="chipbar" id="p-avail"></div>
        ${courses.length ? `<div class="ps-sub">
          <div class="f2">نسبة الحضور (للكورسات)</div>
          <div class="tags" id="p-rates">${courses.map((g) => `<button type="button" class="tag" data-r="${g.id}"><span class="dot c-${esc(g.color)}"></span>${esc(g.name)}</button>`).join('')}</div>
          <label class="chk"><input type="checkbox" id="p-counts"> إظهار عدد مرات الحضور أيضاً (مثال: 8 من 10)</label>
        </div>` : ''}
        <label class="chk" style="margin-top:8px"><input type="checkbox" id="p-numbers"> ترقيم الصفوف</label>
      </section>
    </div>
    <div class="print-main"><div id="sheet-host"></div></div>
  </div>`;

  const main = $('.print-main', view);
  // Scale the A4 sheet so the whole width is always visible (no sideways scrolling).
  const fit = () => {
    const sh = $('.sheet', view);
    if (!sh) return;
    const natural = P.orient === 'landscape' ? 1122.5 : 793.7;
    sh.style.zoom = String(Math.min(1, Math.max(0.3, (main.clientWidth - 40) / natural)));
  };
  ro = new ResizeObserver(fit);
  ro.observe(main);

  const drawSheet = () => {
    setPageStyle();
    $('#sheet-host', view).innerHTML = sheetHtml();
    const t = $('#p-title', view);
    t.placeholder = autoTitle();
    if (!P.title && document.activeElement !== t) t.value = autoTitle();
    fit();
  };

  /* --- who --- */
  const drawWho = () => {
    const host = $('#p-who', view);
    $$('#p-mode button', view).forEach((b) => b.classList.toggle('on', b.dataset.v === P.mode));
    if (P.mode === 'all') {
      host.innerHTML = `<p class="muted small" style="margin-top:10px">سيتم طباعة كل الأعضاء (${db.members.length}).</p>`;
    } else if (P.mode === 'group') {
      const picked = db.groups.filter((g) => P.groups.has(g.id));
      const suggest = picked.filter((g) => isCourse(g) && !P.rate.has(g.id));
      host.innerHTML = `<div class="tags" style="margin-top:12px">${db.groups.length ? db.groups.map((g) => `<button type="button" class="tag ${P.groups.has(g.id) ? 'on' : ''}" data-g="${g.id}"><span class="dot c-${esc(g.color)}"></span>${esc(g.name)}</button>`).join('') : '<span class="muted small">لا توجد مجموعات</span>'}</div>
        ${picked.length ? `<div class="ps-sub"><div class="f2">الاسم الذي يظهر في الطباعة</div>${picked.map((g) => `<input type="text" class="alias" data-alias="${g.id}" value="${esc(P.alias[g.id] || '')}" placeholder="${esc(g.name)}" aria-label="اسم ${esc(g.name)} في الطباعة">`).join('')}
          <div class="muted small">اتركه فارغاً لاستخدام الاسم المحفوظ. التعديل هنا للطباعة فقط ولا يغيّر اسم المجموعة.</div></div>` : ''}
        ${suggest.map((g) => `<button type="button" class="btn sm block-sm" data-addrate="${g.id}" style="margin-top:8px">${ic('chart', 'sm')}إضافة نسبة الحضور — ${esc(disp(g))}</button>`).join('')}
        ${picked.length ? `<div class="ps-sub"><div class="f2">استثناء أسماء <span class="muted">(ألغِ التحديد لإخراج اسم من الكشف)</span></div>
          <div class="toolbar" style="margin:6px 0"><button class="btn sm" id="p-exall">تحديد الكل</button><button class="btn sm" id="p-exnone">إلغاء الكل</button><span class="muted small num" id="p-excount" style="margin-inline-start:auto"></span></div>
          <div class="panel checklist pick-box" id="p-exlist"></div></div>` : ''}
        <label class="chk" style="margin-top:12px"><input type="checkbox" id="p-split" ${P.split ? 'checked' : ''}> تقسيم القائمة إلى أقسام حسب المجموعة</label>
        <label class="chk ${P.split ? '' : 'off'}"><input type="checkbox" id="p-break" ${P.pageBreak ? 'checked' : ''} ${P.split ? '' : 'disabled'}> كل قسم في صفحة منفصلة</label>`;
      if (picked.length) {
        const gset = new Set(picked.map((g) => g.id));
        const pool = db.members.filter((m) => m.groups.some((id) => gset.has(id))).sort(byName);
        const drawEx = () => {
          $('#p-exlist', host).innerHTML = pool.map((m) => `<div class="item ${P.excl.has(m.id) ? '' : 'on'}" data-id="${m.id}"><span class="checkbox">${ic('check')}</span><span class="nm">${esc(m.name)}</span>${pendTag(m)}</div>`).join('');
          const n = pool.filter((m) => P.excl.has(m.id)).length;
          $('#p-excount', host).textContent = n ? `مستثنى: ${n} من ${pool.length}` : `الكل (${pool.length})`;
        };
        drawEx();
        $('#p-exlist', host).addEventListener('click', (e) => {
          const r = e.target.closest('[data-id]'); if (!r) return;
          P.excl.has(r.dataset.id) ? P.excl.delete(r.dataset.id) : P.excl.add(r.dataset.id);
          drawEx(); drawSheet();
        });
        $('#p-exall', host).onclick = () => { pool.forEach((m) => P.excl.delete(m.id)); drawEx(); drawSheet(); };
        $('#p-exnone', host).onclick = () => { pool.forEach((m) => P.excl.add(m.id)); drawEx(); drawSheet(); };
      }
      $$('[data-g]', host).forEach((b) => b.addEventListener('click', () => {
        P.groups.has(b.dataset.g) ? P.groups.delete(b.dataset.g) : P.groups.add(b.dataset.g);
        drawWho(); drawSheet();
      }));
      $$('[data-alias]', host).forEach((i) => i.addEventListener('input', () => { P.alias[i.dataset.alias] = i.value; drawCols(); drawSheet(); }));
      $$('[data-addrate]', host).forEach((b) => b.addEventListener('click', () => { P.rate.add(b.dataset.addrate); syncRateCols(); drawRates(); drawCols(); drawWho(); drawSheet(); }));
      $('#p-split', host)?.addEventListener('change', (e) => { P.split = e.target.checked; if (!P.split) P.pageBreak = false; drawWho(); drawSheet(); });
      $('#p-break', host)?.addEventListener('change', (e) => { P.pageBreak = e.target.checked; drawSheet(); });
    } else {
      host.innerHTML = `<div class="search" style="margin-top:12px">${ic('search')}<input type="search" id="p-q" placeholder="ابحث بالاسم" value="${esc(P.q)}"></div>
        <div class="toolbar" style="margin:10px 0 6px"><button class="btn sm" id="p-selall">تحديد الظاهر</button><button class="btn sm" id="p-selnone">مسح التحديد</button><span class="muted small num" id="p-selcount" style="margin-inline-start:auto"></span></div>
        <div class="panel checklist pick-box" id="p-list"></div>`;
      const drawList = () => {
        const q = norm(P.q);
        const list = db.members.filter((m) => !q || norm(m.name).includes(q)).sort(byName);
        $('#p-list', host).innerHTML = list.length ? list.slice(0, 400).map((m) => `<div class="item ${P.custom.has(m.id) ? 'on' : ''}" data-id="${m.id}"><span class="checkbox">${ic('check')}</span><span class="nm">${esc(m.name)}</span>${pendTag(m)}</div>`).join('') : '<div class="empty">لا توجد نتائج</div>';
        $('#p-selcount', host).textContent = `المحدد: ${P.custom.size}`;
        return list;
      };
      let shown = drawList();
      $('#p-q', host).addEventListener('input', (e) => { P.q = e.target.value; shown = drawList(); });
      $('#p-list', host).addEventListener('click', (e) => {
        const r = e.target.closest('[data-id]'); if (!r) return;
        P.custom.has(r.dataset.id) ? P.custom.delete(r.dataset.id) : P.custom.add(r.dataset.id);
        r.classList.toggle('on'); $('#p-selcount', host).textContent = `المحدد: ${P.custom.size}`; drawSheet();
      });
      $('#p-selall', host).onclick = () => { shown.forEach((m) => P.custom.add(m.id)); drawList(); drawSheet(); };
      $('#p-selnone', host).onclick = () => { P.custom.clear(); drawList(); drawSheet(); };
    }
  };

  /* --- columns: shown ones (ordered) + the rest to add --- */
  // Sort choices = every column (shown or not), so the list can be ordered by anything.
  const drawSort = () => {
    syncRateCols();
    if (!P.cols.order.includes(P.sort)) P.sort = 'name';
    const el = $('#p-sort', view);
    el.innerHTML = P.cols.order.map((k) => `<option value="${esc(k)}">${esc(LABEL(k))}</option>`).join('');
    el.value = P.sort;
    $('#p-sortdir', view).textContent = P.sortDir > 0 ? 'تصاعدي ▲' : 'تنازلي ▼';
    if (P.sort2 && !P.cols.order.includes(P.sort2)) P.sort2 = '';
    const el2 = $('#p-sort2', view);
    el2.innerHTML = '<option value="">— بدون —</option>' + P.cols.order.map((k) => `<option value="${esc(k)}">${esc(LABEL(k))}</option>`).join('');
    el2.value = P.sort2;
    $('#p-sortdir2', view).textContent = P.sortDir2 > 0 ? 'تصاعدي ▲' : 'تنازلي ▼';
  };
  const drawCols = () => {
    drawSort();
    const act = activeCols();
    const rest = P.cols.order.filter((k) => !P.cols.on.has(k));
    $('#p-active', view).innerHTML = act.map((k, i) => `<span class="cchip">
      <button type="button" class="mvb" data-mv="${esc(k)}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="تقديم">${ic('chevronR', 'sm')}</button>
      <span class="cl">${esc(LABEL(k))}</span>
      ${k === 'name' ? '' : `<button type="button" class="mvb rm" data-off="${esc(k)}" aria-label="إزالة">${ic('x', 'sm')}</button>`}
      <button type="button" class="mvb" data-mv="${esc(k)}" data-d="1" ${i === act.length - 1 ? 'disabled' : ''} aria-label="تأخير">${ic('chevron', 'sm')}</button></span>`).join('');
    $('#p-avail', view).innerHTML = rest.length ? rest.map((k) => `<button type="button" class="tag" data-on="${esc(k)}">${ic('plus', 'sm')}${esc(LABEL(k))}</button>`).join('') : '<span class="muted small">كل الأعمدة ظاهرة</span>';
  };
  $('.ps-cols', view).addEventListener('click', (e) => {
    const off = e.target.closest('[data-off]'), on = e.target.closest('[data-on]'), mv = e.target.closest('[data-mv]');
    if (off) P.cols.on.delete(off.dataset.off);
    else if (on) P.cols.on.add(on.dataset.on);
    else if (mv) {
      const act = activeCols(), i = act.indexOf(mv.dataset.mv), j = i + +mv.dataset.d, o = P.cols.order;
      if (j < 0 || j >= act.length) return;
      const a2 = o.indexOf(act[i]), b2 = o.indexOf(act[j]);
      [o[a2], o[b2]] = [o[b2], o[a2]];
    } else return;
    saveCols(); drawCols(); drawSheet();
  });

  /* --- attendance-rate courses --- */
  const drawRates = () => {
    $$('#p-rates [data-r]', view).forEach((b) => b.classList.toggle('on', P.rate.has(b.dataset.r)));
    const c = $('#p-counts', view); if (c) c.checked = P.showCounts;
  };
  $('#p-rates', view)?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    P.rate.has(b.dataset.r) ? P.rate.delete(b.dataset.r) : P.rate.add(b.dataset.r);
    syncRateCols(); drawRates(); drawCols(); drawWho(); drawSheet();
  });
  $('#p-counts', view)?.addEventListener('change', (e) => { P.showCounts = e.target.checked; syncRateCols(); drawCols(); drawSheet(); });

  /* --- look & feel --- */
  const seg = (id, key, after) => {
    const el = $(id, view);
    const paint = () => $$('button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === P[key]));
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { P[key] = b.dataset.v; paint(); (after || drawSheet)(); } });
    paint();
  };
  seg('#p-mode', 'mode', () => { drawWho(); drawSheet(); });
  seg('#p-orient', 'orient');
  seg('#p-size', 'size');
  const bind = (id, key, type = 'value') => {
    const el = $(id, view);
    el[type === 'checked' ? 'checked' : 'value'] = P[key];
    el.addEventListener(type === 'checked' ? 'change' : 'input', () => { P[key] = type === 'checked' ? el.checked : el.value; drawSheet(); });
  };
  bind('#p-sub', 'subtitle'); bind('#p-sign', 'sign'); $('#p-sort', view).addEventListener('change', (e) => { P.sort = e.target.value; drawSheet(); });
  $('#p-sort2', view).addEventListener('change', (e) => { P.sort2 = e.target.value; drawSheet(); });
  $('#p-sortdir2', view).onclick = () => { P.sortDir2 = -P.sortDir2; drawSort(); drawSheet(); };
  $('#p-sortdir', view).onclick = () => { P.sortDir = -P.sortDir; drawSort(); drawSheet(); };
  bind('#p-logo', 'logo', 'checked'); bind('#p-banded', 'banded', 'checked'); bind('#p-numbers', 'numbers', 'checked');
  // Title: shows the automatic title until you type your own; clearing it (or the button) goes back to automatic.
  $('#p-title', view).value = P.title || autoTitle();
  $('#p-title', view).addEventListener('input', (e) => { P.title = e.target.value.trim() ? e.target.value : ''; drawSheet(); });
  $('#p-title-reset', view).onclick = () => { P.title = ''; $('#p-title', view).value = autoTitle(); drawSheet(); };

  /* --- actions --- */
  $('#opts-toggle', view).onclick = () => {
    const box = $('#print-opts', view);
    box.classList.toggle('hidden');
    $('#opts-toggle span', view).textContent = box.classList.contains('hidden') ? 'إظهار الخيارات' : 'إخفاء الخيارات';
  };
  $('#do-print', view).onclick = () => {
    if (!sections().some((s) => s.members.length)) { toast('لا توجد أسماء للطباعة — اختر الأعضاء أولاً'); return; }
    setPageStyle();
    window.print();
  };
  $('#do-csv', view).onclick = () => {
    const secs = sections();
    const cols = activeCols();
    if (!secs.some((s) => s.members.length)) { toast('لا توجد أسماء للتصدير'); return; }
    const rows = [[...(P.numbers ? ['م'] : []), ...cols.map(LABEL)]];
    secs.forEach((s) => s.members.forEach((m, i) => rows.push([...(P.numbers ? [i + 1] : []), ...cols.map((k) => colValue(k, m))])));
    downloadCsv(`${(P.title.trim() || autoTitle()).slice(0, 60)}_${today()}.csv`, rows);
  };

  drawWho(); drawCols(); drawRates(); drawSheet();
}
