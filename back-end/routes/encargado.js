const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../front-end/private/encargado.html'));
});
// Ruta para la página de gestionar usuarios
router.get('/gestion_empleado.html', isAuthenticated, (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../../front-end/private/gestion_empleado.html'));
    } catch (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(500).send('Error interno del servidor.');
    }
});


module.exports = router;
