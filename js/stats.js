document.addEventListener('DOMContentLoaded', () => {

  // ── 12 grupos hardcoded ────────────────────────────────
  const grupos     = 'ABCDEFGHIJKL'.split('');
  const gruposGrid = document.getElementById('grupos-grid');

  gruposGrid.innerHTML = grupos.map(letra => `
    <article class="table-card">
      <h3>Grupo ${letra}</h3>
      <div class="table-wrap">
        <table class="mf-table">
          <thead>
            <tr>
              <th>Pos</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th>
              <th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4].map(n => `
              <tr>
                <td>${n}</td><td>—</td><td>0</td><td>0</td><td>0</td>
                <td>0</td><td>0</td><td>0</td><td>0</td><td>0</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `).join('');

  // ── Estadística general ────────────────────────────────
  const token   = localStorage.getItem('mf_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

  fetch('http://localhost:8000/api/stats/general', { headers })
    .then(r => r.json())
    .then(data => {
      const rows  = data.data ?? data;
      const tbody = document.getElementById('tbody-stats');
      if (!rows || !rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3" style="opacity:.5;">Sin datos aún.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.team ?? r.country ?? '—'}</td>
          <td>${r.goals        ?? 0}</td>
          <td>${r.yellow_cards ?? 0}</td>
          <td>${r.red_cards    ?? 0}</td>
        </tr>
      `).join('');
    })
    .catch(() => {
      document.getElementById('tbody-stats').innerHTML =
        `<tr><td colspan="4" class="text-center py-3" style="opacity:.5;">Sin datos aún.</td></tr>`;
    });

});
