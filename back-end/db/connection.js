const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'db',
    user: 'Inventario', // Usuario de la base de datos
    password: 'inventario', // Contraseña de la base de datos
    database: 'inventario', // Nombre de la base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

console.log('Se ha conectado a la base de datos correctamente.');

module.exports = db;
