// controllers/adminController.js
const db = require('../data/db');

function showLogin(req, res) {
  const error = req.session.loginError;
  req.session.loginError = null;
  res.render('admin-login', { error });
}

function handleLogin(req, res) {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD || 'changeme123';

  if (password && password === correct) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }

  req.session.loginError = 'Incorrect password. Try again.';
  return res.redirect('/admin/login');
}

function handleLogout(req, res) {
  req.session.isAdmin = false;
  res.redirect('/admin/login');
}

function showDashboard(req, res) {
  const submissions = db.getAllSubmissions();
  const chatHistory = db.getAllMessages();

  const rows = Object.entries(submissions).map(([sessionId, sub]) => ({
    sessionId,
    ...sub,
  }));

  // Most recently updated first
  rows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  res.render('admin-dashboard', {
    submissions: rows,
    chatHistory,
  });
}

async function deleteSubmission(req, res) {
  const { sessionId } = req.params;
  await db.deleteSubmission(sessionId);
  res.redirect('/admin/dashboard');
}

async function clearChat(req, res) {
  await db.clearChat();
  res.redirect('/admin/dashboard');
}

module.exports = {
  showLogin,
  handleLogin,
  handleLogout,
  showDashboard,
  deleteSubmission,
  clearChat,
};
