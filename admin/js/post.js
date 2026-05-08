/**
 * Admin - Vista de Publicación Individual
 */

// ─── Constantes de módulo ─────────────────────────────────────────────────────
const BASE   = 'https://mundialfan-api-production.up.railway.app';
const postId = new URLSearchParams(window.location.search).get('id');
let currentUser = null;
let currentPost = null;

console.log('=== ADMIN POST VIEW ===');
console.log('Post ID:', postId);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('uploads/')) return `${BASE}/${path}`;
  return `${BASE}/uploads/${path}`;
}

function getAvatarUrl(user) {
  if (!user) return '../../images/default-profile.jpg';
  const path = user.profile_picture;
  if (!path) return '../../images/default-profile.jpg';
  return resolveUrl(path) || '../../images/default-profile.jpg';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function loadCurrentUser() {
  try {
    const user = adminGetUser();
    if (user) {
      currentUser = user;
      console.log('Usuario cargado desde localStorage:', currentUser);
      console.log('Es admin?', currentUser?.role === 'admin');
    } else {
      console.log('No hay usuario logueado');
    }
  } catch (e) {
    console.error('Error cargando usuario:', e);
  }
}

// ─── Comentarios ──────────────────────────────────────────────────────────────

async function deleteComment(commentId, postId) {
  confirmAction('¿Eliminar este comentario permanentemente?', async () => {
    try {
      await adminFetch(`/admin/comments/${commentId}`, { method: 'DELETE' });
      showAlert('page-alert', 'Comentario eliminado', 'success');
      await loadAndRenderComments(postId);
      const el = document.getElementById('comments-count');
      if (el) el.textContent = Math.max(0, (parseInt(el.textContent) || 1) - 1);
    } catch (e) {
      console.error('Error al eliminar comentario:', e);
      showAlert('page-alert', e.message || 'Error al eliminar comentario', 'danger');
    }
  });
}

function renderCommentsList(comments, postId) {
  if (!comments || comments.length === 0) {
    return '<div class="text-center text-muted-custom py-3">No hay comentarios aún.</div>';
  }

  const isAdmin = currentUser?.role === 'admin' || adminGetUser()?.role === 'admin';

  return comments.map(c => {
    let commentUser = c.user;
    if (typeof commentUser === 'string') {
      try { commentUser = JSON.parse(commentUser); } catch(e) { commentUser = {}; }
    }
    commentUser = commentUser || {};

    const actionButtons = isAdmin ? `
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-danger rounded-pill"
                onclick="deleteComment(${c.id}, ${postId})"
                title="Eliminar permanentemente"
                style="padding:2px 8px;font-size:11px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    ` : '';

    return `
      <div class="d-flex gap-2 mb-3" id="comment-${c.id}">
        <img src="${getAvatarUrl(commentUser)}" alt="Avatar"
             style="width:32px;height:32px;border-radius:50%;object-fit:cover;"
             onerror="this.src='../../images/default-profile.jpg'">
        <div class="flex-grow-1 p-2 rounded-3" style="background:var(--adm-surface2);">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong style="font-size:13px;">${escapeHtml(commentUser.name || 'Usuario')}</strong>
              <small class="text-muted-custom" style="font-size:10px;margin-left:8px;">${formatDate(c.created_at)}</small>
            </div>
            ${actionButtons}
          </div>
          <div style="font-size:14px;margin-top:4px;">${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadAndRenderComments(postId) {
  try {
    const comments = await adminFetch(`/posts/${postId}/comments`);
    const listEl   = document.getElementById('comments-list');
    const countEl  = document.getElementById('comments-count');
    if (listEl)  listEl.innerHTML      = renderCommentsList(comments, postId);
    if (countEl) countEl.textContent   = comments?.length || 0;
    return comments;
  } catch (e) {
    console.error('Error loading comments:', e);
    const listEl = document.getElementById('comments-list');
    if (listEl) listEl.innerHTML = '<div class="text-center text-muted-custom py-3">Error al cargar comentarios</div>';
    return [];
  }
}

// ─── Render post ──────────────────────────────────────────────────────────────

function renderPost(post) {
  const isLiked   = post.liked_by_user || false;
  const likeIcon  = isLiked ? 'fas fa-heart' : 'far fa-heart';
  const likeClass = isLiked ? 'btn-danger'   : 'btn-outline-secondary';

  // Media
  const resolvedMedia = resolveUrl(post.media_path);
  const mediaHtml = resolvedMedia
    ? (post.content_type === 'video'
        ? `<video controls src="${resolvedMedia}" class="w-100 rounded-3 mb-3" style="max-height:400px;"></video>`
        : `<img src="${resolvedMedia}" class="img-fluid rounded-3 mb-3" style="max-height:400px;object-fit:cover;width:100%;">`)
    : '';

  // Autor
  let authorUser = post.user;
  if (typeof authorUser === 'string') {
    try { authorUser = JSON.parse(authorUser); } catch(e) { authorUser = {}; }
  }
  authorUser = authorUser || {};

  // Formulario comentario
  const commentForm = currentUser ? `
    <div class="d-flex gap-2 mt-3">
      <img src="${getAvatarUrl(currentUser)}" alt="Tu avatar"
           style="width:36px;height:36px;border-radius:50%;object-fit:cover;"
           onerror="this.src='../../images/default-profile.jpg'">
      <div class="flex-grow-1">
        <textarea id="comment-textarea" class="form-control-custom" rows="2"
                  placeholder="Escribe un comentario..."></textarea>
        <div class="d-flex justify-content-end mt-2">
          <button id="btn-submit-comment" class="btn btn-primary btn-sm px-3 rounded-pill">
            <i class="fas fa-paper-plane"></i> Comentar
          </button>
        </div>
      </div>
    </div>
  ` : `<div class="alert alert-info text-center mt-3">Inicia sesión para comentar</div>`;

  return `
    <div class="mf-post">
      <div class="card-body">
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${getAvatarUrl(authorUser)}" alt="Avatar"
               style="width:48px;height:48px;border-radius:50%;object-fit:cover;"
               onerror="this.src='../../images/default-profile.jpg'">
          <div>
            <h5 class="m-0 fw-bold" style="color:var(--adm-text);">${escapeHtml(authorUser.name || 'Usuario')}</h5>
            <small class="text-muted-custom">@${escapeHtml(authorUser.username || 'usuario')} · ${formatDate(post.created_at)}</small>
          </div>
        </div>

        <p class="mb-3" style="color:var(--adm-text);font-size:1rem;line-height:1.5;">
          ${escapeHtml(post.content)}
        </p>

        ${mediaHtml}

        <div class="d-flex align-items-center gap-3 mt-3 pt-2 border-top" style="border-color:var(--adm-border);">
          <button id="btn-like" class="btn btn-sm ${likeClass} rounded-pill px-3">
            <i class="${likeIcon} me-1"></i>
            <span id="likes-count">${post.likes_count || post.likes || 0}</span>
          </button>
          <button id="btn-toggle-comments" class="btn btn-sm btn-outline-secondary-custom rounded-pill px-3">
            <i class="far fa-comment me-1"></i>
            <span id="comments-count">0</span> comentarios
          </button>
        </div>

        <div id="comments-section" style="display:none;margin-top:1rem;">
          <hr class="my-3" style="border-color:var(--adm-border);">
          <div id="comments-list">
            <div class="text-center text-muted-custom py-3">Cargando comentarios...</div>
          </div>
          ${commentForm}
        </div>
      </div>
    </div>
  `;
}

// ─── Carga principal ──────────────────────────────────────────────────────────

async function loadPost() {
  if (!postId) {
    document.getElementById('post-detail').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>ID de publicación no especificado</p>
      </div>`;
    return;
  }

  try {
    console.log('Fetching post...');
    const post = await adminFetch(`/posts/${postId}`);
    console.log('Post recibido:', post);
    currentPost = post;

    document.getElementById('post-detail').innerHTML = renderPost(post);
    attachEventListeners(postId);
    await loadAndRenderComments(postId);

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('post-detail').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>Error: ${error.message || 'No se pudo cargar la publicación'}</p>
        <button class="btn btn-primary mt-3" onclick="location.reload()">Reintentar</button>
      </div>`;
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

function attachEventListeners(postId) {
  const toggleBtn      = document.getElementById('btn-toggle-comments');
  const commentsSection = document.getElementById('comments-section');

  if (toggleBtn && commentsSection) {
    toggleBtn.addEventListener('click', () => {
      const visible = commentsSection.style.display !== 'none';
      commentsSection.style.display = visible ? 'none' : 'block';
      const icon = toggleBtn.querySelector('i');
      icon.classList.toggle('far', visible);
      icon.classList.toggle('fas', !visible);
    });
  }

  const likeBtn = document.getElementById('btn-like');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!currentUser) { showAlert('page-alert', 'Inicia sesión para dar like', 'info'); return; }
      try {
        const result = await adminFetch(`/posts/${postId}/like`, { method: 'POST' });
        document.getElementById('likes-count').textContent = result.likes;
        likeBtn.classList.toggle('btn-danger', result.liked);
        likeBtn.classList.toggle('btn-outline-secondary', !result.liked);
        likeBtn.querySelector('i').classList.toggle('fas', result.liked);
        likeBtn.querySelector('i').classList.toggle('far', !result.liked);
      } catch (e) {
        showAlert('page-alert', 'Error al dar like', 'danger');
      }
    });
  }

  const submitBtn = document.getElementById('btn-submit-comment');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const textarea = document.getElementById('comment-textarea');
      const content  = textarea?.value.trim();
      if (!content) { showAlert('page-alert', 'Escribe un comentario', 'warning'); return; }
      try {
        await adminFetch(`/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content })
        });
        textarea.value = '';
        showAlert('page-alert', 'Comentario agregado', 'success');
        await loadAndRenderComments(postId);
      } catch (e) {
        showAlert('page-alert', 'Error al enviar comentario', 'danger');
      }
    });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.deleteComment = deleteComment;

async function init() {
  await loadCurrentUser();
  await loadPost();
}

init();