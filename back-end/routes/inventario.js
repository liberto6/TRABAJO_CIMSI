    const express = require('express');
    const router = express.Router();
    const db = require('../db/connection');
    const { isAuthenticated } = require('../middlewares/auth');

    // Ruta para obtener la lista de proveedores
    router.get('/proveedores', isAuthenticated, async (req, res) => {
        const { id_restaurante } = req.session.user;

        try {
            const [proveedores] = await db.query(
                `SELECT id_proveedor, nombre, correo FROM proveedores WHERE id_restaurante = ?`,
                [id_restaurante]
            );

            if (proveedores.length === 0) {
                return res.status(404).json({ message: 'No se encontraron proveedores para este restaurante.' });
            }

            res.json(proveedores);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            res.status(500).json({ message: 'Error al cargar los proveedores.' });
        }
    });
    // Ruta para obtener ingredientes existentes
    router.get('/ingredientes', isAuthenticated, async (req, res) => {
        const { id_restaurante } = req.session.user;

        try {
            const [ingredientes] = await db.query(
                `SELECT id_ingrediente, nombre FROM ingredientes WHERE id_restaurante = ?`,
                [id_restaurante]
            );
            res.json(ingredientes);
        } catch (error) {
            console.error('Error al cargar ingredientes:', error);
            res.status(500).json({ message: 'Error al cargar los ingredientes.' });
        }
    });

    // Ruta para añadir un nuevo proveedor
    router.post("/proveedores", isAuthenticated, async (req, res) => {
        const { nombre, correo, id_ingrediente } = req.body;
        const { id_restaurante } = req.session.user;
    
        // Validación de datos
        if (!nombre || !correo || !id_ingrediente) {
            return res.status(400).json({ message: "Todos los campos son obligatorios." });
        }
    
        try {
            await db.query(
                `INSERT INTO proveedores (nombre, correo, id_ingrediente, id_restaurante) VALUES (?, ?, ?, ?)`,
                [nombre, correo, id_ingrediente, id_restaurante]
            );
            res.status(201).json({ message: "Proveedor añadido correctamente." });
        } catch (error) {
            console.error("Error al añadir proveedor:", error);
            res.status(500).json({ message: "Error al añadir el proveedor." });
        }
    });
    

    // Ruta para eliminar un proveedor
    router.delete('/proveedores/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params;

        try {
            await db.query(`DELETE FROM proveedores WHERE id_proveedor = ?`, [id]);
            res.status(200).json({ message: 'Proveedor eliminado correctamente.' });
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            res.status(500).json({ message: 'Error al eliminar el proveedor.' });
        }
    });

    // Ruta para obtener ingredientes con información de stock
    router.get('/ingredientes-info', isAuthenticated, async (req, res) => {
        const { id_restaurante } = req.session.user;

        try {
            const [ingredientes] = await db.query(
                `SELECT id_ingrediente, nombre, stock, stock_minimo FROM ingredientes WHERE id_restaurante = ?`,
                [id_restaurante]
            );
            res.json(ingredientes);
        } catch (error) {
            console.error('Error al cargar ingredientes:', error);
            res.status(500).json({ message: 'Error al cargar los ingredientes.' });
        }
    });

    // Ruta para comprar más stock de un ingrediente
    router.post('/ingredientes/comprar', isAuthenticated, async (req, res) => {
        const { id_ingrediente, cantidad } = req.body;

        if (!id_ingrediente || !cantidad) {
            return res.status(400).json({ message: 'Datos incompletos para la compra.' });
        }

        try {
            await db.query(
                `UPDATE ingredientes SET stock = stock + ? WHERE id_ingrediente = ?`,
                [cantidad, id_ingrediente]
            );
            res.status(200).json({ message: 'Stock actualizado correctamente.' });
        } catch (error) {
            console.error('Error al comprar más stock:', error);
            res.status(500).json({ message: 'Error al actualizar el stock.' });
        }
    });

    // Ruta para eliminar un ingrediente
    router.delete('/ingredientes/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params;

        try {
            await db.query(`DELETE FROM ingredientes WHERE id_ingrediente = ?`, [id]);
            res.status(200).json({ message: 'Ingrediente eliminado correctamente.' });
        } catch (error) {
            console.error('Error al eliminar ingrediente:', error);
            res.status(500).json({ message: 'Error al eliminar el ingrediente.' });
        }
    });

    router.post('/inventario/enviar-correo', async (req, res) => {
        const { cantidad, correo, asunto, mensaje } = req.body;
    
        // Validar que todos los campos están presentes
        if (!cantidad || !correo || !asunto || !mensaje) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }
    
        try {
            // Configurar el transporte de nodemailer
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Cambia según tu proveedor de correo
                auth: {
                    user: 'tu_correo@gmail.com', // Tu correo
                    pass: 'tu_contraseña'        // Tu contraseña
                }
            });
    
            // Configurar los detalles del correo
            const mailOptions = {
                from: 'tu_correo@gmail.com',
                to: correo,
                subject: asunto,
                text: mensaje
            };
    
            // Enviar el correo
            await transporter.sendMail(mailOptions);
    
            res.status(200).json({ message: 'Correo enviado correctamente.' });
        } catch (error) {
            console.error('Error al enviar el correo:', error);
            res.status(500).json({ message: 'Error al enviar el correo.' });
        }
    });
    

    router.get('/ingredientes-proveedores/:id', isAuthenticated, async (req, res) => {
        const { id_restaurante } = req.session.user;
    
        try {
            const [rows] = await db.query(
                `SELECT p.nombre AS proveedor_nombre, p.correo
                 FROM proveedores p
                 WHERE p.id_restaurante = ?`,
                [id_restaurante]
            );
    
            console.log('Proveedores encontrados:', rows);
    
            if (rows.length === 0) {
                return res.status(404).json({ message: 'No se encontraron proveedores para este restaurante.' });
            }
    
            res.json(rows);
        } catch (error) {
            console.error('Error al obtener los proveedores:', error);
            res.status(500).json({ message: 'Error al cargar los proveedores.' });
        }
    });
    
    

    router.get('/ingrediente-proveedor/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params; // id del ingrediente
        const { id_restaurante } = req.session.user; // Usuario autenticado
    
        try {
            const [rows] = await db.query(
                `SELECT p.correo
                 FROM proveedores p
                 WHERE p.id_ingrediente = ? AND p.id_restaurante = ?`,
                [id, id_restaurante]
            );
    
            if (rows.length === 0) {
                return res.status(404).json({ message: 'No se encontró un proveedor para este ingrediente.' });
            }
    
            res.json({ correo: rows[0].correo }); // Devolver solo el correo
        } catch (error) {
            console.error('Error al obtener el proveedor:', error);
            res.status(500).json({ message: 'Error al cargar los datos del proveedor.' });
        }
    });
    
    
    
   
// Ruta para registrar una compra sin validación
router.post('/compras', async (req, res) => {
    try {
        // Simular el registro de una compra (sin validaciones ni lógica adicional)
        res.status(200).json({ message: 'Email de compra efectuada.' });
    } catch (error) {
        console.error('Error simulado:', error);
        res.status(200).json({ message: 'Email de compra efectuada.' }); // Siempre enviar mensaje exitoso
    }
});


    module.exports = router;
