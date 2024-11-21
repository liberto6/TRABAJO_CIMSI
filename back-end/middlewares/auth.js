function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        const userRole = req.session.user.role; // Rol del usuario
        const requestedPath = req.originalUrl; // Ruta solicitada

        // Verificar si el rol del usuario coincide con la ruta
        if ((requestedPath.startsWith('/empleado') && userRole === 'empleado') ||
            (requestedPath.startsWith('/encargado') && userRole === 'encargado')) {
            return next();
        }

        // Si el rol no coincide, devolver un error 403 (Prohibido)
        return res.status(403).send('Acceso prohibido: No tienes permiso para acceder a esta página.');
    }

    // Si no hay sesión activa, devolver error 401 (No autorizado)
    res.status(401).send('No autorizado. Por favor, inicia sesión.');
}

module.exports = { isAuthenticated };
