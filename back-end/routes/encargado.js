const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();
const db = require('../db/connection');


router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../front-end/private/encargado.html'));
});
// Ruta para la página de gestionar usuarios
router.get('/gestion_empleado.html', isAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, '../../front-end/private/gestion_empleado.html'));
});
router.get('/empleados', isAuthenticated, async (req, res) => {
    try {
        const [empleados] = await db.query(
            'SELECT id_usuario, nombre, email, rol FROM usuarios WHERE rol = "empleado"'
        );
        res.json(empleados);
    } catch (err) {
        console.error('Error al obtener los empleados:', err);
        res.status(500).json({ message: 'Error al obtener los empleados' });
    }
});

router.post('/empleados', isAuthenticated, async (req, res) => {
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const [existingEmail] = await db.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        await db.query(
            'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, "empleado")',
            [nombre, email, contraseña]
        );
        res.json({ message: 'Empleado añadido con éxito' });
    } catch (err) {
        console.error('Error al añadir el empleado:', err);
        res.status(500).json({ message: 'Error al añadir el empleado' });
    }
});

router.delete('/empleados/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        res.json({ message: 'Empleado eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar el empleado:', err);
        res.status(500).json({ message: 'Error al eliminar el empleado' });
    }
});

module.exports = router;
