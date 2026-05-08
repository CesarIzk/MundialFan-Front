import { Users } from './api.js';

const BASE = 'https://mundialfan-api-production.up.railway.app';

function mediaUrl(path, fallback = '/images/default-profile.jpg') {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('uploads/')) return `${BASE}/${path}`;
  return `${BASE}/uploads/${path}`;
}

document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  const loggedUser = getUser();

  // ── ¿Perfil propio o ajeno? ────────────────────────────────────────────────
  const urlParams    = new URLSearchParams(window.location.search);
  const profileId    = urlParams.get('id') ? parseInt(urlParams.get('id')) : loggedUser.id;
  const isOwnProfile = profileId === loggedUser.id;

  const postsEl = document.getElementById('my-posts');

  // ── Mostrar/ocultar controles que solo aplican al perfil propio ────────────
  document.querySelectorAll('[data-own-only]').forEach(el => {
    el.style.display = isOwnProfile ? '' : 'none';
  });

  // ── Llenar datos del perfil ────────────────────────────────────────────────
  try {
    const data = await Users.getProfile(profileId);
    const u    = data.user ?? data;

    document.getElementById('profile-name').textContent     = u.name     ?? '—';
    document.getElementById('profile-username').textContent = '@' + (u.username ?? '—');
    document.getElementById('profile-email').textContent    = u.email    ?? '—';
    document.getElementById('profile-city').textContent     = u.city     || '—';
    document.getElementById('profile-country').textContent  = u.country  || '—';

    let fechaNac = u.birth_date ?? '—';
    if (fechaNac.includes(','))      fechaNac = fechaNac.split(',')[0];
    else if (fechaNac.includes('T')) fechaNac = fechaNac.split('T')[0];
    document.getElementById('profile-birth').textContent = fechaNac;

    if (u.profile_picture) {
      document.getElementById('profile-avatar').src = mediaUrl(u.profile_picture);
    }

    if (u.cover_picture) {
      const cover = document.getElementById('profile-cover');
      cover.style.backgroundImage    = `url('${mediaUrl(u.cover_picture)}')`;
      cover.style.backgroundSize     = 'cover';
      cover.style.backgroundPosition = 'center';
    }

    // ── Controles de perfil propio ─────────────────────────────────────────
    if (isOwnProfile) {

      const avatarUploadEl = document.getElementById('avatar-upload');
      if (avatarUploadEl) {
        avatarUploadEl.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('avatar', file);
          try {
            const result = await Users.updateAvatar(formData);
            document.getElementById('profile-avatar').src = mediaUrl(result.profile_picture);
            const stored = getUser();
            if (stored) {
              stored.profile_picture = result.profile_picture;
              localStorage.setItem('mf_user', JSON.stringify(stored));
            }
          } catch (err) {
            alert(err.message ?? 'Error al subir avatar.');
          }
        });
      }

      const coverUploadEl = document.getElementById('cover-upload');
      if (coverUploadEl) {
        coverUploadEl.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('cover', file);
          try {
            const result = await Users.updateCover(formData);
            const cover  = document.getElementById('profile-cover');
            cover.style.backgroundImage    = `url('${mediaUrl(result.cover_picture)}')`;
            cover.style.backgroundSize     = 'cover';
            cover.style.backgroundPosition = 'center';
          } catch (err) {
            alert(err.message ?? 'Error al subir portada.');
          }
        });
      }

    } else {
      // ── Controles de perfil ajeno: botón Mensaje ─────────────────────────
      const actionEl = document.getElementById('profile-actions');
      if (actionEl) {
        actionEl.innerHTML = `
          <a href="chat.html?with=${profileId}" class="btn btn-primary rounded-pill px-4">
            <i class="fas fa-comment-dots me-2"></i>Enviar mensaje
          </a>
        `;
      }
    }

    // ── Publicaciones ────────────────────────────────────────────────────────
    const posts = data.posts ?? [];
    if (!posts.length) {
      postsEl.innerHTML = `<div class="text-center py-4" style="opacity:.65;">
        <i class="fas fa-newspaper fa-2x mb-2 d-block"></i>
        ${isOwnProfile ? 'Aún no has publicado nada.' : 'Este usuario aún no tiene publicaciones.'}</div>`;
    } else {
      postsEl.innerHTML = posts.map(post => `
        <article class="card border-0 shadow-sm rounded-4 mb-3">
          <div class="card-body">
            <p class="mb-2">${post.content}</p>
            ${post.media_path
              ? (post.content_type === 'video'
                  ? `<video controls src="${mediaUrl(post.media_path)}" class="w-100 rounded-4 border" style="max-height:320px;"></video>`
                  : `<img src="${mediaUrl(post.media_path)}" class="img-fluid rounded-4 border" style="max-height:320px;object-fit:cover;width:100%;">`)
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
    console.error(e);
    document.getElementById('profile-name').textContent     = '—';
    document.getElementById('profile-username').textContent = '—';
    document.getElementById('profile-email').textContent    = '—';
    postsEl.innerHTML = `<div class="text-center py-4 text-danger">Error al cargar el perfil.</div>`;
  }

  // ── Búsqueda de usuarios (solo en perfil propio) ──────────────────────────
  if (isOwnProfile) {
    const btnSearch = document.getElementById('btn-user-search');
    if (btnSearch) {
      btnSearch.addEventListener('click', async () => {
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
          tbody.innerHTML = users.map(u => `
            <tr>
              <td class="d-flex align-items-center gap-2">
                <img src="${mediaUrl(u.profile_picture)}" style="width:36px;height:36px;border-radius:999px;object-fit:cover;">
                <strong>@${u.username}</strong>
              </td>
              <td>${u.name}</td>
              <td class="d-flex gap-2">
                <a href="perfil.html?id=${u.id}" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-user me-1"></i> Perfil
                </a>
                <a href="chat.html?with=${u.id}" class="btn btn-outline-secondary btn-sm">
                  <i class="fas fa-comment-dots me-1"></i> Chat
                </a>
              </td>
            </tr>
          `).join('');
        } catch (e) {
          tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error en la búsqueda.</td></tr>`;
        }
      });
    }
  }

});