document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  function showAlert(msg, type = 'success') {
    const box = document.getElementById('alert-box');
    box.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    box.style.display = 'block';
    setTimeout(() => box.style.display = 'none', 4000);
  }

  // ── Pre-cargar datos del perfil ────────────────────────
  try {
    const user = getUser();
    const data = await Users.getProfile(user.id);
    const u    = data.user ?? data;

    document.getElementById('cfg-name').value    = u.name    ?? '';
    document.getElementById('cfg-bio').value     = u.bio     ?? '';
    document.getElementById('cfg-email').value   = u.email   ?? '';
    document.getElementById('cfg-city').value    = u.city    ?? '';
    document.getElementById('cfg-country').value = u.country ?? '';
    if (u.gender) document.getElementById('cfg-gender').value = u.gender;

    let fechaNac = u.birth_date ?? '';
    if (fechaNac.includes('/')) {
      const partes = fechaNac.split(',')[0].split('/');
      if (partes.length === 3) fechaNac = `${partes[2]}-${partes[1]}-${partes[0]}`;
    } else if (fechaNac.includes('T')) {
      fechaNac = fechaNac.split('T')[0];
    }
    document.getElementById('cfg-birth').value = fechaNac;

    if (u.profile_picture) {
      document.getElementById('cfg-avatar-preview').src = `http://localhost:8000/uploads/${u.profile_picture}`;
    }
  } catch (e) {
    const user = getUser();
    document.getElementById('cfg-name').value  = user?.name  ?? '';
    document.getElementById('cfg-email').value = user?.email ?? '';
  }

  // ── Guardar perfil ─────────────────────────────────────
  document.getElementById('btn-save-profile').addEventListener('click', async () => {
    try {
      await Users.updateProfile({
        name:       document.getElementById('cfg-name').value.trim(),
        bio:        document.getElementById('cfg-bio').value.trim(),
        birth_date: document.getElementById('cfg-birth').value,
        gender:     document.getElementById('cfg-gender').value,
        email:      document.getElementById('cfg-email').value.trim(),
      });
      showAlert('✅ Perfil actualizado correctamente.');
    } catch (err) {
      showAlert(err.message || 'Error al guardar.', 'danger');
    }
  });

  // ── Guardar ubicación ──────────────────────────────────
  document.getElementById('btn-save-location').addEventListener('click', async () => {
    const city    = document.getElementById('cfg-city').value.trim();
    const country = document.getElementById('cfg-country').value.trim();
    try {
      await Users.updateProfile({ city, country });
      showAlert('✅ Ubicación actualizada correctamente.');
    } catch (err) {
      showAlert(err.message || 'Error al guardar la ubicación.', 'danger');
    }
  });

  // ── Previsualizar avatar ────────────────────────────────
  document.getElementById('cfg-avatar').addEventListener('change', function () {
    const file = this.files[0];
    if (file) document.getElementById('cfg-avatar-preview').src = URL.createObjectURL(file);
  });

  // ── Subir avatar ───────────────────────────────────────
  document.getElementById('btn-save-avatar').addEventListener('click', async () => {
    const file = document.getElementById('cfg-avatar').files[0];
    if (!file) { showAlert('Selecciona una imagen primero.', 'warning'); return; }

    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await Users.updateAvatar(formData);
      const currentUser = getUser();
      currentUser.profile_picture = res.profile_picture;
      localStorage.setItem('mf_user', JSON.stringify(currentUser));
      showAlert('✅ Foto de perfil actualizada.');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showAlert(err.message || 'Error al subir la foto.', 'danger');
    }
  });

  // ── Cambiar contraseña ─────────────────────────────────
  document.getElementById('btn-save-password').addEventListener('click', async () => {
    const actual    = document.getElementById('cfg-pass-actual').value;
    const nueva     = document.getElementById('cfg-pass-nueva').value;
    const confirmar = document.getElementById('cfg-pass-confirmar').value;
    if (nueva !== confirmar) { showAlert('Las contraseñas no coinciden.', 'danger'); return; }
    try {
      await Users.updatePassword(actual, nueva);
      showAlert('✅ Contraseña actualizada.');
      document.getElementById('cfg-pass-actual').value    = '';
      document.getElementById('cfg-pass-nueva').value     = '';
      document.getElementById('cfg-pass-confirmar').value = '';
    } catch (err) {
      showAlert(err.message || 'Error al cambiar contraseña.', 'danger');
    }
  });

  // ── Dar de baja ────────────────────────────────────────
  document.getElementById('btn-deactivate').addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de que deseas dar de baja tu cuenta?')) return;
    try {
      await Users.deactivate();
      Auth.logout();
    } catch (err) {
      showAlert(err.message || 'Error al dar de baja la cuenta.', 'danger');
    }
  });

});