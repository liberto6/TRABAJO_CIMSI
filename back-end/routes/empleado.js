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
    const idRestaurante = req.session.user.id_restaurante;

    try {
        const [productos] = await db.query(
            'SELECT id_producto, nombre, precio FROM productos WHERE id_restaurante = ?',
            [idRestaurante]
        );

        if (!productos || productos.length === 0) {
            return res.status(404).json({ message: 'No hay productos disponibles para este restaurante.' });
        }

        res.json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al cargar los productos.' });
    }
});


// Procesar un pedido
router.post('/procesar-pedido', isAuthenticated, async (req, res) => {
    const { productos } = req.body;
    const idRestaurante = req.session.user.id_restaurante;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'No hay productos en la comanda.' });
    }

    console.log("Productos recibidos en el backend:", productos); // Log de depuración

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let totalPedido = 0;

        // Calcular el total del pedido
        for (const producto of productos) {
            // Obtener información del producto
            const [productoInfo] = await connection.query(
                'SELECT precio FROM productos WHERE id_producto = ? AND id_restaurante = ?',
                [producto.id, idRestaurante]
            );

            if (!productoInfo.length) {
                throw new Error(`Producto con ID ${producto.id} no encontrado.`);
            }

            // Calcular el subtotal para el producto actual
            const subtotal = productoInfo[0].precio * producto.cantidad;
            totalPedido += subtotal;

            // Verificar y actualizar el stock de los ingredientes
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
                    throw new Error(`Stock insuficiente para el ingrediente con ID ${receta.id_ingrediente}.`);
                }

                await connection.query(
                    `UPDATE ingredientes 
                     SET stock = ? 
                     WHERE id_ingrediente = ? AND id_restaurante = ?`,
                    [nuevoStock, receta.id_ingrediente, idRestaurante]
                );
            }
        }

        // Crear el pedido
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (fecha, total, id_restaurante) 
             VALUES (NOW(), ?, ?)`,
            [totalPedido, idRestaurante]
        );

        const pedidoId = pedidoResult.insertId;

        // Insertar los detalles del pedido
        for (const producto of productos) {
            const [productoInfo] = await connection.query(
                'SELECT precio FROM productos WHERE id_producto = ? AND id_restaurante = ?',
                [producto.id, idRestaurante]
            );

            const subtotal = productoInfo[0].precio * producto.cantidad;

            await connection.query(
                `INSERT INTO detalles_pedidos (id_pedido, id_producto, cantidad, subtotal, id_restaurante) 
                 VALUES (?, ?, ?, ?, ?)`,
                [pedidoId, producto.id, producto.cantidad, subtotal, idRestaurante]
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Pedido procesado correctamente.', pedidoId });
    } catch (error) {
        console.error('Error al procesar el pedido:', error.message);
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});


// Ver pedidos del restaurante del empleado
router.get('/ver-pedidos', isAuthenticated, async (req, res) => {
    const { fecha } = req.query;
    const idRestaurante = req.session.user.id_restaurante;

    if (!idRestaurante) {
        return res.status(400).json({ message: 'El restaurante no está definido en la sesión.' });
    }

    try {
        const query = `
            SELECT p.id_pedido AS pedido_id, p.fecha, p.total
            FROM pedidos p
            WHERE p.id_restaurante = ?
            ${fecha ? 'AND DATE(p.fecha) = ?' : ''}
            ORDER BY p.fecha DESC
        `;
        const params = fecha ? [idRestaurante, fecha] : [idRestaurante];

        const [pedidos] = await db.query(query, params);

        if (pedidos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pedidos para esta fecha.' });
        }

        res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({ message: 'Error al obtener los pedidos.' });
    }
});


module.exports = router;
