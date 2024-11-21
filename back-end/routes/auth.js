const express = require('express');
const router = express.Router();
const db = require('../db/connection'); // Importa la conexión a la base de datos

router.post('/login', async (req, res) => {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    try {
        const query = 'SELECT * FROM usuarios WHERE email = ? AND contraseña = ?';
        const [results] = await db.query(query, [email, contraseña]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = results[0];
        req.session.user = { 
            id: user.id_usuario, 
            nombre: user.nombre, // Agregamos `nombre` a la sesión
            email: user.email, 
            role: user.rol 
        };
        console.log(req.session.user); // Para verificar qué datos se almacenan en la sesión
        res.json({ message: 'Login exitoso', role: user.rol });
    } catch (err) {
        console.error('Error en la consulta:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

router.post('/register', async (req, res) => {
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si el email ya está registrado
        const emailCheckQuery = 'SELECT email FROM usuarios WHERE email = ?';
        const [emailResult] = await db.query(emailCheckQuery, [email]);

        if (emailResult.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Insertar el nuevo usuario
        const insertQuery = 'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, ?)';
        const values = [nombre, email, contraseña, 'empleado']; // Rol por defecto: empleado

        await db.query(insertQuery, values);

        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    } catch (err) {
        console.error('Error al registrar el usuario:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});
router.post('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.status(500).json({ message: 'Error al cerrar sesión.' });
            }
            res.clearCookie('connect.sid'); // Elimina la cookie de sesión
            res.json({ message: 'Sesión cerrada correctamente.' });
        });
    } else {
        res.status(400).json({ message: 'No hay sesión activa.' });
    }
});

module.exports = router;
