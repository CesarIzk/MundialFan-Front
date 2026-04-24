/**
 * MundialFan — Admin Shared JS
 * Inyecta sidebar + topbar, verifica que el usuario sea admin,
 * y expone helpers de API y utilidades.
 */

const API = 'http://localhost:8000/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

function adminGetToken()  { return localStorage.getItem('mf_token'); }
function adminGetUser()   { const r = localStorage.getItem('mf_user'); return r ? JSON.parse(r) : null; }

function adminGuard() {
  const user = adminGetUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '../index.html';
  }
}

function adminLogout() {
  localStorage.removeItem('mf_token');
  localStorage.removeItem('mf_user');
  window.location.href = '../index.html';
}

// ─── API fetch helper ─────────────────────────────────────────────────────────

async function adminFetch(endpoint, options = {}) {
  const token = adminGetToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res  = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Error', data };
  return data;
}

async function adminFetchForm(endpoint, formData, method = 'POST') {
  const token = adminGetToken();
  const res   = await fetch(`${API}${endpoint}`, {
    method,
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// ─── Sidebar HTML ─────────────────────────────────────────────────────────────

function getAdminSidebarHTML() {
  const page = window.location.pathname.split('/').pop();
  const link = (href, icon, label) =>
    `<a class="adm-sidebar__link ${page === href ? 'active' : ''}" href="${href}">
       <i class="${icon}"></i> ${label}
     </a>`;

  return `
    <span class="adm-sidebar__label">General</span>
    ${link('dashboard.html',   'fas fa-chart-pie',      'Dashboard')}
    ${link('usuarios.html',    'fas fa-users',          'Usuarios')}
    ${link('publicaciones.html','fas fa-newspaper',     'Publicaciones')}
    ${link('comentarios.html', 'fas fa-comments',       'Comentarios')}

    <span class="adm-sidebar__label">Contenido</span>
    ${link('paises.html',      'fas fa-globe-americas', 'Países')}
    ${link('campeonatos.html', 'fas fa-trophy',         'Campeonatos')}
    ${link('categorias.html',  'fas fa-tags',           'Categorías')}
    ${link('jugadores.html',   'fas fa-star',           'Jugadores Destacados')}
    ${link('equipos.html',     'fas fa-shield-halved',  'Equipos Exitosos')}

    <span class="adm-sidebar__label">Reportes</span>
    ${link('reportes.html',    'fas fa-file-chart-column', 'Reportes')}

    <span class="adm-sidebar__label">Sistema</span>
    ${link('logs.html',        'fas fa-terminal',       'Logs')}
    ${link('crear-admin.html', 'fas fa-user-shield',    'Crear Admin')}

    <span class="adm-sidebar__label" style="margin-top:auto;"></span>
    <a class="adm-sidebar__link" href="../index.html" target="_blank" style="margin-top:auto;">
      <i class="fas fa-globe"></i> Ver Sitio
    </a>
  `;
}

function getAdminTopbarHTML() {
  const user = adminGetUser();
  const initial = (user?.name || 'A')[0].toUpperCase();
  return `
    <a class="adm-topbar__brand" href="dashboard.html">
      <i class="fas fa-futbol"></i>
      <span>MundialFan</span>
      <span style="background:var(--adm-accent);color:#fff;font-size:.65rem;padding:.15rem .4rem;border-radius:4px;letter-spacing:.5px;">ADMIN</span>
    </a>
    <div class="adm-topbar__right">
      <div class="adm-topbar__user">
        <div class="adm-topbar__avatar">${initial}</div>
        <span>${user?.name ?? 'Admin'}</span>
      </div>
      <button class="adm-logout-btn" onclick="adminLogout()">
        <i class="fas fa-sign-out-alt"></i> Salir
      </button>
    </div>
  `;
}

// ─── Layout injection ─────────────────────────────────────────────────────────

function injectAdminLayout() {
  adminGuard();

  const topbarSlot  = document.getElementById('adm-topbar');
  const sidebarSlot = document.getElementById('adm-sidebar');
  if (topbarSlot)  topbarSlot.innerHTML  = getAdminTopbarHTML();
  if (sidebarSlot) sidebarSlot.innerHTML = getAdminSidebarHTML();
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function showAlert(containerId, msg, type = 'success') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = `adm-alert adm-alert--${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function confirmAction(msg, callback) {
  if (confirm(msg)) callback();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', injectAdminLayout);
