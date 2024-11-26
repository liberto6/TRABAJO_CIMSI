const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();
const db = require('../db/connection');

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

// Obtener productos del restaurante del empleado
router.get('/productos', isAuthenticated, async (req, res) => {
    const idRestaurante = req.session.user.id_restaurante; // Obtener el restaurante del usuario

    try {
        const [productos] = await db.query(
            'SELECT id_producto AS id, nombre, precio FROM productos WHERE id_restaurante = ?',
            [idRestaurante]
        );
        if (!productos || productos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron productos' });
        }
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
});

// Procesar un pedido
router.post('/procesar-pedido', isAuthenticated, async (req, res) => {
    const { productos } = req.body; // Array con productos y cantidades [{ id, cantidad }]
    const idRestaurante = req.session.user.id_restaurante;

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
                `SELECT r.id_ingrediente, r.cantidad, i.stock 
                 FROM recetas r
                 INNER JOIN ingredientes i ON r.id_ingrediente = i.id_ingrediente
                 WHERE r.id_producto = ? AND r.id_restaurante = ?`,
                [producto.id, idRestaurante]
            );

            for (const receta of recetas) {
                const nuevoStock = receta.stock - receta.cantidad * producto.cantidad;

                if (nuevoStock < 0) {
                    throw new Error(`Stock insuficiente para el ingrediente ID ${receta.id_ingrediente}`);
                }

                await connection.query(
                    `UPDATE ingredientes SET stock = ? WHERE id_ingrediente = ? AND id_restaurante = ?`,
                    [nuevoStock, receta.id_ingrediente, idRestaurante]
                );
            }

            const [productoInfo] = await connection.query(
                `SELECT precio FROM productos WHERE id_producto = ? AND id_restaurante = ?`,
                [producto.id, idRestaurante]
            );

            totalPedido += productoInfo[0].precio * producto.cantidad;
        }

        // Crear el pedido en la tabla `pedidos`
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (fecha, total, id_restaurante) VALUES (NOW(), ?, ?)`,
            [totalPedido, idRestaurante]
        );

        const pedidoId = pedidoResult.insertId;

        // Insertar los detalles del pedido
        for (const producto of productos) {
            const [productoInfo] = await connection.query(
                `SELECT precio FROM productos WHERE id_producto = ? AND id_restaurante = ?`,
                [producto.id, idRestaurante]
            );

            await connection.query(
                `INSERT INTO detalles_pedidos (id_pedido, id_producto, cantidad, subtotal, id_restaurante) 
                 VALUES (?, ?, ?, ?, ?)`,
                [pedidoId, producto.id, producto.cantidad, productoInfo[0].precio * producto.cantidad, idRestaurante]
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

// Ver pedidos del restaurante del empleado
router.get('/ver-pedidos', isAuthenticated, async (req, res) => {
    const { fecha } = req.query;
    const idRestaurante = req.session.user.id_restaurante;

    if (!fecha) {
        return res.status(400).json({ message: 'La fecha es requerida.' });
    }

    try {
        const [pedidos] = await db.query(
            `SELECT p.id_pedido AS pedido_id, p.fecha, p.total, dp.id_producto, pr.nombre AS producto_nombre, dp.cantidad, dp.subtotal 
             FROM pedidos p
             INNER JOIN detalles_pedidos dp ON p.id_pedido = dp.id_pedido
             INNER JOIN productos pr ON dp.id_producto = pr.id_producto
             WHERE p.id_restaurante = ? AND DATE(p.fecha) = ?`,
            [idRestaurante, fecha]
        );

        if (!pedidos || pedidos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pedidos para la fecha seleccionada.' });
        }

        res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({ message: 'Error al obtener los pedidos.' });
    }
});

module.exports = router;
