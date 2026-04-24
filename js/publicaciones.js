document.addEventListener('DOMContentLoaded', async () => {

  const feed = document.getElementById('posts-feed');
  const friendsContainer = document.getElementById('friends-list-container');
  let friendsList = [];
  let currentUser = getUser();

  // ──────────────────────────────────────────────────────────────
  // LISTA DE AMIGOS
  // ──────────────────────────────────────────────────────────────

  async function loadFriendsList() {
    if (!isLoggedIn()) {
      friendsContainer.innerHTML = `
        <div class="text-center py-4" style="opacity:0.6;">
          <i class="fas fa-lock"></i><br>
          <small>Inicia sesión para ver tus amigos</small>
        </div>`;
      return;
    }

    try {
      const data = await Chats.getSidebar();
      friendsList = data.data ?? data;
      renderFriendsList(friendsList);
    } catch (error) {
      friendsContainer.innerHTML = `
        <div class="text-center py-4 text-danger">
          <i class="fas fa-exclamation-circle"></i><br>
          <small>Error al cargar amigos</small>
        </div>`;
    }
  }

  function renderFriendsList(friends) {
    if (!friends || friends.length === 0) {
      friendsContainer.innerHTML = `
        <div class="text-center py-4" style="opacity:0.6;">
          <i class="fas fa-user-friends"></i><br>
          <small>Aún no tienes amigos agregados</small>
        </div>`;
      return;
    }

    friendsContainer.innerHTML = `
      <ul class="friends-list" id="friends-list">
        ${friends.map(chat => {
          const avatar = chat.friend_avatar 
            ? `http://localhost:8000/uploads/${chat.friend_avatar}` 
            : '../images/default-profile.jpg';
          const lastMsg = chat.last_message_content 
            ? (chat.last_message_content.length > 30 
                ? chat.last_message_content.substring(0, 30) + '...' 
                : chat.last_message_content)
            : (chat.last_message_media ? '📷 Multimedia' : '');
          const badge = chat.unread_count > 0 
            ? `<span class="friend-badge">${chat.unread_count > 99 ? '99+' : chat.unread_count}</span>` 
            : '';
          
          let ticks = '';
          if (chat.last_message_sender_id == currentUser?.id && chat.last_message_content) {
            if (chat.last_message_status === 'read') ticks = '<i class="fas fa-check-double" style="color:#53bdeb;"></i> ';
            else if (chat.last_message_status === 'delivered') ticks = '<i class="fas fa-check-double text-muted"></i> ';
            else if (chat.last_message_status === 'sent') ticks = '<i class="fas fa-check text-muted"></i> ';
          }

          return `
            <li class="friend-item">
              <a href="chat.html?with=${chat.friend_id}" class="friend-link">
                <div style="position: relative;">
                  <img class="friend-avatar" src="${avatar}" alt="${chat.friend_name}">
                  <div class="friend-online" style="display: none;"></div>
                </div>
                <div class="friend-info">
                  <p class="friend-name">${chat.friend_name}</p>
                  <p class="friend-preview">${ticks}${lastMsg || 'Sin mensajes'}</p>
                </div>
                ${badge}
              </a>
            </li>
          `;
        }).join('')}
      </ul>
    `;

    // Filtro de búsqueda
    const searchInput = document.getElementById('friends-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = friendsList.filter(f => 
          f.friend_name.toLowerCase().includes(term)
        );
        const list = document.getElementById('friends-list');
        if (list) {
          if (filtered.length === 0) {
            list.innerHTML = `<li class="text-center py-3" style="opacity:0.6;">No se encontraron amigos</li>`;
          } else {
            list.innerHTML = filtered.map(chat => {
              const avatar = chat.friend_avatar 
                ? `http://localhost:8000/uploads/${chat.friend_avatar}` 
                : '../images/default-profile.jpg';
              const badge = chat.unread_count > 0 
                ? `<span class="friend-badge">${chat.unread_count > 99 ? '99+' : chat.unread_count}</span>` 
                : '';
              return `
                <li class="friend-item">
                  <a href="chat.html?with=${chat.friend_id}" class="friend-link">
                    <img class="friend-avatar" src="${avatar}" alt="${chat.friend_name}">
                    <div class="friend-info">
                      <p class="friend-name">${chat.friend_name}</p>
                    </div>
                    ${badge}
                  </a>
                </li>
              `;
            }).join('');
          }
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────────────
  // PUBLICACIONES (código existente)
  // ──────────────────────────────────────────────────────────────

  function renderPost(post) {
    const liked    = post.liked ?? false;
    const likes    = post.likes_count ?? 0;
    const comments = post.comments ?? [];
    const user     = getUser();

    const mediaHTML = post.media_path ? (
      post.content_type === 'video'
        ? `<video controls class="w-100 rounded-4 border mb-3" style="max-height:400px;">
             <source src="http://localhost:8000/uploads/${post.media_path}">
           </video>`
        : `<img src="http://localhost:8000/uploads/${post.media_path}" alt="Imagen"
               class="img-fluid rounded-4 border w-100 mb-3" style="max-height:400px;object-fit:cover;">`
    ) : '';

    const commentsHTML = comments.map(c => {
      const cAvatar = c.user?.profile_picture
        ? `http://localhost:8000/uploads/${c.user.profile_picture}`
        : '../images/default-profile.jpg';
      return `
        <div class="d-flex gap-2 mb-2">
          <img src="${cAvatar}" alt="Avatar" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">
          <div class="p-2 rounded-4 bg-light flex-grow-1 border">
            <div class="d-flex justify-content-between">
              <strong style="font-size:12px;">${c.user?.name ?? 'Usuario'}</strong>
              <small class="text-muted" style="font-size:10px;">${c.created_at ?? ''}</small>
            </div>
            <div style="font-size:13px;">${c.content}</div>
          </div>
        </div>
      `;
    }).join('');

    const myAvatar = user?.profile_picture
      ? `http://localhost:8000/uploads/${user.profile_picture}`
      : '../images/default-profile.jpg';

    const commentFormHTML = user ? `
      <div class="d-flex gap-2 mt-2">
        <img src="${myAvatar}" alt="Tu avatar" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">
        <div class="flex-grow-1">
          <textarea class="form-control form-control-sm rounded-3 comment-input"
                    data-post-id="${post.id}" rows="1"
                    placeholder="Escribe un comentario..." required></textarea>
          <div class="d-flex justify-content-end mt-2">
            <button class="btn btn-primary btn-sm px-3 rounded-pill btn-comment" data-post-id="${post.id}">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    ` : '';

    const authorAvatar = post.user?.profile_picture
      ? `http://localhost:8000/uploads/${post.user.profile_picture}`
      : '../images/default-profile.jpg';

    return `
      <article class="mf-post card border-0 shadow-sm rounded-4 mb-4 w-100">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-3">
            <img src="${authorAvatar}" alt="Avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
            <div>
              <h6 class="m-0 fw-bold">${post.user?.name ?? 'Usuario'}</h6>
              <small class="text-muted" style="font-size:11px;">${post.created_at ?? ''}</small>
            </div>
          </div>
          <p class="mb-3">${post.content}</p>
          ${mediaHTML}
          <div class="d-flex align-items-center gap-3 mb-2">
            <button class="btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-secondary'} rounded-pill px-3 btn-like"
                    data-post-id="${post.id}" ${!user ? 'onclick="window.location.href=\'auth.html\'"' : ''}>
              <i class="${liked ? 'fas' : 'far'} fa-heart me-1"></i>
              <span class="like-count">${likes}</span>
            </button>
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 btn-toggle-comments"
                    data-post-id="${post.id}">
              <i class="far fa-comment me-1"></i>
              <span class="comment-count-${post.id}">${comments.length}</span> comentarios
            </button>
          </div>
          <div class="comments-section-${post.id}" style="display:none;">
            <hr class="my-3 opacity-25">
            <div class="comments-box-${post.id} mb-2">${commentsHTML}</div>
            ${commentFormHTML}
          </div>
        </div>
      </article>
    `;
  }

  async function loadPosts(params = {}) {
    feed.innerHTML = `<div class="text-center py-5" style="opacity:.5;">
      <i class="fas fa-spinner fa-spin fa-2x mb-3"></i><p>Cargando...</p></div>`;
    try {
      const data  = await Posts.getAll(params);
      const posts = data.data ?? data;
      if (!posts.length) {
        feed.innerHTML = `<div class="text-center py-5" style="opacity:.5;">
          <i class="fas fa-newspaper fa-3x mb-3"></i><p>No se encontraron publicaciones.</p></div>`;
        return;
      }
      feed.innerHTML = posts.map(renderPost).join('');
      attachListeners();
    } catch (err) {
      feed.innerHTML = `<div class="text-center py-4 text-danger">Error al cargar publicaciones.</div>`;
    }
  }

  function attachListeners() {
    // Likes
    document.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isLoggedIn()) return;
        const postId = btn.dataset.postId;
        try {
          const res     = await Likes.toggle(postId);
          const countEl = btn.querySelector('.like-count');
          const icon    = btn.querySelector('i');
          countEl.textContent = res.likes_count;
          if (res.liked) {
            btn.classList.replace('btn-outline-secondary', 'btn-danger');
            icon.classList.replace('far', 'fas');
          } else {
            btn.classList.replace('btn-danger', 'btn-outline-secondary');
            icon.classList.replace('fas', 'far');
          }
        } catch (e) { console.error(e); }
      });
    });

    // Toggle sección de comentarios
    document.querySelectorAll('.btn-toggle-comments').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId  = btn.dataset.postId;
        const section = document.querySelector(`.comments-section-${postId}`);
        if (!section) return;
        const isOpen  = section.style.display !== 'none';
        section.style.display = isOpen ? 'none' : 'block';
        const icon = btn.querySelector('i');
        icon.classList.toggle('fas', !isOpen);
        icon.classList.toggle('far',  isOpen);
      });
    });

    // Enviar comentario
    document.querySelectorAll('.btn-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const postId   = btn.dataset.postId;
        const textarea = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        const content  = textarea.value.trim();
        if (!content) return;
        try {
          await Comments.create(postId, content);
          const box  = document.querySelector(`.comments-box-${postId}`);
          const user = getUser();
          const myAvatar = user?.profile_picture
            ? `http://localhost:8000/uploads/${user.profile_picture}`
            : '../images/default-profile.jpg';
          box.insertAdjacentHTML('beforeend', `
            <div class="d-flex gap-2 mb-2">
              <img src="${myAvatar}" alt="Avatar" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">
              <div class="p-2 rounded-4 bg-light flex-grow-1 border">
                <strong style="font-size:12px;">${user?.name ?? 'Tú'}</strong>
                <div style="font-size:13px;">${content}</div>
              </div>
            </div>
          `);
          textarea.value = '';
          const countEl = document.querySelector(`.comment-count-${postId}`);
          if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
        } catch (e) { console.error(e); }
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ──────────────────────────────────────────────────────────────

  document.getElementById('btn-search').addEventListener('click', () => {
    const q     = document.getElementById('search-input').value.trim();
    const orden = document.getElementById('order-select').value;
    loadPosts({ ...(q ? { q } : {}), orden });
  });

  // Cargar amigos y publicaciones
  await loadFriendsList();
  await loadPosts();

  // Actualizar amigos cada 10 segundos
  setInterval(async () => {
    if (isLoggedIn()) {
      await loadFriendsList();
    }
  }, 10000);

});

// ══════════════════════════════════════════════════════════════
//  publicaciones-perfil.js
//  Carga los datos del usuario en la sidebar izquierda de
//  publicaciones.html (foto, portada, nombre, @handle)
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) return;

  const user        = getUser();
  const coverEl     = document.getElementById('profile-sidebar-cover');
  const avatarEl    = document.getElementById('profile-avatar');
  const nameEl      = document.getElementById('profile-name');
  const handleEl    = document.getElementById('profile-handle');

  // ── Datos básicos desde localStorage (instantáneo) ────────
  if (avatarEl && user?.profile_picture) {
    avatarEl.src = `http://localhost:8000/uploads/${user.profile_picture}`;
  }
  if (nameEl)   nameEl.textContent   = user?.name ?? 'Usuario';
  if (handleEl) handleEl.textContent = '@' + (user?.username ?? user?.email?.split('@')[0] ?? 'usuario');

  // ── Datos completos desde la API (portada) ─────────────────
  try {
    const data = await Users.getProfile(user.id);
    const u    = data.user ?? data;

    // Portada real — igual que en perfil.js
    if (u.cover_picture && coverEl) {
      coverEl.style.backgroundImage    = `url('http://localhost:8000/uploads/${u.cover_picture}')`;
      coverEl.style.backgroundSize     = 'cover';
      coverEl.style.backgroundPosition = 'center';
    }

    // Si el avatar en la API es más reciente que en localStorage, actualizarlo
    if (u.profile_picture && avatarEl) {
      avatarEl.src = `http://localhost:8000/uploads/${u.profile_picture}`;
    }

    // Nombre y handle actualizados desde la API
    if (nameEl)   nameEl.textContent   = u.name ?? user?.name ?? 'Usuario';
    if (handleEl) handleEl.textContent = '@' + (u.username ?? user?.username ?? 'usuario');

  } catch (e) {
    // Si falla la API, los datos del localStorage ya están cargados — no pasa nada
    console.warn('No se pudo cargar el perfil completo:', e);
  }

});