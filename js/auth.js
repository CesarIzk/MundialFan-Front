document.addEventListener('DOMContentLoaded', () => {

  if (isLoggedIn()) window.location.href = 'index.html';

  // ── LOGIN ──────────────────────────────────────────────
  document.getElementById('btn-login').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const okEl     = document.getElementById('login-success');

    errEl.style.display = 'none';
    okEl.style.display  = 'none';

    if (!email || !password) {
      errEl.textContent = 'Completa todos los campos.';
      errEl.style.display = 'block';
      return;
    }

    try {
      await Auth.login(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      errEl.textContent = err.message || 'Credenciales incorrectas.';
      errEl.style.display = 'block';
    }
  });

  // ── REGISTRO ───────────────────────────────────────────
  document.getElementById('btn-register').addEventListener('click', async () => {
    const name      = document.getElementById('reg-name').value.trim();
    const username  = document.getElementById('reg-username').value.trim();
    const email     = document.getElementById('reg-email').value.trim();
    const birth     = document.getElementById('reg-birth').value;
    const gender    = document.getElementById('reg-gender').value;
    const password  = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const errEl     = document.getElementById('register-error');

    errEl.style.display = 'none';

    if (!name || !username || !email || !birth || !gender || !password) {
      errEl.textContent = 'Completa todos los campos.';
      errEl.style.display = 'block';
      return;
    }

    if (password !== password2) {
      errEl.textContent = 'Las contraseñas no coinciden.';
      errEl.style.display = 'block';
      return;
    }

    try {
      await Auth.register({ name, username, email, birth_date: birth, gender, password, password_confirmation: password2 });
      await Auth.login(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      errEl.textContent = err.message || 'Error al crear la cuenta.';
      errEl.style.display = 'block';
    }
  });

});
