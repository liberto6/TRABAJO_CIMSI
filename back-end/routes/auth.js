const express = require('express');
const router = express.Router();
const db = require('../db/connection'); // Importa la conexión a la base de datos

router.post('/login', (req, res) => {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ? AND contraseña = ?';
    db.query(query, [email, contraseña], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = results[0];
        req.session.user = { id: user.id_usuario, email: user.email, role: user.rol };
        res.json({ message: 'Login exitoso', role: user.rol });
    });
});

router.post('/register', async (req, res) => {
    const { nombre, email, contraseña } = req.body;

    // Validar que los campos no estén vacíos
    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si el email ya está registrado
        const emailCheckQuery = 'SELECT email FROM usuarios WHERE email = ?';
        const [emailResult] = await db.promise().query(emailCheckQuery, [email]);

        if (emailResult.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Insertar el nuevo usuario
        const insertQuery = 'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, ?)';
        const values = [nombre, email, contraseña, 'encargado']; // Rol por defecto: empleado

        await db.promise().query(insertQuery, values);

        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    } catch (err) {
        console.error('Error al registrar el usuario:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});


module.exports = router;
