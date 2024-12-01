function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {

        const { role, id_restaurante } = req.session.user;
        const requestedPath = req.originalUrl;

        if (!id_restaurante) {
            return res.status(403).send('Acceso prohibido: Usuario no está asociado a un restaurante.');
        }

        if ((requestedPath.startsWith('/empleado') && role === 'empleado') ||
            (requestedPath.startsWith('/encargado') && role === 'encargado')) {
            return next();
        }

        return res.status(403).send('Acceso prohibido: No tienes permiso para acceder a esta página.');
    }

    res.status(401).send('No autorizado. Por favor, inicia sesión.');
}
module.exports = { isAuthenticated };