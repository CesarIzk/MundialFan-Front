/**
 * social.js - Manejo de Likes y Comentarios mediante AJAX
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE LIKES ---
    document.querySelectorAll('.ajax-like').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button');
            const icon = btn.querySelector('i');
            const countSpan = btn.querySelector('.like-count');
            const formData = new FormData(form);

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        const liked = result.liked; // estado real devuelto por el servidor

                        // Actualizar UI según estado real
                        icon.classList.toggle('fas', liked);
                        icon.classList.toggle('far', !liked);
                        btn.classList.toggle('btn-danger', liked);
                        btn.classList.toggle('btn-outline-secondary', !liked);

                        // Actualizar contador según estado real
                        let count = parseInt(countSpan.innerText) || 0;
                        countSpan.innerText = liked ? count + 1 : count - 1;
                    }
                }
            } catch (error) {
                console.error("Error en Like:", error);
            }
        });
    });

    // --- LÓGICA DE COMENTARIOS ---
    document.querySelectorAll('.ajax-comment').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const textarea = form.querySelector('textarea');
            const postId = form.querySelector('input[name="idPublicacion"]').value;
            const container = document.querySelector(`.comments-section-${postId}`);
            const submitBtn = form.querySelector('button[type="submit"]');

            if (!textarea.value.trim()) return;

            submitBtn.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                const data = await response.json();

                if (data.success) {
                    const userStr = localStorage.getItem('mf_user');
                    const currentUser = userStr ? JSON.parse(userStr) : {};
                    const avatarSrc = currentUser.profile_picture ? `http://localhost:8000/uploads/${currentUser.profile_picture}` : '../imagenes/default-profile.jpg';

                    const nuevoHtml = `
                        <div class="d-flex gap-2 mb-2 mf-fade-in">
                            <img src="${avatarSrc}" 
                                 style="width:30px;height:30px;border-radius:50%;object-fit:cover;">
                            <div class="p-2 rounded-4 bg-light flex-grow-1 border">
                                <div class="d-flex justify-content-between">
                                    <strong style="font-size:12px;">${data.user_name}</strong>
                                    <small class="text-muted" style="font-size:10px;">Ahora mismo</small>
                                </div>
                                <div style="font-size:13px;">${data.texto}</div>
                            </div>
                        </div>`;

                    container.insertAdjacentHTML('beforeend', nuevoHtml);
                    textarea.value = '';
                }
            } catch (error) {
                console.error("Error al comentar:", error);
            } finally {
                submitBtn.disabled = false;
            }
        });
    });
});