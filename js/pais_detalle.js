document.addEventListener('DOMContentLoaded', async () => {

  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  const loading = document.getElementById('page-loading');
  const empty   = document.getElementById('page-empty');
  const content = document.getElementById('page-content');

  if (!id) { window.location.href = 'equipo.html'; return; }

  try {
    const data    = await Countries.getOne(id);
    const country = data.data ?? data;

    loading.style.display = 'none';

    if (!country.name) {
      document.getElementById('empty-name').textContent = 'País desconocido';
      empty.style.display = 'block';
      return;
    }

    const API = 'http://localhost:8000';
    document.title = `MundialFan - ${country.name}`;

    document.getElementById('pais-nombre').textContent       = country.name;
    document.getElementById('pais-nombre-2').textContent     = country.name;
    document.getElementById('pais-continente').textContent   = country.continent ?? '';
    document.getElementById('pais-continente-2').textContent = country.continent ?? '—';
    document.getElementById('pais-codigo').textContent       = country.code        ?? '';
    document.getElementById('pais-titulos').textContent      = country.titles       ?? '—';
    document.getElementById('pais-participaciones').textContent = country.participations ?? '—';
    document.getElementById('pais-entrenador').textContent   = country.coach       ?? '—';
    document.getElementById('pais-jugador').textContent      = country.best_player ?? '—';

    if (country.flag) {
      const flagUrl = country.flag.startsWith('http') ? country.flag : `${API}/uploads/${country.flag}`;
      document.getElementById('pais-bandera').src = flagUrl;
      const cover = document.getElementById('pais-cover');
      cover.style.backgroundImage    = `url('${flagUrl}')`;
      cover.style.backgroundSize     = 'cover';
      cover.style.backgroundPosition = 'center';
      cover.style.filter             = 'brightness(0.6)';
    }

    if (country.images && country.images.length) {
      document.getElementById('galeria-section').style.display = 'block';
      document.getElementById('galeria-container').innerHTML =
        country.images.map(img => `
          <img src="${API}/uploads/${img.path}" alt="${img.caption ?? ''}"
               class="rounded shadow-sm" style="max-width:100%;border-radius:10px;">
        `).join('');
    }

    if (country.videos && country.videos.length) {
      document.getElementById('videos-section').style.display = 'block';
      document.getElementById('videos-container').innerHTML =
        country.videos.map(v => `
          <iframe src="${v.url}" frameborder="0" allowfullscreen
                  class="shadow-sm" style="width:100%;aspect-ratio:16/9;border-radius:10px;"></iframe>
        `).join('');
    }

    content.style.display = 'block';

  } catch (e) {
    loading.style.display = 'none';
    document.getElementById('empty-name').textContent = 'País no encontrado';
    empty.style.display = 'block';
  }

});
