/**
 * Admin - Vista de Publicación Individual
 * Permite ver publicación, comentarios, y gestionarlos (eliminar/ocultar)
 */

const postId = new URLSearchParams(window.location.search).get('id');
let currentUser = null;
let currentPost = null;

// Mostrar mensajes de depuración
console.log('=== ADMIN POST VIEW ===');
console.log('Post ID:', postId);

// Cargar usuario actual - usar directamente adminGetUser() en lugar de fetch
async function loadCurrentUser() {
  try {
    // Obtener usuario directamente del localStorage
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

// Función para obtener URL de avatar
function getAvatarUrl(user) {
  if (!user) return '../../images/default-profile.jpg';
  if (user.profile_picture) {
    return `http://localhost:8000/uploads/${user.profile_picture}`;
  }
  return '../../images/default-profile.jpg';
}

// Formatear fecha
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Escapar HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Eliminar comentario permanentemente
async function deleteComment(commentId, postId) {
  confirmAction('¿Eliminar este comentario permanentemente?', async () => {
    try {
      await adminFetch(`/admin/comments/${commentId}`, { method: 'DELETE' });
      showAlert('page-alert', 'Comentario eliminado', 'success');
      // Recargar comentarios
      await loadAndRenderComments(postId);
      
      // Actualizar contador de comentarios en el post
      const commentsCountSpan = document.getElementById('comments-count');
      if (commentsCountSpan) {
        const currentCount = parseInt(commentsCountSpan.textContent) || 0;
        commentsCountSpan.textContent = currentCount - 1;
      }
    } catch (e) {
      console.error('Error al eliminar comentario:', e);
      showAlert('page-alert', e.message || 'Error al eliminar comentario', 'danger');
    }
  });
}

// Renderizar comentarios con botones de acción para admin
function renderCommentsList(comments, postId) {
  if (!comments || comments.length === 0) {
    return '<div class="text-center text-muted-custom py-3">No hay comentarios aún. ¡Sé el primero!</div>';
  }
  
  // Verificar si es admin (usando currentUser o adminGetUser como fallback)
  const isAdmin = currentUser?.role === 'admin' || adminGetUser()?.role === 'admin';
  console.log('Renderizando comentarios - isAdmin:', isAdmin, 'currentUser:', currentUser);
  
  return comments.map(c => {
    // Extraer datos del usuario del comentario
    let commentUser = c.user;
    if (typeof commentUser === 'string') {
      try { commentUser = JSON.parse(commentUser); } catch(e) { commentUser = {}; }
    }
    commentUser = commentUser || {};
    
    const userAvatar = getAvatarUrl(commentUser);
    const userName = commentUser.name || 'Usuario';
    
    // Botones de acción (solo para admin)
    const actionButtons = isAdmin ? `
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-danger rounded-pill" 
                onclick="deleteComment(${c.id}, ${postId})"
                title="Eliminar permanentemente"
                style="padding: 2px 8px; font-size: 11px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    ` : '';
    
    return `
      <div class="d-flex gap-2 mb-3" id="comment-${c.id}">
        <img src="${userAvatar}" alt="Avatar" class="comment-avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" onerror="this.src='../../images/default-profile.jpg'">
        <div class="flex-grow-1 p-2 rounded-3 bg-light-custom" style="background:var(--adm-surface2);">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong style="font-size:13px;">${escapeHtml(userName)}</strong>
              <small class="text-muted-custom" style="font-size:10px; margin-left: 8px;">${formatDate(c.created_at)}</small>
            </div>
            ${actionButtons}
          </div>
          <div style="font-size:14px; margin-top:4px;">${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Cargar y renderizar solo los comentarios
async function loadAndRenderComments(postId) {
  try {
    console.log('Fetching comments...');
    const comments = await adminFetch(`/posts/${postId}/comments`);
    console.log('Comentarios recibidos:', comments);
    
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');
    
    if (commentsList) {
      commentsList.innerHTML = renderCommentsList(comments, postId);
    }
    if (commentsCount) {
      commentsCount.textContent = comments?.length || 0;
    }
    
    return comments;
  } catch (e) {
    console.error('Error loading comments:', e);
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
      commentsList.innerHTML = '<div class="text-center text-muted-custom py-3">Error al cargar comentarios</div>';
    }
    return [];
  }
}

// Renderizar publicación completa
function renderPost(post) {
  const isLiked = post.liked_by_user || false;
  const likeIcon = isLiked ? 'fas fa-heart' : 'far fa-heart';
  const likeClass = isLiked ? 'btn-danger' : 'btn-outline-secondary';
  
  // Media HTML - Corregir ruta de uploads
  let mediaHtml = '';
  if (post.media_path && post.media_path !== 'null' && post.media_path !== '') {
    // La ruta correcta es /uploads/ no /uploads/post/images/
    let mediaUrl = post.media_path;
    if (!mediaUrl.startsWith('http')) {
      // Si ya tiene la ruta completa, usarla, si no, construirla
      if (mediaUrl.startsWith('uploads/')) {
        mediaUrl = `http://localhost:8000/${mediaUrl}`;
      } else {
        mediaUrl = `http://localhost:8000/uploads/${mediaUrl}`;
      }
    }
    console.log('Media URL:', mediaUrl);
    
    if (post.content_type === 'video') {
      mediaHtml = `
        <video controls class="post-media w-100" style="max-height:400px;">
          <source src="${mediaUrl}">
        </video>
      `;
    } else {
      mediaHtml = `
        <img src="${mediaUrl}" 
             alt="Imagen de publicación" 
             class="post-media w-100" 
             style="max-height:400px; object-fit:cover;"
             onerror="this.onerror=null; this.src='../../images/default-image.jpg'; console.error('Error cargando imagen:', this.src)">
      `;
    }
  }
  
  // Formulario de comentario (solo si admin está logueado)
  const commentForm = currentUser ? `
    <div class="d-flex gap-2 mt-3">
      <img src="${getAvatarUrl(currentUser)}" alt="Tu avatar" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" onerror="this.src='../../images/default-profile.jpg'">
      <div class="flex-grow-1">
        <textarea id="comment-textarea" class="form-control-custom" rows="2" placeholder="Escribe un comentario..."></textarea>
        <div class="d-flex justify-content-end mt-2">
          <button id="btn-submit-comment" class="btn btn-primary btn-sm px-3 rounded-pill">
            <i class="fas fa-paper-plane"></i> Comentar
          </button>
        </div>
      </div>
    </div>
  ` : `
    <div class="alert alert-info text-center mt-3">
      <i class="fas fa-info-circle"></i> Inicia sesión para comentar
    </div>
  `;
  
  // Avatar del autor
  let authorUser = post.user;
  if (typeof authorUser === 'string') {
    try { authorUser = JSON.parse(authorUser); } catch(e) { authorUser = {}; }
  }
  authorUser = authorUser || {};
  const authorAvatar = getAvatarUrl(authorUser);
  const authorName = authorUser.name || 'Usuario';
  const authorUsername = authorUser.username || 'usuario';
  
  return `
    <div class="mf-post">
      <div class="card-body">
        <!-- Autor -->
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${authorAvatar}" alt="Avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" 
               onerror="this.src='../../images/default-profile.jpg'">
          <div>
            <h5 class="m-0 fw-bold" style="color:var(--adm-text);">${escapeHtml(authorName)}</h5>
            <small class="text-muted-custom">@${escapeHtml(authorUsername)} · ${formatDate(post.created_at)}</small>
          </div>
        </div>
        
        <!-- Contenido -->
        <p class="mb-3" style="color:var(--adm-text); font-size:1rem; line-height:1.5;">${escapeHtml(post.content)}</p>
        
        <!-- Media -->
        ${mediaHtml}
        
        <!-- Stats -->
        <div class="d-flex align-items-center gap-3 mt-3 pt-2 border-top" style="border-color:var(--adm-border);">
          <button id="btn-like" class="btn btn-sm ${likeClass} rounded-pill px-3" style="border-color:var(--adm-border);">
            <i class="${likeIcon} me-1"></i>
            <span id="likes-count">${post.likes_count || post.likes || 0}</span>
          </button>
          <button id="btn-toggle-comments" class="btn btn-sm btn-outline-secondary-custom rounded-pill px-3">
            <i class="far fa-comment me-1"></i>
            <span id="comments-count">0</span> comentarios
          </button>
        </div>
        
        <!-- Sección de comentarios (inicialmente oculta) -->
        <div id="comments-section" style="display:none; margin-top:1rem;">
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

// Cargar todo
async function loadPost() {
  if (!postId) {
    document.getElementById('post-detail').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>ID de publicación no especificado</p>
      </div>
    `;
    return;
  }
  
  try {
    console.log('Fetching post...');
    const post = await adminFetch(`/posts/${postId}`);
    console.log('Post recibido:', post);
    currentPost = post;
    
    const container = document.getElementById('post-detail');
    container.innerHTML = renderPost(post);
    
    // Adjuntar event listeners después de renderizar
    attachEventListeners(postId);
    
    // Cargar comentarios
    await loadAndRenderComments(postId);
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('post-detail').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
        <p>Error: ${error.message || 'No se pudo cargar la publicación'}</p>
        <button class="btn btn-primary mt-3" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

// Adjuntar event listeners
function attachEventListeners(postId) {
  // Toggle comentarios
  const toggleBtn = document.getElementById('btn-toggle-comments');
  const commentsSection = document.getElementById('comments-section');
  
  if (toggleBtn && commentsSection) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = commentsSection.style.display !== 'none';
      commentsSection.style.display = isVisible ? 'none' : 'block';
      const icon = toggleBtn.querySelector('i');
      if (!isVisible) {
        icon.classList.remove('far');
        icon.classList.add('fas');
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
    });
  }
  
  // Like
  const likeBtn = document.getElementById('btn-like');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!currentUser) {
        showAlert('page-alert', 'Inicia sesión para dar like', 'info');
        return;
      }
      try {
        const result = await adminFetch(`/posts/${postId}/like`, { method: 'POST' });
        const likesSpan = document.getElementById('likes-count');
        if (likesSpan) likesSpan.textContent = result.likes;
        
        if (result.liked) {
          likeBtn.classList.remove('btn-outline-secondary');
          likeBtn.classList.add('btn-danger');
          likeBtn.querySelector('i').classList.remove('far');
          likeBtn.querySelector('i').classList.add('fas');
        } else {
          likeBtn.classList.remove('btn-danger');
          likeBtn.classList.add('btn-outline-secondary');
          likeBtn.querySelector('i').classList.remove('fas');
          likeBtn.querySelector('i').classList.add('far');
        }
      } catch (e) {
        console.error('Like error:', e);
        showAlert('page-alert', 'Error al dar like', 'danger');
      }
    });
  }
  
  // Comentar
  const submitBtn = document.getElementById('btn-submit-comment');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const textarea = document.getElementById('comment-textarea');
      const content = textarea?.value.trim();
      
      if (!content) {
        showAlert('page-alert', 'Escribe un comentario', 'warning');
        return;
      }
      
      try {
        await adminFetch(`/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content })
        });
        
        textarea.value = '';
        showAlert('page-alert', 'Comentario agregado', 'success');
        
        // Recargar comentarios
        await loadAndRenderComments(postId);
        
      } catch (e) {
        console.error('Comment error:', e);
        showAlert('page-alert', 'Error al enviar comentario', 'danger');
      }
    });
  }
}

// Exponer funciones globalmente para que onclick funcione
window.deleteComment = deleteComment;

// Inicializar
async function init() {
  await loadCurrentUser();
  await loadPost();
}

init();