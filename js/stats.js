// ══════════════════════════════════════════════════════════════
//  stats.js  —  Estadísticas mundiales
//  Consume: GET /api/stats/general
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {

  const token   = localStorage.getItem('mf_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const loading = (colspan) =>
    `<tr><td colspan="${colspan}" class="text-center py-3" style="opacity:.5;">
      Sin datos disponibles.</td></tr>`;

  function rankBadge(i) {
    const cls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n';
    return `<span class="rank-badge ${cls}">${i + 1}</span>`;
  }

  try {
    const res  = await fetch('http://localhost:8000/api/stats/general', { headers });
    const data = await res.json();

    // ── Resumen ──────────────────────────────────────────────
    const s = data.summary ?? {};
    document.getElementById('sum-editions').textContent = s.total_editions ?? '—';
    document.getElementById('sum-goals').textContent    = s.total_goals    ?? '—';
    document.getElementById('sum-champion').textContent = s.last_champion  ?? '—';
    document.getElementById('sum-year').textContent     = s.last_year      ?? '—';
    document.getElementById('sum-host').textContent     = s.last_host      ?? '—';

    // ── Campeones históricos ──────────────────────────────────
    const champions = data.champions_ranking ?? [];
    document.getElementById('tbody-champions').innerHTML = champions.length
      ? champions.map((c, i) => `
          <tr>
            <td>${rankBadge(i)}</td>
            <td><strong>${c.country ?? '—'}</strong></td>
            <td>${c.titles ?? 0} ${'🏆'.repeat(Math.min(c.titles, 5))}</td>
          </tr>`).join('')
      : loading(3);

    // ── Equipos exitosos ──────────────────────────────────────
    const teams = data.successful_teams ?? [];
    document.getElementById('tbody-teams').innerHTML = teams.length
      ? teams.map((t, i) => `
          <tr>
            <td>${rankBadge(i)}</td>
            <td>
              ${t.flag ? `<img src="http://localhost:8000/uploads/${t.flag}" style="width:22px;height:16px;object-fit:cover;border-radius:2px;margin-right:6px;">` : ''}
              <strong>${t.name ?? '—'}</strong>
            </td>
            <td>${t.titles ?? 0}</td>
          </tr>`).join('')
      : loading(3);

    // ── Goles por edición (barras) ────────────────────────────
    const goalsByYear = data.goals_by_year ?? [];
    const maxGoals    = Math.max(...goalsByYear.map(g => g.goals ?? 0), 1);

    document.getElementById('goals-by-year').innerHTML = goalsByYear.length
      ? goalsByYear.map(g => `
          <div class="goals-bar-item" title="${g.host ?? ''} ${g.year ?? ''}">
            <span class="goals-bar-year">${g.year ?? '—'}</span>
            <div class="goals-bar-track">
              <div class="goals-bar-fill" style="width:${Math.round((g.goals / maxGoals) * 100)}%"></div>
            </div>
            <span class="goals-bar-num">${g.goals ?? 0}</span>
          </div>`).join('')
      : `<p class="text-center py-3" style="opacity:.5;">Sin datos.</p>`;

    // ── Ranking de países ─────────────────────────────────────
    const countries = data.countries_ranking ?? [];
    document.getElementById('tbody-countries').innerHTML = countries.length
      ? countries.map((c, i) => `
          <tr>
            <td>${rankBadge(i)}</td>
            <td>
              ${c.flag ? `<img src="http://localhost:8000/uploads/${c.flag}" style="width:22px;height:16px;object-fit:cover;border-radius:2px;margin-right:6px;">` : ''}
              <strong>${c.name ?? '—'}</strong>
            </td>
            <td>${c.continent ?? '—'}</td>
            <td>${c.titles ?? 0}</td>
            <td>${c.participations ?? 0}</td>
          </tr>`).join('')
      : loading(5);

  } catch (err) {
    console.error('Error al cargar estadísticas:', err);
    ['tbody-champions', 'tbody-teams', 'tbody-countries'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">Error al cargar datos.</td></tr>`;
    });
    document.getElementById('goals-by-year').innerHTML =
      `<p class="text-center py-3 text-danger">Error al cargar datos.</p>`;
  }

});