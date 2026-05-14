requireAuth();
const user = getUser();
const projectId = new URLSearchParams(location.search).get('id');
if (!projectId) window.location.href = '/projects.html';

let tasks = [], members = [], allUsers = [], editingTaskId = null, draggingId = null;

document.getElementById('sb-name').textContent = user.name;
document.getElementById('sb-role').textContent = user.role;
document.getElementById('sb-avatar').textContent = user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
if (isAdmin()) {
  document.getElementById('admin-label').style.display = '';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  document.getElementById('btn-add-task').style.display = '';
} else {
  document.getElementById('btn-add-task').style.display = '';
}

async function init() {
  try {
    const [proj, t, m] = await Promise.all([
      GET(`/projects/${projectId}`),
      GET(`/projects/${projectId}/tasks`),
      GET(`/projects/${projectId}/members`)
    ]);
    tasks = t; members = m;
    renderProjectHeader(proj);
    renderStats(t);
    renderKanban(t);
    if (isAdmin()) {
      allUsers = await GET('/users');
      populateMemberSelects();
    } else {
      populateAssigneeSelect(m);
    }
    setupDragDrop();
  } catch(err) { showToast('Failed to load project: ' + err.message, 'error'); }
}

function renderProjectHeader(p) {
  document.title = `TaskFlow — ${p.name}`;
  document.getElementById('project-title').textContent = p.name;
  document.getElementById('project-status-badge').innerHTML = `<span class="badge badge-${p.status.toLowerCase()}">${p.status.replace('_',' ')}</span>`;
  if (p.deadline) {
    const days = daysUntil(p.deadline);
    const cls = days < 0 ? 'deadline-overdue' : days <= 7 ? 'deadline-soon' : 'deadline-ok';
    const txt = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
    document.getElementById('project-deadline-info').innerHTML = `<span class="${cls}">📅 ${formatDate(p.deadline)} · ${txt}</span>`;
  }
}

function renderStats(t) {
  const todo = t.filter(x=>x.status==='TODO').length;
  const ip = t.filter(x=>x.status==='IN_PROGRESS').length;
  const rev = t.filter(x=>x.status==='REVIEW').length;
  const done = t.filter(x=>x.status==='DONE').length;
  const over = t.filter(x=>x.overdue).length;
  document.getElementById('proj-stats').innerHTML = `
    <div class="stat-card blue"><div class="stat-icon">📋</div><div class="stat-value">${t.length}</div><div class="stat-label">Total</div></div>
    <div class="stat-card yellow"><div class="stat-icon">📌</div><div class="stat-value">${todo}</div><div class="stat-label">To Do</div></div>
    <div class="stat-card purple"><div class="stat-icon">⚡</div><div class="stat-value">${ip}</div><div class="stat-label">In Progress</div></div>
    <div class="stat-card cyan"><div class="stat-icon">👁️</div><div class="stat-value">${rev}</div><div class="stat-label">Review</div></div>
    <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${done}</div><div class="stat-label">Done</div></div>`;
}

function renderKanban(t) {
  const statuses = ['TODO','IN_PROGRESS','REVIEW','DONE'];
  statuses.forEach(s => {
    const group = t.filter(x=>x.status===s);
    document.getElementById(`count-${s}`).textContent = group.length;
    const col = document.getElementById(`cards-${s}`);
    if (!group.length) { col.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:20px 0">Drop tasks here</div>'; return; }
    col.innerHTML = group.map(task => {
      const days = task.dueDate ? daysUntil(task.dueDate) : null;
      const dueText = task.dueDate ? (days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`) : '';
      const dueClass = task.overdue ? 'overdue' : '';
      const assigneeHTML = task.assignee ? `<div class="avatar" style="width:22px;height:22px;font-size:9px;background:#6366f1;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${task.assignee.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>` : '<span style="font-size:11px;color:var(--text-muted)">Unassigned</span>';
      return `<div class="kanban-card" draggable="true" data-id="${task.id}" data-status="${task.status}"
        ondragstart="dragStart(event,${task.id})"
        ondragend="dragEnd(event)"
        onclick="openTaskModal(${task.id})">
        <div class="kanban-card-title">${task.title}</div>
        ${priorityBadge(task.priority)}
        <div class="kanban-card-footer">
          ${assigneeHTML}
          <span class="kanban-card-due ${dueClass}">${dueText}</span>
        </div>
        ${isAdmin() ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="event.stopPropagation();openTaskModal(${task.id})">Edit</button>
          <button class="btn btn-danger btn-sm" style="font-size:11px;padding:4px 8px" onclick="event.stopPropagation();deleteTask(${task.id})">Del</button>
        </div>` : ''}
      </div>`;
    }).join('');
    setupColDrop(col);
  });
}

function setupDragDrop() {
  document.querySelectorAll('.kanban-cards').forEach(col => setupColDrop(col));
}

function setupColDrop(col) {
  col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
  col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
  col.addEventListener('drop', async e => {
    e.preventDefault(); col.classList.remove('drag-over');
    const newStatus = col.dataset.status;
    if (draggingId == null) return;
    const task = tasks.find(t => t.id == draggingId);
    if (!task || task.status === newStatus) return;
    try {
      await PATCH(`/tasks/${draggingId}/status`, { status: newStatus });
      tasks = await GET(`/projects/${projectId}/tasks`);
      renderStats(tasks); renderKanban(tasks);
      showToast('Status updated!');
    } catch(err) { showToast(err.message, 'error'); }
  });
}

function dragStart(e, id) { draggingId = id; e.target.classList.add('dragging'); }
function dragEnd(e) { e.target.classList.remove('dragging'); draggingId = null; }

function populateMemberSelects() {
  const assignSel = document.getElementById('t-assignee');
  const addSel = document.getElementById('add-member-select');
  assignSel.innerHTML = '<option value="">Unassigned</option>' + allUsers.map(u=>`<option value="${u.id}">${u.name} (${u.role})</option>`).join('');
  const memberIds = members.map(m=>m.id);
  addSel.innerHTML = allUsers.filter(u=>!memberIds.includes(u.id)).map(u=>`<option value="${u.id}">${u.name} — ${u.email}</option>`).join('');
}

function populateAssigneeSelect(members) {
  document.getElementById('t-assignee').innerHTML = '<option value="">Unassigned</option>' + members.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
}

function openTaskModal(id = null) {
  editingTaskId = id;
  document.getElementById('task-modal-title').textContent = id ? 'Edit Task' : 'New Task';
  document.getElementById('save-task-btn').textContent = id ? 'Save Changes' : 'Create Task';
  if (id) {
    const t = tasks.find(x=>x.id===id);
    if (t) {
      document.getElementById('t-title').value = t.title;
      document.getElementById('t-desc').value = t.description || '';
      document.getElementById('t-status').value = t.status;
      document.getElementById('t-priority').value = t.priority;
      document.getElementById('t-due').value = t.dueDate || '';
      document.getElementById('t-assignee').value = t.assignee ? t.assignee.id : '';
    }
  } else {
    document.getElementById('t-title').value = '';
    document.getElementById('t-desc').value = '';
    document.getElementById('t-status').value = 'TODO';
    document.getElementById('t-priority').value = 'MEDIUM';
    document.getElementById('t-due').value = '';
    document.getElementById('t-assignee').value = '';
  }
  document.getElementById('task-modal').classList.add('open');
}

function closeTaskModal() { document.getElementById('task-modal').classList.remove('open'); }

async function saveTask(e) {
  e.preventDefault();
  const btn = document.getElementById('save-task-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const body = {
    title: document.getElementById('t-title').value,
    description: document.getElementById('t-desc').value,
    status: document.getElementById('t-status').value,
    priority: document.getElementById('t-priority').value,
    dueDate: document.getElementById('t-due').value || null,
    assigneeId: document.getElementById('t-assignee').value ? parseInt(document.getElementById('t-assignee').value) : null
  };
  try {
    if (editingTaskId) await PUT(`/tasks/${editingTaskId}`, body);
    else await POST(`/projects/${projectId}/tasks`, body);
    closeTaskModal();
    tasks = await GET(`/projects/${projectId}/tasks`);
    renderStats(tasks); renderKanban(tasks);
    showToast(editingTaskId ? 'Task updated!' : 'Task created!');
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false; btn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await DELETE(`/tasks/${id}`);
    tasks = await GET(`/projects/${projectId}/tasks`);
    renderStats(tasks); renderKanban(tasks);
    showToast('Task deleted');
  } catch(err) { showToast(err.message, 'error'); }
}

function openMemberModal() {
  renderMembersList();
  document.getElementById('member-modal').classList.add('open');
}
function closeMemberModal() { document.getElementById('member-modal').classList.remove('open'); }

function renderMembersList() {
  document.getElementById('members-list').innerHTML = members.length
    ? '<div style="display:flex;flex-direction:column;gap:10px">' + members.map(m=>`
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar avatar-lg" style="background:#6366f1">${m.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>
            <div><div style="font-size:14px;font-weight:500">${m.name}</div><div style="font-size:12px;color:var(--text-muted)">${m.email}</div></div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="removeMember(${m.id})">Remove</button>
        </div>`).join('') + '</div>'
    : '<p style="color:var(--text-muted);font-size:13px">No members yet.</p>';
}

async function addMember() {
  const userId = document.getElementById('add-member-select').value;
  if (!userId) return;
  try {
    await POST(`/projects/${projectId}/members`, { userId: parseInt(userId) });
    members = await GET(`/projects/${projectId}/members`);
    populateMemberSelects(); renderMembersList();
    showToast('Member added!');
  } catch(err) { showToast(err.message, 'error'); }
}

async function removeMember(userId) {
  try {
    await DELETE(`/projects/${projectId}/members/${userId}`);
    members = await GET(`/projects/${projectId}/members`);
    populateMemberSelects(); renderMembersList();
    showToast('Member removed');
  } catch(err) { showToast(err.message, 'error'); }
}

document.getElementById('task-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeTaskModal(); });
document.getElementById('member-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeMemberModal(); });

init();
