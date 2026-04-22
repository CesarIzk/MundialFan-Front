document.addEventListener('DOMContentLoaded', async () => {

  let allChampionships = [];

  function renderChampionship(c) {
    return `
      <section class="wc-result mb-4">
        <div class="wc-card">
          <div class="wc-card__head">
            <h2>${c.host_country ?? ''} ${c.year ?? ''}</h2>
          </div>
          <div class="wc-grid">
            <div class="wc-box">
              <h3>Final</h3>
              <ul class="wc-list">
                <li><strong>Campeón:</strong> ${c.champion ?? '—'}</li>
                <li><strong>Subcampeón:</strong> ${c.runner_up ?? '—'}</li>
                <li><strong>3er lugar:</strong> ${c.third_place ?? '—'}</li>
                <li><strong>4to lugar:</strong> ${c.fourth_place ?? '—'}</li>
              </ul>
            </div>
            <div class="wc-box">
              <h3>Datos</h3>
              <ul class="wc-list">
                <li><strong>Sede:</strong> ${c.host_country ?? '—'}</li>
                <li><strong>Equipos:</strong> ${c.participating_teams ?? '—'}</li>
                <li><strong>Partidos:</strong> ${c.matches ?? '—'}</li>
                <li><strong>Goles:</strong> ${c.total_goals ?? '—'}</li>
              </ul>
            </div>
            ${c.top_scorer || c.golden_ball ? `
            <div class="wc-box wc-box--full">
              <h3>Premios FIFA</h3>
              <div class="wc-pills">
                ${c.golden_ball  ? `<span class="wc-pill"><strong>Balón de Oro:</strong> ${c.golden_ball}</span>` : ''}
                ${c.top_scorer   ? `<span class="wc-pill"><strong>Bota de Oro:</strong> ${c.top_scorer}</span>` : ''}
                ${c.golden_glove ? `<span class="wc-pill"><strong>Guante de Oro:</strong> ${c.golden_glove}</span>` : ''}
                ${c.best_young   ? `<span class="wc-pill"><strong>Mejor Joven:</strong> ${c.best_young}</span>` : ''}
              </div>
            </div>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  function filtrar(q) {
    if (!q) {
      document.getElementById('lista-campeonatos').innerHTML =
        allChampionships.map(renderChampionship).join('');
      return;
    }
    const lower = q.toLowerCase();
    const filtered = allChampionships.filter(c =>
      (c.year?.toString().includes(lower)) ||
      (c.host_country?.toLowerCase().includes(lower)) ||
      (c.champion?.toLowerCase().includes(lower))
    );
    document.getElementById('lista-campeonatos').innerHTML =
      filtered.length
        ? filtered.map(renderChampionship).join('')
        : `<p class="text-center text-muted py-4">No se encontraron resultados para "${q}".</p>`;
  }

  document.getElementById('filtroInput').addEventListener('input', e => filtrar(e.target.value.trim()));

  try {
    const data = await Championships.getAll();
    allChampionships = data.data ?? data;
    document.getElementById('lista-campeonatos').innerHTML =
      allChampionships.length
        ? allChampionships.map(renderChampionship).join('')
        : `<p class="text-center text-muted py-4">No hay campeonatos registrados aún.</p>`;
  } catch (e) {
    document.getElementById('lista-campeonatos').innerHTML =
      `<p class="text-center text-danger py-4">Error al cargar campeonatos.</p>`;
  }

});
