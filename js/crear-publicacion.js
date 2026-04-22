document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  // ── Cargar categorías ──────────────────────────────────
  try {
    const cats = await Categories.getAll();
    const sel  = document.getElementById('categoria');
    (cats.data ?? cats).forEach(cat => {
      const opt = document.createElement('option');
      opt.value       = cat.id;
      opt.textContent = cat.name;
      sel.appendChild(opt);
    });
  } catch (e) { console.warn('No se pudieron cargar categorías'); }

  // ── Upload dinámico ────────────────────────────────────
  const radios        = document.querySelectorAll('input[name="tipoContenido"]');
  const archivoUpload = document.getElementById('archivoUpload');
  const inputArchivo  = document.getElementById('archivo');
  const label         = document.getElementById('archivoLabel');
  const icono         = document.getElementById('archivoIcono');
  const texto         = document.getElementById('archivoTexto');
  const info          = document.getElementById('archivoInfo');
  const preview       = document.getElementById('archivoPreview');

  function actualizarTipo() {
    const tipo = document.querySelector('input[name="tipoContenido"]:checked').value;
    if (tipo === 'texto') {
      archivoUpload.style.display = 'none';
      inputArchivo.value = '';
      preview.innerHTML  = '';
      return;
    }
    archivoUpload.style.display = 'block';
    inputArchivo.value = '';
    preview.innerHTML  = '';
    if (tipo === 'imagen') {
      label.innerHTML      = '<i>🖼️</i> Subir Imagen';
      icono.textContent    = '📸';
      texto.textContent    = 'Arrastra una imagen aquí o haz clic para seleccionar';
      info.textContent     = 'JPG, PNG, GIF o WEBP • Máximo 5MB';
      inputArchivo.accept  = 'image/jpeg,image/png,image/gif,image/webp';
    } else {
      label.innerHTML      = '<i>🎥</i> Subir Video';
      icono.textContent    = '🎬';
      texto.textContent    = 'Arrastra un video aquí o haz clic para seleccionar';
      info.textContent     = 'MP4, MOV o AVI • Máximo 50MB';
      inputArchivo.accept  = 'video/mp4,video/quicktime,video/x-msvideo';
    }
  }

  radios.forEach(r => r.addEventListener('change', actualizarTipo));
  actualizarTipo();

  inputArchivo.addEventListener('change', () => {
    const file = inputArchivo.files[0];
    const tipo = document.querySelector('input[name="tipoContenido"]:checked').value;
    preview.innerHTML = '';
    if (!file) return;
    const maxSize = tipo === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      preview.innerHTML = `<p style="color:red;font-size:13px;">⚠️ El archivo es demasiado grande.</p>`;
      inputArchivo.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    preview.innerHTML = tipo === 'imagen'
      ? `<img src="${url}" style="max-width:100%;max-height:300px;border-radius:12px;margin-top:10px;">`
      : `<video controls src="${url}" style="max-width:100%;max-height:300px;border-radius:12px;margin-top:10px;"></video>`;
  });

  // ── Contador de caracteres ─────────────────────────────
  const textarea = document.getElementById('texto');
  const contador = document.querySelector('.contador-caracteres');
  textarea.addEventListener('input', () => {
    contador.textContent = `${textarea.value.length}/500 caracteres`;
  });

  // ── Publicar ───────────────────────────────────────────
  document.getElementById('btn-publicar').addEventListener('click', async () => {
    const errEl   = document.getElementById('form-error');
    const content = textarea.value.trim();
    const catId   = document.getElementById('categoria').value;
    const tipo    = document.querySelector('input[name="tipoContenido"]:checked').value;
    const archivo = inputArchivo.files[0];

    errEl.style.display = 'none';

    if (!content) {
      errEl.textContent = 'El texto no puede estar vacío.';
      errEl.style.display = 'block';
      return;
    }
    if (!catId) {
      errEl.textContent = 'Selecciona una categoría.';
      errEl.style.display = 'block';
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('category_id', catId);
    formData.append('content_type', tipo);
    if (archivo) formData.append('media', archivo);

    try {
      await Posts.create(formData);
      window.location.href = 'publicaciones.html';
    } catch (err) {
      errEl.textContent = err.message || 'Error al publicar.';
      errEl.style.display = 'block';
    }
  });

});
