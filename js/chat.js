document.addEventListener('DOMContentLoaded', async () => {

  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return;
  }

  const user        = getUser();
  const messages    = document.getElementById('chat-messages');
  const input       = document.getElementById('chat-text-input');
  const btnSend     = document.getElementById('btn-send');
  const attachInput = document.getElementById('chat-attach-input');
  const chatList    = document.getElementById('chat-list');
  const topbarLeft  = document.getElementById('chat-topbar-left');

  let myChats = [];
  let currentChatUser = null;
  let pollingInterval = null;
  let isUploading = false;
  window.chatMediaMap = new Map();

  const urlParams    = new URLSearchParams(window.location.search);
  const activeChatId = urlParams.get('with') || localStorage.getItem('mf_active_chat');

  // ── Sidebar ───────────────────────────────────────────────
  async function loadSidebar() {
    try {
      const data = await Chats.getSidebar();
      myChats = data.data ?? data;
      renderChatList(myChats);
    } catch (error) {
      chatList.innerHTML = `<li class="text-center py-4 text-danger">Error al cargar chats.</li>`;
    }
  }

  function renderChatList(chats) {
    if (!chats || chats.length === 0) {
      chatList.innerHTML = `<li class="text-center py-4" style="opacity:0.6;">Aún no tienes amigos agregados.</li>`;
      return;
    }

    const cacheKey = JSON.stringify(chats) + '-' + (currentChatUser?.friend_id || '');
    if (chatList.dataset.cacheKey === cacheKey) return;
    chatList.dataset.cacheKey = cacheKey;

    chatList.innerHTML = chats.map(chat => {
      const avatar  = chat.friend_avatar ? `http://localhost:8000/uploads/${chat.friend_avatar}` : '../images/default-profile.jpg';
      const lastMsg = chat.last_message_content || (chat.last_message_media ? '📷 Multimedia' : '');
      const badge   = chat.unread_count > 0 ? `<span class="chat-badge">${chat.unread_count}</span>` : '';

      let ticks = '';
      if (chat.last_message_sender_id == user.id) {
        if (chat.last_message_status === 'read')      ticks = '<i class="fas fa-check-double" style="color:#53bdeb; font-size:0.7em;"></i> ';
        else if (chat.last_message_status === 'delivered') ticks = '<i class="fas fa-check-double text-muted" style="font-size:0.7em;"></i> ';
        else if (chat.last_message_status === 'sent') ticks = '<i class="fas fa-check text-muted" style="font-size:0.7em;"></i> ';
      }

      return `
        <li>
          <a class="chat-item ${currentChatUser && currentChatUser.friend_id == chat.friend_id ? 'chat-item--active' : ''}"
             href="#" data-friend-id="${chat.friend_id}">
            <img class="chat-avatar" src="${avatar}" alt="${chat.friend_name}">
            <div class="chat-item__meta">
              <div class="chat-item__row">
                <p class="chat-item__name">${chat.friend_name}</p>
                ${badge}
              </div>
              <p class="chat-item__preview">${ticks}${lastMsg}</p>
            </div>
          </a>
        </li>
      `;
    }).join('');

    document.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(parseInt(item.getAttribute('data-friend-id')));
      });
    });
  }

  async function openChat(friendId) {
    currentChatUser = myChats.find(f => f.friend_id == friendId);
    if (!currentChatUser) return;

    localStorage.setItem('mf_active_chat', friendId);
    window.history.replaceState({}, document.title, 'chat.html');
    renderChatList(myChats);

    const avatar = currentChatUser.friend_avatar
      ? `http://localhost:8000/uploads/${currentChatUser.friend_avatar}`
      : '../images/default-profile.jpg';

    topbarLeft.innerHTML = `
      <img class="chat-avatar" src="${avatar}" alt="${currentChatUser.friend_name}">
      <div class="chat-topbar__title">
        <h2>${currentChatUser.friend_name}</h2>
        <p style="font-size:12px; opacity:0.75;">@${currentChatUser.friend_username}</p>
      </div>
    `;

    if (pollingInterval) clearInterval(pollingInterval);
    await loadMessages(friendId, true);

    pollingInterval = setInterval(async () => {
      if (isUploading) return;
      await loadMessages(friendId, false);
      loadSidebar();
    }, 3000);

    input.focus();
  }

  async function loadMessages(friendId, forceScroll = false) {
    try {
      const data = await Chats.getHistory(friendId);
      const msgs = data.data ?? data;

      if (currentChatUser && currentChatUser.unread_count > 0) {
        currentChatUser.unread_count = 0;
        renderChatList(myChats);
      }

      const cacheKey = friendId + '-' + JSON.stringify(msgs);
      if (messages.dataset.cacheKey === cacheKey) {
        if (forceScroll) setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
        return;
      }
      messages.dataset.cacheKey = cacheKey;

      if (msgs.length === 0) {
        messages.innerHTML = `<div class="text-center py-5" style="opacity:0.5;"><p>No hay mensajes. ¡Di hola!</p></div>`;
      } else {
        const isScrolledBottom = messages.scrollHeight - messages.clientHeight <= messages.scrollTop + 50;
        window.chatMediaMap.clear();

        const groupedMsgs = [];
        for (const msg of msgs) {
          const isMediaOnly = msg.media_url && !msg.content;
          const lastGroup   = groupedMsgs[groupedMsgs.length - 1];
          if (isMediaOnly && lastGroup && lastGroup.type === 'mediaGroup' && lastGroup.sender_id === msg.sender_id) {
            lastGroup.items.push(msg);
            lastGroup.status = msg.status;
          } else if (isMediaOnly) {
            groupedMsgs.push({ type: 'mediaGroup', sender_id: msg.sender_id, status: msg.status, items: [msg] });
          } else {
            groupedMsgs.push({ type: 'single', msg });
          }
        }

        messages.innerHTML = groupedMsgs.map(group => {
          if (group.type === 'single')      return renderMessage(group.msg);
          if (group.type === 'mediaGroup')  return group.items.length === 1 ? renderMessage(group.items[0]) : renderMediaGroup(group);
        }).join('');

        if (forceScroll || isScrolledBottom) {
          setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderMessage(msg) {
    const isMe = msg.sender_id === user.id;

    let mediaHtml = '';
    if (msg.media_url) {
      window.chatMediaMap.set('msg_' + msg.id, [msg]);
      if (msg.media_type === 'image') {
        mediaHtml = `<div class="msg-media mb-1" style="cursor:pointer;" onclick="openMediaViewer('msg_${msg.id}')"><img src="http://localhost:8000/uploads/${msg.media_url}" style="max-width:100%; border-radius:8px;"></div>`;
      } else if (msg.media_type === 'video') {
        mediaHtml = `<div class="msg-media mb-1" style="cursor:pointer;" onclick="openMediaViewer('msg_${msg.id}')"><video controls src="http://localhost:8000/uploads/${msg.media_url}" style="max-width:100%; border-radius:8px;"></video></div>`;
      }
    }

    let ticks = '';
    if (isMe && msg.status) {
      if (msg.status === 'sent')      ticks = '<i class="fas fa-check" style="font-size:0.7em; opacity:0.7;"></i>';
      else if (msg.status === 'delivered') ticks = '<i class="fas fa-check-double" style="font-size:0.7em; opacity:0.7;"></i>';
      else if (msg.status === 'read') ticks = '<i class="fas fa-check-double" style="color:#53bdeb; font-size:0.7em;"></i>';
    }

    const contentHtml = msg.content ? `<div>${msg.content}</div>` : '';

    return `
      <div class="msg-row ${isMe ? 'msg-row--me' : 'msg-row--them'}">
        <div class="msg ${isMe ? 'msg--me' : 'msg--them'}">
          <div class="msg-bubble">
            ${mediaHtml}
            ${contentHtml}
            ${isMe ? `<div class="text-end mt-1">${ticks}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderMediaGroup(group) {
    const isMe         = group.sender_id === user.id;
    const items        = group.items;
    const displayCount = Math.min(items.length, 4);
    const extraCount   = items.length - 4;
    const groupId      = 'group_' + items[0].id;

    window.chatMediaMap.set(groupId, items);

    let mosaicHtml = `<div class="msg-mosaic msg-mosaic--${displayCount}" style="cursor:pointer;" onclick="openMediaViewer('${groupId}')">`;
    for (let i = 0; i < displayCount; i++) {
      const item = items[i];
      let mediaTag = '';
      if (item.media_type === 'image') {
        mediaTag = `<img src="http://localhost:8000/uploads/${item.media_url}">`;
      } else if (item.media_type === 'video') {
        mediaTag = `<video src="http://localhost:8000/uploads/${item.media_url}"></video><div class="msg-mosaic__video-icon"><i class="fas fa-play"></i></div>`;
      }
      const overlay = (i === 3 && extraCount > 0) ? `<div class="msg-mosaic__overlay">+${extraCount}</div>` : '';
      mosaicHtml += `<div class="msg-mosaic__item">${mediaTag}${overlay}</div>`;
    }
    mosaicHtml += `</div>`;

    let ticks = '';
    if (isMe && group.status) {
      if (group.status === 'sent')      ticks = '<i class="fas fa-check" style="font-size:0.7em; opacity:0.7;"></i>';
      else if (group.status === 'delivered') ticks = '<i class="fas fa-check-double" style="font-size:0.7em; opacity:0.7;"></i>';
      else if (group.status === 'read') ticks = '<i class="fas fa-check-double" style="color:#53bdeb; font-size:0.7em;"></i>';
    }

    return `
      <div class="msg-row ${isMe ? 'msg-row--me' : 'msg-row--them'}">
        <div class="msg ${isMe ? 'msg--me' : 'msg--them'}">
          <div class="msg-bubble p-1" style="background:transparent; border:none; box-shadow:none;">
            ${mosaicHtml}
            ${isMe ? `<div class="text-end mt-1 px-1">${ticks}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async function sendToBackend(text, files = []) {
    if (!currentChatUser) { alert('Selecciona un chat primero.'); return; }
    if (!text && files.length === 0) return;

    isUploading = true;
    try {
      if (text) {
        messages.insertAdjacentHTML('beforeend', `
          <div class="msg-row msg-row--me" id="temp-msg-txt">
            <div class="msg msg--me"><div class="msg-bubble text-muted"><i class="fas fa-clock fa-spin"></i> Enviando...</div></div>
          </div>
        `);
        messages.scrollTop = messages.scrollHeight;
        try {
          await Chats.sendMessage(currentChatUser.friend_id, text, null);
          input.value = '';
        } catch (e) {
          console.error(e);
          alert('Error al enviar el mensaje.');
        }
        document.getElementById('temp-msg-txt')?.remove();
      }

      if (files.length > 0) {
        const tempIds = [];
        for (let i = 0; i < files.length; i++) {
          const tempId = 'temp-file-' + Date.now() + '-' + i;
          tempIds.push(tempId);
          messages.insertAdjacentHTML('beforeend', `
            <div class="msg-row msg-row--me" id="${tempId}">
              <div class="msg msg--me"><div class="msg-bubble text-muted"><i class="fas fa-clock fa-spin"></i> Subiendo archivo ${i + 1} de ${files.length}...</div></div>
            </div>
          `);
        }
        messages.scrollTop = messages.scrollHeight;
        for (let i = 0; i < files.length; i++) {
          try { await Chats.sendMessage(currentChatUser.friend_id, '', files[i]); } catch (e) { console.error(e); }
          document.getElementById(tempIds[i])?.remove();
        }
      }
    } finally {
      isUploading = false;
      await loadMessages(currentChatUser.friend_id, true);
      loadSidebar();
    }
  }

  btnSend.addEventListener('click', () => sendToBackend(input.value.trim(), []));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendToBackend(input.value.trim(), []);
    }
  });

  attachInput.addEventListener('change', async () => {
    const files = Array.from(attachInput.files);
    if (!files.length) return;
    await sendToBackend('', files);
    attachInput.value = '';
  });

  // ── Visor multimedia ──────────────────────────────────────
  window.openMediaViewer = function (mediaId) {
    const items = window.chatMediaMap.get(mediaId);
    if (!items) return;
    const viewer  = document.getElementById('media-viewer');
    const content = document.getElementById('media-viewer-content');
    content.innerHTML = items.map(item => {
      if (item.media_type === 'image') return `<img src="http://localhost:8000/uploads/${item.media_url}" class="media-viewer__item">`;
      if (item.media_type === 'video') return `<video controls src="http://localhost:8000/uploads/${item.media_url}" class="media-viewer__item"></video>`;
      return '';
    }).join('');
    viewer.style.display = 'flex';
  };

  document.getElementById('media-viewer-close').addEventListener('click', () => {
    document.getElementById('media-viewer').style.display = 'none';
    document.getElementById('media-viewer-content').innerHTML = '';
  });

  document.getElementById('chat-search-input').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    renderChatList(myChats.filter(c => c.friend_name.toLowerCase().includes(term)));
  });

  await loadSidebar();
  if (activeChatId) openChat(parseInt(activeChatId));

});
