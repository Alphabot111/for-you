// data/db.js
// -----------------------------------------------------------------------
// Tiny JSON-file "database" helper.
// Two files are used:
//   submissions.json  -> { [sessionId]: { aboutHer, aboutMe, decision, createdAt, updatedAt } }
//   chat.json         -> [ { id, sender, text, timestamp, read } ]
//
// A very small in-process write queue is used so concurrent writes never
// clobber each other (fine for a personal-scale app like this one).
// -----------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const SUBMISSIONS_PATH = path.join(__dirname, 'submissions.json');
const CHAT_PATH = path.join(__dirname, 'chat.json');

// Make sure the files exist before we ever try to read them.
function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
}
ensureFile(SUBMISSIONS_PATH, {});
ensureFile(CHAT_PATH, []);

// A tiny promise chain per-file so writes never interleave.
const writeQueues = {};
function queueWrite(filePath, fn) {
  const prev = writeQueues[filePath] || Promise.resolve();
  const next = prev.then(fn).catch((err) => {
    console.error(`[db] write error for ${filePath}:`, err);
  });
  writeQueues[filePath] = next;
  return next;
}

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || 'null');
  } catch (err) {
    console.error(`[db] read error for ${filePath}:`, err);
    return null;
  }
}

function writeJSON(filePath, data) {
  return queueWrite(filePath, () => {
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, filePath);
  });
}

// ---------------------------- Submissions ------------------------------

function getAllSubmissions() {
  return readJSON(SUBMISSIONS_PATH) || {};
}

function getSubmission(sessionId) {
  const all = getAllSubmissions();
  return all[sessionId] || null;
}

function saveSubmission(sessionId, partial) {
  const all = getAllSubmissions();
  const now = new Date().toISOString();
  const existing = all[sessionId] || { createdAt: now };
  all[sessionId] = {
    ...existing,
    ...partial,
    updatedAt: now,
  };
  return writeJSON(SUBMISSIONS_PATH, all).then(() => all[sessionId]);
}

function deleteSubmission(sessionId) {
  const all = getAllSubmissions();
  delete all[sessionId];
  return writeJSON(SUBMISSIONS_PATH, all);
}

// ------------------------------- Chat -----------------------------------

function getAllMessages() {
  return readJSON(CHAT_PATH) || [];
}

function addMessage(message) {
  const all = getAllMessages();
  all.push(message);
  return writeJSON(CHAT_PATH, all).then(() => message);
}

function markAllRead(readerRole) {
  const all = getAllMessages();
  let changed = false;
  all.forEach((m) => {
    if (m.sender !== readerRole && !m.read) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) {
    return writeJSON(CHAT_PATH, all).then(() => all);
  }
  return Promise.resolve(all);
}

function clearChat() {
  return writeJSON(CHAT_PATH, []);
}

module.exports = {
  getAllSubmissions,
  getSubmission,
  saveSubmission,
  deleteSubmission,
  getAllMessages,
  addMessage,
  markAllRead,
  clearChat,
};
