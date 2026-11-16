/**
 * DeadlineShield Dashboard, Needs Attention & Progress Tracker (Frontend Client)
 * Computes live metrics, motivational quotes, countdown ticker, and progress visualizations
 */

window.DeadlineShieldDashboard = (function () {
  let countdownInterval = null;

  const motivationalQuotes = [
    { text: "Small daily milestones protect you from massive midnight panic.", author: "DeadlineShield Philosophy" },
    { text: "The secret to getting ahead is getting started. Break it into bite-sized steps.", author: "Mark Twain" },
    { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { text: "Consistency beats intensity every single semester.", author: "Academic Mindset" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" }
  ];

  function init() {
    renderDashboard();
    renderNeedsAttention();
    renderProgressTracker();
    renderCalendar();
    setMotivationalQuote();
    startCountdownTicker();

    window.addEventListener('deadlineshield:datachanged', () => {
      renderDashboard();
      renderNeedsAttention();
      renderProgressTracker();
      renderCalendar();
      startCountdownTicker();
    });
  }

  function setMotivationalQuote() {
    const quoteEl = document.getElementById('dailyQuoteText');
    const authorEl = document.getElementById('dailyQuoteAuthor');
    if (!quoteEl) return;

    // Pick quote based on day of month so it rotates daily
    const day = new Date().getDate();
    const quote = motivationalQuotes[day % motivationalQuotes.length];

    quoteEl.textContent = `"${quote.text}"`;
    if (authorEl) authorEl.textContent = `— ${quote.author}`;
  }

  function renderDashboard() {
    const tasks = window.DeadlineShieldStorage.getAllTasks();
    const now = new Date();

    let totalTasks = tasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let upcoming72hTasks = 0;

    const tasksWithPriority = tasks.map(t => {
      const p = window.DeadlineShieldPriority.calculatePriority(t, now);
      if (t.status === 'completed') {
        completedTasks++;
      } else {
        pendingTasks++;
        if (p.isOverdue) {
          overdueTasks++;
        } else if (p.hoursRemaining <= 72) {
          upcoming72hTasks++;
        }
      }
      return { ...t, priorityInfo: p };
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update stat numbers
    updateStatText('statTotalTasks', totalTasks);
    updateStatText('statPendingTasks', pendingTasks);
    updateStatText('statCompletedTasks', completedTasks);
    updateStatText('statOverdueTasks', overdueTasks);
    updateStatText('statUpcomingTasks', upcoming72hTasks);
    updateStatText('statCompletionRate', `${completionRate}%`);

    // Circular or Bar Progress Fill
    const progressFill = document.getElementById('dashboardProgressFill');
    if (progressFill) {
      progressFill.style.width = `${completionRate}%`;
    }

    // Render Today's Priority Tasks (Top 3-4 critical / high tasks)
    renderTodayPriorityTasks(tasksWithPriority);

    // Render Upcoming Deadlines List
    renderUpcomingDeadlinesList(tasksWithPriority);
  }

  function updateStatText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderTodayPriorityTasks(tasksWithPriority) {
    const container = document.getElementById('dashboardPriorityTasksList');
    if (!container) return;

    const urgentTasks = tasksWithPriority
      .filter(t => t.status !== 'completed')
      .sort((a, b) => b.priorityInfo.score - a.priorityInfo.score)
      .slice(0, 4);

    if (urgentTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-emoji">🎉</div>
          <h4>All Clear for Today!</h4>
          <p>No critical deadlines pending. You're completely ahead of schedule!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = urgentTasks.map(task => {
      const p = task.priorityInfo;
      const d = new Date(task.deadline);
      const isOverdue = p.isOverdue;

      return `
        <div class="priority-list-item priority-${p.level.toLowerCase()}">
          <div class="item-left">
            <span class="priority-pill ${p.badgeClass}">${p.level}</span>
            <div class="item-info">
              <h5 class="item-title">${escapeHtml(task.title)}</h5>
              <span class="item-meta">
                ${task.course ? `<strong>${escapeHtml(task.course)}</strong> • ` : ''}
                ${isOverdue ? `<span class="text-danger font-medium">Overdue!</span>` : `Due in ${Math.max(1, Math.round(p.hoursRemaining))}h`} • 
                ${task.effortHours || 2}h effort
              </span>
            </div>
          </div>
          <div class="item-right">
            <button class="btn btn-xs btn-outline" onclick="DeadlineShieldTasks.openAiPlannerForTask('${task.id}')">
              AI Plan
            </button>
            <button class="btn btn-xs btn-primary" onclick="DeadlineShieldTasks.toggleComplete('${task.id}')">
              Done
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderUpcomingDeadlinesList(tasksWithPriority) {
    const container = document.getElementById('dashboardUpcomingList');
    if (!container) return;

    const upcoming = tasksWithPriority
      .filter(t => t.status !== 'completed' && !t.priorityInfo.isOverdue)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <p>No upcoming deadlines within the immediate horizon.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(task => {
      const d = new Date(task.deadline);
      const days = Math.round(task.priorityInfo.daysRemaining);
      const dayText = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`;

      return `
        <div class="upcoming-item">
          <div class="upcoming-date-box">
            <span class="month">${d.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span class="day">${d.getDate()}</span>
          </div>
          <div class="upcoming-details">
            <h5 class="upcoming-title">${escapeHtml(task.title)}</h5>
            <span class="upcoming-sub">${task.course || task.category} • <strong class="text-primary">${dayText}</strong></span>
          </div>
          <span class="priority-dot-badge ${task.priorityInfo.badgeClass}" title="Priority: ${task.priorityInfo.level}"></span>
        </div>
      `;
    }).join('');
  }

  function startCountdownTicker() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    function updateTicker() {
      const tasks = window.DeadlineShieldStorage.getAllTasks();
      const now = new Date();

      // Find the closest pending deadline in the future
      const pendingFutureTasks = tasks
        .filter(t => t.status !== 'completed')
        .map(t => ({ task: t, date: new Date(t.deadline) }))
        .filter(item => !isNaN(item.date.getTime()) && item.date.getTime() > now.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const tickerContainer = document.getElementById('closestDeadlineCountdown');
      if (!tickerContainer) return;

      if (pendingFutureTasks.length === 0) {
        tickerContainer.innerHTML = `
          <div class="countdown-badge-inner">
            <span class="countdown-label">Next Deadline:</span>
            <span class="countdown-time">No active deadlines</span>
          </div>
        `;
        return;
      }

      const closest = pendingFutureTasks[0];
      const diffMs = closest.date.getTime() - now.getTime();

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      tickerContainer.innerHTML = `
        <div class="countdown-badge-inner">
          <span class="countdown-label">⚡ Next Deadline: <strong>${escapeHtml(closest.task.title.slice(0, 22))}</strong></span>
          <span class="countdown-digits">
            ${days > 0 ? `<strong>${days}</strong>d ` : ''}
            <strong>${pad(hours)}</strong>h 
            <strong>${pad(minutes)}</strong>m 
            <strong class="sec-highlight">${pad(seconds)}</strong>s
          </span>
        </div>
      `;
    }

    updateTicker();
    countdownInterval = setInterval(updateTicker, 1000);
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  // MODULE 5: NEEDS ATTENTION
  function renderNeedsAttention() {
    const container = document.getElementById('needsAttentionContainer');
    if (!container) return;

    const tasks = window.DeadlineShieldStorage.getAllTasks();
    const now = new Date();

    const tasksWithPriority = tasks.map(t => ({
      ...t,
      priorityInfo: window.DeadlineShieldPriority.calculatePriority(t, now)
    }));

    const overdue = tasksWithPriority.filter(t => t.status !== 'completed' && t.priorityInfo.isOverdue);
    const dueWithin24h = tasksWithPriority.filter(t => t.status !== 'completed' && !t.priorityInfo.isOverdue && t.priorityInfo.hoursRemaining <= 24);
    const dueWithin3d = tasksWithPriority.filter(t => t.status !== 'completed' && !t.priorityInfo.isOverdue && t.priorityInfo.hoursRemaining > 24 && t.priorityInfo.hoursRemaining <= 72);
    const incompleteSubtasks = tasksWithPriority.filter(t => {
      if (t.status === 'completed') return false;
      const subs = Array.isArray(t.subtasks) ? t.subtasks : [];
      return subs.length > 0 && subs.some(s => s.status !== 'completed');
    });

    const totalAttentionNeeded = overdue.length + dueWithin24h.length + dueWithin3d.length;

    const alertBanner = document.getElementById('needsAttentionHeaderCount');
    if (alertBanner) {
      alertBanner.textContent = `${totalAttentionNeeded} Urgent Items`;
    }

    container.innerHTML = `
      <!-- Overdue Section -->
      <div class="attention-block block-overdue">
        <div class="attention-block-header">
          <div class="block-title-row">
            <span class="block-icon">🚨</span>
            <div>
              <h3>Overdue Deadlines (${overdue.length})</h3>
              <p>These tasks have passed their deadline without completion. Take immediate action.</p>
            </div>
          </div>
        </div>
        <div class="attention-card-list">
          ${overdue.length === 0 ? '<p class="attention-empty-text">No overdue tasks! You are on track.</p>' : overdue.map(t => renderAttentionCard(t, 'overdue')).join('')}
        </div>
      </div>

      <!-- Due within 24 Hours Section -->
      <div class="attention-block block-critical">
        <div class="attention-block-header">
          <div class="block-title-row">
            <span class="block-icon">⏳</span>
            <div>
              <h3>Due Within 24 Hours (${dueWithin24h.length})</h3>
              <p>Final stretch! Tasks due today or tonight requiring immediate focus.</p>
            </div>
          </div>
        </div>
        <div class="attention-card-list">
          ${dueWithin24h.length === 0 ? '<p class="attention-empty-text">No deadlines due in the next 24 hours.</p>' : dueWithin24h.map(t => renderAttentionCard(t, 'critical')).join('')}
        </div>
      </div>

      <!-- Due within 3 Days Section -->
      <div class="attention-block block-soon">
        <div class="attention-block-header">
          <div class="block-title-row">
            <span class="block-icon">📅</span>
            <div>
              <h3>Due Within 3 Days (${dueWithin3d.length})</h3>
              <p>Upcoming workload. Break these tasks into steps now to prevent last-minute cramming.</p>
            </div>
          </div>
        </div>
        <div class="attention-card-list">
          ${dueWithin3d.length === 0 ? '<p class="attention-empty-text">No deadlines due in the next 3 days.</p>' : dueWithin3d.map(t => renderAttentionCard(t, 'soon')).join('')}
        </div>
      </div>

      <!-- Tasks With Incomplete Subtasks -->
      <div class="attention-block block-subtasks">
        <div class="attention-block-header">
          <div class="block-title-row">
            <span class="block-icon">🎯</span>
            <div>
              <h3>Active Plans With Pending Steps (${incompleteSubtasks.length})</h3>
              <p>You have structured AI breakdowns in progress. Check off your daily steps.</p>
            </div>
          </div>
        </div>
        <div class="attention-card-list">
          ${incompleteSubtasks.length === 0 ? '<p class="attention-empty-text">No active subtasks in progress.</p>' : incompleteSubtasks.map(t => renderSubtaskAttentionCard(t)).join('')}
        </div>
      </div>
    `;
  }

  function renderAttentionCard(task, urgency) {
    const p = task.priorityInfo;
    const deadlineDate = new Date(task.deadline);

    return `
      <div class="attention-task-card urgency-${urgency}">
        <div class="att-card-main">
          <div class="att-title-row">
            <span class="category-pill">${escapeHtml(task.category)}</span>
            ${task.course ? `<span class="course-pill">${escapeHtml(task.course)}</span>` : ''}
            <span class="priority-badge ${p.badgeClass}">${p.level}</span>
          </div>
          <h4 class="att-task-title">${escapeHtml(task.title)}</h4>
          <p class="att-explanation">${escapeHtml(p.explanation)}</p>
        </div>
        <div class="att-card-side">
          <span class="att-time-badge">${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <div class="att-buttons">
            <button class="btn btn-sm btn-ai-action" onclick="DeadlineShieldTasks.openAiPlannerForTask('${task.id}')">
              AI Plan
            </button>
            <button class="btn btn-sm btn-primary" onclick="DeadlineShieldTasks.toggleComplete('${task.id}')">
              Mark Done
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSubtaskAttentionCard(task) {
    const subs = task.subtasks || [];
    const done = subs.filter(s => s.status === 'completed').length;
    const pct = Math.round((done / subs.length) * 100);
    const nextPending = subs.find(s => s.status !== 'completed');

    return `
      <div class="attention-task-card urgency-plan">
        <div class="att-card-main">
          <div class="att-title-row">
            <span class="course-pill">${escapeHtml(task.course || task.category)}</span>
            <span class="badge-subtask-progress">${done}/${subs.length} Steps Done (${pct}%)</span>
          </div>
          <h4 class="att-task-title">${escapeHtml(task.title)}</h4>
          ${nextPending ? `
            <div class="next-step-box">
              <span class="next-label">👉 Next milestone:</span>
              <strong>${escapeHtml(nextPending.title)}</strong> 
              <span class="next-time">(${escapeHtml(nextPending.suggestedDay)} • ${escapeHtml(nextPending.estimatedDuration)})</span>
            </div>
          ` : ''}
        </div>
        <div class="att-card-side">
          <button class="btn btn-sm btn-outline" onclick="DeadlineShieldTasks.openAiPlannerForTask('${task.id}')">
            Continue Plan
          </button>
        </div>
      </div>
    `;
  }

  // MODULE 6: PROGRESS TRACKER
  function renderProgressTracker() {
    const container = document.getElementById('progressTrackerContainer');
    if (!container) return;

    const tasks = window.DeadlineShieldStorage.getAllTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Subtask metrics
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach(t => {
      if (Array.isArray(t.subtasks)) {
        totalSubtasks += t.subtasks.length;
        completedSubtasks += t.subtasks.filter(s => s.status === 'completed').length;
      }
    });
    const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Subject/Course Breakdown
    const courseMap = {};
    tasks.forEach(t => {
      const course = t.course || 'General';
      if (!courseMap[course]) {
        courseMap[course] = { total: 0, completed: 0 };
      }
      courseMap[course].total += 1;
      if (t.status === 'completed') {
        courseMap[course].completed += 1;
      }
    });

    // Category Breakdown
    const categoryMap = {};
    tasks.forEach(t => {
      const cat = t.category || 'Assignment';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += 1;
    });

    container.innerHTML = `
      <div class="progress-hero-grid">
        <div class="progress-card hero-metric">
          <h4>Overall Task Completion</h4>
          <div class="hero-gauge-wrapper">
            <div class="hero-number">${completionPct}%</div>
            <div class="hero-label">${completedTasks} of ${totalTasks} tasks resolved</div>
          </div>
          <div class="progress-bar-lg">
            <div class="progress-bar-fill fill-primary" style="width: ${completionPct}%"></div>
          </div>
        </div>

        <div class="progress-card hero-metric">
          <h4>Subtask Milestone Velocity</h4>
          <div class="hero-gauge-wrapper">
            <div class="hero-number text-success">${subtaskPct}%</div>
            <div class="hero-label">${completedSubtasks} of ${totalSubtasks} micro-steps conquered</div>
          </div>
          <div class="progress-bar-lg">
            <div class="progress-bar-fill fill-success" style="width: ${subtaskPct}%"></div>
          </div>
        </div>
      </div>

      <div class="progress-details-grid">
        <!-- Course Breakdown -->
        <div class="progress-card">
          <div class="card-header-simple">
            <h4>Subject & Course Completion</h4>
          </div>
          <div class="course-progress-list">
            ${Object.keys(courseMap).map(course => {
              const item = courseMap[course];
              const pct = Math.round((item.completed / item.total) * 100);
              return `
                <div class="course-progress-item">
                  <div class="course-meta-row">
                    <span class="course-name">${escapeHtml(course)}</span>
                    <span class="course-ratio">${item.completed}/${item.total} (${pct}%)</span>
                  </div>
                  <div class="subtask-progress-bar">
                    <div class="subtask-progress-fill" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Category Workload -->
        <div class="progress-card">
          <div class="card-header-simple">
            <h4>Academic Workload Distribution</h4>
          </div>
          <div class="category-distribution-list">
            ${Object.keys(categoryMap).map(cat => {
              const count = categoryMap[cat];
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return `
                <div class="category-dist-item">
                  <div class="dist-meta">
                    <span class="dist-name">${escapeHtml(cat)}</span>
                    <span class="dist-count">${count} tasks (${pct}%)</span>
                  </div>
                  <div class="subtask-progress-bar">
                    <div class="subtask-progress-fill fill-secondary" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // CALENDAR VIEW
  function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const tasks = window.DeadlineShieldStorage.getAllTasks();
    const now = new Date();

    // Group tasks by upcoming 14 days
    const daysArray = [];
    for (let i = -1; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateKey = d.toDateString();
      daysArray.push({
        date: d,
        dateKey,
        isToday: i === 0,
        isPast: i < 0,
        tasks: []
      });
    }

    tasks.forEach(t => {
      const td = new Date(t.deadline);
      if (!isNaN(td.getTime())) {
        const key = td.toDateString();
        const foundDay = daysArray.find(day => day.dateKey === key);
        if (foundDay) {
          foundDay.tasks.push(t);
        }
      }
    });

    container.innerHTML = `
      <div class="calendar-timeline-grid">
        ${daysArray.map(day => {
          const isToday = day.isToday;
          const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return `
            <div class="calendar-day-col ${isToday ? 'is-today' : ''} ${day.isPast ? 'is-past' : ''}">
              <div class="calendar-day-header">
                <span class="day-weekday">${dayName}</span>
                <span class="day-monthday">${monthDay}</span>
                ${isToday ? '<span class="today-pill">TODAY</span>' : ''}
              </div>
              <div class="calendar-tasks-slot">
                ${day.tasks.length === 0 ? '<span class="slot-empty">—</span>' : day.tasks.map(t => {
                  const p = window.DeadlineShieldPriority.calculatePriority(t);
                  return `
                    <div class="calendar-task-chip ${t.status === 'completed' ? 'chip-done' : ''} priority-${p.level.toLowerCase()}" 
                         title="${escapeAttr(t.title)} (${p.level})">
                      <span class="chip-dot"></span>
                      <span class="chip-text">${escapeHtml(t.title)}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
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
    renderDashboard,
    renderNeedsAttention,
    renderProgressTracker,
    renderCalendar
  };
})();
