/**
 * DeadlineShield Task Manager (Frontend Client)
 * Handles task rendering, filtering, searching, sorting, and CRUD modal operations
 */

window.DeadlineShieldTasks = (function () {
  let currentFilters = {
    search: '',
    category: 'all',
    status: 'all',
    priority: 'all',
    sort: 'deadline-asc'
  };

  let pendingDeleteTaskId = null;
  let editingTaskId = null;

  function init() {
    setupEventListeners();
    renderTasks();
  }

  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase().trim();
        renderTasks();
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('taskCategoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        renderTasks();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('taskStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        renderTasks();
      });
    }

    // Priority filter
    const priorityFilter = document.getElementById('taskPriorityFilter');
    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        renderTasks();
      });
    }

    // Sort order
    const sortSelect = document.getElementById('taskSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        renderTasks();
      });
    }

    // New Task Form Submission
    const taskForm = document.getElementById('taskModalForm');
    if (taskForm) {
      taskForm.addEventListener('submit', handleTaskFormSubmit);
    }

    // Export CSV button
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportTasksToCsv);
    }

    // Listen to data changes from storage
    window.addEventListener('deadlineshield:datachanged', () => {
      renderTasks();
    });
  }

  function getFilteredAndSortedTasks() {
    let tasks = window.DeadlineShieldStorage.getAllTasks();

    // 1. Search Filter
    if (currentFilters.search) {
      const q = currentFilters.search;
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.course && t.course.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (currentFilters.category !== 'all') {
      tasks = tasks.filter(t => (t.category || '').toLowerCase() === currentFilters.category.toLowerCase());
    }

    // 3. Status Filter
    if (currentFilters.status !== 'all') {
      tasks = tasks.filter(t => (t.status || 'pending').toLowerCase() === currentFilters.status.toLowerCase());
    }

    // 4. Attach Priority to each task for filtering & sorting
    tasks = tasks.map(t => {
      const priorityInfo = window.DeadlineShieldPriority.calculatePriority(t);
      return { ...t, priorityInfo };
    });

    // 5. Priority Filter
    if (currentFilters.priority !== 'all') {
      tasks = tasks.filter(t => t.priorityInfo.level.toLowerCase() === currentFilters.priority.toLowerCase());
    }

    // 6. Sorting
    tasks.sort((a, b) => {
      if (currentFilters.sort === 'deadline-asc') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (currentFilters.sort === 'deadline-desc') {
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      } else if (currentFilters.sort === 'priority-desc') {
        return b.priorityInfo.score - a.priorityInfo.score;
      } else if (currentFilters.sort === 'effort-desc') {
        return (parseFloat(b.effortHours) || 0) - (parseFloat(a.effortHours) || 0);
      } else if (currentFilters.sort === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return tasks;
  }

  function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    const tasks = getFilteredAndSortedTasks();
    const countBadge = document.getElementById('tasksFilteredCount');
    if (countBadge) {
      countBadge.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
    }

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No tasks found</h3>
          <p>No deadlines match your current search or filter criteria. Try resetting filters or adding a new assignment.</p>
          <button class="btn btn-primary" onclick="DeadlineShieldTasks.openCreateModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add New Task
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => renderTaskCard(task)).join('');
  }

  function renderTaskCard(task) {
    const isCompleted = task.status === 'completed';
    const p = task.priorityInfo || window.DeadlineShieldPriority.calculatePriority(task);
    const deadlineDate = new Date(task.deadline);
    const isValidDate = !isNaN(deadlineDate.getTime());

    // Deadline badge format
    let deadlineBadgeHtml = '';
    if (isValidDate) {
      const now = new Date();
      const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

      if (isCompleted) {
        deadlineBadgeHtml = `<span class="deadline-badge deadline-completed">Completed</span>`;
      } else if (diffHours < 0) {
        const hoursAgo = Math.abs(Math.round(diffHours));
        const daysAgo = Math.floor(hoursAgo / 24);
        const text = daysAgo > 0 ? `${daysAgo}d ago` : `${hoursAgo}h ago`;
        deadlineBadgeHtml = `<span class="deadline-badge deadline-overdue">Overdue by ${text}</span>`;
      } else if (diffHours <= 24) {
        deadlineBadgeHtml = `<span class="deadline-badge deadline-urgent">Due in ${Math.max(1, Math.round(diffHours))}h</span>`;
      } else if (diffHours <= 72) {
        deadlineBadgeHtml = `<span class="deadline-badge deadline-soon">Due in ${Math.round(diffHours / 24)}d</span>`;
      } else {
        deadlineBadgeHtml = `<span class="deadline-badge deadline-normal">${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
      }
    }

    // Subtask progress
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const totalSubs = subtasks.length;
    const completedSubs = subtasks.filter(s => s.status === 'completed').length;
    const progressPct = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''} priority-${p.level.toLowerCase()}" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-card-tags">
            <span class="category-pill tag-${(task.category || 'assignment').toLowerCase().replace(/\s+/g, '-')}">
              ${getCategoryIcon(task.category)} ${escapeHtml(task.category || 'Assignment')}
            </span>
            ${task.course ? `<span class="course-pill">${escapeHtml(task.course)}</span>` : ''}
            <span class="difficulty-pill diff-${(task.difficulty || 'medium').toLowerCase()}">${escapeHtml(task.difficulty || 'Medium')}</span>
          </div>

          <div class="task-card-badges">
            <span class="priority-badge ${p.badgeClass}" title="${escapeHtml(p.explanation)}">
              ${p.level === 'CRITICAL' ? '<span class="pulse-dot"></span>' : ''}
              ${p.level}
            </span>
            ${deadlineBadgeHtml}
          </div>
        </div>

        <div class="task-card-body">
          <div class="task-title-row">
            <label class="custom-checkbox-wrapper" title="Mark as ${isCompleted ? 'incomplete' : 'completed'}">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="DeadlineShieldTasks.toggleComplete('${task.id}')">
              <span class="custom-checkbox"></span>
            </label>
            <h4 class="task-title ${isCompleted ? 'title-struck' : ''}">${escapeHtml(task.title)}</h4>
          </div>

          ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

          <!-- Intelligent Priority Explanation Banner -->
          <div class="priority-explanation-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>${escapeHtml(p.explanation)}</span>
          </div>

          <!-- Subtasks Progress -->
          <div class="task-subtasks-preview">
            <div class="subtasks-summary-header">
              <span class="subtask-count-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                ${totalSubs > 0 ? `${completedSubs} of ${totalSubs} steps done (${progressPct}%)` : 'No steps broken down yet'}
              </span>
              <button class="btn-link-action" onclick="DeadlineShieldTasks.openAiPlannerForTask('${task.id}')">
                ${totalSubs > 0 ? 'View / Edit Plan' : '⚡ AI Task Breakdown'}
              </button>
            </div>
            ${totalSubs > 0 ? `
              <div class="subtask-progress-bar">
                <div class="subtask-progress-fill" style="width: ${progressPct}%"></div>
              </div>
            ` : ''}
          </div>

          <div class="task-metadata-footer">
            <span class="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escapeHtml(task.effortHours || 2)}h effort
            </span>
            <span class="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${isValidDate ? deadlineDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}
            </span>
          </div>
        </div>

        <div class="task-card-actions">
          <button class="btn btn-sm btn-ai-action" onclick="DeadlineShieldTasks.openAiPlannerForTask('${task.id}')" title="Generate or refine subtasks with AI">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/></svg>
            AI Plan
          </button>
          <button class="btn btn-sm btn-outline" onclick="DeadlineShieldTasks.openEditModal('${task.id}')" title="Edit task details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn btn-sm btn-danger-icon" onclick="DeadlineShieldTasks.confirmDelete('${task.id}', '${escapeAttr(task.title)}')" title="Delete task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function getCategoryIcon(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('exam')) return '📝';
    if (cat.includes('project')) return '🚀';
    if (cat.includes('lab')) return '🔬';
    if (cat.includes('presentation')) return '🎤';
    if (cat.includes('assignment')) return '📚';
    return '📌';
  }

  function toggleComplete(id) {
    const newStatus = window.DeadlineShieldStorage.toggleTaskComplete(id);
    if (newStatus === 'completed') {
      window.DeadlineShieldApp.showToast('Task marked as completed! 🎉', 'success');
    } else {
      window.DeadlineShieldApp.showToast('Task reopened.', 'info');
    }
  }

  function openCreateModal() {
    editingTaskId = null;
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    const form = document.getElementById('taskModalForm');

    if (!modal || !form) return;

    modalTitle.textContent = 'Add New Academic Task';
    form.reset();

    // Default deadline to 3 days from now
    const defaultDate = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const deadlineInput = document.getElementById('modalTaskDeadline');
    if (deadlineInput) deadlineInput.value = localIso;

    const effortInput = document.getElementById('modalTaskEffort');
    if (effortInput) effortInput.value = '4';

    modal.classList.add('is-active');
  }

  function openEditModal(id) {
    const task = window.DeadlineShieldStorage.getTaskById(id);
    if (!task) return;

    editingTaskId = id;
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModalTitle');
    if (!modal) return;

    modalTitle.textContent = 'Edit Academic Task';

    document.getElementById('modalTaskTitle').value = task.title || '';
    document.getElementById('modalTaskCourse').value = task.course || '';
    document.getElementById('modalTaskCategory').value = task.category || 'Assignment';
    document.getElementById('modalTaskDifficulty').value = task.difficulty || 'Medium';
    document.getElementById('modalTaskEffort').value = task.effortHours || '4';
    document.getElementById('modalTaskDescription').value = task.description || '';
    document.getElementById('modalTaskNotes').value = task.notes || '';
    document.getElementById('modalTaskStatus').value = task.status || 'pending';

    if (task.deadline) {
      const d = new Date(task.deadline);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      document.getElementById('modalTaskDeadline').value = localIso;
    }

    modal.classList.add('is-active');
  }

  function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('is-active');
    editingTaskId = null;
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('modalTaskTitle').value.trim();
    if (!title) {
      window.DeadlineShieldApp.showToast('Please enter a task title.', 'error');
      return;
    }

    const course = document.getElementById('modalTaskCourse').value.trim();
    const category = document.getElementById('modalTaskCategory').value;
    const difficulty = document.getElementById('modalTaskDifficulty').value;
    const effortHours = parseFloat(document.getElementById('modalTaskEffort').value) || 3;
    const deadlineVal = document.getElementById('modalTaskDeadline').value;
    const description = document.getElementById('modalTaskDescription').value.trim();
    const notes = document.getElementById('modalTaskNotes').value.trim();
    const status = document.getElementById('modalTaskStatus').value;

    if (!deadlineVal) {
      window.DeadlineShieldApp.showToast('Please specify a deadline date and time.', 'error');
      return;
    }

    const taskPayload = {
      id: editingTaskId || undefined,
      title,
      course,
      category,
      difficulty,
      effortHours,
      deadline: new Date(deadlineVal).toISOString(),
      description,
      notes,
      status
    };

    window.DeadlineShieldStorage.saveTask(taskPayload);
    closeTaskModal();
    window.DeadlineShieldApp.showToast(
      editingTaskId ? 'Task updated successfully!' : 'New task added to DeadlineShield!',
      'success'
    );
  }

  function confirmDelete(id, taskTitle) {
    pendingDeleteTaskId = id;
    const modal = document.getElementById('deleteConfirmModal');
    const msg = document.getElementById('deleteConfirmMessage');

    if (msg) {
      msg.textContent = `Are you sure you want to delete "${taskTitle}"? This cannot be undone.`;
    }
    if (modal) {
      modal.classList.add('is-active');
    }
  }

  function executeDelete() {
    if (pendingDeleteTaskId) {
      window.DeadlineShieldStorage.deleteTask(pendingDeleteTaskId);
      pendingDeleteTaskId = null;
      closeDeleteModal();
      window.DeadlineShieldApp.showToast('Task removed from your schedule.', 'info');
    }
  }

  function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.remove('is-active');
    pendingDeleteTaskId = null;
  }

  function openAiPlannerForTask(taskId) {
    // Switch to AI Planner view and select task
    window.DeadlineShieldApp.switchView('ai-planner');
    if (window.DeadlineShieldAiPlanner) {
      window.DeadlineShieldAiPlanner.selectTask(taskId);
    }
  }

  function exportTasksToCsv() {
    const tasks = window.DeadlineShieldStorage.getAllTasks();
    if (tasks.length === 0) {
      window.DeadlineShieldApp.showToast('No tasks to export.', 'warning');
      return;
    }

    const headers = ['Title', 'Course', 'Category', 'Deadline', 'Effort (Hours)', 'Difficulty', 'Status', 'Priority Level', 'Subtasks Total', 'Subtasks Done'];
    const rows = tasks.map(t => {
      const p = window.DeadlineShieldPriority.calculatePriority(t);
      const subs = Array.isArray(t.subtasks) ? t.subtasks : [];
      const doneSubs = subs.filter(s => s.status === 'completed').length;

      return [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.course || '').replace(/"/g, '""')}"`,
        `"${t.category || ''}"`,
        `"${t.deadline ? new Date(t.deadline).toISOString() : ''}"`,
        t.effortHours || 2,
        `"${t.difficulty || 'Medium'}"`,
        `"${t.status || 'pending'}"`,
        `"${p.level}"`,
        subs.length,
        doneSubs
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DeadlineShield_Tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.DeadlineShieldApp.showToast('Tasks exported as CSV!', 'success');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return {
    init,
    renderTasks,
    openCreateModal,
    openEditModal,
    closeTaskModal,
    confirmDelete,
    executeDelete,
    closeDeleteModal,
    toggleComplete,
    openAiPlannerForTask,
    exportTasksToCsv
  };
})();
