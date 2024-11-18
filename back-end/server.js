const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware para manejar JSON
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/login/login.html'));
});

//busca automaticamente el archivo, no hace falta declarar cada uno, si no lo encuentra devuelve un 404
app.use(express.static(path.join(__dirname, '../front-end')));

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Inventario',
    password: 'inventario',
    database: 'baseinventario',
});

db.connect(err => {
    if (err) throw err;
    console.log('Conexión a la base de datos establecida');
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    console.log('Datos recibidos en /login:', req.body);

    const { email, contraseña } = req.body;

    // Verifica si los datos llegan correctamente
    if (!email || !contraseña) {
        console.error('Email o contraseña faltante');
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ? AND contraseña = ?';
    db.query(query, [email, contraseña], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            console.log('Credenciales incorrectas:', email, contraseña);
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = results[0];
        console.log('Usuario autenticado:', user);
        res.json({ id: user.id_usuario, nombre: user.nombre, rol: user.rol });
    });
});


// Escucha en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
