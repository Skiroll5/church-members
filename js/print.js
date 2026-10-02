/**
 * print.js - Professional Print to PDF Formatter using pure Tailwind CSS
 * Prints all groups sequentially with high-resolution logo (Picture5.png), official letterhead, and crisp tables.
 */
import { state } from './state.js';
import { calculateAge } from './ui.js';

export function prepareAndPrint() {
  const filtered = state.getFilteredMembers();
  const printContainer = document.getElementById('print-area');
  if (!printContainer) return;

  const isAllGroups = state.filters.group === 'all';
  let groupLabel = 'الكشف العام الشامل (كافة المجموعات)';
  if (state.filters.group === '__dual__' || state.filters.group === '__multi__') {
    groupLabel = 'الأعضاء المشتركون في عدة مجموعات';
  } else if (state.filters.group === '__no_phone__') {
    groupLabel = 'الأعضاء بدون رقم هاتف';
  } else if (state.filters.group === '__no_dob__') {
    groupLabel = 'الأعضاء بدون تاريخ ميلاد';
  } else if (!isAllGroups) {
    groupLabel = `كشف مجموعة: ${state.filters.group}`;
  }

  const printDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Determine sections to print (current selected group or all groups)
  let groupsToPrint = [];
  if (isAllGroups || state.filters.group === '__all_sunday_school__' || state.filters.group === '__all_service__') {
    groupsToPrint = state.groupTab === 'sunday_school' ? [...state.sundaySchoolClasses] : [...state.serviceGroups];
  } else if (state.filters.group === '__dual__' || state.filters.group === '__multi__') {
    groupsToPrint = ['__multi__'];
  } else if (state.filters.group === '__no_phone__') {
    groupsToPrint = ['__no_phone__'];
  } else if (state.filters.group === '__no_dob__') {
    groupsToPrint = ['__no_dob__'];
  } else {
    groupsToPrint = [state.filters.group];
  }

  let sectionsHtml = '';

  groupsToPrint.forEach((gName, gIdx) => {
    let groupMembers = [];
    let title = gName;

    if (gName === '__dual__' || gName === '__multi__') {
      groupMembers = filtered.filter(m => m.groups && m.groups.length > 1);
      title = 'أعضاء مسجلين في عدة مجموعات في نفس الوقت';
    } else if (gName === '__no_phone__') {
      groupMembers = filtered.filter(m => {
        const hasP = Boolean(m.phone && m.phone.trim());
        const hasF = Boolean(m.fatherPhone && m.fatherPhone.trim());
        const hasM = Boolean(m.motherPhone && m.motherPhone.trim());
        return !hasP && !hasF && !hasM;
      });
      title = 'كشف الأعضاء بدون رقم هاتف';
    } else if (gName === '__no_dob__') {
      groupMembers = filtered.filter(m => !m.dob || !m.dob.trim());
      title = 'كشف الأعضاء بدون تاريخ ميلاد';
    } else {
      groupMembers = filtered.filter(m => m.groups && m.groups.includes(gName));
    }

    if (groupMembers.length === 0) return;

    let rowsHtml = '';
    groupMembers.forEach((m, idx) => {
      const age = calculateAge(m.dob);
      const marriedMark = m.isMarried ? ' *' : '';
      
      let groupsPrintText = '';
      if (Array.isArray(m.groups) && m.groups.length > 0) {
        groupsPrintText = `المجموعات: ${m.groups.join('، ')}`;
      }

      const contacts = [];
      if (m.phone) contacts.push(`<div><span class="text-slate-500 font-sans">شخصي:</span> ${m.phone}</div>`);
      if (m.fatherPhone) contacts.push(`<div><span class="text-slate-500 font-sans">الأب:</span> ${m.fatherPhone}</div>`);
      if (m.motherPhone) contacts.push(`<div><span class="text-slate-500 font-sans">الأم:</span> ${m.motherPhone}</div>`);
      const contactText = contacts.length > 0 ? contacts.join('') : '—';

      let withFamilyText = '—';
      if (m.withFamily === true) withFamilyText = 'نعم';
      else if (m.withFamily === false) withFamilyText = 'لا';

      const rowZebra = idx % 2 === 1 ? 'bg-slate-50' : 'bg-white';

      rowsHtml += `
        <tr class="${rowZebra} border-b border-slate-300 text-[11px] leading-tight break-inside-avoid">
          <td class="p-1.5 text-center font-mono font-bold border-l border-slate-300 w-8">${idx + 1}</td>
          <td class="p-1.5 font-bold text-slate-900 border-l border-slate-300">
            <span>${m.name}${marriedMark}</span>
            ${groupsPrintText ? `<span class="text-[9px] text-slate-500 font-normal block mt-0.5">${groupsPrintText}</span>` : ''}
          </td>
          <td class="p-1.5 text-center border-l border-slate-300 whitespace-nowrap font-mono text-[10px]" dir="ltr">${m.dob || '—'}</td>
          <td class="p-1.5 text-center font-semibold border-l border-slate-300 whitespace-nowrap">${age}</td>
          <td class="p-1.5 border-l border-slate-300 font-mono text-[10px] space-y-0.5" dir="ltr">${contactText}</td>
          <td class="p-1.5 border-l border-slate-300">${m.education || '—'}</td>
          <td class="p-1.5 border-l border-slate-300 font-medium">${m.serviceType || '—'}</td>
          <td class="p-1.5 text-center border-l border-slate-300">${withFamilyText}</td>
          <td class="p-1.5 text-center border-l border-slate-300 font-semibold">${m.gender === 'Female' ? 'أنثى' : 'ذكر'}</td>
          <td class="p-1.5 text-slate-700">${m.notes || '—'}</td>
        </tr>
      `;
    });

    sectionsHtml += `
      <div class="mb-6 break-inside-avoid">
        <div class="flex items-center justify-between bg-slate-100 border border-slate-300 px-3 py-1.5 mb-1.5">
          <h3 class="font-bold text-xs text-slate-900">${title}</h3>
          <span class="text-xs font-mono font-bold text-slate-700">عدد الأفراد: ${groupMembers.length}</span>
        </div>

        <table class="w-full text-right border-collapse border border-slate-300 mb-2">
          <thead>
            <tr class="bg-slate-800 text-white text-[11px] font-bold border-b border-slate-900">
              <th class="p-1.5 text-center border-l border-slate-700 w-8">#</th>
              <th class="p-1.5 border-l border-slate-700">الاسم الكامل</th>
              <th class="p-1.5 text-center border-l border-slate-700 w-24">تاريخ الميلاد</th>
              <th class="p-1.5 text-center border-l border-slate-700 w-20">السن</th>
              <th class="p-1.5 border-l border-slate-700">أرقام التواصل</th>
              <th class="p-1.5 border-l border-slate-700">المؤهل الدراسي</th>
              <th class="p-1.5 border-l border-slate-700">نوع الخدمة</th>
              <th class="p-1.5 text-center border-l border-slate-700 w-14">مع الأسرة</th>
              <th class="p-1.5 text-center border-l border-slate-700 w-12">النوع</th>
              <th class="p-1.5">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  const printHtml = `
    <div class="p-4 bg-white text-slate-900 font-sans">
      <!-- Church Letterhead / Header -->
      <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
        <!-- Right side (Arabic Church Name) -->
        <div class="text-right">
          <h1 class="text-lg font-bold text-slate-900 tracking-tight">كنيسة القديس أثناسيوس الرسولي</h1>
          <p class="text-xs text-slate-700 font-medium">Chiesa Copta Ortodossa di Sant'Atanasio</p>
          <p class="text-xs text-slate-500 mt-1">كشف بيانات المخدومين والخدام - سجل الخدمة</p>
        </div>

        <!-- Center: Church Logo (Picture5.png) -->
        <div class="flex flex-col items-center">
          <img src="Picture5.png" alt="شعار كنيسة القديس أثناسيوس" class="w-14 h-14 object-contain" />
        </div>

        <!-- Left side: Report Metadata -->
        <div class="text-left text-xs space-y-1">
          <div><strong class="text-slate-800">تاريخ الطباعة:</strong> ${printDate}</div>
          <div><strong class="text-slate-800">التوقيت:</strong> ${printTime}</div>
          <div><strong class="text-slate-800">التصنيف:</strong> <span class="font-bold">${groupLabel}</span></div>
          <div><strong class="text-slate-800">إجمالي الأفراد:</strong> <span class="font-bold font-mono">${filtered.length} فرد</span></div>
        </div>
      </div>

      <!-- Information notice -->
      <div class="flex items-center justify-between text-[10px] text-slate-500 mb-3 px-1 border-b border-slate-200 pb-1">
        <span>* علامة النجمة (*) بجوار الاسم تعني متزوج.</span>
        <span>كود التوثيق: SA-${Date.now().toString(36).toUpperCase()}</span>
      </div>

      <!-- Printed Group Sections -->
      ${sectionsHtml}

      <!-- Official Footer -->
      <div class="flex items-center justify-between border-t border-slate-400 pt-2 mt-4 text-[10px] text-slate-500">
        <span>كنيسة القديس أثناسيوس الرسولي - جميع الحقوق محفوظة</span>
        <span>سجل الخدمة الرقمي المعتمد</span>
      </div>
    </div>
  `;

  printContainer.innerHTML = printHtml;
  window.print();
}
