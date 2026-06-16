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
        req.session.flash = res.locals.flash = { type: "error", message: "Access denied" };
        return res.status(403).render('error');
    }
    next();
}

module.exports = { requireLogin, requireAdmin };