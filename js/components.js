/**
 * MundialFan - Component Loader
 * Carga header, nav y footer en cada página automáticamente.
 * También gestiona el estado de sesión (JWT en localStorage).
 */

const BASE_URL = 'http://localhost:8000'; // URL del backend

// ─── Auth helpers ────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('mf_token');
}

function getUser() {
  const raw = localStorage.getItem('mf_user');
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem('mf_token');
  localStorage.removeItem('mf_user');
  window.location.href = 'auth.html';
}

// ─── Nav dinámico según sesión ────────────────────────────────────────────────

function buildAuthButtons() {
  const user = getUser();

  if (user) {
    const avatarSrc = user.profile_picture
      ? `${BASE_URL}/uploads/${user.profile_picture}`
      : `../images/default-profile.jpg`;
    const displayName = user.username || user.name || 'Usuario';

    return `
      <a href="crear-publicacion.html" class="btn-crear-post" title="Nueva Publicación">
        <i class="fas fa-plus-circle"></i> <span>Publicar</span>
      </a>

      <!-- Campana con dropdown -->
      <div class="mf-notif-dropdown" id="mf-notif-dropdown">
        <button class="mf-notif-btn" id="mf-notif-btn" aria-label="Notificaciones" title="Notificaciones">
          <i class="fas fa-bell"></i>
          <span class="nav-notif-badge" id="nav-notif-badge" style="display:none;">0</span>
        </button>
        <div class="mf-notif-panel" id="mf-notif-panel">
          <div class="mf-notif-panel__header">
            <span>Notificaciones</span>
            <a href="notificaciones.html" class="mf-notif-panel__vermas">Ver todas</a>
          </div>
          <div class="mf-notif-panel__list" id="mf-notif-panel-list">
            <div class="mf-notif-panel__loading">
              <i class="fas fa-spinner fa-spin"></i> Cargando...
            </div>
          </div>
        </div>
      </div>

      <!-- Perfil: foto + username -->
      <a href="perfil.html" class="mf-user-chip">
        <img src="${avatarSrc}" alt="Avatar" class="mf-user-chip__avatar">
        <span class="mf-user-chip__name">${displayName}</span>
      </a>

      ${user.role === 'admin' ? `<a href="../html/admin/dashboard.html" class="btn btn-warning btn-sm"><i class="fas fa-shield-halved"></i></a>` : ''}
      <button onclick="logout()" class="btn btn-danger btn-sm" title="Cerrar sesión">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    `;
  }

  return `
    <a href="crear-publicacion.html" class="btn-crear-post" title="Nueva Publicación">
      <i class="fas fa-plus-circle"></i> <span>Publicar</span>
    </a>
    <a href="auth.html" class="btn-login">
      <i class="fas fa-sign-in-alt"></i> <span>Ingresar</span>
    </a>
  `;
}

// ─── HTML de los componentes ──────────────────────────────────────────────────

function getHeaderHTML() {
  return `
    <header>
      <div class="header-contenido contenedor">
        <a href="index.html" class="logo">
          <i class="fas fa-futbol"></i>
          <h1>MundialFan</h1>
        </a>
      </div>
    </header>
  `;
}

function getNavHTML() {
  return `
    <nav>
      <div class="nav-wrap">
        <button class="menu-toggle" aria-label="Menú">
          <i class="fas fa-bars"></i>
        </button>
        <ul class="navbar" id="navbar-menu">

          <!-- Inicio -->
          <li>
            <a href="index.html"><i class="fas fa-home"></i> <span>Inicio</span></a>
          </li>

          <!-- Deportes -->
          <li class="mf-nav-group" id="mf-nav-deportes">
            <button class="mf-nav-group__btn" aria-expanded="false" aria-haspopup="true">
              <i class="fas fa-futbol"></i> <span>Deportes</span>
              <i class="fas fa-chevron-down mf-nav-group__arrow"></i>
            </button>
            <ul class="mf-nav-group__dropdown">
              <li><a href="campeonatos.html"><i class="fas fa-trophy"></i> Campeonatos</a></li>
              <li><a href="equipo.html"><i class="fas fa-users"></i> Equipos</a></li>
              <li><a href="stats.html"><i class="fas fa-chart-bar"></i> Estadísticas</a></li>
            </ul>
          </li>

          <!-- Social -->
          <li class="mf-nav-group" id="mf-nav-social">
            <button class="mf-nav-group__btn" aria-expanded="false" aria-haspopup="true">
              <i class="fas fa-users"></i> <span>Social</span>
              <i class="fas fa-chevron-down mf-nav-group__arrow"></i>
            </button>
            <ul class="mf-nav-group__dropdown">
              <li><a href="publicaciones.html"><i class="fas fa-calendar-alt"></i> Publicaciones</a></li>
              <li><a href="chat.html"><i class="fas fa-comments"></i> Chat</a></li>
              <li><a href="amigos.html"><i class="fas fa-user-friends"></i> Amigos</a></li>
            </ul>
          </li>

        </ul>
        <div class="auth-buttons" id="auth-buttons">
          ${buildAuthButtons()}
        </div>
      </div>
    </nav>
  `;
}

function getFooterHTML() {
  return `
    <footer class="footer-min">
      <div class="contenedor">
        <p class="footer-min__copy">© 2026 MundialFan. Todos los derechos reservados.</p>
      </div>
    </footer>
  `;
}

// ─── Inyección en el DOM ──────────────────────────────────────────────────────

function injectComponents() {
  // Evitar error 404 del favicon inyectando uno vacío automáticamente
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'data:image/x-icon;base64,'; 
    document.head.appendChild(favicon);
  }

  // Header
  const headerSlot = document.getElementById('mf-header');
  if (headerSlot) headerSlot.innerHTML = getHeaderHTML();

  // Nav
  const navSlot = document.getElementById('mf-nav');
  if (navSlot) navSlot.innerHTML = getNavHTML();

  // Footer
  const footerSlot = document.getElementById('mf-footer');
  if (footerSlot) footerSlot.innerHTML = getFooterHTML();

  // Marcar enlace activo en el nav
  highlightActiveNav();

  // Inicializar menú hamburguesa
  initMobileMenu();

  // Inicializar dropdowns de grupos del nav
  initNavGroups();

  // Inicializar dropdown de notificaciones y cargar contador (solo si hay sesión)
  if (isLoggedIn()) {
    loadNotifCount();      // Carga inmediata
    startNotifPolling();   // Polling cada 30s
    initNotifDropdown();
  }
}

function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('navbar-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
  }
}

function initNavGroups() {
  document.addEventListener('click', (e) => {
    const groups = document.querySelectorAll('.mf-nav-group');

    groups.forEach(group => {
      const btn = group.querySelector('.mf-nav-group__btn');
      if (!btn) return;

      if (btn.contains(e.target)) {
        const isOpen = group.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        // Cerrar los demás
        groups.forEach(other => {
          if (other !== group) {
            other.classList.remove('open');
            other.querySelector('.mf-nav-group__btn')?.setAttribute('aria-expanded', 'false');
          }
        });
        return;
      }

      // Clic fuera → cerrar
      if (!group.contains(e.target)) {
        group.classList.remove('open');
        btn.querySelector && btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Marcar grupo activo si algún hijo coincide con la página actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.mf-nav-group').forEach(group => {
    group.querySelectorAll('a').forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        group.classList.add('active');
        link.classList.add('active');
      }
    });
  });
}

// ─── Notificaciones: badge ────────────────────────────────────────────────────

function setNotifBadge(count) {
  const badge = document.getElementById('nav-notif-badge');
  if (!badge) return;
  
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Carga el conteo de no leídas.
 * ── Para conectar al backend reemplaza el bloque MOCK por: ──────────────────
 *   const res  = await fetch(`${BASE_URL}/api/users/me/notifications/unread-count`,
 *                  { headers: { Authorization: `Bearer ${getToken()}` } });
 *   const data = await res.json();
 *   setNotifBadge(data.count ?? 0);
 * ────────────────────────────────────────────────────────────────────────────
 */
async function loadNotifCount() {
  try {
    const res  = await fetch(`${BASE_URL}/api/users/me/notifications/unread-count`,
                   { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    setNotifBadge(data.count ?? 0);
  } catch (e) {
    console.warn('No se pudo cargar el conteo de notificaciones:', e);
  }
}


// ─── Notificaciones: polling adaptativo ──────────────────────────────────────
// SSE con PHP-FPM bloquea un worker por usuario → congela la página.
// Este polling usa setTimeout (no setInterval) para ajustar la frecuencia:
//   · 5s  mientras haya actividad reciente (conteo cambió)
//   · 15s después de 3 checks sin cambio
//   · 30s después de 8 checks sin cambio

let _notifTimer      = null;
let _notifLastCount  = -1;
let _notifSameStreak = 0;

function _notifInterval() {
  if (_notifSameStreak < 3) return 5000;
  if (_notifSameStreak < 8) return 15000;
  return 30000;
}

async function _notifTick() {
  if (!isLoggedIn()) return;
  try {
    const res   = await fetch(`${BASE_URL}/api/users/me/notifications/unread-count`,
                    { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) return;
    const data  = await res.json();
    const count = data.count ?? 0;

    if (count !== _notifLastCount) {
      _notifLastCount  = count;
      _notifSameStreak = 0;
      setNotifBadge(count);
      const panel = document.getElementById('mf-notif-panel');
      if (panel && panel.classList.contains('open')) loadNotifPanel();
    } else {
      _notifSameStreak++;
    }
  } catch (_) { /* error de red, ignorar */ }

  _notifTimer = setTimeout(_notifTick, _notifInterval());
}

function startNotifPolling() {
  if (!isLoggedIn() || _notifTimer) return;
  _notifTick(); // primera llamada inmediata
}

// ─── Notificaciones: dropdown ─────────────────────────────────────────────────

/**
 * Carga las últimas notificaciones en el panel.
 * ── Para conectar al backend reemplaza el bloque MOCK por: ──────────────────
 *   const res   = await fetch(`${BASE_URL}/api/users/me/notifications?limit=5`,
 *                   { headers: { Authorization: `Bearer ${getToken()}` } });
 *   const data  = await res.json();
 *   renderNotifPanel(data.notifications ?? data);
 * ────────────────────────────────────────────────────────────────────────────
 */
async function loadNotifPanel() {
  const list = document.getElementById('mf-notif-panel-list');
  if (!list) return;

  try {
    const res  = await fetch(`${BASE_URL}/api/users/me/notifications?limit=5`,
                   { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    const notifs = (data.notifications ?? []).map(notifToPanel);
    renderNotifPanel(notifs);
  } catch (e) {
    list.innerHTML = `<div class="mf-notif-panel__empty">Error al cargar.</div>`;
  }
}

function renderNotifPanel(notifs) {
  const list = document.getElementById('mf-notif-panel-list');
  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = `<div class="mf-notif-panel__empty"><i class="fas fa-bell-slash"></i> Sin notificaciones nuevas.</div>`;
    return;
  }

  list.innerHTML = notifs.map(n => `
    <div class="mf-notif-panel__item ${n.unread ? 'unread' : ''}">
      <div class="mf-notif-panel__item-icon ${n.type}">
        <i class="fas ${n.icon}"></i>
      </div>
      <div class="mf-notif-panel__item-body">
        <p class="mf-notif-panel__item-title">${n.title}</p>
        <p class="mf-notif-panel__item-text">${n.text}</p>
        <span class="mf-notif-panel__item-time"><i class="far fa-clock"></i> ${n.time}</span>
      </div>
      ${n.unread ? '<span class="mf-notif-panel__dot"></span>' : ''}
    </div>
  `).join('');
}

function initNotifDropdown() {
  // El DOM aún no tiene el botón en este punto, usar delegación desde document
  document.addEventListener('click', (e) => {
    const btn   = document.getElementById('mf-notif-btn');
    const panel = document.getElementById('mf-notif-panel');
    if (!btn || !panel) return;

    // Abrir/cerrar al hacer clic en la campana
    if (btn.contains(e.target)) {
      const isOpen = panel.classList.toggle('open');
      if (isOpen) loadNotifPanel();
      return;
    }

    // Cerrar si se hace clic fuera
    const dropdown = document.getElementById('mf-notif-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
}


// ─── Notificaciones: mapa tipo → icono/título ─────────────────────────────────

const NOTIF_META = {
  friend_request:  { type: 'social',  icon: 'fa-user-plus',   title: 'Solicitud de amistad' },
  friend_accepted: { type: 'social',  icon: 'fa-user-check',  title: 'Solicitud aceptada'   },
  post_like:       { type: 'post',    icon: 'fa-heart',        title: 'Nuevo like'           },
  post_comment:    { type: 'post',    icon: 'fa-comment-dots', title: 'Nuevo comentario'     },
  message:         { type: 'message', icon: 'fa-envelope',     title: 'Nuevo mensaje'        },
  group_message:   { type: 'message', icon: 'fa-users',        title: 'Mensaje de grupo'     },
  group_added:     { type: 'social',  icon: 'fa-user-friends', title: 'Nuevo grupo'          },
  system:          { type: 'system',  icon: 'fa-check-circle', title: 'Notificación'         },
};

function notifToPanel(n) {
  const meta  = NOTIF_META[n.type] ?? NOTIF_META.system;
  const actor = n.actor?.name ?? 'Alguien';
  const texts = {
    friend_request:  `<strong>${actor}</strong> te envió una solicitud de amistad.`,
    friend_accepted: `<strong>${actor}</strong> aceptó tu solicitud de amistad.`,
    post_like:       `A <strong>${actor}</strong> le gustó tu publicación.`,
    post_comment:    `<strong>${actor}</strong> comentó tu publicación.`,
    message:         `<strong>${actor}</strong> te envió un mensaje privado.`,
    group_message:   `Nuevo mensaje en el grupo.`,
    group_added:     `Te agregaron a un grupo.`,
    system:          n.body ?? 'Notificación del sistema.',
  };
  return {
    type:   meta.type,
    icon:   meta.icon,
    title:  meta.title,
    text:   texts[n.type] ?? n.body ?? '',
    time:   timeAgo(n.created_at),
    unread: !n.is_read,
  };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', injectComponents);