/**
 * MundialFan - Notificaciones Page
 * Lógica exclusiva de notificaciones.html
 * Requiere: api.js y components.js cargados antes.
 */

// ─── Config visual por tipo ───────────────────────────────────────────────────

const PAGE_NOTIF_META = {
  friend_request:  { css: 'social',  icon: 'fa-user-plus',   title: 'Solicitud de amistad',
    text: (actor) => `<strong>${actor}</strong> te envió una solicitud de amistad.` },
  friend_accepted: { css: 'social',  icon: 'fa-user-check',  title: 'Solicitud aceptada',
    text: (actor) => `<strong>${actor}</strong> aceptó tu solicitud de amistad.` },
  post_like:       { css: 'post',    icon: 'fa-heart',        title: 'Nuevo like',
    text: (actor) => `A <strong>${actor}</strong> le gustó tu publicación.` },
  post_comment:    { css: 'post',    icon: 'fa-comment-dots', title: 'Nuevo comentario',
    text: (actor) => `<strong>${actor}</strong> comentó tu publicación.` },
  message:         { css: 'message', icon: 'fa-envelope',     title: 'Nuevo mensaje',
    text: (actor) => `<strong>${actor}</strong> te envió un mensaje privado.` },
  group_message:   { css: 'message', icon: 'fa-users',        title: 'Mensaje de grupo',
    text: ()      => 'Recibiste un nuevo mensaje en tu grupo.' },
  group_added:     { css: 'social',  icon: 'fa-user-friends', title: 'Nuevo grupo',
    text: ()      => 'Te agregaron a un nuevo grupo.' },
  system:          { css: 'system',  icon: 'fa-check-circle', title: 'Notificación',
    text: (_, body) => body ?? 'Notificación del sistema.' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pageTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'Hace un momento';
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function buildCard(n) {
  const meta  = PAGE_NOTIF_META[n.type] ?? PAGE_NOTIF_META.system;
  const actor = n.actor?.name ?? 'Alguien';
  const text  = meta.text(actor, n.body);
  const time  = pageTimeAgo(n.created_at);
  const unreadClass = !n.is_read ? 'mf-notif-card--unread' : '';

  return `
    <article class="mf-notif-card ${unreadClass}" data-id="${n.id}">
      <div class="mf-notif-card__icon ${meta.css}">
        <i class="fas ${meta.icon}"></i>
      </div>
      <div class="mf-notif-card__content">
        <div class="mf-notif-card__top">
          <h3>${meta.title}</h3>
          ${!n.is_read ? '<span class="mf-notif-card__badge">Nuevo</span>' : ''}
        </div>
        <p>${text}</p>
        <div class="mf-notif-meta">
          <span><i class="far fa-clock"></i> ${time}</span>
        </div>
      </div>
    </article>
  `;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderList(notifications) {
  const list = document.querySelector('.mf-notif-list');
  if (!list) return;

  if (!notifications.length) {
    list.innerHTML = `
      <div class="mf-notif-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No tienes notificaciones aún.</p>
      </div>`;
    return;
  }

  list.innerHTML = notifications.map(buildCard).join('');
}

function renderToolbar(hasUnread) {
  const toolbar = document.querySelector('.mf-notif-toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = hasUnread ? `
    <button class="mf-notif-filter active" id="btn-mark-all">
      <i class="fas fa-check-double"></i> Marcar todas como leídas
    </button>` : '';

  document.getElementById('btn-mark-all')?.addEventListener('click', async () => {
    await Notifications.markAllRead();
    // Quitar badge del nav
    setNotifBadge(0);
    // Recargar lista
    await loadPage();
  });
}

// ─── Carga principal ──────────────────────────────────────────────────────────

async function loadPage() {
  const list = document.querySelector('.mf-notif-list');
  if (list) {
    list.innerHTML = `
      <div class="mf-notif-empty">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando notificaciones...</p>
      </div>`;
  }

  try {
    const data          = await Notifications.getAll(50);
    const notifications = data.notifications ?? [];
    const hasUnread     = notifications.some(n => !n.is_read);

    renderToolbar(hasUnread);
    renderList(notifications);
  } catch (e) {
    console.error('Error cargando notificaciones:', e);
    if (list) {
      list.innerHTML = `
        <div class="mf-notif-empty">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar las notificaciones.</p>
        </div>`;
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que components.js inyecte el nav (usa DOMContentLoaded también)
  // Usar un pequeño delay para asegurar que injectComponents terminó
  setTimeout(() => {
    if (typeof Notifications === 'undefined') {
      console.error('api.js no está cargado antes de notificaciones.js');
      return;
    }
    loadPage();
  }, 0);
});