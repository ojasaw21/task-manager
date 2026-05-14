const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function isAdmin() { const u = getUser(); return u && u.role === 'ADMIN'; }

function saveAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

function requireAuth() {
    if (!getToken()) window.location.href = '/index.html';
}

async function api(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) { logout(); return; }
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
}

const GET    = (path)        => api('GET',    path);
const POST   = (path, body)  => api('POST',   path, body);
const PUT    = (path, body)  => api('PUT',    path, body);
const PATCH  = (path, body)  => api('PATCH',  path, body);
const DELETE = (path)        => api('DELETE', path);

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(d) {
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
    return diff;
}

function priorityBadge(p) {
    const map = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
    return `<span class="badge ${map[p] || ''}">${p}</span>`;
}

function statusBadge(s) {
    const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', REVIEW: 'badge-review', DONE: 'badge-done' };
    const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done' };
    return `<span class="badge ${map[s] || ''}">${labels[s] || s}</span>`;
}

function avatar(name) {
    if (!name) return '<div class="avatar avatar-empty">?</div>';
    const initials = name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return `<div class="avatar" style="background:${color}">${initials}</div>`;
}
