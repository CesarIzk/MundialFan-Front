document.addEventListener('DOMContentLoaded', async () => {

  const grid = document.getElementById('paises-grid');
  let allCountries = [];

  function renderCountries(list) {
    if (!list.length) {
      grid.innerHTML = `<p class="text-center text-muted py-5" style="grid-column:1/-1;">
        No hay países registrados actualmente.</p>`;
      return;
    }
    grid.innerHTML = list.map(c => {
      const flagSrc = c.flag
        ? (c.flag.startsWith('http') ? c.flag : `http://localhost:8000/uploads/${c.flag}`)
        : `../images/default-profile.jpg`;
      return `
        <article class="team-card">
          <a class="team-card__link" href="pais_detalle.html?id=${c.id}" aria-label="Ver información de ${c.name}">
            <img class="team-card__flag" src="${flagSrc}" alt="Bandera de ${c.name}">
            <h3 class="team-card__name">${c.name}</h3>
            <p class="team-card__meta">${c.continent ?? ''}</p>
          </a>
        </article>
      `;
    }).join('');
  }

  document.getElementById('search-country').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderCountries(q ? allCountries.filter(c => c.name.toLowerCase().includes(q)) : allCountries);
  });

  try {
    const data = await Countries.getAll();
    allCountries = data.data ?? data;
    renderCountries(allCountries);
  } catch (e) {
    grid.innerHTML = `<p class="text-center text-danger py-5" style="grid-column:1/-1;">Error al cargar países.</p>`;
  }

});
