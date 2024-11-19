const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',          // Cambia según tu configuración
    user: 'Inventario',
    password: 'inventario',
    database: 'baseinventario',
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1); // Detiene la aplicación si la conexión falla
    }
    console.log('Conexión a la base de datos establecida');
});

module.exports = db;
