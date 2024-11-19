const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware para manejar JSON
app.use(express.json());

// Configurar middleware de sesión
app.use(session({
    secret: 'clave_secreta', // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,
}));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../front-end/public')));

// Importar rutas
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Ruta principal para la página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/public/login.html'));
});


const encargadoRoutes = require('./routes/encargado'); // Importar la ruta de encargado
// Rutas
app.use('/encargado', encargadoRoutes); // Registrar la ruta de encargado


const empleadoRoutes = require('./routes/empleado'); // Importar la ruta de empleado
// Rutas
app.use('/empleado', empleadoRoutes); // Registrar la ruta de empleado


// Escucha en el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
