/**
 * DeadlineShield AI Task Breakdown Engine (Main USP)
 * Interacts with POST /api/breakdown
 * Provides interactive, editable subtask roadmap with Gemini AI integration
 */

window.DeadlineShieldAiPlanner = (function () {
  let activeTaskId = null;
  let currentPlan = [];
  let currentSummary = '';
  let isAiGenerated = false;
  let modelUsed = '';
  let fallbackReason = '';
  let isLoading = false;

  function init() {
    setupEventListeners();
    populateTaskSelector();
  }

  function setupEventListeners() {
    const taskSelect = document.getElementById('aiTaskSelect');
    if (taskSelect) {
      taskSelect.addEventListener('change', (e) => {
        handleTaskSelection(e.target.value);
      });
    }

    const generateBtn = document.getElementById('aiGeneratePlanBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', generatePlan);
    }

    const savePlanBtn = document.getElementById('aiSavePlanBtn');
    if (savePlanBtn) {
      savePlanBtn.addEventListener('click', savePlanToTask);
    }

    const addStepBtn = document.getElementById('aiAddCustomStepBtn');
    if (addStepBtn) {
      addStepBtn.addEventListener('click', addCustomStep);
    }

    const demoPresetBtn = document.getElementById('aiDemoPresetBtn');
    if (demoPresetBtn) {
      demoPresetBtn.addEventListener('click', loadDemoPreset);
    }

    // Refresh task selector when tasks change
    window.addEventListener('deadlineshield:datachanged', () => {
      populateTaskSelector();
    });
  }

  function populateTaskSelector() {
    const taskSelect = document.getElementById('aiTaskSelect');
    if (!taskSelect) return;

    const currentVal = taskSelect.value;
    const tasks = window.DeadlineShieldStorage.getAllTasks();

    taskSelect.innerHTML = '<option value="">-- Choose an existing task or enter custom details below --</option>';

    tasks.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = `${t.title} (${t.course || t.category || 'Task'})`;
      taskSelect.appendChild(option);
    });

    if (activeTaskId && tasks.some(t => t.id === activeTaskId)) {
      taskSelect.value = activeTaskId;
    } else if (currentVal && tasks.some(t => t.id === currentVal)) {
      taskSelect.value = currentVal;
    }
  }

  function selectTask(taskId) {
    activeTaskId = taskId;
    populateTaskSelector();

    const taskSelect = document.getElementById('aiTaskSelect');
    if (taskSelect) taskSelect.value = taskId;

    handleTaskSelection(taskId);
  }

  function handleTaskSelection(taskId) {
    activeTaskId = taskId;
    if (!taskId) return;

    const task = window.DeadlineShieldStorage.getTaskById(taskId);
    if (!task) return;

    // Fill the planner inputs with task info
    document.getElementById('aiInputTitle').value = task.title || '';
    document.getElementById('aiInputCourse').value = task.course || '';
    document.getElementById('aiInputCategory').value = task.category || 'Assignment';
    document.getElementById('aiInputEffort').value = task.effortHours || 5;
    document.getElementById('aiInputDifficulty').value = task.difficulty || 'Medium';
    document.getElementById('aiInputNotes').value = task.description || '';

    // If task already has subtasks saved, load them directly into current plan
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      currentPlan = JSON.parse(JSON.stringify(task.subtasks));
      currentSummary = `Existing plan for "${task.title}" (${currentPlan.length} steps). Click "Generate AI Plan" to refresh or regenerate with Gemini AI.`;
      isAiGenerated = false;
      modelUsed = 'Saved Plan';
      fallbackReason = '';
      renderSteps();
    }
  }

  function loadDemoPreset() {
    document.getElementById('aiTaskSelect').value = '';
    activeTaskId = null;

    document.getElementById('aiInputTitle').value = 'DBMS Mini Project: Library Management System';
    document.getElementById('aiInputCourse').value = 'CS204 Database Systems';
    document.getElementById('aiInputCategory').value = 'Project';
    document.getElementById('aiInputEffort').value = '10';
    document.getElementById('aiInputDifficulty').value = 'Hard';
    document.getElementById('aiInputNotes').value = 'Complete DBMS mini project on Library Management System. Need full relational design, borrow/return logic, and role-based permissions.';

    window.DeadlineShieldApp.showToast('Hackathon Demo Preset loaded! Click "Generate AI Plan".', 'info');
  }

  async function generatePlan() {
    const title = document.getElementById('aiInputTitle').value.trim();
    if (!title) {
      window.DeadlineShieldApp.showToast('Please enter a task title to generate a plan.', 'error');
      return;
    }

    const course = document.getElementById('aiInputCourse').value.trim();
    const category = document.getElementById('aiInputCategory').value;
    const effortHours = parseFloat(document.getElementById('aiInputEffort').value) || 5;
    const difficulty = document.getElementById('aiInputDifficulty').value;
    const notes = document.getElementById('aiInputNotes').value.trim();

    // Determine deadline from active task or default to 5 days
    let deadline = null;
    if (activeTaskId) {
      const task = window.DeadlineShieldStorage.getTaskById(activeTaskId);
      if (task && task.deadline) deadline = task.deadline;
    }
    if (!deadline) {
      deadline = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    }

    const payload = {
      title,
      course,
      category,
      effortHours,
      difficulty,
      description: notes,
      deadline
    };

    setLoading(true);

    try {
      let data = null;

      try {
        const response = await fetch('/api/breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (networkErr) {
        // Express backend is unreachable (e.g. static GitHub Pages hosting)
        console.warn('[AI Planner] Backend endpoint unreachable, using client-side academic engine:', networkErr.message);
      }

      // If backend was unreachable or returned non-OK, generate client-side academic plan
      if (!data || !data.success) {
        data = generateClientAcademicPlan(payload, 'Live Static Deployment (Academic Engine Active)');
      }

      currentPlan = data.subtasks || [];
      currentSummary = data.summary || '';
      isAiGenerated = data.isAiGenerated === true;
      modelUsed = data.model || 'Academic Engine';
      fallbackReason = data.fallbackReason || '';

      renderSteps();

      if (isAiGenerated) {
        window.DeadlineShieldApp.showToast(`✨ Generated ${currentPlan.length} steps with ${modelUsed}!`, 'success');
      } else {
        window.DeadlineShieldApp.showToast(`Plan generated with Academic Roadmap Engine (${currentPlan.length} steps)`, 'info');
      }
    } catch (err) {
      console.error('[AI Planner Error]', err);
      window.DeadlineShieldApp.showToast(`Failed to generate plan: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function generateClientAcademicPlan(task, reason = 'Academic Template Engine') {
    const effort = task.effortHours || 6;
    const category = (task.category || 'Assignment').toLowerCase();
    const title = task.title || 'Academic Task';
    const course = task.course ? `for ${task.course}` : '';

    let steps = [];

    if (category.includes('exam')) {
      steps = [
        {
          title: 'Review Syllabus & Exam Pattern',
          description: `Analyze marking schemes and compile list of high-weightage topics ${course}.`,
          suggestedDay: 'Day 1',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
          status: 'pending'
        },
        {
          title: 'Core Concept Mastery & Notes',
          description: 'Read primary textbook chapters and prepare 1-page condensed formula sheets.',
          suggestedDay: 'Day 2',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.35))} hours`,
          status: 'pending'
        },
        {
          title: 'Solve Past Papers & Numerical Problems',
          description: 'Solve questions from the last 3-5 years under untimed conditions to build accuracy.',
          suggestedDay: 'Day 3',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
          status: 'pending'
        },
        {
          title: 'Timed Mock Test & Final Quick Revision',
          description: 'Attempt a simulated exam environment, review weak spots, and ensure proper rest.',
          suggestedDay: 'Day 4',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
          status: 'pending'
        }
      ];
    } else if (category.includes('project')) {
      steps = [
        {
          title: 'Requirements & Scope Definition',
          description: `Define project objectives, user stories, and architecture requirements for "${title}".`,
          suggestedDay: 'Day 1',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
          status: 'pending'
        },
        {
          title: 'System Design & Database Schema',
          description: 'Design ER diagrams, database tables, component wireframes, and API endpoints.',
          suggestedDay: 'Day 2',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
          status: 'pending'
        },
        {
          title: 'Core Feature Implementation',
          description: 'Implement main logic, CRUD operations, backend handlers, and primary user workflows.',
          suggestedDay: 'Day 3',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.35))} hours`,
          status: 'pending'
        },
        {
          title: 'Testing, Edge Cases & Bug Fixing',
          description: 'Execute end-to-end user tests, fix boundary issues, and polish UI responsiveness.',
          suggestedDay: 'Day 4',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
          status: 'pending'
        },
        {
          title: 'Documentation, README & Submission',
          description: 'Write comprehensive project documentation, clean code comments, and prepare submission.',
          suggestedDay: 'Day 5',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.15))} hours`,
          status: 'pending'
        }
      ];
    } else if (category.includes('lab')) {
      steps = [
        {
          title: 'Prelab Theory & Algorithm Setup',
          description: `Review experiment theory, expected input/output ranges, and required software tools.`,
          suggestedDay: 'Day 1',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.25))} hours`,
          status: 'pending'
        },
        {
          title: 'Code/Hardware Experimentation',
          description: 'Write the experiment code, run initial test cases, and record raw observations.',
          suggestedDay: 'Day 2',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.45))} hours`,
          status: 'pending'
        },
        {
          title: 'Analysis, Graphs & Lab Record Writing',
          description: 'Plot necessary charts, write inferences, format answers, and prepare for viva questions.',
          suggestedDay: 'Day 3',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
          status: 'pending'
        }
      ];
    } else if (category.includes('presentation')) {
      steps = [
        {
          title: 'Outline & Content Research',
          description: `Identify key takeaways, cite reputable sources, and draft presentation talking points.`,
          suggestedDay: 'Day 1',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
          status: 'pending'
        },
        {
          title: 'Slide Deck Creation & Visuals',
          description: 'Build slides with clear visual hierarchy, diagrams, minimal text, and punchy titles.',
          suggestedDay: 'Day 2',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.4))} hours`,
          status: 'pending'
        },
        {
          title: 'Speech Rehearsal & Q&A Prep',
          description: 'Practice speaking aloud with a timer, prepare answers for potential audience questions.',
          suggestedDay: 'Day 3',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
          status: 'pending'
        }
      ];
    } else {
      steps = [
        {
          title: 'Understand Requirements & Outline',
          description: `Carefully read the prompt for "${title}", clarify questions, and create a solution outline.`,
          suggestedDay: 'Day 1',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.2))} hours`,
          status: 'pending'
        },
        {
          title: 'Core Draft & Solution Development',
          description: 'Write primary answers, code solutions, or report sections without premature editing.',
          suggestedDay: 'Day 2',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.5))} hours`,
          status: 'pending'
        },
        {
          title: 'Review, Proofreading & Submission',
          description: 'Verify calculations, check rubrics, format references, and complete final submission.',
          suggestedDay: 'Day 3',
          estimatedDuration: `${Math.max(1, Math.round(effort * 0.3))} hours`,
          status: 'pending'
        }
      ];
    }

    const subtasks = steps.map((s, idx) => ({
      id: `step-${Date.now()}-${idx + 1}`,
      stepNumber: idx + 1,
      title: s.title,
      description: s.description,
      suggestedDay: s.suggestedDay,
      estimatedDuration: s.estimatedDuration,
      status: 'pending'
    }));

    return {
      success: true,
      isAiGenerated: false,
      model: 'Academic Roadmap Engine',
      fallbackReason: reason,
      summary: `Structured academic plan for "${title}" (${subtasks.length} manageable steps, approx. ${effort} hours total).`,
      subtasks
    };
  }

  function setLoading(loading) {
    isLoading = loading;
    const btn = document.getElementById('aiGeneratePlanBtn');
    const loadingContainer = document.getElementById('aiPlannerLoading');
    const stepsContainer = document.getElementById('aiStepsContainer');

    if (btn) {
      btn.disabled = loading;
      btn.innerHTML = loading
        ? `<span class="spinner-sm"></span> Analyzing with Gemini AI...`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/></svg> Generate AI Plan`;
    }

    if (loadingContainer) {
      loadingContainer.style.display = loading ? 'block' : 'none';
    }
    if (stepsContainer && loading) {
      stepsContainer.style.opacity = '0.4';
    } else if (stepsContainer) {
      stepsContainer.style.opacity = '1';
    }
  }

  function renderSteps() {
    const stepsContainer = document.getElementById('aiStepsContainer');
    const summaryBox = document.getElementById('aiPlanSummaryBox');
    const saveSection = document.getElementById('aiPlannerActions');

    if (!stepsContainer) return;

    if (currentPlan.length === 0) {
      stepsContainer.innerHTML = `
        <div class="empty-state planner-empty-state">
          <div class="empty-state-icon">🤖</div>
          <h3>No Plan Generated Yet</h3>
          <p>Choose an assignment or enter details on the left, then click <strong>Generate AI Plan</strong> to break down overwhelming tasks into bite-sized daily milestones.</p>
        </div>
      `;
      if (summaryBox) summaryBox.style.display = 'none';
      if (saveSection) saveSection.style.display = 'none';
      return;
    }

    // Render Strategy & Source Badge
    if (summaryBox) {
      summaryBox.style.display = 'block';

      let sourceBadgeHtml = '';
      if (isAiGenerated) {
        sourceBadgeHtml = `
          <div class="ai-source-badge ai-source-real">
            <span class="ai-sparkle-dot"></span>
            <strong>Generated by Google Gemini AI</strong> (${escapeHtml(modelUsed)})
          </div>
        `;
      } else {
        sourceBadgeHtml = `
          <div class="ai-source-badge ai-source-fallback">
            <span class="fallback-dot"></span>
            <strong>Academic Template Plan (Manual Fallback)</strong>
            <span class="fallback-note">${escapeHtml(fallbackReason || 'Gemini API key unconfigured')}</span>
          </div>
        `;
      }

      summaryBox.innerHTML = `
        <div class="summary-box-inner">
          ${sourceBadgeHtml}
          <div class="summary-strategy-text">
            <strong>Target Strategy:</strong> ${escapeHtml(currentSummary)}
          </div>
        </div>
      `;
    }

    // Render Steps List
    stepsContainer.innerHTML = `
      <div class="planner-steps-list">
        ${currentPlan.map((step, idx) => renderStepCard(step, idx)).join('')}
      </div>
    `;

    if (saveSection) {
      saveSection.style.display = 'flex';
    }
  }

  function renderStepCard(step, idx) {
    const isCompleted = step.status === 'completed';

    return `
      <div class="ai-step-card ${isCompleted ? 'step-completed' : ''}" data-step-index="${idx}">
        <div class="ai-step-header">
          <div class="step-badge-row">
            <span class="step-num-pill">Step ${idx + 1}</span>
            <input type="text" class="step-day-input" value="${escapeAttr(step.suggestedDay || `Day ${idx + 1}`)}" 
                   onchange="DeadlineShieldAiPlanner.updateStepField(${idx}, 'suggestedDay', this.value)" 
                   title="Click to edit suggested schedule (e.g. Day 1, Monday, Tonight)">
            <input type="text" class="step-duration-input" value="${escapeAttr(step.estimatedDuration || '1.5 hours')}" 
                   onchange="DeadlineShieldAiPlanner.updateStepField(${idx}, 'estimatedDuration', this.value)"
                   title="Click to edit estimated time">
          </div>

          <div class="step-actions-row">
            <label class="custom-checkbox-wrapper" title="Mark step complete">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="DeadlineShieldAiPlanner.toggleStepStatus(${idx})">
              <span class="custom-checkbox"></span>
            </label>
            <button class="btn-step-delete" onclick="DeadlineShieldAiPlanner.deleteStep(${idx})" title="Remove this step">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="ai-step-content">
          <input type="text" class="step-title-input ${isCompleted ? 'title-struck' : ''}" 
                 value="${escapeAttr(step.title || '')}" 
                 placeholder="Step title"
                 onchange="DeadlineShieldAiPlanner.updateStepField(${idx}, 'title', this.value)">
          <textarea class="step-desc-input" rows="2" 
                    placeholder="Step description and checklist"
                    onchange="DeadlineShieldAiPlanner.updateStepField(${idx}, 'description', this.value)">${escapeHtml(step.description || '')}</textarea>
        </div>
      </div>
    `;
  }

  function updateStepField(index, field, value) {
    if (currentPlan[index]) {
      currentPlan[index][field] = value;
    }
  }

  function toggleStepStatus(index) {
    if (currentPlan[index]) {
      currentPlan[index].status = currentPlan[index].status === 'completed' ? 'pending' : 'completed';
      renderSteps();
    }
  }

  function deleteStep(index) {
    if (currentPlan[index]) {
      currentPlan.splice(index, 1);
      // Renumber
      currentPlan.forEach((s, i) => s.stepNumber = i + 1);
      renderSteps();
      window.DeadlineShieldApp.showToast('Step removed from plan.', 'info');
    }
  }

  function addCustomStep() {
    const newStepNumber = currentPlan.length + 1;
    const newStep = {
      id: `custom-step-${Date.now()}`,
      stepNumber: newStepNumber,
      title: `Step ${newStepNumber}: Custom Milestone`,
      description: 'Detail the requirements for this custom step.',
      suggestedDay: `Day ${newStepNumber}`,
      estimatedDuration: '1.5 hours',
      status: 'pending'
    };

    currentPlan.push(newStep);
    renderSteps();

    // Scroll to the new step
    const stepsContainer = document.getElementById('aiStepsContainer');
    if (stepsContainer) {
      stepsContainer.scrollTop = stepsContainer.scrollHeight;
    }

    window.DeadlineShieldApp.showToast('Added custom step. You can edit title and description directly.', 'info');
  }

  function savePlanToTask() {
    if (currentPlan.length === 0) {
      window.DeadlineShieldApp.showToast('No steps to save.', 'warning');
      return;
    }

    // If an existing task is selected, save directly to it
    if (activeTaskId) {
      const task = window.DeadlineShieldStorage.getTaskById(activeTaskId);
      if (task) {
        window.DeadlineShieldStorage.setTaskSubtasks(activeTaskId, currentPlan);
        window.DeadlineShieldApp.showToast(`Saved ${currentPlan.length} steps to "${task.title}"!`, 'success');
        return;
      }
    }

    // Otherwise create a new task with this plan!
    const title = document.getElementById('aiInputTitle').value.trim() || 'New AI Planned Task';
    const course = document.getElementById('aiInputCourse').value.trim();
    const category = document.getElementById('aiInputCategory').value;
    const effortHours = parseFloat(document.getElementById('aiInputEffort').value) || 5;
    const difficulty = document.getElementById('aiInputDifficulty').value;
    const notes = document.getElementById('aiInputNotes').value.trim();
    const deadline = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();

    const newTask = {
      title,
      course,
      category,
      effortHours,
      difficulty,
      description: notes,
      deadline,
      subtasks: currentPlan,
      status: 'in-progress'
    };

    window.DeadlineShieldStorage.saveTask(newTask);
    populateTaskSelector();
    window.DeadlineShieldApp.showToast(`Saved plan as new task "${title}"!`, 'success');
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
    selectTask,
    generatePlan,
    savePlanToTask,
    addCustomStep,
    deleteStep,
    toggleStepStatus,
    updateStepField,
    loadDemoPreset
  };
})();
