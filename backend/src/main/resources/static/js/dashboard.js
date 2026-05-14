requireAuth();

const user = getUser();

// Init sidebar
document.getElementById('sb-name').textContent = user.name;
document.getElementById('sb-role').textContent = user.role;
document.getElementById('sb-avatar').innerHTML = avatar(user.name).replace('class="avatar"','class="avatar"');
document.getElementById('sb-avatar').style.cssText = `width:32px;height:32px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff`;
document.getElementById('sb-avatar').textContent = user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();

const now = new Date().getHours();
const greet = now < 12 ? 'Good morning' : now < 17 ? 'Good afternoon' : 'Good evening';
document.getElementById('greeting').textContent = `${greet}, ${user.name.split(' ')[0]}! Here's your overview.`;

if (isAdmin()) {
  document.getElementById('admin-label').style.display = '';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
}

async function loadDashboard() {
  try {
    const stats = await GET('/dashboard/stats');
    renderStats(stats);
    renderRecentTasks(stats.myRecentTasks || []);
    renderProjectsOverview(stats.myProjects || []);
    if (isAdmin() && stats.overdueTasksList && stats.overdueTasksList.length > 0) {
      document.getElementById('overdue-section').style.display = '';
      renderOverdueTasks(stats.overdueTasksList);
    }
  } catch(err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderStats(s) {
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon">📁</div>
      <div class="stat-value">${s.totalProjects}</div>
      <div class="stat-label">Total Projects</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${s.completedTasks}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-icon">⚡</div>
      <div class="stat-value">${s.inProgressTasks}</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">🔴</div>
      <div class="stat-value">${s.overdueTasks}</div>
      <div class="stat-label">Overdue</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${s.totalTasks}</div>
      <div class="stat-label">Total Tasks</div>
    </div>
    <div class="stat-card cyan">
      <div class="stat-icon">📈</div>
      <div class="stat-value">${s.completionRate}%</div>
      <div class="stat-label">Completion Rate</div>
    </div>`;
}

function renderRecentTasks(tasks) {
  const el = document.getElementById('recent-tasks');
  if (!tasks.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No tasks yet</h3><p>Tasks assigned to you will appear here.</p></div>'; return; }
  el.innerHTML = '<div class="task-list">' + tasks.slice(0,6).map(t => `
    <div class="task-item ${t.overdue?'overdue':''}" onclick="window.location='/project-detail.html?id=${t.projectId}'">
      <div class="task-info">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">${t.projectName} · ${formatDate(t.dueDate)}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        ${priorityBadge(t.priority)}
        ${statusBadge(t.status)}
      </div>
    </div>`).join('') + '</div>';
}

function renderProjectsOverview(projects) {
  const el = document.getElementById('projects-overview');
  if (!projects.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><h3>No projects</h3></div>'; return; }
  el.innerHTML = projects.slice(0,5).map(p => {
    const pct = p.totalTasks > 0 ? Math.round(p.completedTasks / p.totalTasks * 100) : 0;
    const statusClass = p.status.toLowerCase().replace('_','-');
    return `<div style="margin-bottom:16px;cursor:pointer" onclick="window.location='/project-detail.html?id=${p.id}'">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:500">${p.name}</span>
        <span class="badge badge-${p.status.toLowerCase()}">${p.status.replace('_',' ')}</span>
      </div>
      <div class="progress-label"><span style="color:var(--text-muted)">${p.completedTasks}/${p.totalTasks} tasks</span><span style="font-weight:600">${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderOverdueTasks(tasks) {
  document.getElementById('overdue-tasks').innerHTML = '<div class="task-list">' + tasks.map(t => `
    <div class="task-item overdue" onclick="window.location='/project-detail.html?id=${t.projectId}'">
      <div class="task-info">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">${t.projectName} · Due ${formatDate(t.dueDate)} · ${t.assignee ? t.assignee.name : 'Unassigned'}</div>
      </div>
      ${priorityBadge(t.priority)}
    </div>`).join('') + '</div>';
}

loadDashboard();
