let myFriends = [];
let pendingRequests = [];
let suggestedUsers = [];

// --- RENDER LOGIC ---
function renderUserCards(containerId, users, listType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-user-friends"></i><p>No hay usuarios para mostrar</p></div>`;
    return;
  }

  container.innerHTML = users.map(user => {
    let actionButtons = '';
    if (listType === 'requests') {
      actionButtons = `
        <button class="btn-amigo btn-amigo-primary" onclick="acceptFriendRequest(${user.id})"><i class="fas fa-check"></i> Accept</button>
        <button class="btn-amigo btn-amigo-danger" onclick="declineFriendRequest(${user.id})"><i class="fas fa-times"></i> Decline</button>
      `;
    } else if (listType === 'suggestions') {
      actionButtons = `
        <button class="btn-amigo btn-amigo-primary" onclick="sendFriendRequest(${user.id})"><i class="fas fa-user-plus"></i> Add Friend</button>
      `;
    } else {
      actionButtons = `
        <button class="btn-amigo btn-amigo-primary" onclick="sendMessage(${user.id})"><i class="fas fa-comment"></i> Message</button>
        <button class="btn-amigo btn-amigo-outline" onclick="viewProfile(${user.id})"><i class="fas fa-user"></i> Profile</button>
      `;
    }

    return `
    <div class="amigo-card" data-user-id="${user.id}">
      <div class="amigo-cover" style="background-image: url('${user.cover || 'https://picsum.photos/id/1/400/120'}')"></div>
      <div class="amigo-avatar-wrapper">
        <div class="amigo-avatar" style="background-image: url('${user.avatar}'); background-size: cover;">
          <div class="amigo-status ${user.isOnline ? 'online' : 'offline'}"></div>
        </div>
        <div class="amigo-menu" onclick="event.stopPropagation(); toggleMenu(this)">
          <i class="fas fa-ellipsis-h"></i>
          <div class="dropdown-menu-custom">
            <a href="#"><i class="fas fa-comment"></i> Send Message</a>
            <a href="#"><i class="fas fa-ban"></i> Remove Friend</a>
            <a href="#"><i class="fas fa-flag"></i> Report</a>
          </div>
        </div>
      </div>
      <div class="amigo-info">
        <h4>${user.name} ${user.countryFlag ? `<span title="${user.team}">${user.countryFlag}</span>` : ''}</h4>
        <div class="amigo-user">${user.username}</div>
        ${user.mutualFriends ? `<div class="amigo-mutuos"><i class="fas fa-user-friends"></i> ${user.mutualFriends} mutual friends</div>` : ''}
        <div class="amigo-equipo"><i class="fas fa-trophy"></i> ${user.team}</div>
        <div class="amigo-botones">
          ${actionButtons}
        </div>
      </div>
    </div>
    `;
  }).join('');
}

function updateCounters() {
  document.getElementById('contadorAmigos').innerText = myFriends.length;
  document.getElementById('contadorSolicitudes').innerText = pendingRequests.length;
}

function refreshAllViews() {
  renderUserCards('misAmigos', myFriends, 'friends');
  renderUserCards('solicitudesAmistad', pendingRequests, 'requests');
  renderUserCards('sugerenciasAmistad', suggestedUsers, 'suggestions');
  updateCounters();
}

// --- ACTIONS LOGIC ---
async function sendFriendRequest(userId) {
  const userIndex = suggestedUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    try {
      await Users.sendRequest(userId);
      suggestedUsers.splice(userIndex, 1);
      refreshAllViews();
    } catch (e) {
      console.error(e);
      alert('Error sending request.');
    }
  }
}

async function acceptFriendRequest(userId) {
  const requestIndex = pendingRequests.findIndex(u => u.id === userId);
  if (requestIndex > -1) {
    const user = pendingRequests[requestIndex];
    try {
      await Users.acceptRequest(userId);
      pendingRequests.splice(requestIndex, 1);
      myFriends.push(user);
      refreshAllViews();
    } catch (e) {
      console.error(e);
      alert('Error accepting request.');
    }
  }
}

async function declineFriendRequest(userId) {
  const requestIndex = pendingRequests.findIndex(u => u.id === userId);
  if (requestIndex > -1) {
    try {
      await Users.declineRequest(userId);
      pendingRequests.splice(requestIndex, 1);
      refreshAllViews();
    } catch (e) {
      console.error(e);
      alert('Error declining request.');
    }
  }
}

function sendMessage(userId) {
  window.location.href = `chat.html?with=${userId}`;
}

function viewProfile(userId) {
  window.location.href = `perfil.html?id=${userId}`;
}

// --- UTILS ---
function toggleMenu(btn) {
  const dropdown = btn.querySelector('.dropdown-menu-custom');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
}

document.addEventListener('click', function (e) {
  if (!e.target.closest('.amigo-menu')) {
    document.querySelectorAll('.dropdown-menu-custom').forEach(d => d.style.display = 'none');
  }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function () {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  try {
    const friendsData = await Users.getFriends();
    const apiFriends = friendsData.data ?? friendsData;
    myFriends = apiFriends.map(u => ({
      id: u.id,
      name: u.name,
      username: "@" + u.username,
      team: u.country || "Unknown",
      countryFlag: "",
      isOnline: Math.random() > 0.5,
      mutualFriends: 0,
      avatar: u.profile_picture ? `http://localhost:8000/uploads/${u.profile_picture}` : "../images/default-profile.jpg",
      cover: u.cover_picture    ? `http://localhost:8000/uploads/${u.cover_picture}`   : `https://picsum.photos/seed/${u.id}/400/120`
    }));
  } catch (error) {
    console.error("Error fetching friends:", error);
  }

  try {
    const reqData = await Users.getRequests();
    const apiRequests = reqData.data ?? reqData;
    pendingRequests = apiRequests.map(u => ({
      id: u.id,
      name: u.name,
      username: "@" + u.username,
      team: u.country || "Unknown",
      countryFlag: "",
      isOnline: Math.random() > 0.5,
      mutualFriends: 0,
      avatar: u.profile_picture ? `http://localhost:8000/uploads/${u.profile_picture}` : "../images/default-profile.jpg",
      cover: u.cover_picture    ? `http://localhost:8000/uploads/${u.cover_picture}`   : `https://picsum.photos/seed/${u.id}/400/120`
    }));
  } catch (error) {
    console.error("Error fetching requests:", error);
  }

  try {
    const data = await Users.search('');
    const apiUsers = data.data ?? data;
    suggestedUsers = apiUsers
      .filter(u => !pendingRequests.find(pr => pr.id === u.id) && !myFriends.find(mf => mf.id === u.id))
      .map(u => ({
        id: u.id,
        name: u.name,
        username: "@" + u.username,
        team: u.country || "Unknown",
        countryFlag: "",
        isOnline: Math.random() > 0.5,
        mutualFriends: 0,
        avatar: u.profile_picture ? `http://localhost:8000/uploads/${u.profile_picture}` : "../images/default-profile.jpg",
        cover: u.cover_picture    ? `http://localhost:8000/uploads/${u.cover_picture}`   : `https://picsum.photos/seed/${u.id}/400/120`
      }));
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  refreshAllViews();

  const searchInput = document.getElementById('buscarPersona');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = suggestedUsers.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.team.toLowerCase().includes(term)
      );
      renderUserCards('sugerenciasAmistad', filtered, 'suggestions');
    });
  }
});
