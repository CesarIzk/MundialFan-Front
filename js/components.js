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
    const initial = (user.name || user.username || 'U')[0].toUpperCase();
    const avatarHTML = user.profile_picture 
      ? `<img src="${BASE_URL}/uploads/${user.profile_picture}" alt="Avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--btn);">` 
      : `<img src="../images/default-profile.jpg" alt="Avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--btn);">`;

    return `
      <a href="crear-publicacion.html" class="btn-crear-post" title="Nueva Publicación">
        <i class="fas fa-plus-circle"></i> <span>Publicar</span>
      </a>
      <a href="perfil.html" class="user-profile">
        ${avatarHTML}
        <span>${user.name || user.username}</span>
      </a>
      ${user.role === 'admin' ? `<a href="../backend/admin" class="btn btn-warning btn-sm"><i class="fas fa-shield-halved"></i></a>` : ''}
      <button onclick="logout()" class="btn btn-danger btn-sm">
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
          <li><a href="index.html"><i class="fas fa-home"></i> <span>Inicio</span></a></li>
          <li><a href="campeonatos.html"><i class="fas fa-trophy"></i> <span>Campeonatos</span></a></li>
          <li><a href="equipo.html"><i class="fas fa-users"></i> <span>Equipos</span></a></li>
          <li><a href="publicaciones.html"><i class="fas fa-calendar-alt"></i> <span>Publicaciones</span></a></li>
          <li><a href="notificaciones.html"><i class="fas fa-bell"></i> <span>Notificaciones</span></a></li>
          <li><a href="stats.html"><i class="fas fa-chart-bar"></i> <span>Estadísticas</span></a></li>
          <li><a href="chat.html"><i class="fas fa-comments"></i> <span>Chat</span></a></li>
          <li><a href="amigos.html"><i class="fas fa-user-friends"></i> <span>Amigos</span></a></li>
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

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', injectComponents);
