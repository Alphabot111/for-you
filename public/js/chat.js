// public/js/chat.js
// Handles the real-time private chat: connecting, sending, receiving,
// typing indicators, read receipts, and online status.

(function () {
  let socket = null;
  let myRole = null; // 'her' or 'me'
  let typingTimeout = null;

  const messagesEl = () => document.getElementById('chat-messages');
  const typingEl = () => document.getElementById('chat-typing-indicator');
  const statusEl = () => document.getElementById('chat-online-status');
  const nameEl = () => document.getElementById('chat-partner-name');

  const EMOJIS = ['❤️', '😊', '😂', '🥰', '😘', '🌹', '🔥', '🙈', '✨', '😢', '👀', '🤔'];

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMessage(msg) {
    const wrap = document.createElement('div');
    wrap.className = `chat-bubble ${msg.sender === myRole ? 'me' : 'her'}`;
    wrap.dataset.id = msg.id;

    const textNode = document.createElement('span');
    textNode.textContent = msg.text; // textContent keeps this safe from HTML injection
    wrap.appendChild(textNode);

    const meta = document.createElement('span');
    meta.className = 'chat-meta';
    const readLabel = msg.sender === myRole && msg.read ? ' · Read' : '';
    meta.textContent = `${formatTime(msg.timestamp)}${readLabel}`;
    wrap.appendChild(meta);

    messagesEl().appendChild(wrap);
    scrollToBottom();
  }

  function scrollToBottom() {
    const el = messagesEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  function updateOnlineStatus(status) {
    const partnerOnline = myRole === 'her' ? status.me : status.her;
    const el = statusEl();
    if (!el) return;
    el.textContent = partnerOnline ? 'online' : 'offline';
    el.classList.toggle('online', !!partnerOnline);
  }

  function buildEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (!picker || picker.childElementCount) return;
    EMOJIS.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        input.value += emoji;
        input.focus();
      });
      picker.appendChild(btn);
    });
  }

  function initChat(role) {
    myRole = role;
    nameEl().textContent = role === 'her' ? 'Chatting as You 💗' : 'Chatting as Me 💌';
    buildEmojiPicker();

    socket = io();

    socket.on('connect', () => {
      socket.emit('join', { role: myRole });
    });

    socket.on('chat-history', (history) => {
      messagesEl().innerHTML = '';
      history.forEach(renderMessage);
    });

    socket.on('message', (msg) => {
      renderMessage(msg);
    });

    socket.on('typing', ({ role, isTyping }) => {
      if (role === myRole) return;
      typingEl().classList.toggle('hidden', !isTyping);
    });

    socket.on('online-status', updateOnlineStatus);

    socket.on('read-receipt', () => {
      // Refresh read markers on my own sent bubbles.
      document.querySelectorAll(`.chat-bubble.me .chat-meta`).forEach((meta) => {
        if (!meta.textContent.includes('Read')) {
          meta.textContent = `${meta.textContent} · Read`;
        }
      });
    });

    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      socket.emit('message', { role: myRole, text });
      input.value = '';
      socket.emit('typing', { role: myRole, isTyping: false });
    });

    input.addEventListener('input', () => {
      socket.emit('typing', { role: myRole, isTyping: true });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { role: myRole, isTyping: false });
      }, 1200);
    });

    document.getElementById('emoji-toggle').addEventListener('click', () => {
      document.getElementById('emoji-picker').classList.toggle('hidden');
    });
  }

  window.ChatModule = { initChat };
})();
