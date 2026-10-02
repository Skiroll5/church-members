/**
 * state.js - Centralized reactive state management with multi-level sorting
 */
import { computeMemberHashSync } from './hash.js';

export const DEFAULT_SERVICE_GROUPS = [
  'الخدام',
  'إعداد خدام',
  'شباب (أولاد و بنات)',
  'ثانوى (أولاد و بنات)',
  'حضانة - إبتدائى - إعدادى (أولاد و بنات)',
  'شباب لجوء'
];

export const DEFAULT_SUNDAY_SCHOOL_CLASSES = [];

export const DEFAULT_GROUPS = [...DEFAULT_SERVICE_GROUPS, ...DEFAULT_SUNDAY_SCHOOL_CLASSES];

/**
 * Parses DOB to timestamp for oldest-to-youngest sorting
 */
export function getBirthTimestamp(dobStr) {
  if (!dobStr || !dobStr.trim()) return Infinity; // Unknown DOB placed at the end
  const trimmed = dobStr.trim();
  
  if (trimmed.startsWith('00/00/')) {
    const year = parseInt(trimmed.split('/')[2], 10);
    return isNaN(year) ? Infinity : new Date(year, 0, 1).getTime();
  }
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    return new Date(year, 0, 1).getTime();
  }
  if (trimmed.includes('/')) {
    const p = trimmed.split('/');
    if (p.length === 3 && p[2] && !isNaN(p[2])) {
      const day = parseInt(p[0], 10) || 1;
      const month = (parseInt(p[1], 10) || 1) - 1;
      let year = parseInt(p[2], 10);
      if (year < 100) year += year > 40 ? 1900 : 2000;
      return new Date(year, month, day).getTime();
    }
  }
  if (trimmed.includes('-')) {
    const p = trimmed.split('-');
    if (p.length === 3) {
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
    }
  }
  return Infinity;
}

export const DEFAULT_GROUP_COLORS = {
  'الخدام': 'indigo',
  'إعداد خدام': 'sky',
  'شباب (أولاد و بنات)': 'emerald',
  'ثانوى (أولاد و بنات)': 'amber',
  'حضانة - إبتدائى - إعدادى (أولاد و بنات)': 'purple',
  'شباب لجوء': 'teal'
};

export const ALL_COLUMNS = [
  { key: 'dob', label: 'تاريخ الميلاد / السن' },
  { key: 'phone', label: 'أرقام التواصل' },
  { key: 'education', label: 'المؤهل الدراسي' },
  { key: 'serviceType', label: 'نوع الخدمة' },
  { key: 'withFamily', label: 'مع الأسرة' },
  { key: 'gender', label: 'النوع' },
  { key: 'lastUpdated', label: 'آخر تحديث' }
];

export const DEFAULT_VISIBLE_COLUMNS = {
  dob: true,
  phone: true,
  education: true,
  serviceType: true,
  withFamily: true,
  gender: true,
  lastUpdated: true
};

class AppState {
  constructor() {
    this.members = [];
    this.savedSnapshot = [];
    this.dirtyIds = new Set();
    this.deletedIds = new Set();
    this.currentFileName = 'church_members.json';

    // Semantic Group Tab: 'service' | 'sunday_school'
    this.groupTab = 'service';

    // 1. Restore service groups
    try {
      const savedService = localStorage.getItem('church_service_groups');
      if (savedService) {
        const parsed = JSON.parse(savedService);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const unique = new Set(parsed);
          DEFAULT_SERVICE_GROUPS.forEach(g => unique.add(g));
          this.serviceGroups = Array.from(unique);
        } else {
          this.serviceGroups = [...DEFAULT_SERVICE_GROUPS];
        }
      } else {
        this.serviceGroups = [...DEFAULT_SERVICE_GROUPS];
      }
    } catch (e) {
      this.serviceGroups = [...DEFAULT_SERVICE_GROUPS];
    }

    // 2. Restore Sunday School classes (user adds them later)
    try {
      const savedClasses = localStorage.getItem('church_sunday_school_classes');
      if (savedClasses) {
        const parsed = JSON.parse(savedClasses);
        const oldSeeded = ['فصل حضانة', 'فصل ابتدائي', 'فصل إعدادي', 'فصل ثانوي'];
        const isExactOldSeed = Array.isArray(parsed) && parsed.length === 4 && oldSeeded.every(c => parsed.includes(c));
        if (isExactOldSeed) {
          this.sundaySchoolClasses = [];
          localStorage.removeItem('church_sunday_school_classes');
        } else if (Array.isArray(parsed)) {
          this.sundaySchoolClasses = parsed.filter(c => c && typeof c === 'string' && !oldSeeded.includes(c));
        } else {
          this.sundaySchoolClasses = [];
        }
      } else {
        this.sundaySchoolClasses = [];
      }
    } catch (e) {
      this.sundaySchoolClasses = [];
    }

    this.groups = Array.from(new Set([...this.serviceGroups, ...this.sundaySchoolClasses]));

    // Restore custom group colors if saved in localStorage
    this.groupColors = { ...DEFAULT_GROUP_COLORS };
    try {
      const savedColors = localStorage.getItem('church_group_colors');
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (parsed && typeof parsed === 'object') {
          this.groupColors = { ...this.groupColors, ...parsed };
        }
      }
    } catch (e) {}

    this.filters = {
      search: '',
      group: 'all',
      editedOnly: false
    };

    // Default sorting: multi-level (Males first, then Females, oldest to youngest)
    this.sort = {
      field: 'default_church_sort', // 'default_church_sort', 'name', 'dob', 'gender', 'lastUpdated', 'education'
      direction: 'asc'
    };

    this.selectedIds = new Set();
    this.listeners = new Set();

    // Responsive View Mode: 'table' | 'cards'
    try {
      const savedView = localStorage.getItem('church_view_mode');
      this.viewMode = (savedView === 'cards') ? 'cards' : 'table';
    } catch (e) {
      this.viewMode = 'table';
    }

    // Column Visibility settings (Column Filter)
    try {
      const savedCols = localStorage.getItem('church_visible_columns');
      this.visibleColumns = savedCols ? { ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(savedCols) } : { ...DEFAULT_VISIBLE_COLUMNS };
    } catch (e) {
      this.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
    }
  }

  setViewMode(mode) {
    if (mode === 'table' || mode === 'cards') {
      this.viewMode = mode;
      try {
        localStorage.setItem('church_view_mode', mode);
      } catch (e) {}
      this.notify('view_mode_changed', { mode });
    }
  }

  toggleColumn(colKey) {
    if (this.visibleColumns.hasOwnProperty(colKey)) {
      this.visibleColumns[colKey] = !this.visibleColumns[colKey];
      try {
        localStorage.setItem('church_visible_columns', JSON.stringify(this.visibleColumns));
      } catch (e) {}
      this.notify('columns_changed', { visibleColumns: this.visibleColumns });
    }
  }

  isColumnVisible(colKey) {
    return this.visibleColumns[colKey] !== false;
  }

  resetColumns() {
    this.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
    try {
      localStorage.removeItem('church_visible_columns');
    } catch (e) {}
    this.notify('columns_changed', { visibleColumns: this.visibleColumns });
  }

  setGroupTab(tab) {
    if (tab === 'service' || tab === 'sunday_school') {
      this.groupTab = tab;
      this.notify('group_tab_changed', { tab });
    }
  }

  isSundaySchoolClass(groupName) {
    return this.sundaySchoolClasses.includes(groupName);
  }

  isServiceGroup(groupName) {
    return this.serviceGroups.includes(groupName);
  }

  getGroupColor(groupName) {
    if (this.groupColors && this.groupColors[groupName]) {
      return this.groupColors[groupName];
    }
    if (DEFAULT_GROUP_COLORS[groupName]) {
      return DEFAULT_GROUP_COLORS[groupName];
    }
    return 'indigo';
  }

  setGroupColor(groupName, color) {
    if (!this.groupColors) this.groupColors = {};
    this.groupColors[groupName] = color;
    try {
      localStorage.setItem('church_group_colors', JSON.stringify(this.groupColors));
    } catch (e) {}
    this.notify('group_color_changed', { groupName, color });
  }

  setGroupsOrder(newGroups, type = 'service') {
    if (!Array.isArray(newGroups)) return;
    if (type === 'sunday_school') {
      this.sundaySchoolClasses = [...newGroups];
      try {
        localStorage.setItem('church_sunday_school_classes', JSON.stringify(this.sundaySchoolClasses));
      } catch (e) {}
    } else {
      this.serviceGroups = [...newGroups];
      try {
        localStorage.setItem('church_service_groups', JSON.stringify(this.serviceGroups));
      } catch (e) {}
    }
    this.groups = Array.from(new Set([...this.serviceGroups, ...this.sundaySchoolClasses]));
    this.notify('groups_reordered', { type, groups: newGroups });
  }

  addGroup(groupName, color = 'indigo', type = 'service') {
    const trimmed = (groupName || '').trim();
    if (!trimmed) return { success: false, error: 'اسم المجموعة أو الفصل مطلوب' };
    if (this.groups.includes(trimmed)) return { success: false, error: 'المجموعة أو الفصل موجود بالفعل' };

    if (type === 'sunday_school') {
      this.sundaySchoolClasses.push(trimmed);
      try {
        localStorage.setItem('church_sunday_school_classes', JSON.stringify(this.sundaySchoolClasses));
      } catch (e) {}
    } else {
      this.serviceGroups.push(trimmed);
      try {
        localStorage.setItem('church_service_groups', JSON.stringify(this.serviceGroups));
      } catch (e) {}
    }

    this.groups.push(trimmed);
    if (!this.groupColors) this.groupColors = {};
    this.groupColors[trimmed] = color;

    try {
      localStorage.setItem('church_group_colors', JSON.stringify(this.groupColors));
    } catch (e) {}

    this.notify('group_added', { groupName: trimmed, color, type });
    return { success: true, groupName: trimmed, type };
  }

  addMembersToGroup(memberIds, groupName) {
    if (!Array.isArray(memberIds) || !groupName) return { count: 0 };
    const targetGroup = groupName.trim();
    let updatedCount = 0;

    for (const id of memberIds) {
      const member = this.members.find(m => m.id === id);
      if (member) {
        const currentGroups = Array.isArray(member.groups) ? member.groups : [];
        if (!currentGroups.includes(targetGroup)) {
          const res = this.updateMember(id, { groups: [...currentGroups, targetGroup] });
          if (res.success && res.changed) {
            updatedCount++;
          }
        }
      }
    }

    if (updatedCount > 0) {
      this.notify('bulk_members_updated', { groupName: targetGroup, count: updatedCount });
    }
    return { count: updatedCount };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data, this);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  setMembers(membersList, markSaved = true) {
    this.members = membersList.map(m => {
      const copy = { ...m };
      if (!Array.isArray(copy.groups)) copy.groups = [];
      if (!copy.fatherPhone) copy.fatherPhone = '';
      if (!copy.motherPhone) copy.motherPhone = '';
      if (typeof copy.withFamily !== 'boolean') {
        if (copy.withFamily === 'Sì' || copy.withFamily === 'yes' || copy.withFamily === true) copy.withFamily = true;
        else if (copy.withFamily === 'No' || copy.withFamily === 'no' || copy.withFamily === false) copy.withFamily = false;
        else copy.withFamily = null;
      }
      delete copy.ageRecorded;
      delete copy.parentPhone;
      delete copy.parentPhoneLabel;

      if (!copy.dataHash) {
        copy.dataHash = computeMemberHashSync(copy);
      }
      return copy;
    });

    for (const m of this.members) {
      if (Array.isArray(m.groups)) {
        m.groups.forEach(g => {
          if (g && g.trim()) {
            const cleanG = g.trim();
            if (!this.groups.includes(cleanG)) {
              this.groups.push(cleanG);
            }
            if (!this.sundaySchoolClasses.includes(cleanG) && !this.serviceGroups.includes(cleanG)) {
              if (cleanG.startsWith('فصل ') || cleanG.includes('مدارس أحد') || cleanG.includes('حضانة') || cleanG.includes('ابتدائي') || cleanG.includes('إعدادي')) {
                this.sundaySchoolClasses.push(cleanG);
              } else {
                this.serviceGroups.push(cleanG);
              }
            }
          }
        });
      }
    }

    if (markSaved) {
      this.markSaved();
    } else {
      this.notify('members_updated');
    }
  }

  markSaved() {
    this.savedSnapshot = JSON.parse(JSON.stringify(this.members));
    this.dirtyIds.clear();
    this.deletedIds.clear();
    this.notify('saved_state_changed', { hasUnsavedChanges: false });
  }

  hasUnsavedChanges() {
    return this.dirtyIds.size > 0 || this.deletedIds.size > 0;
  }

  getUnsavedCount() {
    return this.dirtyIds.size + this.deletedIds.size;
  }

  isMemberDirty(id) {
    return this.dirtyIds.has(id);
  }

  isMemberNew(id) {
    const orig = this.savedSnapshot.find(m => m.id === id);
    return !orig && this.members.some(m => m.id === id);
  }

  /**
   * Adds a new church member (supports any number of groups contemporarily)
   */
  addMember(memberData) {
    const id = 'mem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    let withFamilyVal = null;
    if (typeof memberData.withFamily === 'boolean') withFamilyVal = memberData.withFamily;
    else if (memberData.withFamily === 'true' || memberData.withFamily === 'Sì') withFamilyVal = true;
    else if (memberData.withFamily === 'false' || memberData.withFamily === 'No') withFamilyVal = false;

    const newMember = {
      id,
      name: (memberData.name || '').trim(),
      isMarried: Boolean(memberData.isMarried),
      dob: (memberData.dob || '').trim(),
      phone: (memberData.phone || '').trim(),
      fatherPhone: (memberData.fatherPhone || '').trim(),
      motherPhone: (memberData.motherPhone || '').trim(),
      education: (memberData.education || '').trim(),
      gender: memberData.gender || 'Male',
      // Sunday school classes can only be added to existing members, never brand new members
      groups: Array.isArray(memberData.groups) ? memberData.groups.filter(g => g && !this.isSundaySchoolClass(g)) : [],
      serviceType: (memberData.serviceType || '').trim(),
      withFamily: withFamilyVal,
      notes: (memberData.notes || '').trim(),
      createdAt: nowIso,
      lastUpdated: nowIso,
      dataHash: ''
    };

    newMember.dataHash = computeMemberHashSync(newMember);

    this.members.unshift(newMember);
    this.dirtyIds.add(id);

    newMember.groups.forEach(g => {
      if (g && !this.groups.includes(g)) this.groups.push(g);
    });

    this.notify('member_added', { member: newMember });
    return newMember;
  }

  /**
   * Updates an existing member with hash change detection
   */
  updateMember(id, updatedData) {
    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return { success: false, error: 'Member not found' };

    const currentMember = this.members[index];

    let withFamilyVal = currentMember.withFamily;
    if (updatedData.withFamily !== undefined) {
      if (typeof updatedData.withFamily === 'boolean') withFamilyVal = updatedData.withFamily;
      else if (updatedData.withFamily === 'true') withFamilyVal = true;
      else if (updatedData.withFamily === 'false') withFamilyVal = false;
      else if (updatedData.withFamily === null || updatedData.withFamily === '') withFamilyVal = null;
    }

    const prospective = {
      ...currentMember,
      name: String(updatedData.name !== undefined ? updatedData.name : (currentMember.name || '')).trim(),
      isMarried: updatedData.isMarried !== undefined ? Boolean(updatedData.isMarried) : currentMember.isMarried,
      dob: String(updatedData.dob !== undefined ? updatedData.dob : (currentMember.dob || '')).trim(),
      phone: String(updatedData.phone !== undefined ? updatedData.phone : (currentMember.phone || '')).trim(),
      fatherPhone: String(updatedData.fatherPhone !== undefined ? updatedData.fatherPhone : (currentMember.fatherPhone || '')).trim(),
      motherPhone: String(updatedData.motherPhone !== undefined ? updatedData.motherPhone : (currentMember.motherPhone || '')).trim(),
      education: String(updatedData.education !== undefined ? updatedData.education : (currentMember.education || '')).trim(),
      gender: updatedData.gender || currentMember.gender || 'Male',
      groups: Array.isArray(updatedData.groups) ? [...updatedData.groups] : (Array.isArray(currentMember.groups) ? currentMember.groups : []),
      serviceType: String(updatedData.serviceType !== undefined ? updatedData.serviceType : (currentMember.serviceType || '')).trim(),
      withFamily: withFamilyVal,
      notes: String(updatedData.notes !== undefined ? updatedData.notes : (currentMember.notes || '')).trim()
    };

    delete prospective.ageRecorded;
    delete prospective.parentPhone;
    delete prospective.parentPhoneLabel;

    const newHash = computeMemberHashSync(prospective);
    const hasChanged = newHash !== currentMember.dataHash;

    if (!hasChanged) {
      return {
        success: true,
        changed: false,
        member: currentMember,
        message: 'No changes detected. Update timestamp preserved.'
      };
    }

    prospective.dataHash = newHash;
    prospective.lastUpdated = new Date().toISOString();
    this.members[index] = prospective;

    const savedVersion = this.savedSnapshot.find(m => m.id === id);
    if (savedVersion && savedVersion.dataHash === newHash) {
      this.dirtyIds.delete(id);
    } else {
      this.dirtyIds.add(id);
    }

    prospective.groups.forEach(g => {
      if (g && !this.groups.includes(g)) this.groups.push(g);
    });

    this.notify('member_updated', { member: prospective, changed: true });
    return {
      success: true,
      changed: true,
      member: prospective,
      message: 'Member updated successfully.'
    };
  }

  /**
   * Confirms/verifies member data and updates lastUpdated timestamp to now
   */
  confirmMemberData(id) {
    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return { success: false, error: 'Member not found' };

    const currentMember = this.members[index];
    const nowIso = new Date().toISOString();
    const updated = {
      ...currentMember,
      lastUpdated: nowIso
    };
    updated.dataHash = computeMemberHashSync(updated);
    this.members[index] = updated;
    this.dirtyIds.add(id);

    this.notify('member_updated', { member: updated, changed: true, confirmed: true });
    return { success: true, member: updated };
  }

  deleteMember(id) {
    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return false;

    const removed = this.members[index];
    this.members.splice(index, 1);
    this.selectedIds.delete(id);
    this.dirtyIds.delete(id);

    const wasInSnapshot = this.savedSnapshot.some(m => m.id === id);
    if (wasInSnapshot) {
      this.deletedIds.add(id);
    }

    this.notify('member_deleted', { member: removed });
    return true;
  }

  /**
   * Reverts changes for a single member back to the saved snapshot
   */
  revertMember(id) {
    const isNew = this.isMemberNew(id);
    const index = this.members.findIndex(m => m.id === id);

    if (isNew) {
      if (index !== -1) {
        const removed = this.members[index];
        this.members.splice(index, 1);
        this.dirtyIds.delete(id);
        this.selectedIds.delete(id);
        this.notify('member_reverted', { id, member: removed, wasNew: true });
        return { success: true, wasNew: true, name: removed.name };
      }
      return { success: false, error: 'Member not found' };
    }

    const savedVersion = this.savedSnapshot.find(m => m.id === id);
    if (!savedVersion) {
      return { success: false, error: 'Original saved record not found' };
    }

    const restored = JSON.parse(JSON.stringify(savedVersion));
    if (index !== -1) {
      this.members[index] = restored;
    } else {
      this.members.push(restored);
      this.deletedIds.delete(id);
    }

    this.dirtyIds.delete(id);
    this.notify('member_reverted', { id, member: restored, wasNew: false });
    return { success: true, wasNew: false, name: restored.name };
  }

  discardChanges() {
    this.members = JSON.parse(JSON.stringify(this.savedSnapshot));
    this.dirtyIds.clear();
    this.deletedIds.clear();
    this.selectedIds.clear();
    this.notify('changes_discarded');
  }

  /**
   * Sort comparator for members
   */
  sortMembers(list) {
    const field = this.sort.field;
    const direction = this.sort.direction;
    const dirMult = direction === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      // 1. Default Church Multi-Level Sorting:
      // First: Males (0), then Females (1)
      // Second: Oldest to Youngest (earliest birthdate first)
      // Third: Name alphabetically
      if (field === 'default_church_sort') {
        const genderA = a.gender === 'Female' ? 1 : 0;
        const genderB = b.gender === 'Female' ? 1 : 0;
        if (genderA !== genderB) {
          return (genderA - genderB) * dirMult;
        }

        // Within same gender, sort oldest to youngest
        const timeA = getBirthTimestamp(a.dob);
        const timeB = getBirthTimestamp(b.dob);
        if (timeA !== timeB) {
          return (timeA - timeB) * dirMult;
        }

        return (a.name || '').localeCompare(b.name || '', ['ar', 'it', 'en']) * dirMult;
      }

      // Column-specific sorting
      if (field === 'name') {
        return (a.name || '').localeCompare(b.name || '', ['ar', 'it', 'en']) * dirMult;
      }

      if (field === 'dob') {
        const timeA = getBirthTimestamp(a.dob);
        const timeB = getBirthTimestamp(b.dob);
        return (timeA - timeB) * dirMult;
      }

      if (field === 'gender') {
        const genA = a.gender === 'Female' ? 1 : 0;
        const genB = b.gender === 'Female' ? 1 : 0;
        if (genA !== genB) return (genA - genB) * dirMult;
        return (getBirthTimestamp(a.dob) - getBirthTimestamp(b.dob)) * dirMult;
      }

      if (field === 'serviceType') {
        return (a.serviceType || '').localeCompare(b.serviceType || '', ['ar', 'it', 'en']) * dirMult;
      }

      if (field === 'education') {
        return (a.education || '').localeCompare(b.education || '', ['ar', 'it', 'en']) * dirMult;
      }

      if (field === 'lastUpdated') {
        const tA = new Date(a.lastUpdated || 0).getTime();
        const tB = new Date(b.lastUpdated || 0).getTime();
        return (tA - tB) * dirMult;
      }

      return 0;
    });

    return list;
  }

  getFilteredMembers() {
    let result = this.members.filter(m => {
      // Filter by edited only
      if (this.filters.editedOnly) {
        const isDirty = this.dirtyIds.has(m.id);
        const isNew = this.isMemberNew(m.id);
        if (!isDirty && !isNew) return false;
      }

      // Filter by group or class
      if (this.filters.group !== 'all') {
        if (this.filters.group === '__all_service__') {
          if (!m.groups || !m.groups.some(g => this.serviceGroups.includes(g))) return false;
        } else if (this.filters.group === '__all_sunday_school__') {
          if (!m.groups || !m.groups.some(g => this.sundaySchoolClasses.includes(g))) return false;
        } else if (this.filters.group === '__multi__') {
          if (!m.groups || m.groups.length < 2) return false;
        } else if (this.filters.group === '__no_phone__') {
          const hasPersonal = Boolean(m.phone && m.phone.trim());
          const hasFather = Boolean(m.fatherPhone && m.fatherPhone.trim());
          const hasMother = Boolean(m.motherPhone && m.motherPhone.trim());
          if (hasPersonal || hasFather || hasMother) return false;
        } else if (this.filters.group === '__no_dob__') {
          if (m.dob && m.dob.trim()) return false;
        } else if (!m.groups || !m.groups.includes(this.filters.group)) {
          return false;
        }
      }

      // Live search
      if (this.filters.search) {
        const q = this.filters.search.toLowerCase().trim();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchPhone = (m.phone || '').includes(q);
        const matchFatherPhone = (m.fatherPhone || '').includes(q);
        const matchMotherPhone = (m.motherPhone || '').includes(q);
        const matchEdu = (m.education || '').toLowerCase().includes(q);
        const matchNotes = (m.notes || '').toLowerCase().includes(q);
        const matchService = (m.serviceType || '').toLowerCase().includes(q);
        const matchGroup = (m.groups || []).some(g => g.toLowerCase().includes(q));

        if (!matchName && !matchPhone && !matchFatherPhone && !matchMotherPhone && !matchEdu && !matchNotes && !matchService && !matchGroup) {
          return false;
        }
      }

      return true;
    });

    return this.sortMembers(result);
  }

  getStats() {
    const total = this.members.length;
    const groupCounts = {};
    for (const g of this.groups) groupCounts[g] = 0;

    let multiCount = 0;
    let missingPhoneCount = 0;
    let missingDobCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let serviceTotal = 0;
    let sundaySchoolTotal = 0;

    for (const m of this.members) {
      let inService = false;
      let inSundaySchool = false;
      if (Array.isArray(m.groups)) {
        m.groups.forEach(g => {
          groupCounts[g] = (groupCounts[g] || 0) + 1;
          if (this.serviceGroups.includes(g)) inService = true;
          if (this.sundaySchoolClasses.includes(g)) inSundaySchool = true;
        });
        if (m.groups.length > 1) multiCount++;
      }

      if (inService) serviceTotal++;
      if (inSundaySchool) sundaySchoolTotal++;

      const hasPersonal = Boolean(m.phone && m.phone.trim());
      const hasFather = Boolean(m.fatherPhone && m.fatherPhone.trim());
      const hasMother = Boolean(m.motherPhone && m.motherPhone.trim());

      if (!hasPersonal && !hasFather && !hasMother) missingPhoneCount++;
      if (!m.dob || !m.dob.trim()) missingDobCount++;
      if ((m.gender || '').toLowerCase() === 'female') femaleCount++;
      else maleCount++;
    }

    return {
      total,
      groupCounts,
      serviceTotal,
      sundaySchoolTotal,
      multiCount,
      missingPhoneCount,
      missingDobCount,
      maleCount,
      femaleCount,
      unsavedCount: this.getUnsavedCount()
    };
  }
}

export const state = new AppState();
