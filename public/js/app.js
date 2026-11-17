/**
 * DeadlineShield Main Application Controller
 * Handles view switching, themes, modals, toast alerts, and server health
 */

window.DeadlineShieldApp = (function () {
  let currentView = 'dashboard';

  function init() {
    setupNavigation();
    setupTheme();
    setupModals();
    setupShortcuts();
    checkServerHealth();

    // Initialize modules
    if (window.DeadlineShieldTasks) window.DeadlineShieldTasks.init();
    if (window.DeadlineShieldAiPlanner) window.DeadlineShieldAiPlanner.init();
    if (window.DeadlineShieldDashboard) window.DeadlineShieldDashboard.init();

    // Check if initial hash is set
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      switchView(hash);
    } else {
      switchView('dashboard');
    }
  }

  function setupNavigation() {
    const navLinks = document.querySelectorAll('[data-view-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view-target');
        switchView(targetView);

        // Close mobile drawer if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
        }
      });
    });

    // Mobile hamburger menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Quick Add Task header button
    const quickAddBtn = document.getElementById('headerQuickAddBtn');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => {
        window.DeadlineShieldTasks.openCreateModal();
      });
    }
  }

  function switchView(viewName) {
    const targetElement = document.getElementById(`view-${viewName}`);
    if (!targetElement) return;

    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.remove('active-view');
    });

    // Show selected view
    targetElement.classList.add('active-view');
    currentView = viewName;
    window.location.hash = viewName;

    // Update sidebar active link
    document.querySelectorAll('[data-view-target]').forEach(link => {
      if (link.getAttribute('data-view-target') === viewName) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });

    // Refresh specific view if needed
    if (viewName === 'tasks' && window.DeadlineShieldTasks) {
      window.DeadlineShieldTasks.renderTasks();
    } else if (viewName === 'dashboard' && window.DeadlineShieldDashboard) {
      window.DeadlineShieldDashboard.renderDashboard();
    } else if (viewName === 'needs-attention' && window.DeadlineShieldDashboard) {
      window.DeadlineShieldDashboard.renderNeedsAttention();
    } else if (viewName === 'progress' && window.DeadlineShieldDashboard) {
      window.DeadlineShieldDashboard.renderProgressTracker();
    } else if (viewName === 'calendar' && window.DeadlineShieldDashboard) {
      window.DeadlineShieldDashboard.renderCalendar();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('deadlineshield_theme') || 'light';

    applyTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('deadlineshield_theme', theme);

    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  function setupModals() {
    // Backdrop click or close button
    document.querySelectorAll('.modal-overlay, .modal-close-trigger').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.closest('.modal-close-trigger')) {
          closeAllModals();
        }
      });
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal.is-active').forEach(m => m.classList.remove('is-active'));
  }

  function setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.DeadlineShieldTasks.openCreateModal();
      }
    });
  }

  async function checkServerHealth() {
    const aiStatusPill = document.getElementById('headerAiStatusPill');
    if (!aiStatusPill) return;

    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check error');
      const data = await res.json();

      if (data.aiConfigured) {
        aiStatusPill.className = 'status-pill pill-ai-active';
        aiStatusPill.innerHTML = `
          <span class="status-indicator"></span>
          <span>Gemini AI Connected (${data.aiModel || 'Live'})</span>
        `;
        aiStatusPill.title = 'Real Google Gemini AI is active and ready for breakdown plans.';
      } else {
        aiStatusPill.className = 'status-pill pill-ai-offline';
        aiStatusPill.innerHTML = `
          <span class="status-indicator"></span>
          <span>Academic Fallback Active</span>
        `;
        aiStatusPill.title = 'Running in verified academic template fallback mode. Add GEMINI_API_KEY in .env for live AI.';
      }
    } catch (err) {
      aiStatusPill.className = 'status-pill pill-ai-active';
      aiStatusPill.innerHTML = `
        <span class="status-indicator"></span>
        <span>Academic Shield Active</span>
      `;
      aiStatusPill.title = 'Client-side deterministic priority engine and academic roadmap planner are active.';
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
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

  return {
    init,
    switchView,
    showToast,
    closeAllModals,
    checkServerHealth
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.DeadlineShieldApp.init();
});
