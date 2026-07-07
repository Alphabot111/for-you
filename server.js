// server.js
// -----------------------------------------------------------------------
// "For You ❤️" — main server entry point.
// Sets up Express, sessions, static files, the EJS admin views,
// the JSON API routes, and the real-time Socket.IO chat.
// -----------------------------------------------------------------------

require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { Server: SocketIOServer } = require('socket.io');

const db = require('./data/db');
const { cleanText, MAX_MESSAGE_LENGTH } = require('./middleware/validate');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT || 3000;

// ---------------------------- Core middleware ---------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'please-change-this-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  },
});
app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

// Basic global rate limiting to prevent spam on the API.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ------------------------------- Routes ---------------------------------

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Serve the single-page front-end experience for every other route.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// ------------------------------ Socket.IO --------------------------------
// Share the Express session with Socket.IO so we know who is connecting.
io.engine.use(sessionMiddleware);

// Track which roles ("her" / "me") currently have an active connection.
const onlineRoles = { her: 0, me: 0 };

function broadcastOnlineStatus() {
  io.emit('online-status', {
    her: onlineRoles.her > 0,
    me: onlineRoles.me > 0,
  });
}

io.on('connection', (socket) => {
  let currentRole = null;

  socket.on('join', async ({ role }) => {
    if (role !== 'her' && role !== 'me') return;

    currentRole = role;
    socket.join(role);
    onlineRoles[role] += 1;
    broadcastOnlineStatus();

    // Send full chat history to the newly connected client.
    const history = db.getAllMessages();
    socket.emit('chat-history', history);

    // Mark the other person's messages as read, since this person just opened the chat.
    const updated = await db.markAllRead(role);
    io.emit('read-receipt', { reader: role });
  });

  socket.on('typing', ({ role, isTyping }) => {
    if (role !== 'her' && role !== 'me') return;
    socket.broadcast.emit('typing', { role, isTyping: !!isTyping });
  });

  socket.on('message', async ({ role, text }) => {
    if (role !== 'her' && role !== 'me') return;
    const clean = cleanText(text, MAX_MESSAGE_LENGTH);
    if (!clean) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: role,
      text: clean,
      timestamp: new Date().toISOString(),
      read: false,
    };

    await db.addMessage(message);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    if (currentRole && onlineRoles[currentRole] > 0) {
      onlineRoles[currentRole] -= 1;
    }
    broadcastOnlineStatus();
  });
});

// ------------------------------- Start up --------------------------------

server.listen(PORT, () => {
  console.log('');
  console.log('  💌  For You ❤️  is running!');
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  Admin:   http://localhost:${PORT}/admin`);
  console.log('');
});
