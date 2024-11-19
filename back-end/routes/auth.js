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

module.exports = router;
