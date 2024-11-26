const express = require('express');
const router = express.Router();
const db = require('../db/connection'); // Importa la conexión a la base de datos

router.post('/login', async (req, res) => {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    try {
        const query = `
            SELECT u.id_usuario, u.nombre, u.email, u.rol, u.id_restaurante, r.nombre AS nombre_restaurante
            FROM usuarios u
            INNER JOIN restaurantes r ON u.id_restaurante = r.id_restaurante
            WHERE u.email = ? AND u.contraseña = ?
        `;
        const [results] = await db.query(query, [email, contraseña]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = results[0];
        req.session.user = { 
            id_usuario: user.id_usuario,
            nombre: user.nombre,
            email: user.email,
            role: user.rol,
            id_restaurante: user.id_restaurante,
            nombre_restaurante: user.nombre_restaurante,
        };

        res.json({ message: 'Login exitoso', role: user.rol });
    } catch (err) {
        console.error('Error en la consulta:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


router.post('/register', async (req, res) => {
    const { nombre, email, contraseña, restaurante, emailRestaurante, telefonoRestaurante, direccionRestaurante } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !email || !contraseña || !restaurante || !emailRestaurante || !telefonoRestaurante || !direccionRestaurante) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si el restaurante ya existe
        const [restauranteExistente] = await db.query(
            'SELECT id_restaurante FROM restaurantes WHERE nombre = ?',
            [restaurante]
        );

        let idRestaurante;
        if (restauranteExistente.length > 0) {
            // Si el restaurante existe, usar su ID
            idRestaurante = restauranteExistente[0].id_restaurante;

            // Actualizar información del restaurante existente
            await db.query(
                'UPDATE restaurantes SET email = ?, telefono = ?, direccion = ? WHERE id_restaurante = ?',
                [emailRestaurante, telefonoRestaurante, direccionRestaurante, idRestaurante]
            );
        } else {
            // Si no existe, crear el restaurante con la información proporcionada
            const [nuevoRestaurante] = await db.query(
                'INSERT INTO restaurantes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
                [restaurante, emailRestaurante, telefonoRestaurante, direccionRestaurante]
            );
            idRestaurante = nuevoRestaurante.insertId;
        }

        // Verificar si el email del usuario ya está registrado
        const [usuarioExistente] = await db.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (usuarioExistente.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Crear el usuario como encargado del restaurante
        await db.query(
            'INSERT INTO usuarios (nombre, email, contraseña, rol, id_restaurante) VALUES (?, ?, ?, "encargado", ?)',
            [nombre, email, contraseña, idRestaurante]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar el usuario.' });
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
