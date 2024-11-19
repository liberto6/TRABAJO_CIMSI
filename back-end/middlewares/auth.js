function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).send('No autorizado. Por favor, inicia sesión.');
}

module.exports = { isAuthenticated };
