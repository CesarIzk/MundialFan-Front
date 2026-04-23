document.addEventListener('DOMContentLoaded', () => {

  const typeIcon = { 
    text: 'fas fa-align-left', 
    image: 'fas fa-image', 
    video: 'fas fa-video' 
  };

  function renderPosts(list) {
    const tbody = document.getElementById('posts-tbody');
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="adm-empty"><i class="fas fa-newspaper"></i> Sin publicaciones</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>
          <div class="adm-user-cell">
            <div class="adm-avatar-placeholder">${(p.user?.name || 'U')[0].toUpperCase()}</div>
            <span style="white-space:nowrap;">${p.user?.name ?? '—'}</span>
          </div>
        </td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.content?.replace(/"/g, '&quot;') ?? ''}">
          ${p.content?.substring(0, 80) ?? ''}${p.content?.length > 80 ? '...' : ''}
        </td>
        <td><i class="${typeIcon[p.content_type] || 'fas fa-file'}" title="${p.content_type}"></i></td>
        <td style="color:var(--adm-muted);font-size:.8rem;">${p.category?.name ?? '—'}</td>
        <td>${p.likes_count ?? 0}</td>
        <td>${p.comments_count ?? 0}</td>
        <td><span class="adm-badge ${p.status === 'public' ? 'adm-badge--green' : 'adm-badge--gray'}">${p.status}</span></td>
        <td style="color:var(--adm-muted);font-size:.8rem;white-space:nowrap;">${p.created_at?.slice(0, 10) ?? '—'}</td>
        <td>
          <div style="display:flex;gap:.4rem;">
            <!-- Botón Ver Publicación - redirige a vista de usuario -->
            <button class="adm-btn adm-btn--info adm-btn--sm"
              onclick="viewPost(${p.id})"
              title="Ver publicación en el sitio">
              <i class="fas fa-external-link-alt"></i>
            </button>
            <button class="adm-btn adm-btn--ghost adm-btn--sm"
              onclick="togglePost(${p.id}, '${p.status === 'public' ? 'hidden' : 'public'}')"
              title="${p.status === 'public' ? 'Ocultar' : 'Publicar'}">
              <i class="fas fa-${p.status === 'public' ? 'eye-slash' : 'eye'}"></i>
            </button>
            <button class="adm-btn adm-btn--danger adm-btn--sm" onclick="deletePost(${p.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function loadPosts() {
    try {
      const q      = document.getElementById('search-input').value.trim();
      const status = document.getElementById('filter-status').value;
      const type   = document.getElementById('filter-type').value;
      const params = new URLSearchParams();
      if (q)      params.set('q', q);
      if (status) params.set('status', status);
      if (type)   params.set('type', type);

      const data  = await adminFetch(`/admin/posts?${params}`);
      renderPosts(data ?? []);
    } catch(e) {
      document.getElementById('posts-tbody').innerHTML =
        `<tr><td colspan="9" class="adm-empty">Error al cargar</td></tr>`;
    }
  }


window.viewPost = (postId) => {
  window.location.href = `post.html?id=${postId}`;
};
  window.togglePost = async (id, newStatus) => {
    try {
      await adminFetch(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      showAlert('page-alert', `Publicación ${newStatus === 'public' ? 'publicada' : 'ocultada'}.`);
      loadPosts();
    } catch(e) { showAlert('page-alert', e.message || 'Error', 'danger'); }
  };

  window.deletePost = (id) => {
    confirmAction('¿Eliminar esta publicación permanentemente?', async () => {
      try {
        await adminFetch(`/admin/posts/${id}`, { method: 'DELETE' });
        showAlert('page-alert', 'Publicación eliminada.');
        loadPosts();
      } catch(e) { showAlert('page-alert', e.message || 'Error', 'danger'); }
    });
  };

  document.getElementById('btn-search').addEventListener('click', loadPosts);
  document.getElementById('search-input').addEventListener('keydown', e => e.key === 'Enter' && loadPosts());
  loadPosts();
});
