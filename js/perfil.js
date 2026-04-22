document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  const user    = getUser();
  const postsEl = document.getElementById('my-posts');

  // ── Llenar datos del perfil ────────────────────────────
  try {
    const data = await Users.getProfile(user.id);
    const u    = data.user ?? data;

    document.getElementById('profile-name').textContent     = u.name ?? '—';
    document.getElementById('profile-username').textContent = '@' + (u.username ?? '—');
    document.getElementById('profile-email').textContent    = u.email ?? '—';
    document.getElementById('profile-city').textContent     = u.city    || '—';
    document.getElementById('profile-country').textContent  = u.country || '—';

    let fechaNac = u.birth_date ?? '—';
    if (fechaNac.includes(','))      fechaNac = fechaNac.split(',')[0];
    else if (fechaNac.includes('T')) fechaNac = fechaNac.split('T')[0];
    document.getElementById('profile-birth').textContent = fechaNac;

    if (u.profile_picture) {
      document.getElementById('profile-avatar').src = `http://localhost:8000/uploads/${u.profile_picture}`;
    }

    if (u.cover_picture) {
      const cover = document.getElementById('profile-cover');
      cover.style.backgroundImage    = `url('http://localhost:8000/uploads/${u.cover_picture}')`;
      cover.style.backgroundSize     = 'cover';
      cover.style.backgroundPosition = 'center';
    }

    // ── Subir portada ──────────────────────────────────────
    document.getElementById('cover-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('cover', file);
      try {
        const result = await Users.updateCover(formData);
        const cover  = document.getElementById('profile-cover');
        cover.style.backgroundImage    = `url('http://localhost:8000/uploads/${result.cover_picture}')`;
        cover.style.backgroundSize     = 'cover';
        cover.style.backgroundPosition = 'center';
      } catch (err) {
        alert(err.message ?? 'Error al subir portada.');
      }
    });

    // ── Publicaciones ──────────────────────────────────────
    const posts = data.posts ?? [];
    if (!posts.length) {
      postsEl.innerHTML = `<div class="text-center py-4" style="opacity:.65;">
        <i class="fas fa-newspaper fa-2x mb-2 d-block"></i> Aún no hay publicaciones.</div>`;
    } else {
      postsEl.innerHTML = posts.map(post => `
        <article class="card border-0 shadow-sm rounded-4 mb-3">
          <div class="card-body">
            <p class="mb-2">${post.content}</p>
            ${post.media_path
              ? (post.content_type === 'video'
                  ? `<video controls src="http://localhost:8000/uploads/${post.media_path}" class="w-100 rounded-4 border" style="max-height:320px;"></video>`
                  : `<img src="http://localhost:8000/uploads/${post.media_path}" class="img-fluid rounded-4 border" style="max-height:320px;object-fit:cover;width:100%;">`)
              : ''}
            <div class="d-flex gap-3 mt-3" style="font-size:14px;opacity:.85;">
              <span><i class="fas fa-heart me-1"></i>${post.likes ?? 0}</span>
              <span><i class="fas fa-comment me-1"></i>${post.comments_count ?? 0}</span>
            </div>
          </div>
        </article>
      `).join('');
    }

  } catch (e) {
    document.getElementById('profile-name').textContent     = user.name ?? '—';
    document.getElementById('profile-username').textContent = '@' + (user.username ?? '—');
    document.getElementById('profile-email').textContent    = user.email ?? '—';
    postsEl.innerHTML = `<div class="text-center py-4 text-danger">Error al cargar publicaciones.</div>`;
  }

  // ── Búsqueda de usuarios ───────────────────────────────
  document.getElementById('btn-user-search').addEventListener('click', async () => {
    const q     = document.getElementById('user-search-input').value.trim();
    if (!q) return;
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = `<tr><td colspan="3" class="text-center"><i class="fas fa-spinner fa-spin"></i></td></tr>`;
    try {
      const data  = await Users.search(q);
      const users = data.data ?? data;
      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-3" style="opacity:.65;">
          <i class="fas fa-user-slash me-2"></i>No se encontraron usuarios.</td></tr>`;
        return;
      }
      tbody.innerHTML = users.map(u => {
        const avatarSrc = u.profile_picture
          ? `http://localhost:8000/uploads/${u.profile_picture}`
          : '../images/default-profile.jpg';
        return `
        <tr>
          <td class="d-flex align-items-center gap-2">
            <img src="${avatarSrc}" style="width:36px;height:36px;border-radius:999px;object-fit:cover;">
            <strong>@${u.username}</strong>
          </td>
          <td>${u.name}</td>
          <td>
            <a href="chat.html?with=${u.id}" class="btn btn-outline-secondary btn-sm">
              <i class="fas fa-comment-dots me-1"></i> Chat
            </a>
          </td>
        </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error en la búsqueda.</td></tr>`;
    }
  });

});