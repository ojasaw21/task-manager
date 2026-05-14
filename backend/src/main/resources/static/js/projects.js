requireAuth();
const user = getUser();
let allProjects = [], editingProjectId = null;

// Init sidebar
document.getElementById('sb-name').textContent = user.name;
document.getElementById('sb-role').textContent = user.role;
document.getElementById('sb-avatar').textContent = user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
if (isAdmin()) {
  document.getElementById('btn-new-project').style.display = '';
  document.getElementById('admin-label').style.display = '';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
}

async function loadProjects() {
  try {
    allProjects = await GET('/projects');
    renderProjects(allProjects);
  } catch(err) { showToast('Failed to load projects', 'error'); }
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!projects.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><h3>No projects found</h3><p>Create a project to get started.</p></div>';
    return;
  }
  grid.innerHTML = projects.map(p => {
    const pct = p.totalTasks > 0 ? Math.round(p.completedTasks / p.totalTasks * 100) : 0;
    const days = daysUntil(p.deadline);
    let deadlineClass = '', deadlineText = '—';
    if (p.deadline) {
      deadlineText = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
      deadlineClass = days < 0 ? 'deadline-overdue' : days <= 7 ? 'deadline-soon' : 'deadline-ok';
    }
    return `<div class="project-card">
      <div class="project-card-header" onclick="window.location='/project-detail.html?id=${p.id}'">
        <div>
          <div class="project-name">${p.name}</div>
          <div class="project-desc">${p.description || 'No description provided.'}</div>
        </div>
        <span class="badge badge-${p.status.toLowerCase()}" style="flex-shrink:0;margin-left:8px">${p.status.replace('_',' ')}</span>
      </div>
      <div class="progress-label">
        <span>${p.completedTasks}/${p.totalTasks} tasks</span>
        <span style="font-weight:600">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="project-meta">
        <span class="project-meta-item">👥 ${p.memberCount} members</span>
        <span class="project-meta-item ${deadlineClass}">📅 ${deadlineText}</span>
        <span class="project-meta-item">👤 ${p.createdBy.name}</span>
      </div>
      ${isAdmin() ? `<div style="display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openProjectModal(${p.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProject(${p.id},'${p.name.replace("'","\\'")}')">🗑️ Delete</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

function filterProjects() {
  const q = document.getElementById('search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const filtered = allProjects.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)) &&
    (!status || p.status === status)
  );
  renderProjects(filtered);
}

function openProjectModal(id = null) {
  editingProjectId = id;
  document.getElementById('modal-title').textContent = id ? 'Edit Project' : 'New Project';
  document.getElementById('save-project-btn').textContent = id ? 'Save Changes' : 'Create Project';
  if (id) {
    const p = allProjects.find(x => x.id === id);
    if (p) {
      document.getElementById('p-name').value = p.name;
      document.getElementById('p-desc').value = p.description || '';
      document.getElementById('p-status').value = p.status;
      document.getElementById('p-deadline').value = p.deadline || '';
    }
  } else {
    document.getElementById('p-name').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-status').value = 'ACTIVE';
    document.getElementById('p-deadline').value = '';
  }
  document.getElementById('project-modal').classList.add('open');
}

function closeProjectModal() { document.getElementById('project-modal').classList.remove('open'); }

async function saveProject(e) {
  e.preventDefault();
  const btn = document.getElementById('save-project-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const body = {
    name: document.getElementById('p-name').value,
    description: document.getElementById('p-desc').value,
    status: document.getElementById('p-status').value,
    deadline: document.getElementById('p-deadline').value || null
  };
  try {
    if (editingProjectId) await PUT(`/projects/${editingProjectId}`, body);
    else await POST('/projects', body);
    closeProjectModal();
    showToast(editingProjectId ? 'Project updated!' : 'Project created!');
    loadProjects();
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false; btn.textContent = editingProjectId ? 'Save Changes' : 'Create Project';
}

async function deleteProject(id, name) {
  if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
  try {
    await DELETE(`/projects/${id}`);
    showToast('Project deleted');
    loadProjects();
  } catch(err) { showToast(err.message, 'error'); }
}

document.getElementById('project-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeProjectModal(); });

loadProjects();
