const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();
const db = require('../db/connection'); // Importa correctamente la conexión a la base de datos


router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../front-end/private/empleado.html'));
});

router.get('/nombre', isAuthenticated, (req, res) => {
    const user = req.session.user;

    if (user) {
        res.json({ nombre: user.nombre });
    } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

router.get('/productos', isAuthenticated, async (req, res) => {
    try {
        const [productos] = await db.query('SELECT id, nombre, precio FROM productos');
        if (!productos || productos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron productos' });
        }
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
});


// Ruta para procesar un pedido
router.post('/procesar-pedido', async (req, res) => {
    const { productos } = req.body; // Array con productos y cantidades [{ id, cantidad }]

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron productos para procesar.' });
    }

    const connection = await db.getConnection(); // Obtener conexión para transacción

    try {
        await connection.beginTransaction(); // Inicia transacción

        let totalPedido = 0;

        // Calcular el total del pedido y verificar stock
        for (const producto of productos) {
            const [recetas] = await connection.query(
                `SELECT r.ingrediente_id, r.cantidad, i.stock 
                 FROM recetas r
                 INNER JOIN ingredientes i ON r.ingrediente_id = i.id
                 WHERE r.producto_id = ?`,
                [producto.id]
            );

            for (const receta of recetas) {
                const nuevoStock = receta.stock - receta.cantidad * producto.cantidad;

                if (nuevoStock < 0) {
                    throw new Error(`Stock insuficiente para el ingrediente ID ${receta.ingrediente_id}`);
                }

                await connection.query(
                    `UPDATE ingredientes SET stock = ? WHERE id = ?`,
                    [nuevoStock, receta.ingrediente_id]
                );
            }

            const [productoInfo] = await connection.query(
                `SELECT precio FROM productos WHERE id = ?`,
                [producto.id]
            );

            totalPedido += productoInfo[0].precio * producto.cantidad;
        }

        // Crear el pedido en la tabla `pedidos` y obtener el ID generado
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (fecha, total) VALUES (NOW(), ?)`,
            [totalPedido]
        );

        const pedidoId = pedidoResult.insertId;

        // Insertar los detalles del pedido
        for (const producto of productos) {
            const [productoInfo] = await connection.query(
                `SELECT precio FROM productos WHERE id = ?`,
                [producto.id]
            );

            await connection.query(
                `INSERT INTO detalles_pedidos (pedido_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)`,
                [pedidoId, producto.id, producto.cantidad, productoInfo[0].precio * producto.cantidad]
            );
        }

        await connection.commit(); // Confirmar la transacción

        res.status(200).json({ message: 'Pedido procesado correctamente.', pedidoId });
    } catch (error) {
        console.error('Error al procesar el pedido:', error);
        await connection.rollback(); // Revertir transacción en caso de error
        res.status(500).json({ message: 'Error al procesar el pedido.' });
    } finally {
        connection.release(); // Liberar la conexión
    }
});


module.exports = router;
