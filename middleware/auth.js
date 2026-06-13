// Redirect to login if user is not logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Redirect to login if user is not an admin
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', { message: 'Access denied' })
    }
    next();
}

module.exports = { requireLogin, requireAdmin };