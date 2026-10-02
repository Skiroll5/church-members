/**
 * ui.js - Professional, Color-Coded Tables with Independent Service Type Column
 * DOB as main information and age as subinformation.
 * Latin numbers for timestamps. NO WhatsApp icons.
 */
import { state, ALL_COLUMNS } from './state.js';

// Clean SVG Icon Templates (Strictly NO emojis)
const ICONS = {
  edit: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  delete: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
  phone: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`,
  check: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`,
  undo: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>`
};

/// 12 Harmonic, Church-Appropriate Preset Themes with Distinct Color Schemes & Zebra Banding
export const PRESET_THEMES = {
  indigo: {
    key: 'indigo',
    label: 'نيلي (Indigo)',
    hex: '#4f46e5',
    sectionBorder: 'border-indigo-200 dark:border-indigo-900',
    sectionHeaderBg: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    accentDot: 'bg-indigo-600',
    theadBg: 'bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    zebraRow: 'bg-indigo-50/30 dark:bg-indigo-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  sky: {
    key: 'sky',
    label: 'سماوي (Sky)',
    hex: '#0284c7',
    sectionBorder: 'border-sky-200 dark:border-sky-900',
    sectionHeaderBg: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    accentDot: 'bg-sky-600',
    theadBg: 'bg-sky-100/70 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    zebraRow: 'bg-sky-50/30 dark:bg-sky-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  emerald: {
    key: 'emerald',
    label: 'زمردي (Emerald)',
    hex: '#059669',
    sectionBorder: 'border-emerald-200 dark:border-emerald-900',
    sectionHeaderBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    accentDot: 'bg-emerald-600',
    theadBg: 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    zebraRow: 'bg-emerald-50/30 dark:bg-emerald-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  amber: {
    key: 'amber',
    label: 'كهرماني (Amber)',
    hex: '#d97706',
    sectionBorder: 'border-amber-200 dark:border-amber-900',
    sectionHeaderBg: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    accentDot: 'bg-amber-600',
    theadBg: 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    zebraRow: 'bg-amber-50/30 dark:bg-amber-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  purple: {
    key: 'purple',
    label: 'بنفسجي (Purple)',
    hex: '#7c3aed',
    sectionBorder: 'border-purple-200 dark:border-purple-900',
    sectionHeaderBg: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    accentDot: 'bg-purple-600',
    theadBg: 'bg-purple-100/70 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    zebraRow: 'bg-purple-50/30 dark:bg-purple-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  teal: {
    key: 'teal',
    label: 'تركوازي (Teal)',
    hex: '#0d9488',
    sectionBorder: 'border-teal-200 dark:border-teal-900',
    sectionHeaderBg: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    accentDot: 'bg-teal-600',
    theadBg: 'bg-teal-100/70 dark:bg-teal-950/60 text-teal-950 dark:text-teal-200 border-teal-200 dark:border-teal-800',
    zebraRow: 'bg-teal-50/30 dark:bg-teal-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  rose: {
    key: 'rose',
    label: 'وردي (Rose)',
    hex: '#e11d48',
    sectionBorder: 'border-rose-200 dark:border-rose-900',
    sectionHeaderBg: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    accentDot: 'bg-rose-600',
    theadBg: 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    zebraRow: 'bg-rose-50/30 dark:bg-rose-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  cyan: {
    key: 'cyan',
    label: 'سيان (Cyan)',
    hex: '#0891b2',
    sectionBorder: 'border-cyan-200 dark:border-cyan-900',
    sectionHeaderBg: 'bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
    badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    accentDot: 'bg-cyan-600',
    theadBg: 'bg-cyan-100/70 dark:bg-cyan-950/60 text-cyan-950 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
    zebraRow: 'bg-cyan-50/30 dark:bg-cyan-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  blue: {
    key: 'blue',
    label: 'أزرق (Blue)',
    hex: '#2563eb',
    sectionBorder: 'border-blue-200 dark:border-blue-900',
    sectionHeaderBg: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    accentDot: 'bg-blue-600',
    theadBg: 'bg-blue-100/70 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    zebraRow: 'bg-blue-50/30 dark:bg-blue-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  violet: {
    key: 'violet',
    label: 'أرجواني (Violet)',
    hex: '#8b5cf6',
    sectionBorder: 'border-violet-200 dark:border-violet-900',
    sectionHeaderBg: 'bg-violet-50/80 dark:bg-violet-950/40 text-violet-950 dark:text-violet-200 border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    accentDot: 'bg-violet-600',
    theadBg: 'bg-violet-100/70 dark:bg-violet-950/60 text-violet-950 dark:text-violet-200 border-violet-200 dark:border-violet-800',
    zebraRow: 'bg-violet-50/30 dark:bg-violet-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  orange: {
    key: 'orange',
    label: 'برتقالي (Orange)',
    hex: '#ea580c',
    sectionBorder: 'border-orange-200 dark:border-orange-900',
    sectionHeaderBg: 'bg-orange-50/80 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    accentDot: 'bg-orange-600',
    theadBg: 'bg-orange-100/70 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    zebraRow: 'bg-orange-50/30 dark:bg-orange-950/20',
    baseRow: 'bg-white dark:bg-slate-900'
  },
  slate: {
    key: 'slate',
    label: 'رمادي (Slate)',
    hex: '#475569',
    sectionBorder: 'border-slate-200 dark:border-slate-800',
    sectionHeaderBg: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700',
    badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    accentDot: 'bg-slate-600',
    theadBg: 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    zebraRow: 'bg-slate-50 dark:bg-slate-800/40',
    baseRow: 'bg-white dark:bg-slate-900'
  }
};

export function hexToRgb(hex) {
  let c = (hex || '#4f46e5').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 79, g: 70, b: 229 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function createCustomTheme(hex) {
  const { r, g, b } = hexToRgb(hex);
  return {
    key: hex,
    label: hex,
    hex: hex,
    isCustom: true,
    sectionBorder: 'border-slate-200 dark:border-slate-800',
    sectionStyle: `border-color: rgba(${r}, ${g}, ${b}, 0.35);`,
    sectionHeaderBg: 'bg-white dark:bg-slate-900',
    sectionHeaderStyle: `background-color: rgba(${r}, ${g}, ${b}, 0.08); border-color: rgba(${r}, ${g}, ${b}, 0.25);`,
    badgeBg: '',
    badgeStyle: `background-color: rgba(${r}, ${g}, ${b}, 0.15); color: ${hex};`,
    accentDot: '',
    accentDotStyle: `background-color: ${hex};`,
    theadBg: '',
    theadStyle: `background-color: rgba(${r}, ${g}, ${b}, 0.12); border-color: rgba(${r}, ${g}, ${b}, 0.25);`,
    zebraRow: '',
    zebraRowStyle: `background-color: rgba(${r}, ${g}, ${b}, 0.04);`,
    baseRow: 'bg-white dark:bg-slate-900',
    baseRowStyle: ''
  };
}

export function getGroupTheme(groupName) {
  if (groupName === '__dual__' || groupName === '__multi__') {
    return PRESET_THEMES['slate'];
  }
  if (groupName === '__no_phone__') {
    return PRESET_THEMES['rose'];
  }
  if (groupName === '__no_dob__') {
    return PRESET_THEMES['amber'];
  }
  const color = state.getGroupColor(groupName);
  if (PRESET_THEMES[color]) {
    return PRESET_THEMES[color];
  }
  if (typeof color === 'string' && color.startsWith('#')) {
    return createCustomTheme(color);
  }
  return PRESET_THEMES['indigo'];
}

export const GROUP_THEMES = PRESET_THEMES; // Backward compatibility export

/**
 * Calculates dynamic age from DOB string (never saved in JSON)
 */
export function calculateAge(dobStr) {
  if (!dobStr || dobStr.trim() === '') {
    return '—';
  }

  const trimmed = dobStr.trim();
  if (trimmed.startsWith('00/00/')) {
    const year = trimmed.split('/')[2];
    return `مواليد ${year}`;
  }

  let day, month, year;
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3 && parts[2]) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  } else if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  } else if (/^\d{4}$/.test(trimmed)) {
    year = parseInt(trimmed, 10);
    const diff = new Date().getFullYear() - year;
    return diff > 0 ? `حوالي ${diff} سنة (مواليد ${year})` : `مواليد ${year}`;
  }

  if (!year || isNaN(year) || isNaN(month) || isNaN(day)) {
    return trimmed;
  }

  if (year < 100) year += year > 40 ? 1900 : 2000;

  const birthDate = new Date(year, month, day);
  if (isNaN(birthDate.getTime())) {
    return trimmed;
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return 'حديث الولادة';
  if (years === 0) return months === 0 ? `${days} يوم` : `${months} شهر`;
  if (months === 0) return `${years} سنة`;
  return `${years} سنة و ${months} شهر`;
}

/**
 * Formats ISO timestamp to readable string USING STRICTLY LATIN NUMERALS (0-9)
 * (Avoids Eastern Arabic / Indian digits)
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    // Return format in strict Latin numerals: DD/MM/YYYY HH:mm
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return isoString;
  }
}

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Main render function - Renders color-coded group tables sequentially
 */
export function renderMembersList() {
  const container = document.getElementById('members-container');
  const countEl = document.getElementById('stat-total');
  const emptyStateEl = document.getElementById('empty-state');

  if (!container) return;

  const filteredMembers = state.getFilteredMembers();
  if (countEl) countEl.textContent = filteredMembers.length;

  if (state.members.length === 0) {
    if (emptyStateEl) emptyStateEl.classList.add('hidden');
    container.innerHTML = `
      <div class="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-8">
        <div class="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">منظومة بيانات أعضاء كنيسة القديس أثناسيوس الرسولي</h3>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4 border border-emerald-200 dark:border-emerald-800">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <span>نظام آمن يعمل محلياً 100% داخل المتصفح (حفاظاً على سرية البيانات)</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          حفاظاً على خصوصية بيانات شعب الكنيسة، لا يتم حفظ السجلات على أي خادم خارجي. يمكنك رفع ملف البيانات الخاص بك من جهازك لتصفحه وتعديله، وعند الضغط على <strong>«حفظ التعديلات»</strong> يتم تنزيل الملف المحدث مباشرة إلى جهازك.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" id="btn-empty-upload-file" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            <span>رفع ملف البيانات (.json)</span>
          </button>
          
          <button type="button" id="btn-add-first-member" class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>البدء بسجل جديد فارغ</span>
          </button>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
          أو اسحب ملف البيانات (.json) وأفلته في أي مكان على الشاشة لفتحه مباشرة
        </div>
      </div>
    `;

    const btnUpload = document.getElementById('btn-empty-upload-file');
    if (btnUpload) {
      btnUpload.addEventListener('click', () => {
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) fileInput.click();
      });
    }

    const btnFirst = document.getElementById('btn-add-first-member');
    if (btnFirst) {
      btnFirst.addEventListener('click', () => {
        const btnAdd = document.getElementById('btn-add-member');
        if (btnAdd) btnAdd.click();
      });
    }
    renderStats();
    renderUnsavedStatus();
    return;
  }

  if (filteredMembers.length === 0) {
    container.innerHTML = '';
    if (emptyStateEl) emptyStateEl.classList.remove('hidden');
    renderStats();
    renderUnsavedStatus();
    return;
  }

  if (emptyStateEl) emptyStateEl.classList.add('hidden');

  let groupsToShow = [];
  if (state.filters.group === 'all') {
    groupsToShow = state.groupTab === 'sunday_school' ? [...state.sundaySchoolClasses] : [...state.serviceGroups];
  } else if (state.filters.group === '__all_service__') {
    groupsToShow = [...state.serviceGroups];
  } else if (state.filters.group === '__all_sunday_school__') {
    groupsToShow = [...state.sundaySchoolClasses];
  } else if (state.filters.group === '__dual__' || state.filters.group === '__multi__') {
    groupsToShow = ['__multi__'];
  } else if (state.filters.group === '__no_phone__') {
    groupsToShow = ['__no_phone__'];
  } else if (state.filters.group === '__no_dob__') {
    groupsToShow = ['__no_dob__'];
  } else {
    groupsToShow = [state.filters.group];
  }

  if (groupsToShow.length === 0) {
    if (state.groupTab === 'sunday_school') {
      container.innerHTML = `
        <div class="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto my-8">
          <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">لا توجد فصول مدارس أحد حالياً</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">يمكنك إنشاء فصول مدارس الأحد لاحقاً بحسب الحاجة، وإضافة المخدومين إليها حصراً من قاعدة بيانات الأعضاء المسجلين.</p>
          <button type="button" id="btn-create-first-class" class="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs cursor-pointer inline-flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ إنشاء أول فصل مدارس أحد</span>
          </button>
        </div>
      `;
      const btnFirst = document.getElementById('btn-create-first-class');
      if (btnFirst) btnFirst.addEventListener('click', () => openNewGroupModal('sunday_school'));
      renderStats();
      renderUnsavedStatus();
      return;
    }
  }

  let html = '';

  groupsToShow.forEach((groupName, groupIdx) => {
    let groupMembers = [];
    let sectionTitle = groupName;
    let sectionSubtitle = '';
    const isSpecialGroup = groupName === '__multi__' || groupName === '__no_phone__' || groupName === '__no_dob__';
    const isSundayClass = state.isSundaySchoolClass(groupName);

    if (groupName === '__dual__' || groupName === '__multi__') {
      groupMembers = filteredMembers.filter(m => m.groups && m.groups.length > 1);
      sectionTitle = 'أعضاء مسجلين في عدة مجموعات';
      sectionSubtitle = 'الأعضاء المشاركون في أكثر من مجموعة أو فصل في نفس الوقت';
    } else if (groupName === '__no_phone__') {
      groupMembers = filteredMembers.filter(m => {
        const hasP = Boolean(m.phone && m.phone.trim());
        const hasF = Boolean(m.fatherPhone && m.fatherPhone.trim());
        const hasM = Boolean(m.motherPhone && m.motherPhone.trim());
        return !hasP && !hasF && !hasM;
      });
      sectionTitle = 'أعضاء بدون رقم هاتف';
      sectionSubtitle = 'الأعضاء غير المسجل لهم أي رقم هاتف شخصي أو لأحد الوالدين';
    } else if (groupName === '__no_dob__') {
      groupMembers = filteredMembers.filter(m => !m.dob || !m.dob.trim());
      sectionTitle = 'أعضاء بدون تاريخ ميلاد';
      sectionSubtitle = 'الأعضاء غير المسجل لهم تاريخ ميلاد أو سن';
    } else {
      groupMembers = filteredMembers.filter(m => m.groups && m.groups.includes(groupName));
      sectionSubtitle = isSundayClass
        ? `فصل مدارس الأحد • كنيسة القديس أثناسيوس الرسولي`
        : `سجل أعضاء ومخدومي ${groupName}`;
    }

    if (groupMembers.length === 0 && state.filters.search) {
      return;
    }

    const theme = getGroupTheme(groupName);
    const sectionId = `group-section-${groupIdx}`;
    const addExistingBtnText = isSundayClass ? '+ إضافة مخدومين للفصل' : '+ إضافة أعضاء للمجموعة';
    const addNewBtnText = '+ عضو جديد';

    html += `
      <section id="${sectionId}" class="scroll-mt-24 mb-6 bg-white dark:bg-slate-900 rounded-xl border ${theme.sectionBorder} shadow-xs overflow-hidden" ${theme.sectionStyle ? `style="${theme.sectionStyle}"` : ''}>
        <!-- Themed Section Header Banner -->
        <div class="px-4 py-2.5 ${theme.sectionHeaderBg} border-b flex flex-wrap items-center justify-between gap-3" ${theme.sectionHeaderStyle ? `style="${theme.sectionHeaderStyle}"` : ''}>
          <div class="flex items-center gap-2.5">
            ${!isSpecialGroup ? `
              <button type="button" class="btn-color-picker-trigger flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-slate-400 transition-all cursor-pointer" data-group="${groupName}" title="انقر لتغيير لون المجموعة">
                <span class="w-3.5 h-3.5 rounded-full shadow-xs border border-white/50 block ${theme.accentDot}" ${theme.accentDotStyle ? `style="${theme.accentDotStyle}"` : ''}></span>
              </button>
            ` : `
              <span class="w-2.5 h-2.5 rounded-full ${theme.accentDot}"></span>
            `}
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold tracking-tight">
                  ${sectionTitle}
                </h2>
                <span class="text-xs font-bold px-2 py-0.2 rounded-full ${theme.badgeBg} font-mono" ${theme.badgeStyle ? `style="${theme.badgeStyle}"` : ''}>
                  ${groupMembers.length} فرد
                </span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">${sectionSubtitle}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${!isSpecialGroup ? `
              <button type="button" class="btn-color-picker-trigger text-xs font-medium px-2 py-1 rounded bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer" data-group="${groupName}" title="تغيير لون المجموعة">
                <span class="w-2.5 h-2.5 rounded-full ${theme.accentDot}" ${theme.accentDotStyle ? `style="${theme.accentDotStyle}"` : ''}></span>
                <span>تغيير اللون</span>
              </button>
              <button type="button" class="btn-open-add-existing text-xs font-semibold px-2.5 py-1 rounded ${isSundayClass ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'} transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5" data-group="${groupName}" title="${isSundayClass ? 'إضافة مخدومين للفصل من قاعدة بيانات الأعضاء المسجلين' : 'إضافة أعضاء مسجلين بالفعل إلى هذه المجموعة'}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                <span>${addExistingBtnText}</span>
              </button>
              ${!isSundayClass ? `
                <button type="button" class="btn-add-to-group text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer" data-group="${groupName}">
                  ${addNewBtnText}
                </button>
              ` : ''}
            ` : ''}
          </div>
        </div>

        <!-- Themed Section Content (Table or Responsive Cards) -->
        ${groupMembers.length > 0
          ? (state.viewMode === 'cards' ? renderGroupCards(groupMembers, groupName, theme) : renderGroupTable(groupMembers, groupName, theme))
          : `
          <div class="p-6 text-center text-xs text-slate-400">
            لا توجد سجلات في هذه المجموعة تطابق شروط التصفية الحالية.
          </div>
        `}
      </section>
    `;
  });

  container.innerHTML = html;

  renderStats();
  renderUnsavedStatus();
}

/**
 * Renders color-coded table (WITHOUT CHECKBOXES) with:
 * 1. BOD as main information, Age as subinformation
 * 2. Independent Service Type column
 * 3. NO WhatsApp icon
 * 4. Latin numerals for timestamps
 */
function renderGroupTable(members, currentGroupName, theme) {
  let rowsHtml = '';

  const getSortIndicator = (field) => {
    if (state.sort.field === field) {
      return state.sort.direction === 'asc' ? '<span class="text-slate-900 dark:text-white font-bold text-[10px] mr-1">▲</span>' : '<span class="text-slate-900 dark:text-white font-bold text-[10px] mr-1">▼</span>';
    }
    return '<span class="text-slate-300 dark:text-slate-600 text-[10px] mr-1">↕</span>';
  };

  members.forEach((m, idx) => {
    const isDirty = state.isMemberDirty(m.id);
    const isNew = state.isMemberNew(m.id);
    
    // Dynamic age calculation
    const age = calculateAge(m.dob);

    // Color-coded zebra row banding based on the group's theme
    let rowClasses = isNew
      ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
      : isDirty
      ? 'bg-amber-50/50 dark:bg-amber-950/30'
      : idx % 2 === 1
      ? theme.zebraRow
      : theme.baseRow;

    let rowStyleAttr = '';
    if (!isNew && !isDirty && idx % 2 === 1 && theme.zebraRowStyle) {
      rowStyleAttr = `style="${theme.zebraRowStyle}"`;
    }

    let statusBadge = '';
    if (isNew) {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
          جديد
        </span>`;
    } else if (isDirty) {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
          معدل
        </span>`;
    }

    const marriedBadge = m.isMarried
      ? `<span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal mr-1.5" title="متزوج">(متزوج)</span>`
      : '';

    // Always show all groups the member belongs to under their name
    let groupsUnderNameHtml = '';
    if (Array.isArray(m.groups) && m.groups.length > 0) {
      groupsUnderNameHtml = `
        <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1">
          <span class="text-slate-400">المجموعات:</span>
          ${m.groups.map(g => `
            <span class="inline-block px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              ${g}
            </span>
          `).join('')}
        </div>
      `;
    }

    // Aligned Phone Numbers (Personal, Father, Mother) with clean typography (No badges/boxes)
    let phoneDisplay = '';
    const phoneItems = [];
    if (m.phone) {
      const cleanPhone = cleanPhoneNumber(m.phone);
      phoneItems.push(`
        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="w-9 shrink-0 text-slate-400 dark:text-slate-500 font-sans text-[11px] text-right">شخصي:</span>
          <a href="tel:${cleanPhone}" class="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 hover:underline tracking-tight" dir="ltr">${m.phone}</a>
        </div>
      `);
    }

    if (m.fatherPhone) {
      const cleanFather = cleanPhoneNumber(m.fatherPhone);
      phoneItems.push(`
        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="w-9 shrink-0 text-slate-400 dark:text-slate-500 font-sans text-[11px] text-right">الأب:</span>
          <a href="tel:${cleanFather}" class="font-mono text-xs text-slate-700 dark:text-slate-300 hover:underline tracking-tight" dir="ltr">${m.fatherPhone}</a>
        </div>
      `);
    }

    if (m.motherPhone) {
      const cleanMother = cleanPhoneNumber(m.motherPhone);
      phoneItems.push(`
        <div class="flex items-center gap-2 whitespace-nowrap">
          <span class="w-9 shrink-0 text-slate-400 dark:text-slate-500 font-sans text-[11px] text-right">الأم:</span>
          <a href="tel:${cleanMother}" class="font-mono text-xs text-slate-700 dark:text-slate-300 hover:underline tracking-tight" dir="ltr">${m.motherPhone}</a>
        </div>
      `);
    }

    if (phoneItems.length > 0) {
      phoneDisplay = `<div class="space-y-1 font-mono text-xs">${phoneItems.join('')}</div>`;
    } else {
      phoneDisplay = `<span class="text-xs text-slate-400">لا يوجد هاتف</span>`;
    }

    // Independent Service Type column
    const serviceTypeDisplay = m.serviceType
      ? `<span class="font-medium text-slate-800 dark:text-slate-200 text-xs">${m.serviceType}</span>`
      : `<span class="text-slate-400 text-xs">—</span>`;

    // With Family boolean - normal text (not green or black)
    let withFamilyDisplay = '<span class="text-xs text-slate-400 font-normal">—</span>';
    if (m.withFamily === true) {
      withFamilyDisplay = `<span class="text-xs text-slate-600 dark:text-slate-400 font-normal">نعم</span>`;
    } else if (m.withFamily === false) {
      withFamilyDisplay = `<span class="text-xs text-slate-600 dark:text-slate-400 font-normal">لا</span>`;
    }

    // Last Updated strictly in Latin Numerals (0-9)
    const updatedFormatted = formatDateTime(m.lastUpdated);

    rowsHtml += `
      <tr class="${rowClasses} border-b border-slate-100 dark:border-slate-800/60" data-member-id="${m.id}" ${rowStyleAttr}>
        <td class="py-2.5 px-2 text-center text-xs font-mono text-slate-400 w-10">${idx + 1}</td>
        
        <!-- Name -->
        <td class="py-2.5 px-3">
          <div class="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
            <span>${m.name}</span>
            ${marriedBadge}
          </div>
          ${groupsUnderNameHtml}
          <div class="mt-0.5">${statusBadge}</div>
        </td>

        ${state.isColumnVisible('dob') ? `
        <!-- BOD as MAIN information, Age as SUBINFORMATION -->
        <td class="py-2.5 px-3 whitespace-nowrap">
          <div class="font-bold text-slate-900 dark:text-white font-mono text-xs tracking-tight" dir="ltr">
            ${m.dob || '—'}
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            ${age}
          </div>
        </td>` : ''}

        ${state.isColumnVisible('phone') ? `
        <!-- Phones (Personal, Father, Mother) with aligned columns -->
        <td class="py-2.5 px-3 whitespace-nowrap">
          ${phoneDisplay}
        </td>` : ''}

        ${state.isColumnVisible('education') ? `
        <!-- Education -->
        <td class="py-2.5 px-3 text-xs">
          <div>${m.education || '—'}</div>
          ${m.notes ? `<div class="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate" title="${m.notes}">${m.notes}</div>` : ''}
        </td>` : ''}

        ${state.isColumnVisible('serviceType') ? `
        <!-- INDEPENDENT COLUMN: Service Type -->
        <td class="py-2.5 px-3 text-xs whitespace-nowrap">
          ${serviceTypeDisplay}
        </td>` : ''}

        ${state.isColumnVisible('withFamily') ? `
        <!-- With Family (Normal text) -->
        <td class="py-2.5 px-3 text-center whitespace-nowrap text-xs">
          ${withFamilyDisplay}
        </td>` : ''}

        ${state.isColumnVisible('gender') ? `
        <!-- Gender -->
        <td class="py-2.5 px-3 text-center whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
          ${m.gender === 'Female' ? 'أنثى' : 'ذكر'}
        </td>` : ''}

        ${state.isColumnVisible('lastUpdated') ? `
        <!-- Last Updated with Latin Numbers (0-9) -->
        <td class="py-2.5 px-3 whitespace-nowrap text-xs">
          <div class="font-mono text-slate-700 dark:text-slate-300 font-medium" dir="ltr">
            ${updatedFormatted}
          </div>
        </td>` : ''}

        <!-- Actions: Undo (for edited/new), Confirm Data, Edit, Delete (Sticky left pinned on mobile scroll) -->
        <td class="py-2.5 px-3 text-center whitespace-nowrap w-28 sticky left-0 ${rowClasses} z-10 border-r border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]" ${rowStyleAttr}>
          <div class="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            ${(isDirty || isNew) ? `
              <button type="button" class="btn-undo-row p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded cursor-pointer transition-colors" data-id="${m.id}" title="${isNew ? 'إلغاء إضافة هذا العضو الجديد' : 'تراجع عن تعديل هذا السجل فقط واستعادة بياناته الأصلية'}">
                ${ICONS.undo}
              </button>
            ` : ''}
            <button type="button" class="btn-confirm-verify p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded cursor-pointer transition-colors" data-id="${m.id}" title="تأكيد ومراجعة البيانات (تحديث تاريخ آخر مراجعة)">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button type="button" class="btn-edit p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 rounded cursor-pointer" data-id="${m.id}" title="تعديل">
              ${ICONS.edit}
            </button>
            <button type="button" class="btn-delete p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer" data-id="${m.id}" title="حذف">
              ${ICONS.delete}
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  return `
    <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
      <table class="w-full min-w-[860px] text-right text-xs text-slate-700 dark:text-slate-300">
        <thead class="${theme.theadBg} text-[11px] font-bold border-b uppercase tracking-wider select-none" ${theme.theadStyle ? `style="${theme.theadStyle}"` : ''}>
          <tr>
            <th class="py-2 px-2 text-center w-10 font-mono text-slate-400">#</th>
            <th class="py-2 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="name">
              <span>الاسم</span> ${getSortIndicator('name')}
            </th>
            ${state.isColumnVisible('dob') ? `
            <th class="py-2 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="dob">
              <span>تاريخ الميلاد / السن</span> ${getSortIndicator('dob')}
            </th>` : ''}
            ${state.isColumnVisible('phone') ? `
            <th class="py-2 px-3">
              <span>أرقام التواصل</span>
            </th>` : ''}
            ${state.isColumnVisible('education') ? `
            <th class="py-2 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="education">
              <span>المؤهل الدراسي</span> ${getSortIndicator('education')}
            </th>` : ''}
            ${state.isColumnVisible('serviceType') ? `
            <th class="py-2 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="serviceType">
              <span>نوع الخدمة</span> ${getSortIndicator('serviceType')}
            </th>` : ''}
            ${state.isColumnVisible('withFamily') ? `
            <th class="py-2 px-3 text-center">
              <span>مع الأسرة</span>
            </th>` : ''}
            ${state.isColumnVisible('gender') ? `
            <th class="py-2 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="gender">
              <span>النوع</span> ${getSortIndicator('gender')}
            </th>` : ''}
            ${state.isColumnVisible('lastUpdated') ? `
            <th class="py-2 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" data-sort="lastUpdated">
              <span>آخر تحديث</span> ${getSortIndicator('lastUpdated')}
            </th>` : ''}
            <th class="py-2 px-3 text-center w-28 sticky left-0 ${theme.theadBg} z-20 border-r border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]" ${theme.theadStyle ? `style="${theme.theadStyle}"` : ''}>إجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders modern, responsive card-based layout (ideal for mobile phones & touch devices)
 */
function renderGroupCards(members, currentGroupName, theme) {
  let cardsHtml = '';

  members.forEach((m, idx) => {
    const isDirty = state.isMemberDirty(m.id);
    const isNew = state.isMemberNew(m.id);
    const age = calculateAge(m.dob);

    let cardBorder = theme.sectionBorder;
    let cardBg = 'bg-white dark:bg-slate-900';
    if (isNew) {
      cardBg = 'bg-emerald-50/40 dark:bg-emerald-950/20';
      cardBorder = 'border-emerald-300 dark:border-emerald-700';
    } else if (isDirty) {
      cardBg = 'bg-amber-50/40 dark:bg-amber-950/20';
      cardBorder = 'border-amber-300 dark:border-amber-700';
    }

    let statusBadge = '';
    if (isNew) {
      statusBadge = `
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
          جديد
        </span>`;
    } else if (isDirty) {
      statusBadge = `
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
          معدل
        </span>`;
    }

    const marriedBadge = m.isMarried
      ? `<span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal mr-1" title="متزوج">(متزوج)</span>`
      : '';

    // Groups under name
    let groupsHtml = '';
    if (Array.isArray(m.groups) && m.groups.length > 0) {
      groupsHtml = `
        <div class="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
          <span class="text-slate-400">المجموعات:</span>
          ${m.groups.map(g => `
            <span class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              ${g}
            </span>
          `).join('')}
        </div>
      `;
    }

    // Phone numbers with direct tap-to-call links
    const phoneItems = [];
    if (m.phone) {
      const clean = cleanPhoneNumber(m.phone);
      phoneItems.push(`
        <div class="flex items-center justify-between text-xs py-0.5">
          <span class="text-slate-400 text-[11px]">شخصي:</span>
          <a href="tel:${clean}" class="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1" dir="ltr">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>${m.phone}</span>
          </a>
        </div>
      `);
    }
    if (m.fatherPhone) {
      const clean = cleanPhoneNumber(m.fatherPhone);
      phoneItems.push(`
        <div class="flex items-center justify-between text-xs py-0.5">
          <span class="text-slate-400 text-[11px]">الأب:</span>
          <a href="tel:${clean}" class="font-mono text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1" dir="ltr">
            <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>${m.fatherPhone}</span>
          </a>
        </div>
      `);
    }
    if (m.motherPhone) {
      const clean = cleanPhoneNumber(m.motherPhone);
      phoneItems.push(`
        <div class="flex items-center justify-between text-xs py-0.5">
          <span class="text-slate-400 text-[11px]">الأم:</span>
          <a href="tel:${clean}" class="font-mono text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1" dir="ltr">
            <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>${m.motherPhone}</span>
          </a>
        </div>
      `);
    }

    const phonesHtml = phoneItems.length > 0
      ? `<div class="space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800/60">${phoneItems.join('')}</div>`
      : `<span class="text-xs text-slate-400">لا يوجد رقم هاتف</span>`;

    let withFamilyDisplay = '—';
    if (m.withFamily === true) withFamilyDisplay = 'نعم';
    else if (m.withFamily === false) withFamilyDisplay = 'لا';

    const updatedFormatted = formatDateTime(m.lastUpdated);

    cardsHtml += `
      <div class="member-card rounded-xl border ${cardBorder} ${cardBg} p-3.5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs relative" data-member-id="${m.id}">
        <div>
          <!-- Card Header: Name, Married, Gender, Status -->
          <div class="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-mono text-slate-400">#${idx + 1}</span>
                <h3 class="font-bold text-slate-900 dark:text-white text-sm">
                  ${m.name}
                </h3>
                ${marriedBadge}
                ${state.isColumnVisible('gender') ? `
                <span class="text-[10px] px-1.5 py-0.2 rounded font-medium ${m.gender === 'Female' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900/50' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50'}">
                  ${m.gender === 'Female' ? 'أنثى' : 'ذكر'}
                </span>` : ''}
              </div>
              ${groupsHtml}
            </div>
            ${statusBadge ? `<div class="shrink-0">${statusBadge}</div>` : ''}
          </div>

          <!-- Card Body: Structured Details -->
          <div class="py-2.5 space-y-2 text-xs">
            ${state.isColumnVisible('dob') ? `
            <!-- DOB & Age -->
            <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 text-[11px]">الميلاد / السن:</span>
              <div class="text-left flex items-center gap-1.5">
                <span class="font-bold text-slate-900 dark:text-white font-mono text-xs" dir="ltr">${m.dob || '—'}</span>
                <span class="text-[11px] text-slate-500 font-sans">(${age})</span>
              </div>
            </div>` : ''}

            ${state.isColumnVisible('phone') ? `
            <!-- Phone Numbers with direct tap-to-call -->
            <div class="bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              ${phonesHtml}
            </div>` : ''}

            ${(state.isColumnVisible('education') || state.isColumnVisible('serviceType')) ? `
            <!-- Additional Info Grid -->
            <div class="grid grid-cols-${state.isColumnVisible('education') && state.isColumnVisible('serviceType') ? '2' : '1'} gap-2 text-[11px]">
              ${state.isColumnVisible('education') ? `
              <div class="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px]">المؤهل الدراسي:</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">${m.education || '—'}</span>
              </div>` : ''}
              ${state.isColumnVisible('serviceType') ? `
              <div class="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px]">نوع الخدمة:</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">${m.serviceType || '—'}</span>
              </div>` : ''}
            </div>` : ''}

            ${state.isColumnVisible('withFamily') ? `
            <!-- With Family -->
            <div class="flex items-center justify-between px-2 text-[11px] text-slate-500">
              <span>مع الأسرة:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">${withFamilyDisplay}</span>
            </div>` : ''}

            ${m.notes ? `
              <div class="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/60 dark:border-amber-900/40 italic">
                <strong>ملاحظة:</strong> ${m.notes}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Card Footer: Last Updated & Action Buttons -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-1">
          <div class="text-[10px] text-slate-400 font-mono" dir="ltr" title="تاريخ آخر مراجعة">
            ${state.isColumnVisible('lastUpdated') ? updatedFormatted : ''}
          </div>

          <div class="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            ${(isDirty || isNew) ? `
              <button type="button" class="btn-undo-row p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded cursor-pointer transition-colors" data-id="${m.id}" title="${isNew ? 'إلغاء إضافة هذا العضو الجديد' : 'تراجع عن تعديل هذا السجل فقط واستعادة بياناته الأصلية'}">
                ${ICONS.undo}
              </button>
            ` : ''}
            <button type="button" class="btn-confirm-verify p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded cursor-pointer transition-colors" data-id="${m.id}" title="تأكيد ومراجعة البيانات (تحديث تاريخ آخر مراجعة)">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button type="button" class="btn-edit p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer" data-id="${m.id}" title="تعديل">
              ${ICONS.edit}
            </button>
            <button type="button" class="btn-delete p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer" data-id="${m.id}" title="حذف">
              ${ICONS.delete}
            </button>
          </div>
        </div>

      </div>
    `;
  });

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-3.5">
      ${cardsHtml}
    </div>
  `;
}

export function renderStats() {
  const stats = state.getStats();

  const totalEl = document.getElementById('stat-total');
  if (totalEl) totalEl.textContent = stats.total;

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    let currentKey = state.sort.field;
    if (state.sort.field === 'default_church_sort') {
      currentKey = 'default_church_sort';
    } else {
      currentKey = `${state.sort.field}_${state.sort.direction}`;
    }
    if (sortSelect.querySelector(`option[value="${currentKey}"]`)) {
      sortSelect.value = currentKey;
    } else if (sortSelect.querySelector(`option[value="${state.sort.field}_asc"]`)) {
      sortSelect.value = `${state.sort.field}_asc`;
    }
  }

  // Sync View Mode Toggle Buttons (Table vs Mobile Cards)
  const btnTable = document.getElementById('btn-view-table');
  const btnCards = document.getElementById('btn-view-cards');
  if (btnTable && btnCards) {
    if (state.viewMode === 'cards') {
      btnCards.className = 'px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs';
      btnTable.className = 'px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer';
    } else {
      btnTable.className = 'px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs';
      btnCards.className = 'px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer';
    }
  }

  const jumpContainer = document.getElementById('group-jump-nav');
  if (jumpContainer) {
    const isServiceTab = state.groupTab === 'service';
    const activeList = isServiceTab ? state.serviceGroups : state.sundaySchoolClasses;
    const allButtonLabel = isServiceTab ? `كافة مجموعات الخدمة (${stats.total})` : `كافة فصول مدارس الأحد (${stats.sundaySchoolTotal})`;
    const allGroupFilterValue = isServiceTab ? 'all' : '__all_sunday_school__';
    const isAllActive = state.filters.group === 'all' || (isServiceTab && state.filters.group === '__all_service__') || (!isServiceTab && state.filters.group === '__all_sunday_school__');

    let jumpHtml = `
      <div class="space-y-2 select-none">
        <!-- Row 1: Semantic Tabs & Dynamic Action Button -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
          <div class="flex items-center gap-1.5 text-xs">
            <button type="button" class="group-tab-btn px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${isServiceTab ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}" data-tab="service">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span>مجموعات ومراحل الخدمة</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${isServiceTab ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${state.serviceGroups.length}</span>
            </button>

            <button type="button" class="group-tab-btn px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${!isServiceTab ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}" data-tab="sunday_school">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              <span>فصول مدارس الأحد</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${!isServiceTab ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${state.sundaySchoolClasses.length}</span>
            </button>
          </div>

          <div>
            ${isServiceTab ? `
              <button type="button" id="btn-open-new-group-modal" data-type="service" class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1" title="إنشاء مجموعة خدمة جديدة">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ مجموعة جديدة</span>
              </button>
            ` : `
              <button type="button" id="btn-open-new-class-modal" data-type="sunday_school" class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1" title="إنشاء فصل مدارس أحد جديد">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ فصل جديد</span>
              </button>
            `}
          </div>
        </div>

        <!-- Row 2: Draggable Active Group Chips List -->
        <div id="drag-group-list" class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <!-- All in tab button -->
          <button type="button" class="group-nav-btn px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors shadow-2xs ${isAllActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}" data-group="${allGroupFilterValue}">
            ${allButtonLabel}
          </button>
    `;

    // Draggable chips for active category
    activeList.forEach((g, idx) => {
      const count = stats.groupCounts[g] || 0;
      const isActive = state.filters.group === g;
      const theme = getGroupTheme(g);

      jumpHtml += `
        <div class="group-draggable-chip flex items-center bg-white dark:bg-slate-800 border ${isActive ? 'border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'} rounded-md py-0.5 px-1 shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing group/chip"
             draggable="true"
             data-group="${g}"
             data-index="${idx}"
             title="اسحب لإعادة الترتيب • انقر على النقطة لتغيير اللون">
          
          <!-- Grip Icon for Dragging -->
          <span class="drag-grip p-0.5 text-slate-300 dark:text-slate-600 group-hover/chip:text-slate-500 cursor-grab active:cursor-grabbing" title="اسحب لإعادة الترتيب">
            <svg class="w-3 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/>
              <circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>
              <circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>
            </svg>
          </span>

          <!-- Color Dot Button -->
          <button type="button" class="btn-color-picker-trigger p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" data-group="${g}" title="انقر لتغيير لون ${g}">
            <span class="w-2.5 h-2.5 rounded-full block shadow-2xs ${theme.accentDot}" ${theme.accentDotStyle ? `style="${theme.accentDotStyle}"` : ''}></span>
          </button>

          <!-- Group Filter Button -->
          <button type="button" class="group-nav-btn px-1.5 py-0.5 font-semibold text-xs whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer" data-group="${g}">
            <span>${g}</span>
            <span class="mr-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${count}</span>
          </button>
        </div>
      `;
    });

    if (!isServiceTab && activeList.length === 0) {
      jumpHtml += `
        <span class="text-xs text-slate-400 py-1 px-2 italic whitespace-nowrap">لم يتم إنشاء أي فصول مدارس أحد بعد. اضغط على "+ فصل جديد" بالأعلى لإنشاء أول فصل.</span>
      `;
    }

    jumpHtml += `
        </div>
      </div>
    `;

    jumpContainer.innerHTML = jumpHtml;
  }

  // Render Dedicated Semantic Audit & Diagnostics Bar (Completely distinct from groups)
  const auditContainer = document.getElementById('audit-filters-bar');
  if (auditContainer) {
    const isMultiActive = state.filters.group === '__multi__';
    const isNoPhoneActive = state.filters.group === '__no_phone__';
    const isNoDobActive = state.filters.group === '__no_dob__';
    const isEditedActive = state.filters.editedOnly;
    const isAnyAuditActive = isMultiActive || isNoPhoneActive || isNoDobActive || isEditedActive;

    auditContainer.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 pl-1">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            <span>فلاتر التدقيق ومراجعة البيانات:</span>
          </div>

          <!-- 1. Multi Groups Audit Filter -->
          <button type="button" class="audit-filter-btn px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isMultiActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}" data-audit="__multi__" title="عرض الأعضاء المسجلين في أكثر من مجموعة">
            <span>في عدة مجموعات</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${isMultiActive ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${stats.multiCount}</span>
          </button>

          <!-- 2. No Phone Audit Filter -->
          <button type="button" class="audit-filter-btn px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isNoPhoneActive ? 'bg-rose-600 text-white shadow-xs' : 'bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'}" data-audit="__no_phone__" title="عرض الأعضاء بدون أي رقم هاتف شخصي أو للوالدين">
            <svg class="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            <span>بدون هاتف</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${isNoPhoneActive ? 'bg-rose-700 text-white' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}">${stats.missingPhoneCount}</span>
          </button>

          <!-- 3. No Date of Birth Audit Filter -->
          <button type="button" class="audit-filter-btn px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isNoDobActive ? 'bg-amber-600 text-white shadow-xs' : 'bg-white hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'}" data-audit="__no_dob__" title="عرض الأعضاء بدون تاريخ ميلاد أو سن">
            <svg class="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>بدون تاريخ ميلاد</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${isNoDobActive ? 'bg-amber-700 text-white' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}">${stats.missingDobCount}</span>
          </button>

          <!-- 4. Edited Rows Toggle Filter -->
          <button type="button" class="audit-filter-btn px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isEditedActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}" data-audit="__edited_only__" title="تصفية السجلات التي تم تعديلها أو إضافتها فقط">
            <span>السجلات المعدلة</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${isEditedActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${stats.unsavedCount}</span>
          </button>
        </div>

        ${isAnyAuditActive ? `
          <button type="button" id="btn-reset-audit-filters" class="px-2.5 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer flex items-center gap-1" title="إلغاء فلاتر التدقيق واستعادة عرض المجموعات">
            <span>✕ إلغاء تصفية التدقيق</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  // Populate Column Visibility Checkboxes & Badge
  const colListEl = document.getElementById('column-checkboxes-list');
  const colBadgeEl = document.getElementById('columns-count-badge');
  const visibleCount = ALL_COLUMNS.filter(c => state.isColumnVisible(c.key)).length;

  if (colBadgeEl) {
    colBadgeEl.textContent = `${visibleCount}`;
  }

  if (colListEl) {
    colListEl.innerHTML = ALL_COLUMNS.map(col => {
      const isChecked = state.isColumnVisible(col.key);
      return `
        <label class="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer select-none transition-colors">
          <span class="text-slate-700 dark:text-slate-300 text-xs font-medium">${col.label}</span>
          <input type="checkbox" class="col-toggle-checkbox accent-indigo-600 rounded cursor-pointer w-3.5 h-3.5" data-col="${col.key}" ${isChecked ? 'checked' : ''}>
        </label>
      `;
    }).join('');
  }
}

export function renderUnsavedStatus() {
  const count = state.getUnsavedCount();
  const hasChanges = count > 0;

  const floatingBar = document.getElementById('floating-unsaved-bar');
  const floatingCount = document.getElementById('floating-unsaved-count');
  const toggleBtn = document.getElementById('btn-toggle-edited-only');
  const toggleText = document.getElementById('btn-toggle-edited-text');

  if (floatingBar) {
    if (hasChanges) {
      floatingBar.classList.remove('hidden', 'translate-y-24');
      floatingBar.classList.add('translate-y-0');
      if (floatingCount) floatingCount.textContent = count;

      if (toggleBtn && toggleText) {
        if (state.filters.editedOnly) {
          toggleText.textContent = 'عرض كافة السجلات';
          toggleBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs';
        } else {
          toggleText.textContent = 'عرض المعدلة فقط';
          toggleBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer';
        }
      }
    } else {
      if (state.filters.editedOnly) {
        state.filters.editedOnly = false;
        renderMembersList();
        return;
      }
      floatingBar.classList.add('translate-y-24');
      setTimeout(() => {
        if (!state.hasUnsavedChanges()) floatingBar.classList.add('hidden');
      }, 300);
    }
  }
}

// -------------------------------------------------------------
// Color Picker Popover Management
// -------------------------------------------------------------
let activeColorPickerGroup = null;

export function openColorPicker(triggerEl, groupName) {
  activeColorPickerGroup = groupName;
  const popover = document.getElementById('color-picker-popover');
  const groupNameEl = document.getElementById('color-picker-group-name');
  const currentDotEl = document.getElementById('color-picker-current-dot');
  const presetsContainer = document.getElementById('color-picker-presets');
  const customInput = document.getElementById('custom-group-color-input');

  if (!popover || !triggerEl) return;

  if (groupNameEl) groupNameEl.textContent = groupName;

  const currentTheme = getGroupTheme(groupName);
  if (currentDotEl) {
    currentDotEl.style.backgroundColor = currentTheme.hex;
  }
  if (customInput) {
    customInput.value = currentTheme.hex.startsWith('#') ? currentTheme.hex : '#4f46e5';
  }

  // Populate presets
  if (presetsContainer) {
    let presetsHtml = '';
    const currentColor = state.getGroupColor(groupName);
    Object.values(PRESET_THEMES).forEach(preset => {
      const isSelected = currentColor === preset.key || currentColor === preset.hex;
      presetsHtml += `
        <button type="button" class="btn-select-preset relative flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer" data-color="${preset.key}" title="${preset.label}">
          <span class="w-6 h-6 rounded-full shadow-xs flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110' : ''}" style="background-color: ${preset.hex}">
            ${isSelected ? '<span class="text-white text-[10px] font-bold">✓</span>' : ''}
          </span>
          <span class="text-[9px] text-slate-600 dark:text-slate-400 truncate max-w-full">${preset.key}</span>
        </button>
      `;
    });
    presetsContainer.innerHTML = presetsHtml;
  }

  // Position popover near triggerEl
  const rect = triggerEl.getBoundingClientRect();
  const popoverWidth = 240;
  let top = rect.bottom + window.scrollY + 6;
  let left = rect.left + window.scrollX - (popoverWidth / 2) + (rect.width / 2);

  // Keep within viewport horizontally
  if (left < 10) left = 10;
  if (left + popoverWidth > window.innerWidth - 10) {
    left = window.innerWidth - popoverWidth - 10;
  }

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
  popover.classList.remove('hidden');
}

export function closeColorPicker() {
  const popover = document.getElementById('color-picker-popover');
  if (popover) {
    popover.classList.add('hidden');
  }
  activeColorPickerGroup = null;
}

export function initColorPicker() {
  const popover = document.getElementById('color-picker-popover');
  if (!popover) return;

  const closeBtn = document.getElementById('btn-close-color-picker');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeColorPicker);
  }

  // Preset click delegation
  popover.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('.btn-select-preset');
    if (presetBtn && activeColorPickerGroup) {
      const colorKey = presetBtn.dataset.color;
      state.setGroupColor(activeColorPickerGroup, colorKey);
      closeColorPicker();
      renderMembersList();
      showToast(`تم تغيير لون "${activeColorPickerGroup}" بنجاح`, 'success');
    }
  });

  // Custom color input
  const customInput = document.getElementById('custom-group-color-input');
  if (customInput) {
    customInput.addEventListener('change', (e) => {
      if (activeColorPickerGroup) {
        state.setGroupColor(activeColorPickerGroup, e.target.value);
        closeColorPicker();
        renderMembersList();
        showToast(`تم تغيير لون "${activeColorPickerGroup}" بنجاح`, 'success');
      }
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (popover.classList.contains('hidden')) return;
    if (e.target.closest('#color-picker-popover')) return;
    if (e.target.closest('.btn-color-picker-trigger')) return;
    closeColorPicker();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.classList.contains('hidden')) {
      closeColorPicker();
    }
  });
}

// -------------------------------------------------------------
// Add Existing Members to Group Modal Management
// -------------------------------------------------------------
let targetGroupForExisting = null;
let selectedExistingMemberIds = new Set();

export function openAddExistingMembersModal(groupName) {
  targetGroupForExisting = groupName;
  selectedExistingMemberIds.clear();

  const modal = document.getElementById('add-existing-members-modal');
  const titleEl = document.getElementById('target-group-title');
  const countEl = document.getElementById('selected-existing-count');
  const searchInput = document.getElementById('existing-member-search');
  const actionLabelEl = document.getElementById('target-group-action-label');
  const subtitleEl = document.getElementById('target-group-subtitle');
  const confirmBtn = document.getElementById('btn-confirm-add-existing');

  if (!modal) return;

  const isSunday = state.isSundaySchoolClass(groupName);

  if (titleEl) titleEl.textContent = groupName;
  if (actionLabelEl) {
    actionLabelEl.textContent = isSunday ? 'إضافة مخدومين مسجلين إلى فصل:' : 'إضافة أعضاء حاليين إلى:';
  }
  if (subtitleEl) {
    subtitleEl.textContent = isSunday
      ? 'حدد المخدومين من قاعدة بيانات الأعضاء المسجلين لإضافتهم لهذا الفصل (مدارس الأحد تقبل الإضافة من الأعضاء الحاليين فقط)'
      : 'حدد الأعضاء من قاعدة البيانات لإضافتهم لهذه المجموعة';
  }
  if (confirmBtn) {
    confirmBtn.textContent = isSunday ? 'إضافة المخدومين للفصل' : 'إضافة الأعضاء للمجموعة';
  }
  if (countEl) countEl.textContent = '0';
  if (searchInput) searchInput.value = '';

  renderExistingMembersPickerList('');
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

export function closeAddExistingMembersModal() {
  const modal = document.getElementById('add-existing-members-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  targetGroupForExisting = null;
  selectedExistingMemberIds.clear();
}

export function renderExistingMembersPickerList(searchQuery = '') {
  const listEl = document.getElementById('existing-members-list');
  if (!listEl) return;

  const q = (searchQuery || '').toLowerCase().trim();
  const allMembers = state.members;

  const filtered = allMembers.filter(m => {
    if (!q) return true;
    const nameMatch = (m.name || '').toLowerCase().includes(q);
    const phoneMatch = (m.phone || '').includes(q) || (m.fatherPhone || '').includes(q) || (m.motherPhone || '').includes(q);
    const eduMatch = (m.education || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || eduMatch;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">لا يوجد أعضاء مطابقين للبحث</div>`;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    const isAlreadyInGroup = Array.isArray(m.groups) && m.groups.includes(targetGroupForExisting);
    const isChecked = selectedExistingMemberIds.has(m.id);

    let itemClasses = '';
    let badgeHtml = '';

    if (isAlreadyInGroup) {
      itemClasses = 'opacity-50 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed';
      badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">مسجل بالفعل</span>`;
    } else if (isChecked) {
      itemClasses = 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-400/50 cursor-pointer shadow-xs';
      badgeHtml = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-xs">محدد ✓</span>`;
    } else {
      itemClasses = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer';
      badgeHtml = `<span class="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-700 border border-slate-200 dark:border-slate-700">+ اختيار</span>`;
    }

    html += `
      <div class="existing-member-item flex items-center justify-between p-2.5 rounded-lg border transition-all ${itemClasses}" data-id="${m.id}" data-already="${isAlreadyInGroup ? 'true' : 'false'}">
        <div class="flex-1 min-w-0 pr-1">
          <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>${m.name}</span>
            ${m.gender === 'Female' ? '<span class="text-[10px] text-pink-600 font-normal">(أنثى)</span>' : '<span class="text-[10px] text-sky-600 font-normal">(ذكر)</span>'}
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
            <span>هاتف: <span class="font-mono" dir="ltr">${m.phone || m.fatherPhone || m.motherPhone || 'لا يوجد'}</span></span>
            <span>•</span>
            <span class="truncate">المجموعات: ${(m.groups || []).join('، ') || 'بدون'}</span>
          </div>
        </div>
        <div class="shrink-0 mr-2">
          ${badgeHtml}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

export function initExistingMembersPickerEvents() {
  const modal = document.getElementById('add-existing-members-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('btn-close-add-existing-modal');
  const cancelBtn = document.getElementById('btn-cancel-add-existing');
  const confirmBtn = document.getElementById('btn-confirm-add-existing');
  const searchInput = document.getElementById('existing-member-search');
  const selectAllBtn = document.getElementById('btn-select-all-existing');
  const clearAllBtn = document.getElementById('btn-clear-all-existing');
  const countEl = document.getElementById('selected-existing-count');

  if (closeBtn) closeBtn.addEventListener('click', closeAddExistingMembersModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAddExistingMembersModal);

  // Click outside / backdrop to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddExistingMembersModal();
    }
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeAddExistingMembersModal();
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderExistingMembersPickerList(e.target.value);
    });
  }

  // Click delegation on selectable member card
  const listEl = document.getElementById('existing-members-list');
  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const item = e.target.closest('.existing-member-item');
      if (item && item.dataset.already !== 'true') {
        const id = item.dataset.id;
        if (selectedExistingMemberIds.has(id)) {
          selectedExistingMemberIds.delete(id);
        } else {
          selectedExistingMemberIds.add(id);
        }
        if (countEl) countEl.textContent = selectedExistingMemberIds.size;
        renderExistingMembersPickerList(searchInput ? searchInput.value : '');
      }
    });
  }

  // Select all not yet in group
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      state.members.forEach(m => {
        const isAlready = Array.isArray(m.groups) && m.groups.includes(targetGroupForExisting);
        if (!isAlready) {
          selectedExistingMemberIds.add(m.id);
        }
      });
      renderExistingMembersPickerList(searchInput ? searchInput.value : '');
      if (countEl) countEl.textContent = selectedExistingMemberIds.size;
    });
  }

  // Clear all
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      selectedExistingMemberIds.clear();
      renderExistingMembersPickerList(searchInput ? searchInput.value : '');
      if (countEl) countEl.textContent = '0';
    });
  }

  // Confirm add to group
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!targetGroupForExisting) return;
      if (selectedExistingMemberIds.size === 0) {
        showToast('يرجى تحديد عضو واحد على الأقل لإضافته للمجموعة', 'warning');
        return;
      }

      const res = state.addMembersToGroup(Array.from(selectedExistingMemberIds), targetGroupForExisting);
      closeAddExistingMembersModal();
      const isSunday = state.isSundaySchoolClass(targetGroupForExisting);
      showToast(isSunday ? `تمت إضافة ${res.count} مخدوم بنجاح إلى فصل "${targetGroupForExisting}"` : `تمت إضافة ${res.count} عضو بنجاح إلى مجموعة "${targetGroupForExisting}"`, 'success');
    });
  }
}

// -------------------------------------------------------------
// New Group Modal Management
// -------------------------------------------------------------
export function openNewGroupModal(preselectedType = 'service') {
  const modal = document.getElementById('new-group-modal');
  const nameInput = document.getElementById('new-group-name-input');
  const presetsContainer = document.getElementById('new-group-color-presets');
  const selectedColorInput = document.getElementById('new-group-selected-color');
  const modalTitle = document.getElementById('new-group-modal-title');
  const nameLabel = document.getElementById('new-group-name-label');
  const radioService = document.getElementById('new-group-type-service');
  const radioSunday = document.getElementById('new-group-type-sunday');

  if (!modal) return;

  const isSunday = preselectedType === 'sunday_school';
  if (isSunday && radioSunday) {
    radioSunday.checked = true;
    if (modalTitle) modalTitle.textContent = 'إنشاء فصل مدارس أحد جديد';
    if (nameLabel) nameLabel.innerHTML = 'اسم فصل مدارس الأحد <span class="text-rose-500">*</span>';
    if (nameInput) nameInput.placeholder = 'مثال: فصل أولى ابتدائي، فصل حضانة، فصل إعدادي...';
    if (selectedColorInput) selectedColorInput.value = 'rose';
  } else {
    if (radioService) radioService.checked = true;
    if (modalTitle) modalTitle.textContent = 'إنشاء مجموعة خدمة جديدة';
    if (nameLabel) nameLabel.innerHTML = 'اسم مجموعة الخدمة <span class="text-rose-500">*</span>';
    if (nameInput) nameInput.placeholder = 'مثال: شباب جامعيين، خريجين، مهرجان الكرازة...';
    if (selectedColorInput) selectedColorInput.value = 'indigo';
  }

  if (nameInput) nameInput.value = '';

  const currentColor = selectedColorInput ? selectedColorInput.value : 'indigo';
  if (presetsContainer) {
    let presetsHtml = '';
    Object.values(PRESET_THEMES).forEach(p => {
      const isSelected = p.key === currentColor;
      presetsHtml += `
        <button type="button" class="btn-new-group-color flex flex-col items-center gap-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" data-color="${p.key}">
          <span class="w-6 h-6 rounded-full shadow-xs flex items-center justify-center ${isSelected ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : ''}" style="background-color: ${p.hex}"></span>
          <span class="text-[9px] text-slate-500 truncate">${p.key}</span>
        </button>
      `;
    });
    presetsContainer.innerHTML = presetsHtml;
  }

  modal.classList.remove('hidden');
  if (nameInput) nameInput.focus();
}

export function closeNewGroupModal() {
  const modal = document.getElementById('new-group-modal');
  if (modal) modal.classList.add('hidden');
}

export function initNewGroupModalEvents() {
  const modal = document.getElementById('new-group-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('btn-close-new-group-modal');
  const cancelBtn = document.getElementById('btn-cancel-new-group');
  const form = document.getElementById('new-group-form');
  const presetsContainer = document.getElementById('new-group-color-presets');
  const selectedColorInput = document.getElementById('new-group-selected-color');
  const radioService = document.getElementById('new-group-type-service');
  const radioSunday = document.getElementById('new-group-type-sunday');
  const modalTitle = document.getElementById('new-group-modal-title');
  const nameLabel = document.getElementById('new-group-name-label');
  const nameInput = document.getElementById('new-group-name-input');

  if (closeBtn) closeBtn.addEventListener('click', closeNewGroupModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeNewGroupModal);

  const onTypeChange = (isSunday) => {
    if (isSunday) {
      if (modalTitle) modalTitle.textContent = 'إنشاء فصل مدارس أحد جديد';
      if (nameLabel) nameLabel.innerHTML = 'اسم فصل مدارس الأحد <span class="text-rose-500">*</span>';
      if (nameInput) nameInput.placeholder = 'مثال: فصل أولى ابتدائي، فصل حضانة، فصل إعدادي...';
      if (selectedColorInput) selectedColorInput.value = 'rose';
    } else {
      if (modalTitle) modalTitle.textContent = 'إنشاء مجموعة خدمة جديدة';
      if (nameLabel) nameLabel.innerHTML = 'اسم مجموعة الخدمة <span class="text-rose-500">*</span>';
      if (nameInput) nameInput.placeholder = 'مثال: شباب جامعيين، خريجين، مهرجان الكرازة...';
      if (selectedColorInput) selectedColorInput.value = 'indigo';
    }
    // Update preset ring
    if (presetsContainer) {
      const color = selectedColorInput ? selectedColorInput.value : 'indigo';
      presetsContainer.querySelectorAll('.btn-new-group-color').forEach(btn => {
        const span = btn.querySelector('span:first-child');
        if (btn.dataset.color === color) {
          span.classList.add('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-110');
        } else {
          span.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-110');
        }
      });
    }
  };

  if (radioService) radioService.addEventListener('change', () => onTypeChange(false));
  if (radioSunday) radioSunday.addEventListener('change', () => onTypeChange(true));

  if (presetsContainer) {
    presetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-new-group-color');
      if (btn) {
        const color = btn.dataset.color;
        if (selectedColorInput) selectedColorInput.value = color;
        presetsContainer.querySelectorAll('.btn-new-group-color span:first-child').forEach(s => {
          s.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-110');
        });
        btn.querySelector('span:first-child').classList.add('ring-2', 'ring-slate-900', 'dark:ring-white', 'scale-110');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : '';
      const color = selectedColorInput ? selectedColorInput.value : 'indigo';
      const typeRadio = document.querySelector('input[name="new-group-type"]:checked');
      const type = typeRadio ? typeRadio.value : 'service';

      if (!name) return;

      const res = state.addGroup(name, color, type);
      if (!res.success) {
        showToast(res.error, 'error');
        return;
      }

      state.setGroupTab(type);
      state.filters.group = name;
      closeNewGroupModal();
      renderMembersList();
      showToast(type === 'sunday_school' ? `تم إنشاء فصل "${name}" بنجاح` : `تم إنشاء مجموعة "${name}" بنجاح`, 'success');
    });
  }
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderClass =
    type === 'success'
      ? 'border-emerald-600 bg-slate-900 text-white'
      : type === 'error'
      ? 'border-rose-600 bg-slate-900 text-white'
      : type === 'warning'
      ? 'border-amber-500 bg-slate-900 text-white'
      : 'border-slate-600 bg-slate-900 text-white';

  toast.className = `flex items-center gap-3 px-3.5 py-2.5 rounded-lg shadow-xl text-xs font-medium border-l-4 ${borderClass} transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;

  toast.innerHTML = `
    <span class="flex-1">${message}</span>
    <button type="button" class="text-slate-400 hover:text-white font-bold ml-1 text-xs">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}
