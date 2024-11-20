const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'Inventario',
    password: 'inventario',
    database: 'baseinventario',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
console.log("Se ha conectado a la base de datos")

module.exports = db;
