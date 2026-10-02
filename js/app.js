/**
 * app.js - Main Application Coordinator
 * Boots the app, manages filters, sorting, bulk actions, shortcuts, and sync.
 */
import { state } from './state.js';
import { loadInitialData, saveMembersJson, downloadJsonFile, saveViaFilePicker, importJsonFile, exportToCsv, clearLocalData } from './data.js';
import {
  renderMembersList,
  showToast,
  initColorPicker,
  openColorPicker,
  initNewGroupModalEvents,
  openNewGroupModal,
  initExistingMembersPickerEvents,
  openAddExistingMembersModal
} from './ui.js';
import { initModals } from './modal.js';
import { prepareAndPrint } from './print.js';

export async function initApp() {
  console.log('Initializing Church Members Management System...');

  // 1. Initialize Modals & UI Components
  initModals();
  initColorPicker();
  initNewGroupModalEvents();
  initExistingMembersPickerEvents();

  // 2. State change subscription
  state.subscribe((event, data) => {
    renderMembersList();
  });

  // 3. Setup UI Controls & Event Listeners
  setupSearchAndFilters();
  setupViewModeToggle();
  setupColumnFilterDropdown();
  setupMoreOptionsMenu();
  setupGroupDragAndDrop();
  setupGroupActionDelegations();
  setupTableSorting();
  setupPersistenceButtons();
  setupKeyboardShortcuts();
  setupThemeToggle();
  setupBeforeUnloadWarning();

  // 4. Load Data
  const loadResult = await loadInitialData();
  if (loadResult.loaded) {
    if (loadResult.isEmpty) {
      showToast('مرحباً بك. يرجى رفع ملف البيانات (.json) للبدء، أو إضافة أول عضو.', 'info', 5000);
    } else if (loadResult.fromLocal) {
      showToast(`تم استعادة بيانات ${loadResult.count} عضو المحفوظة محلياً في متصفحك.`, 'info', 4000);
    } else if (loadResult.hasDraft) {
      showToast(`تم العثور على مسودة سابقة (${loadResult.draftCount} فرد).`, 'info', 5000);
    } else {
      showToast(`تم تحميل بيانات ${loadResult.count} عضو بنجاح.`, 'success');
    }
  } else {
    showToast('يرجى رفع ملف البيانات (.json) للبدء في تصفح الأعضاء.', 'info', 5000);
  }

  // Initial Render
  renderMembersList();
}

/**
 * Search & Filters setup - Clicking a group views ONLY its table!
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const btnClearMobileSearch = document.getElementById('btn-clear-mobile-search');
  const btnEmptyClear = document.getElementById('btn-empty-clear');

  const onSearchChange = (val) => {
    state.filters.search = val;
    if (searchInput && searchInput.value !== val) searchInput.value = val;
    if (mobileSearchInput && mobileSearchInput.value !== val) mobileSearchInput.value = val;
    if (btnClearSearch) {
      if (val) btnClearSearch.classList.remove('hidden');
      else btnClearSearch.classList.add('hidden');
    }
    if (btnClearMobileSearch) {
      if (val) btnClearMobileSearch.classList.remove('hidden');
      else btnClearMobileSearch.classList.add('hidden');
    }
    renderMembersList();
  };

  let debounceTimer = null;
  const handleInput = (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearchChange(e.target.value);
    }, 150);
  };

  if (searchInput) searchInput.addEventListener('input', handleInput);
  if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleInput);

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      onSearchChange('');
      if (searchInput) searchInput.focus();
    });
  }

  if (btnClearMobileSearch) {
    btnClearMobileSearch.addEventListener('click', () => {
      onSearchChange('');
      if (mobileSearchInput) mobileSearchInput.focus();
    });
  }

  if (btnEmptyClear) {
    btnEmptyClear.addEventListener('click', () => {
      onSearchChange('');
      if (searchInput) searchInput.focus();
    });
  }

  // Group Tab Button Delegation (Service Groups vs Sunday School Classes)
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.group-tab-btn');
    if (!tabBtn) return;
    const tab = tabBtn.dataset.tab;
    if (tab && (tab === 'service' || tab === 'sunday_school')) {
      state.setGroupTab(tab);
      state.filters.group = tab === 'sunday_school' ? '__all_sunday_school__' : 'all';
      renderMembersList();
    }
  });

  // Group Filter Button Delegation: Clicking ANY group or class views that table
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.group-nav-btn');
    if (!navBtn) return;

    const groupName = navBtn.dataset.group;
    if (groupName) {
      state.filters.group = groupName;
      renderMembersList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Audit Filter Button Delegation (Dedicated Diagnostic Bar)
  document.addEventListener('click', (e) => {
    const auditBtn = e.target.closest('.audit-filter-btn');
    if (!auditBtn) return;

    const auditType = auditBtn.dataset.audit;
    if (auditType === '__edited_only__') {
      state.filters.editedOnly = !state.filters.editedOnly;
      renderMembersList();
      renderUnsavedStatus();
      showToast(state.filters.editedOnly ? 'تم تفعيل تصفية السجلات المعدلة فقط' : 'تمت العودة لعرض كافة السجلات', 'info', 2000);
      return;
    }

    if (auditType) {
      state.filters.group = auditType;
      renderMembersList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Reset Audit Filters Delegation
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-reset-audit-filters')) {
      state.filters.group = state.groupTab === 'sunday_school' ? '__all_sunday_school__' : 'all';
      state.filters.editedOnly = false;
      renderMembersList();
      renderUnsavedStatus();
      showToast('تمت استعادة العرض الافتراضي وإلغاء فلاتر التدقيق', 'info', 2000);
    }
  });

  // Reset to default church multi-level sort button delegation
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-reset-church-sort')) {
      state.sort.field = 'default_church_sort';
      state.sort.direction = 'asc';
      renderMembersList();
      showToast('تمت استعادة الترتيب المعتمد (ذكور ثم إناث من الأكبر للأصغر)', 'info');
    }
  });
}

/**
 * Table Column and Dropdown Sorting setup
 */
function setupTableSorting() {
  // 1. Sort Dropdown Change
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'default_church_sort') {
        state.sort.field = 'default_church_sort';
        state.sort.direction = 'asc';
      } else {
        const parts = val.split('_');
        const dir = parts.pop();
        const field = parts.join('_');
        state.sort.field = field;
        state.sort.direction = dir || 'asc';
      }
      renderMembersList();
    });
  }

  // 2. Table Column Header Click Delegation
  document.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;

    const field = th.dataset.sort;
    if (!field) return;

    if (state.sort.field === field) {
      if (state.sort.direction === 'asc') {
        state.sort.direction = 'desc';
      } else {
        // 3rd click toggles back to default church multi-level sort
        state.sort.field = 'default_church_sort';
        state.sort.direction = 'asc';
        showToast('تمت استعادة الترتيب المعتمد (ذكور ثم إناث من الأكبر للأصغر)', 'info', 2000);
      }
    } else {
      state.sort.field = field;
      state.sort.direction = 'asc';
    }

    renderMembersList();
  });
}

/**
 * Drag and Drop reordering of groups from the filter bar on top
 */
function setupGroupDragAndDrop() {
  const jumpContainer = document.getElementById('group-jump-nav');
  if (!jumpContainer) return;

  let draggedGroup = null;

  jumpContainer.addEventListener('dragstart', (e) => {
    const chip = e.target.closest('.group-draggable-chip');
    if (!chip) return;
    draggedGroup = chip.dataset.group;
    e.dataTransfer.setData('text/plain', draggedGroup);
    e.dataTransfer.effectAllowed = 'move';
    chip.classList.add('opacity-40', 'scale-95');
  });

  jumpContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const chip = e.target.closest('.group-draggable-chip');
    if (chip && chip.dataset.group !== draggedGroup) {
      chip.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50/50');
    }
  });

  jumpContainer.addEventListener('dragleave', (e) => {
    const chip = e.target.closest('.group-draggable-chip');
    if (chip) {
      chip.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50/50');
    }
  });

  jumpContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetChip = e.target.closest('.group-draggable-chip');
    if (!targetChip || !draggedGroup) return;

    targetChip.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50/50');

    const sourceGroup = draggedGroup;
    const targetGroup = targetChip.dataset.group;

    if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
      const isSunday = state.groupTab === 'sunday_school';
      const currentList = isSunday ? [...state.sundaySchoolClasses] : [...state.serviceGroups];
      const fromIdx = currentList.indexOf(sourceGroup);
      const toIdx = currentList.indexOf(targetGroup);

      if (fromIdx !== -1 && toIdx !== -1) {
        currentList.splice(fromIdx, 1);
        currentList.splice(toIdx, 0, sourceGroup);
        state.setGroupsOrder(currentList, state.groupTab);
        renderMembersList();
        showToast(isSunday ? `تم تغيير ترتيب فصل "${sourceGroup}" بنجاح` : `تم تغيير ترتيب مجموعة "${sourceGroup}" بنجاح`, 'info', 2500);
      }
    }
  });

  jumpContainer.addEventListener('dragend', () => {
    draggedGroup = null;
    document.querySelectorAll('.group-draggable-chip').forEach(c => {
      c.classList.remove('opacity-40', 'scale-95', 'ring-2', 'ring-indigo-500', 'bg-indigo-50/50');
    });
  });
}

/**
 * Group Actions & Modals delegation (Color Picker, New Group, Add Existing Members)
 */
function setupGroupActionDelegations() {
  document.addEventListener('click', (e) => {
    // 1. Color Picker Trigger
    const colorTrigger = e.target.closest('.btn-color-picker-trigger');
    if (colorTrigger) {
      e.stopPropagation();
      const group = colorTrigger.dataset.group;
      if (group) {
        openColorPicker(colorTrigger, group);
      }
      return;
    }

    // 2. Open New Group or Class Modal
    const openGroupBtn = e.target.closest('#btn-open-new-group-modal');
    if (openGroupBtn) {
      openNewGroupModal('service');
      return;
    }

    const openClassBtn = e.target.closest('#btn-open-new-class-modal');
    if (openClassBtn) {
      openNewGroupModal('sunday_school');
      return;
    }

    // 3. Open Add Existing Members Modal
    const addExistingBtn = e.target.closest('.btn-open-add-existing');
    if (addExistingBtn) {
      const group = addExistingBtn.dataset.group;
      if (group) {
        openAddExistingMembersModal(group);
      }
      return;
    }

    // 4. Confirm & Verify Member Data (Update lastUpdated to now)
    const verifyBtn = e.target.closest('.btn-confirm-verify');
    if (verifyBtn) {
      const id = verifyBtn.dataset.id;
      const member = state.members.find(m => m.id === id);
      if (member) {
        state.confirmMemberData(id);
        renderMembersList();
        showToast(`تم تأكيد مراجعة بيانات "${member.name}" وتحديث التاريخ بنجاح`, 'success', 2500);
      }
      return;
    }

    // 5. Revert / Undo Single Row Changes
    const undoBtn = e.target.closest('.btn-undo-row');
    if (undoBtn) {
      const id = undoBtn.dataset.id;
      const member = state.members.find(m => m.id === id);
      const name = member ? member.name : 'هذا السجل';
      const isNew = state.isMemberNew(id);
      const confirmMsg = isNew
        ? `هل ترغب في إلغاء إضافة العضو الجديد "${name}"؟`
        : `هل ترغب في التراجع عن تعديلات "${name}" واستعادة بياناته الأصلية؟`;
      if (confirm(confirmMsg)) {
        const res = state.revertMember(id);
        if (res.success) {
          renderMembersList();
          showToast(res.wasNew ? `تم إلغاء إضافة "${res.name}"` : `تم التراجع عن تعديلات "${res.name}" واستعادة بياناته الأصلية`, 'info', 3000);
        }
      }
      return;
    }
  });
}

/**
 * Persistence (Save, Discard, Export, Import) buttons setup
 */
function setupPersistenceButtons() {
  // Save & Download Action: Triggered by floating bar, save button, or Ctrl+S
  const saveAction = async () => {
    if (!state.hasUnsavedChanges()) {
      // Even if no unsaved changes, allow exporting/downloading current state
      const targetFilename = state.currentFileName || 'church_members.json';
      downloadJsonFile(targetFilename);
      showToast(`تم تنزيل ملف البيانات (${targetFilename}) بنجاح`, 'info', 3000);
      return;
    }

    const res = await saveMembersJson();
    if (res.success) {
      showToast(`تم حفظ التعديلات وتنزيل ملف البيانات المحدث (${res.filename}) بنجاح`, 'success', 5000);
    }
  };

  const btnSaveFloating = document.getElementById('btn-save-floating');
  if (btnSaveFloating) btnSaveFloating.addEventListener('click', saveAction);

  // Toggle View Only Edited Rows Button in floating banner
  const btnToggleEdited = document.getElementById('btn-toggle-edited-only');
  if (btnToggleEdited) {
    btnToggleEdited.addEventListener('click', () => {
      state.filters.editedOnly = !state.filters.editedOnly;
      renderMembersList();
      renderUnsavedStatus();
      if (state.filters.editedOnly) {
        showToast('تم تفعيل عرض السجلات المعدلة والجديدة فقط', 'info', 2000);
      } else {
        showToast('تمت العودة لعرض كافة السجلات', 'info', 2000);
      }
    });
  }

  // Discard Changes Button
  const discardAction = () => {
    if (!state.hasUnsavedChanges()) return;
    if (confirm('هل أنت متأكد من التراجع عن كافة التعديلات واستعادة النسخة الأصلية المحفوظة؟')) {
      state.discardChanges();
      showToast('تم التراجع عن التعديلات واستعادة النسخة المحفوظة', 'info');
    }
  };

  const btnDiscardFloating = document.getElementById('btn-discard-floating');
  if (btnDiscardFloating) btnDiscardFloating.addEventListener('click', discardAction);

  // Export / Download Current Backup
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const targetFilename = state.currentFileName || 'church_members.json';
      downloadJsonFile(targetFilename);
      showToast(`تم تنزيل نسخة من البيانات (${targetFilename}) بنجاح`, 'success');
    });
  }

  // Save to Disk / Download Updated File
  const btnSaveDisk = document.getElementById('btn-save-disk');
  if (btnSaveDisk) {
    btnSaveDisk.addEventListener('click', saveAction);
  }

  // Export CSV
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      exportToCsv();
      showToast('تم تصدير كشف إكسيل (CSV) بنجاح', 'success');
    });
  }

  // Core File Upload Handler (confidential client-side parsing)
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (state.hasUnsavedChanges()) {
      if (!confirm('توجد تعديلات حالية غير محفوظة. هل ترغب في فتح ملف جديد وإلغاء هذه التعديلات؟')) {
        return;
      }
    }

    try {
      const importedData = await importJsonFile(file);
      state.currentFileName = file.name || 'church_members.json';
      state.setMembers(importedData, true);

      // Cache locally in browser
      try {
        localStorage.setItem('church_members_data_v2', JSON.stringify(importedData));
        localStorage.removeItem('church_members_draft_v2');
      } catch (e) {}

      showToast(`تم فتح وتحميل بيانات ${importedData.length} عضو بنجاح من ملف ${file.name}`, 'success', 5000);
    } catch (err) {
      showToast(`فشل قراءة الملف: ${err.message}`, 'error', 5000);
    }
  };

  // Upload Buttons (Header + Menu) and Input
  const fileInput = document.getElementById('import-file-input');
  const btnUploadHeader = document.getElementById('btn-upload-file-header');
  const btnImportTrigger = document.getElementById('btn-import-trigger');

  if (btnUploadHeader && fileInput) {
    btnUploadHeader.addEventListener('click', () => fileInput.click());
  }

  if (btnImportTrigger && fileInput) {
    btnImportTrigger.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file);
      fileInput.value = '';
    });
  }

  // Drag and Drop Support anywhere on the page
  const overlay = document.getElementById('drag-drop-overlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (overlay) overlay.classList.remove('hidden');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (overlay) overlay.classList.add('hidden');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.add('hidden');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  // Clear Session & Lock Data for Privacy on Shared Computers
  const btnClearSession = document.getElementById('btn-clear-session');
  if (btnClearSession) {
    btnClearSession.addEventListener('click', () => {
      if (confirm('تنبيه خصوصية وسرية للبيانات:\nهل ترغب في مسح بيانات الأعضاء من ذاكرة هذا المتصفح وقفل الجلسة؟\n(تأكد أولاً من حفظ وتنزيل أحدث ملف بيانات قبل الإغلاق)')) {
        clearLocalData();
        renderMembersList();
        renderStats();
        renderUnsavedStatus();
        showToast('تم مسح البيانات وقفل الجلسة بأمان من ذاكرة المتصفح', 'info', 4500);
      }
    });
  }

  // Print to PDF
  const btnPrint = document.getElementById('btn-print-pdf');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      prepareAndPrint();
    });
  }
}

/**
 * Keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + S: Save & Download updated file
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveMembersJson().then(res => {
        if (res.success) {
          showToast(`تم حفظ التعديلات وتنزيل ملف البيانات المحدث (${res.filename}) بنجاح`, 'success', 5000);
        }
      });
      return;
    }

    // Ctrl + P: Print
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      prepareAndPrint();
      return;
    }

    // Ctrl + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      const activeEl = document.activeElement;
      if (!activeEl || !['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }
    }
  });
}

/**
 * Dark / Light Theme Toggle
 */
function setupThemeToggle() {
  const btnTheme = document.getElementById('btn-toggle-theme');
  const isDark = localStorage.getItem('theme_dark') === 'true';

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      if (isCurrentlyDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme_dark', 'false');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme_dark', 'true');
      }
    });
  }
}

/**
 * View Mode Toggle setup (Table view vs Mobile Cards view)
 */
function setupViewModeToggle() {
  const btnTable = document.getElementById('btn-view-table');
  const btnCards = document.getElementById('btn-view-cards');

  if (btnTable) {
    btnTable.addEventListener('click', () => {
      state.setViewMode('table');
      showToast('تم التبديل إلى العرض الجدولي', 'info', 1800);
    });
  }

  if (btnCards) {
    btnCards.addEventListener('click', () => {
      state.setViewMode('cards');
      showToast('تم التبديل إلى عرض البطاقات المخصص للهاتف', 'info', 1800);
    });
  }
}

/**
 * Column Filter Dropdown setup (Show/Hide Table Columns)
 */
function setupColumnFilterDropdown() {
  const trigger = document.getElementById('btn-column-filter');
  const menu = document.getElementById('column-filter-menu');
  const container = document.getElementById('column-filter-container');
  const resetBtn = document.getElementById('btn-reset-columns');

  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close more-options-menu if open
      const moreMenu = document.getElementById('more-options-menu');
      if (moreMenu) moreMenu.classList.add('hidden');
      menu.classList.toggle('hidden');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('hidden') && (!container || !container.contains(e.target))) {
        menu.classList.add('hidden');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    });
  }

  // Delegation for column toggle checkboxes
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('col-toggle-checkbox')) {
      const colKey = e.target.dataset.col;
      if (colKey) {
        state.toggleColumn(colKey);
      }
    }
  });

  // Reset all columns to visible
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.resetColumns();
      showToast('تم إظهار كافة أعمدة الجدول بنجاح', 'info', 2000);
    });
  }
}

/**
 * More Options Dropdown Menu setup (Touchscreen & click friendly)
 */
function setupMoreOptionsMenu() {
  const trigger = document.getElementById('btn-more-options-trigger');
  const menu = document.getElementById('more-options-menu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('hidden') && !e.target.closest('#more-options-container')) {
      menu.classList.add('hidden');
    }
  });

  // Close when clicking any menu item inside
  menu.addEventListener('click', () => {
    menu.classList.add('hidden');
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
    }
  });
}

/**
 * Warning before leaving if unsaved changes exist
 */
function setupBeforeUnloadWarning() {
  window.addEventListener('beforeunload', (e) => {
    if (state.hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = 'لديك تعديلات غير محفوظة، هل أنت متأكد من مغادرة الصفحة؟';
      return e.returnValue;
    }
  });
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
