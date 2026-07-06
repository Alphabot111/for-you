// routes/admin.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// Slow down brute-force password guessing on the login form.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.',
});

router.get('/login', adminController.showLogin);
router.post('/login', loginLimiter, adminController.handleLogin);
router.post('/logout', adminController.handleLogout);

router.get('/dashboard', requireAdmin, adminController.showDashboard);
router.post('/submissions/:sessionId/delete', requireAdmin, adminController.deleteSubmission);
router.post('/chat/clear', requireAdmin, adminController.clearChat);

// Convenience redirect: /admin -> /admin/dashboard or /admin/login
router.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/admin/login');
});

module.exports = router;
