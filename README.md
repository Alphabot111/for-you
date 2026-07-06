# For You ❤️

A romantic, interactive full-stack web experience — built with Node.js,
Express, Socket.IO, and vanilla JS/CSS/HTML.

## Quick start

```bash
npm install
cp .env.example .env     # then edit .env with your own values
npm start
```

Open **http://localhost:3000** in your browser. The admin dashboard lives
at **http://localhost:3000/admin**.

## Before you send it to her

1. **Set a real admin password.** Edit `.env` and change `ADMIN_PASSWORD`
   and `SESSION_SECRET` to something only you know.
2. **(Optional) Add background music.** Drop an MP3 file at
   `public/sounds/background-music.mp3`. The mute/unmute button in the
   top-right corner will control it. If no file is present, the button
   simply shows a friendly reminder instead of throwing an error.
3. **Deploy it somewhere she can reach**, e.g. Render, Railway, Fly.io, or
   your own server, and share the link. If you self-host, put it behind
   HTTPS so the session cookies stay secure.
4. **Open the chat as yourself** by visiting `https://your-domain/?as=me`
   — this jumps straight to the private chat as "me" instead of going
   through the whole flow, so you two can talk once she reaches Page 6.

## How it works

- **Page 1–3**: A welcome screen, then two multi-step question flows
  (about her, then about you two) with a progress bar. Every answer is
  escaped and saved to `data/submissions.json`, keyed by her browser
  session.
- **Page 4**: A dark "twist" screen with a typewriter effect building up
  to the reveal.
- **Page 5**: A confession built from her own answers (favorite color,
  dream vacation, favorite memory, etc.), with Yes / Let's Talk / I Need
  Time buttons.
- **Page 6**: A real-time private chat over Socket.IO with typing
  indicators, read receipts, online status, and persisted history.
- **Admin dashboard** (`/admin`): password-protected page showing every
  submission with timestamps, the full chat log, and delete buttons.

## Data storage

This project stores data in plain JSON files under `data/` — no database
server required. That's intentional: it's a personal, single-recipient
project, so a lightweight file store keeps setup to a single `npm
install`. If you want to scale this up or store data more robustly, swap
`data/db.js` for a real database (e.g. SQLite via `better-sqlite3`) —
every other file talks to `data/db.js` through the same small function
API, so the rest of the app won't need to change.

## Project structure

```
for-you/
├── package.json
├── server.js              # Express + Socket.IO entry point
├── .env.example
├── data/
│   ├── db.js               # JSON file storage helper
│   ├── submissions.json    # her answers (auto-created)
│   └── chat.json           # chat history (auto-created)
├── middleware/
│   ├── auth.js             # admin session guard
│   └── validate.js         # input sanitization / escaping
├── controllers/
│   ├── answersController.js
│   └── adminController.js
├── routes/
│   ├── api.js
│   └── admin.js
├── views/
│   ├── admin-login.ejs
│   └── admin-dashboard.ejs
└── public/
    ├── index.html           # the whole front-end SPA
    ├── favicon.svg
    ├── css/
    │   ├── style.css        # main romantic glassmorphism theme
    │   └── admin.css
    ├── js/
    │   ├── main.js           # page flow, questions, confession, UX
    │   ├── chat.js           # Socket.IO chat client
    │   ├── hearts.js         # floating hearts background
    │   └── confetti.js       # canvas confetti burst
    └── sounds/
        └── (add background-music.mp3 here — optional)
```

## Security notes

- All free-text answers and chat messages are HTML-escaped before
  storage and rendered with `textContent` (not `innerHTML`) on the chat
  page, so nothing typed in can inject markup.
- The admin login is rate-limited to slow down password guessing.
- Sessions are HTTP-only cookies; make sure to serve over HTTPS in
  production and set a strong, private `SESSION_SECRET`.
- This is meant for a single, trusted use case (one person filling it
  out for one recipient) — it isn't hardened for public multi-tenant use.
