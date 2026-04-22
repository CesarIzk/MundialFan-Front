document.addEventListener('DOMContentLoaded', async () => {

  const feed = document.getElementById('posts-feed');

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
      <article class="mf-post mf-post--narrow card border-0 shadow-sm rounded-4 mb-4 mx-auto" style="max-width:600px;">
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
            <span class="text-muted" style="font-size:14px;">
              <i class="far fa-comment me-1"></i>
              <span class="comment-count-${post.id}">${comments.length}</span> comentarios
            </span>
          </div>
          <hr class="my-3 opacity-25">
          <div class="comments-box-${post.id}">${commentsHTML}</div>
          ${commentFormHTML}
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

    // Comentarios
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

  document.getElementById('btn-search').addEventListener('click', () => {
    const q     = document.getElementById('search-input').value.trim();
    const orden = document.getElementById('order-select').value;
    loadPosts({ ...(q ? { q } : {}), orden });
  });

  loadPosts();

});
