/**
 * data.js - Persistence, JSON import/export, and File System synchronization
 */
import { state } from './state.js';
import { calculateAge } from './ui.js';

const LOCAL_STORAGE_KEY = 'church_members_data_v2';
const DRAFT_STORAGE_KEY = 'church_members_draft_v2';

export async function loadInitialData() {
  const hasDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

  // 1. If user previously loaded data or has a draft saved in browser localStorage
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.setMembers(parsed, true);
        if (hasDraft) {
          try {
            const draftData = JSON.parse(hasDraft);
            if (Array.isArray(draftData.members) && draftData.members.length > 0) {
              return {
                loaded: true,
                count: parsed.length,
                hasDraft: true,
                draftDate: draftData.timestamp,
                draftCount: draftData.members.length
              };
            }
          } catch (e) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
        }
        return { loaded: true, count: parsed.length, fromLocal: true };
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
  }

  // 2. Try fetching local church_members.json if available
  try {
    const response = await fetch('./church_members.json');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        state.setMembers(data, true);
        return { loaded: true, count: data.length };
      }
    }
  } catch (err) {
    // Normal on static GitHub Pages
  }

  return { loaded: true, count: 0, isEmpty: true };
}

export async function saveMembersJson() {
  const membersToSave = state.members;
  const jsonString = JSON.stringify(membersToSave, null, 2);

  // 1. Download the updated file to the user's computer (Confidential Client-Side workflow)
  const targetFilename = state.currentFileName || 'church_members.json';
  downloadJsonFile(targetFilename);

  // 2. Persist in localStorage as local safety draft
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, jsonString);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.warn('localStorage quota exceeded', e);
  }

  // 3. If local server happens to be running (e.g. during local offline dev), attempt background sync
  try {
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString
    }).catch(() => {});
  } catch (e) {}

  // 4. Mark state as saved
  state.markSaved();

  return {
    success: true,
    downloaded: true,
    filename: targetFilename,
    count: membersToSave.length
  };
}

export function clearLocalData() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {}
  state.setMembers([], true);
  state.currentFileName = 'church_members.json';
}

export function downloadJsonFile(filename = 'church_members.json') {
  const data = JSON.stringify(state.members, null, 2);
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function saveViaFilePicker() {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'church_members.json',
        types: [{
          description: 'ملف البيانات',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      const content = JSON.stringify(state.members, null, 2);
      await writable.write(content);
      await writable.close();
      state.markSaved();
      return { success: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('File Picker error:', err);
      }
    }
  }
  downloadJsonFile();
  state.markSaved();
  return { success: true, fallback: true };
}

export async function importJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) {
          throw new Error('تنسيق ملف البيانات غير صالح، يجب أن يحتوي على قائمة بالأعضاء');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file, 'utf-8');
  });
}

export function exportToCsv(membersList = state.getFilteredMembers()) {
  const headers = [
    'م',
    'الاسم',
    'الحالة الاجتماعية',
    'المجموعات',
    'تاريخ الميلاد',
    'السن المحسوب',
    'الهاتف الشخصي',
    'هاتف الأب',
    'هاتف الأم',
    'المؤهل / الدراسة',
    'النوع',
    'نوع الخدمة',
    'مع الأسرة',
    'ملاحظات',
    'آخر تحديث'
  ];

  const rows = membersList.map((m, idx) => {
    let familyStatus = '';
    if (m.withFamily === true) familyStatus = 'نعم';
    else if (m.withFamily === false) familyStatus = 'لا';

    return [
      idx + 1,
      m.name || '',
      m.isMarried ? 'متزوج' : 'أعزب',
      (m.groups || []).join(' + '),
      m.dob || '',
      calculateAge(m.dob),
      m.phone || '',
      m.fatherPhone || '',
      m.motherPhone || '',
      m.education || '',
      m.gender === 'Female' ? 'أنثى' : 'ذكر',
      m.serviceType || '',
      familyStatus,
      m.notes || '',
      m.lastUpdated ? new Date(m.lastUpdated).toLocaleDateString('ar-EG') : ''
    ];
  });

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(r => r.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `كشف_أعضاء_الكنيسة_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(cell) {
  const str = String(cell == null ? '' : cell).replace(/"/g, '""');
  return `"${str}"`;
}
