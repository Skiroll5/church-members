/**
 * modal.js - Simplified, Clean Modal for Adding, Editing, and Deleting Members
 * Supports selecting any number of groups contemporarily, contemporary father & mother phones,
 * live dynamic age calculation, and hash change detection.
 */
import { state } from './state.js';
import { calculateAge, showToast, renderMembersList } from './ui.js';

let currentEditingId = null;
let currentDeletingId = null;

export function openAddMemberModal(defaultGroup = null) {
  currentEditingId = null;
  const modal = document.getElementById('member-modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('member-form');

  if (!modal || !form) return;

  title.textContent = 'إضافة عضو جديد';
  form.reset();

  document.getElementById('member-id').value = '';
  const marriedEl = document.getElementById('member-married');
  if (marriedEl) {
    if (marriedEl.tagName === 'SELECT') marriedEl.value = 'false';
    else marriedEl.checked = false;
  }
  document.getElementById('member-gender').value = 'Male';
  document.getElementById('member-dob').value = '';
  document.getElementById('live-age-preview').textContent = '—';
  document.getElementById('member-phone').value = '';
  document.getElementById('member-father-phone').value = '';
  document.getElementById('member-mother-phone').value = '';
  document.getElementById('member-education').value = '';
  document.getElementById('member-service-type').value = '';
  document.getElementById('member-family').value = '';
  document.getElementById('member-notes').value = '';

  let initialGroups = [];
  if (defaultGroup && state.groups.includes(defaultGroup) && !state.isSundaySchoolClass(defaultGroup)) {
    initialGroups = [defaultGroup];
  }

  renderGroupCheckboxes(initialGroups, false);

  const revertBtn = document.getElementById('btn-revert-modal-member');
  if (revertBtn) revertBtn.classList.add('hidden');

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.getElementById('member-name').focus();
}

export function openEditMemberModal(id) {
  const member = state.members.find(m => m.id === id);
  if (!member) return;

  currentEditingId = id;
  const modal = document.getElementById('member-modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('member-form');

  if (!modal || !form) return;

  title.textContent = `تعديل بيانات: ${member.name}`;

  document.getElementById('member-id').value = member.id;
  document.getElementById('member-name').value = member.name || '';
  const marriedEl = document.getElementById('member-married');
  if (marriedEl) {
    if (marriedEl.tagName === 'SELECT') marriedEl.value = member.isMarried ? 'true' : 'false';
    else marriedEl.checked = Boolean(member.isMarried);
  }
  document.getElementById('member-gender').value = member.gender || 'Male';
  document.getElementById('member-dob').value = member.dob || '';
  document.getElementById('live-age-preview').textContent = calculateAge(member.dob);
  
  document.getElementById('member-phone').value = member.phone || '';
  document.getElementById('member-father-phone').value = member.fatherPhone || '';
  document.getElementById('member-mother-phone').value = member.motherPhone || '';

  document.getElementById('member-education').value = member.education || '';
  document.getElementById('member-service-type').value = member.serviceType || '';
  
  if (member.withFamily === true) {
    document.getElementById('member-family').value = 'true';
  } else if (member.withFamily === false) {
    document.getElementById('member-family').value = 'false';
  } else {
    document.getElementById('member-family').value = '';
  }

  document.getElementById('member-notes').value = member.notes || '';

  renderGroupCheckboxes(member.groups || [], true);

  const revertBtn = document.getElementById('btn-revert-modal-member');
  if (revertBtn) {
    const isDirty = state.isMemberDirty(id);
    const isNew = state.isMemberNew(id);
    if (isDirty || isNew) {
      revertBtn.classList.remove('hidden');
      revertBtn.textContent = isNew ? 'إلغاء إضافة هذا العضو' : 'تراجع عن تعديل هذا العضو';
      revertBtn.title = isNew ? 'إلغاء إضافة هذا العضو الجديد وحذفه من القائمة' : 'تراجع عن تعديلات هذا العضو واستعادة بياناته الأصلية';
    } else {
      revertBtn.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

/**
 * Renders badges for group selection - Sunday school classes are ONLY selectable for existing members
 */
function renderGroupCheckboxes(selectedGroups = [], isEditing = false) {
  const container = document.getElementById('group-checkboxes-container');
  const counterEl = document.getElementById('selected-groups-counter');
  if (!container) return;

  // Filter out any sunday school classes if creating new member
  let currentSelected = isEditing
    ? [...selectedGroups]
    : selectedGroups.filter(g => !state.isSundaySchoolClass(g));

  const updateDisplay = () => {
    if (counterEl) {
      counterEl.textContent = `${currentSelected.length} مجموعة مختارة`;
    }

    if (!isEditing) {
      // Adding NEW member: only show Service Groups!
      container.innerHTML = `
        <div class="w-full space-y-2">
          <div>
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>مجموعات ومراحل الخدمة:</span>
            </div>
            <div class="flex flex-wrap gap-1.5" id="service-groups-chips"></div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>فصول مدارس الأحد تقبل الإضافة فقط من قاعدة بيانات الأعضاء المسجلين بالفعل (من زر "إضافة مخدومين للفصل").</span>
            </div>
          </div>
        </div>
      `;

      const serviceContainer = document.getElementById('service-groups-chips');
      state.serviceGroups.forEach(g => renderChip(g, serviceContainer));
    } else {
      // Editing EXISTING member: show both sections
      container.innerHTML = `
        <div class="w-full space-y-2.5">
          <div>
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>مجموعات ومراحل الخدمة:</span>
            </div>
            <div class="flex flex-wrap gap-1.5" id="service-groups-chips"></div>
          </div>
          <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>فصول مدارس الأحد:</span>
            </div>
            <div class="flex flex-wrap gap-1.5" id="sunday-school-chips"></div>
          </div>
        </div>
      `;

      const serviceContainer = document.getElementById('service-groups-chips');
      const sundayContainer = document.getElementById('sunday-school-chips');

      if (serviceContainer) state.serviceGroups.forEach(g => renderChip(g, serviceContainer));
      if (sundayContainer) {
        if (state.sundaySchoolClasses.length === 0) {
          sundayContainer.innerHTML = `<span class="text-[11px] text-slate-400 italic">لا توجد فصول مدارس أحد منشأة حالياً.</span>`;
        } else {
          state.sundaySchoolClasses.forEach(g => renderChip(g, sundayContainer));
        }
      }
    }

    const hiddenInput = document.getElementById('selected-groups-json');
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(currentSelected);
    }
  };

  const renderChip = (g, targetContainer) => {
    if (!targetContainer) return;
    const isSelected = currentSelected.includes(g);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
      isSelected
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
    }`;
    btn.innerHTML = `<span>${isSelected ? '✓ ' : ''}${g}</span>`;
    btn.addEventListener('click', () => {
      if (isSelected) {
        currentSelected = currentSelected.filter(item => item !== g);
      } else {
        currentSelected.push(g);
      }
      updateDisplay();
    });
    targetContainer.appendChild(btn);
  };

  updateDisplay();
}

export function closeModal() {
  const modal = document.getElementById('member-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  currentEditingId = null;
}

export function openDeleteModal(id) {
  const member = state.members.find(m => m.id === id);
  if (!member) return;

  currentDeletingId = id;
  const modal = document.getElementById('delete-modal');
  const memberNameEl = document.getElementById('delete-member-name');
  const detailsEl = document.getElementById('delete-member-details');

  if (memberNameEl) memberNameEl.textContent = member.name;
  if (detailsEl) {
    const phones = [member.phone, member.fatherPhone ? `الأب: ${member.fatherPhone}` : '', member.motherPhone ? `الأم: ${member.motherPhone}` : ''].filter(Boolean).join(' | ');
    detailsEl.textContent = `المجموعات: ${(member.groups || []).join('، ') || 'بدون'} | ${phones || 'لا يوجد هاتف'}`;
  }

  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

export function closeDeleteModal() {
  const modal = document.getElementById('delete-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  currentDeletingId = null;
}

export function handleMemberFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('member-name').value.trim();
  if (!name) {
    showToast('يرجى إدخال اسم العضو', 'error');
    return;
  }

  const marriedEl = document.getElementById('member-married');
  const isMarried = marriedEl ? (marriedEl.tagName === 'SELECT' ? marriedEl.value === 'true' : marriedEl.checked) : false;
  const gender = document.getElementById('member-gender').value;
  const dob = document.getElementById('member-dob').value.trim();
  const phone = document.getElementById('member-phone').value.trim();
  const fatherPhone = document.getElementById('member-father-phone').value.trim();
  const motherPhone = document.getElementById('member-mother-phone').value.trim();
  const education = document.getElementById('member-education').value.trim();
  const serviceType = document.getElementById('member-service-type').value.trim();
  
  const rawFamily = document.getElementById('member-family').value;
  const withFamily = rawFamily === 'true' ? true : rawFamily === 'false' ? false : null;
  const notes = document.getElementById('member-notes').value.trim();

  let groups = [];
  try {
    const rawGroups = document.getElementById('selected-groups-json').value;
    groups = JSON.parse(rawGroups);
  } catch (err) {
    groups = [];
  }

  const memberPayload = {
    name,
    isMarried,
    gender,
    dob,
    phone,
    fatherPhone,
    motherPhone,
    education,
    groups: Array.isArray(groups) ? groups : [],
    serviceType,
    withFamily,
    notes
  };

  if (currentEditingId) {
    const result = state.updateMember(currentEditingId, memberPayload);
    if (!result.success) {
      showToast(result.error || 'حدث خطأ أثناء التعديل', 'error');
      return;
    }

    if (!result.changed) {
      showToast('لم يتم تغيير أي بيانات (تم الحفاظ على تاريخ التحديث الأصلي دون تغيير)', 'info');
    } else {
      showToast(`تم تحديث بيانات ${name} بنجاح`, 'success');
    }
  } else {
    const newMember = state.addMember(memberPayload);
    showToast(`تمت إضافة ${newMember.name} إلى السجل بنجاح`, 'success');
  }

  closeModal();
  renderMembersList();
}

export function executeDelete() {
  if (!currentDeletingId) return;

  const member = state.members.find(m => m.id === currentDeletingId);
  const name = member ? member.name : 'العضو';

  const success = state.deleteMember(currentDeletingId);
  closeDeleteModal();

  if (success) {
    showToast(`تم حذف ${name} بنجاح`, 'warning');
    renderMembersList();
  }
}

export function initModals() {
  const btnAdd = document.getElementById('btn-add-member');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openAddMemberModal());
  }

  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  const form = document.getElementById('member-form');
  if (form) {
    form.addEventListener('submit', handleMemberFormSubmit);
  }

  const btnRevertModal = document.getElementById('btn-revert-modal-member');
  if (btnRevertModal) {
    btnRevertModal.addEventListener('click', () => {
      if (!currentEditingId) return;
      const member = state.members.find(m => m.id === currentEditingId);
      const name = member ? member.name : 'هذا السجل';
      const isNew = state.isMemberNew(currentEditingId);
      const confirmMsg = isNew
        ? `هل ترغب في إلغاء إضافة العضو الجديد "${name}"؟`
        : `هل ترغب في التراجع عن تعديلات "${name}" واستعادة بياناته الأصلية؟`;
      if (confirm(confirmMsg)) {
        const res = state.revertMember(currentEditingId);
        closeModal();
        if (res.success) {
          renderMembersList();
          showToast(res.wasNew ? `تم إلغاء إضافة "${res.name}"` : `تم التراجع عن تعديلات "${res.name}" واستعادة بياناته الأصلية`, 'info', 3000);
        }
      }
    });
  }

  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', executeDelete);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

  const dobInput = document.getElementById('member-dob');
  const agePreview = document.getElementById('live-age-preview');
  if (dobInput && agePreview) {
    dobInput.addEventListener('input', (e) => {
      agePreview.textContent = calculateAge(e.target.value);
    });
  }

  // Global listener for edit and delete buttons in table
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      if (id) openEditMemberModal(id);
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (id) openDeleteModal(id);
      return;
    }

    const addGroupBtn = e.target.closest('.btn-add-to-group');
    if (addGroupBtn) {
      const group = addGroupBtn.dataset.group;
      openAddMemberModal(group);
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
    }
  });
}
