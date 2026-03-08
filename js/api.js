/**
 * MundialFan - API Client
 * Centraliza todas las llamadas fetch al backend Slim 4.
 * Uso: import api desde cualquier página, o incluir este script antes del JS de la página.
 */

const API_BASE = 'http://localhost:8000/api';

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('mf_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, message: data.message || 'Error en la solicitud', data };
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const Auth = {
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('mf_token', data.token);
    localStorage.setItem('mf_user', JSON.stringify(data.user));
    return data;
  },

  async register(payload) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    localStorage.removeItem('mf_token');
    localStorage.removeItem('mf_user');
    window.location.href = 'auth.html';
  },
};

// ─── Posts ────────────────────────────────────────────────────────────────────

const Posts = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/posts${query ? '?' + query : ''}`);
  },

  async getOne(id) {
    return apiFetch(`/posts/${id}`);
  },

  async create(formData) {
    const token = localStorage.getItem('mf_token');
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData, // multipart/form-data para archivos
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async delete(id) {
    return apiFetch(`/posts/${id}`, { method: 'DELETE' });
  },
};

// ─── Likes ────────────────────────────────────────────────────────────────────

const Likes = {
  async toggle(postId) {
    return apiFetch(`/posts/${postId}/like`, { method: 'POST' });
  },
};

// ─── Comments ────────────────────────────────────────────────────────────────

const Comments = {
  async getByPost(postId) {
    return apiFetch(`/posts/${postId}/comments`);
  },

  async create(postId, content) {
    return apiFetch(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async delete(commentId) {
    return apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

const Users = {
  async search(q) {
    return apiFetch(`/users?q=${encodeURIComponent(q)}`);
  },

  async getProfile(id) {
    return apiFetch(`/users/${id}`);
  },

  async updateProfile(payload) {
    return apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateAvatar(formData) {
    const token = localStorage.getItem('mf_token');
    const response = await fetch(`${API_BASE}/users/me/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updatePassword(actual, nueva) {
    return apiFetch('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: actual, new_password: nueva }),
    });
  },

  async deactivate() {
    return apiFetch('/users/me', { method: 'DELETE' });
  },
};

// ─── Countries ────────────────────────────────────────────────────────────────

const Countries = {
  async getAll() {
    return apiFetch('/countries');
  },

  async getOne(id) {
    return apiFetch(`/countries/${id}`);
  },
};

// ─── Championships ────────────────────────────────────────────────────────────

const Championships = {
  async getAll() {
    return apiFetch('/championships');
  },
};

// ─── Categories ───────────────────────────────────────────────────────────────

const Categories = {
  async getAll() {
    return apiFetch('/categories');
  },
};
