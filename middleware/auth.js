// middleware/auth.js
// Simple session-based auth guard for the /admin routes.

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAdmin };
