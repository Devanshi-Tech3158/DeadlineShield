/**
 * DeadlineShield LocalStorage Manager
 * Persistent client-side data layer with reactive event dispatching
 */

window.DeadlineShieldStorage = (function () {
  const STORAGE_KEY = 'deadlineshield_tasks_v1';
  const SETTINGS_KEY = 'deadlineshield_settings_v1';

  function getSampleTasks() {
    const now = new Date();

    // Helper to format ISO with offset in days and hours
    const futureDate = (days, hours = 0) => {
      const d = new Date(now.getTime() + (days * 24 * 3600 * 1000) + (hours * 3600 * 1000));
      return d.toISOString();
    };

    const pastDate = (days, hours = 0) => {
      const d = new Date(now.getTime() - (days * 24 * 3600 * 1000) - (hours * 3600 * 1000));
      return d.toISOString();
    };

    return [
      {
        id: 'task-sample-1',
        title: 'DBMS Mini Project: Library Management System',
        course: 'CS204 Database Systems',
        description: 'Complete full-stack library catalog with relational tables, user roles, borrowing history, and penalty calculation.',
        deadline: futureDate(5, 4),
        category: 'Project',
        effortHours: 10,
        difficulty: 'Hard',
        status: 'in-progress',
        notes: 'Tech stack: PostgreSQL + Node.js. Remember ER diagram submission.',
        subtasks: [
          {
            id: 'sub-101',
            stepNumber: 1,
            title: 'Define Project Requirements & Scope',
            description: 'Specify user roles, book statuses, borrow limits, and validation rules.',
            suggestedDay: 'Day 1',
            estimatedDuration: '2 hours',
            status: 'completed'
          },
          {
            id: 'sub-102',
            stepNumber: 2,
            title: 'Design Database Schema & ER Diagram',
            description: 'Create normalized relational schema with primary and foreign key constraints.',
            suggestedDay: 'Day 2',
            estimatedDuration: '2.5 hours',
            status: 'completed'
          },
          {
            id: 'sub-103',
            stepNumber: 3,
            title: 'Implement Core CRUD Operations',
            description: 'Build backend API routes for add book, issue book, return book, and search.',
            suggestedDay: 'Day 3',
            estimatedDuration: '3 hours',
            status: 'pending'
          },
          {
            id: 'sub-104',
            stepNumber: 4,
            title: 'Integration Testing & Edge Case Checks',
            description: 'Test concurrent book checkouts, negative overdue days, and input validation.',
            suggestedDay: 'Day 4',
            estimatedDuration: '1.5 hours',
            status: 'pending'
          },
          {
            id: 'sub-105',
            stepNumber: 5,
            title: 'Final Report & Submission Package',
            description: 'Assemble schema diagrams, query screenshots, README setup instructions, and code repository.',
            suggestedDay: 'Day 5',
            estimatedDuration: '1 hour',
            status: 'pending'
          }
        ],
        createdAt: pastDate(2)
      },
      {
        id: 'task-sample-2',
        title: 'Data Structures Midterm Examination',
        course: 'CS201 Data Structures & Algorithms',
        description: 'Comprehensive exam covering AVL Trees, B-Trees, Graph Traversal (DFS/BFS), and Dynamic Programming.',
        deadline: futureDate(0, 18), // Due in 18 hours!
        category: 'Examination',
        effortHours: 8,
        difficulty: 'Hard',
        status: 'pending',
        notes: 'Room 304, Engineering Block. Bring calculator and student ID.',
        subtasks: [
          {
            id: 'sub-201',
            stepNumber: 1,
            title: 'Tree Rotations & Balancing Drills',
            description: 'Practice 10 AVL tree insertions, double rotations, and deletion rebalancing.',
            suggestedDay: 'Today (Morning)',
            estimatedDuration: '2.5 hours',
            status: 'pending'
          },
          {
            id: 'sub-202',
            stepNumber: 2,
            title: 'Graph Algorithms & Complexity Sheet',
            description: 'Review Dijkstra, Prim, Kruskal, and Topological Sort with runtime derivations.',
            suggestedDay: 'Today (Afternoon)',
            estimatedDuration: '3 hours',
            status: 'pending'
          },
          {
            id: 'sub-203',
            stepNumber: 3,
            title: 'DP Classical Problems & Formula Recap',
            description: 'Review 0/1 Knapsack, Longest Common Subsequence, and Matrix Chain Multiplication.',
            suggestedDay: 'Tonight',
            estimatedDuration: '2.5 hours',
            status: 'pending'
          }
        ],
        createdAt: pastDate(4)
      },
      {
        id: 'task-sample-3',
        title: 'Operating Systems Lab: CPU Scheduling',
        course: 'CS301 Operating Systems',
        description: 'Simulate Round Robin, Shortest Job First (Preemptive & Non-preemptive), and Priority Scheduling in C++.',
        deadline: futureDate(2, 6),
        category: 'Lab Work',
        effortHours: 4,
        difficulty: 'Medium',
        status: 'in-progress',
        notes: 'Output must include Gantt chart representations and Average Turnaround Time calculations.',
        subtasks: [
          {
            id: 'sub-301',
            stepNumber: 1,
            title: 'Implement SJF Algorithm',
            description: 'Write process arrival comparator and ready queue logic.',
            suggestedDay: 'Day 1',
            estimatedDuration: '2 hours',
            status: 'completed'
          },
          {
            id: 'sub-302',
            stepNumber: 2,
            title: 'Round Robin Quantum Handler & Test Cases',
            description: 'Handle context switches, idle CPU cycles, and write output formatter.',
            suggestedDay: 'Day 2',
            estimatedDuration: '2 hours',
            status: 'pending'
          }
        ],
        createdAt: pastDate(1)
      },
      {
        id: 'task-sample-4',
        title: 'Computer Networks Packet Tracer Lab Assignment',
        course: 'CS305 Computer Networks',
        description: 'Configure VLANs, OSPF dynamic routing, and NAT on Cisco Packet Tracer topology.',
        deadline: pastDate(0, 10), // Overdue by 10 hours!
        category: 'Assignment',
        effortHours: 3,
        difficulty: 'Medium',
        status: 'pending',
        notes: 'Late submission window closes at midnight with 10% penalty.',
        subtasks: [],
        createdAt: pastDate(5)
      },
      {
        id: 'task-sample-5',
        title: 'Software Engineering Agile Sprint Presentation',
        course: 'CS401 Software Engineering',
        description: 'Present sprint retrospective, burn-down charts, velocity metrics, and MVP demo to the course panel.',
        deadline: pastDate(3),
        category: 'Presentation',
        effortHours: 3,
        difficulty: 'Easy',
        status: 'completed',
        notes: 'Presentation concluded successfully. Scored 19/20.',
        subtasks: [
          {
            id: 'sub-501',
            stepNumber: 1,
            title: 'Compile Sprint Metrics',
            description: 'Extract velocity from Jira board.',
            suggestedDay: 'Day 1',
            estimatedDuration: '1 hour',
            status: 'completed'
          },
          {
            id: 'sub-502',
            stepNumber: 2,
            title: 'Deliver Presentation to Jury',
            description: '15-minute presentation with 5 minutes Q&A.',
            suggestedDay: 'Day 2',
            estimatedDuration: '1 hour',
            status: 'completed'
          }
        ],
        createdAt: pastDate(7)
      }
    ];
  }

  function notifyChange() {
    window.dispatchEvent(new CustomEvent('deadlineshield:datachanged'));
  }

  function getAllTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = getSampleTasks();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Corrupted storage data');
      }
      return parsed;
    } catch (err) {
      console.warn('[DeadlineShield Storage] Resetting corrupted tasks storage:', err);
      const initial = getSampleTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  function saveAllTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      notifyChange();
      return true;
    } catch (err) {
      console.error('[DeadlineShield Storage] Failed to write localStorage:', err);
      return false;
    }
  }

  function getTaskById(id) {
    const tasks = getAllTasks();
    return tasks.find(t => t.id === id) || null;
  }

  function saveTask(taskData) {
    const tasks = getAllTasks();
    const existingIndex = tasks.findIndex(t => t.id === taskData.id);

    if (existingIndex >= 0) {
      // Update
      const existing = tasks[existingIndex];
      tasks[existingIndex] = {
        ...existing,
        ...taskData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new
      const newTask = {
        id: taskData.id || `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: taskData.title.trim(),
        course: (taskData.course || '').trim(),
        description: (taskData.description || '').trim(),
        deadline: taskData.deadline,
        category: taskData.category || 'Assignment',
        effortHours: parseFloat(taskData.effortHours) || 3,
        difficulty: taskData.difficulty || 'Medium',
        status: taskData.status || 'pending',
        notes: (taskData.notes || '').trim(),
        subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
        createdAt: new Date().toISOString()
      };
      tasks.unshift(newTask);
    }

    saveAllTasks(tasks);
    return true;
  }

  function deleteTask(id) {
    let tasks = getAllTasks();
    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== id);
    if (tasks.length !== initialLength) {
      saveAllTasks(tasks);
      return true;
    }
    return false;
  }

  function toggleTaskComplete(id) {
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    if (task.status === 'completed') {
      task.status = 'pending';
      // If reopening, set subtasks back to pending if they were all completed
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(s => s.status = 'pending');
      }
    } else {
      task.status = 'completed';
      // Mark all subtasks completed
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(s => s.status = 'completed');
      }
    }

    saveAllTasks(tasks);
    return task.status;
  }

  function setTaskSubtasks(taskId, subtasks) {
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.subtasks = subtasks;
    syncTaskStatusWithSubtasks(task);
    saveAllTasks(tasks);
    return true;
  }

  function updateSubtaskStatus(taskId, subtaskId, isCompleted) {
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return false;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return false;

    sub.status = isCompleted ? 'completed' : 'pending';
    syncTaskStatusWithSubtasks(task);
    saveAllTasks(tasks);
    return true;
  }

  function addSubtask(taskId, subtaskData) {
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    if (!Array.isArray(task.subtasks)) {
      task.subtasks = [];
    }

    const newSub = {
      id: subtaskData.id || `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stepNumber: task.subtasks.length + 1,
      title: (subtaskData.title || 'New Subtask').trim(),
      description: (subtaskData.description || '').trim(),
      suggestedDay: subtaskData.suggestedDay || `Day ${task.subtasks.length + 1}`,
      estimatedDuration: subtaskData.estimatedDuration || '1 hour',
      status: subtaskData.status || 'pending'
    };

    task.subtasks.push(newSub);
    syncTaskStatusWithSubtasks(task);
    saveAllTasks(tasks);
    return newSub;
  }

  function removeSubtask(taskId, subtaskId) {
    const tasks = getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return false;

    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    // Renumber steps
    task.subtasks.forEach((s, idx) => s.stepNumber = idx + 1);
    syncTaskStatusWithSubtasks(task);
    saveAllTasks(tasks);
    return true;
  }

  function syncTaskStatusWithSubtasks(task) {
    if (!task.subtasks || task.subtasks.length === 0) return;

    const total = task.subtasks.length;
    const completed = task.subtasks.filter(s => s.status === 'completed').length;

    if (completed === total) {
      task.status = 'completed';
    } else if (completed > 0) {
      task.status = 'in-progress';
    } else if (task.status === 'completed') {
      task.status = 'in-progress';
    }
  }

  function resetToSampleData() {
    const sample = getSampleTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    notifyChange();
    return sample;
  }

  function exportDataAsJson() {
    const tasks = getAllTasks();
    return JSON.stringify({
      app: 'DeadlineShield',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks
    }, null, 2);
  }

  function importDataFromJson(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
      if (!Array.isArray(tasks)) {
        throw new Error('Invalid JSON format: expected an array of tasks.');
      }
      saveAllTasks(tasks);
      return true;
    } catch (err) {
      console.error('[DeadlineShield Storage] Import failed:', err);
      return false;
    }
  }

  return {
    getAllTasks,
    getTaskById,
    saveTask,
    deleteTask,
    toggleTaskComplete,
    setTaskSubtasks,
    updateSubtaskStatus,
    addSubtask,
    removeSubtask,
    resetToSampleData,
    exportDataAsJson,
    importDataFromJson
  };
})();
