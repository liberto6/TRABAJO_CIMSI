    const express = require('express');
    const path = require('path');
    const { isAuthenticated } = require('../middlewares/auth');
    const router = express.Router();
    const db = require('../db/connection');

    router.get('/', isAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, '../../front-end/private/encargado.html'));
    });

    // Ruta para la página de gestionar usuarios
    router.get('/gestion_empleado.html', isAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, '../../front-end/private/gestion_empleado.html'));
    });

    // Ruta para obtener los empleados del restaurante del encargado
    router.get('/empleados', isAuthenticated, async (req, res) => {
        const idRestaurante = req.session.user.id_restaurante;

        try {
            const [empleados] = await db.query(
                'SELECT id_usuario, nombre, email, rol FROM usuarios WHERE rol = "empleado" AND id_restaurante = ?',
                [idRestaurante]
            );
            res.json(empleados);
        } catch (err) {
            console.error('Error al obtener los empleados:', err);
            res.status(500).json({ message: 'Error al obtener los empleados' });
        }
    });

    // Ruta para añadir empleados al restaurante del encargado
    router.post('/empleados', isAuthenticated, async (req, res) => {
        const { nombre, email, contraseña } = req.body;
        const idRestaurante = req.session.user.id_restaurante;

        if (!nombre || !email || !contraseña) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        try {
            const [existingEmail] = await db.query('SELECT email FROM usuarios WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'El correo ya está registrado' });
            }

            await db.query(
                'INSERT INTO usuarios (nombre, email, contraseña, rol, id_restaurante) VALUES (?, ?, ?, "empleado", ?)',
                [nombre, email, contraseña, idRestaurante]
            );
            res.json({ message: 'Empleado añadido con éxito' });
        } catch (err) {
            console.error('Error al añadir el empleado:', err);
            res.status(500).json({ message: 'Error al añadir el empleado' });
        }
    });

    // Ruta para eliminar empleados del restaurante del encargado
    router.delete('/empleados/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params;
        const idRestaurante = req.session.user.id_restaurante;

        try {
            const [empleado] = await db.query(
                'SELECT * FROM usuarios WHERE id_usuario = ? AND id_restaurante = ?',
                [id, idRestaurante]
            );

            if (empleado.length === 0) {
                return res.status(404).json({ message: 'Empleado no encontrado o no pertenece a este restaurante' });
            }

            await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
            res.json({ message: 'Empleado eliminado con éxito' });
        } catch (err) {
            console.error('Error al eliminar el empleado:', err);
            res.status(500).json({ message: 'Error al eliminar el empleado' });
        }
    });

    // Ruta para obtener el nombre del encargado
    router.get('/nombre', isAuthenticated, (req, res) => {
        const user = req.session.user;
        if (user && user.role === 'encargado') {
            res.json({ nombre: user.nombre });
        } else {
            res.status(404).json({ error: 'Encargado no encontrado o no autorizado' });
        }
    });

    // Ruta para obtener productos del restaurante
    router.get('/productos', isAuthenticated, async (req, res) => {
        const idRestaurante = req.session.user.id_restaurante; // Asegurarse de que esto esté correctamente configurado

        if (!idRestaurante) {
            return res.status(400).json({ message: 'El ID del restaurante no está definido en la sesión.' });
        }

        try {
            const [productos] = await db.query(
                'SELECT id_producto AS id, nombre, precio FROM productos WHERE id_restaurante = ?',
                [idRestaurante]
            );

            if (!productos || productos.length === 0) {
                return res.status(404).json({ message: 'No se encontraron productos para este restaurante.' });
            }
            res.json(productos);
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            res.status(500).json({ message: 'Error al obtener los productos.' });
        }
    });


    // Ruta para obtener pedidos del restaurante
    router.get('/ver-pedidos', isAuthenticated, async (req, res) => {
        const { fecha } = req.query;
        const idRestaurante = req.session.user.id_restaurante;

        try {
            const [pedidos] = await db.query(
                `SELECT p.id_pedido AS pedido_id, p.fecha, p.total, dp.id_producto, pr.nombre AS producto_nombre, dp.cantidad, dp.subtotal
                FROM pedidos p
                INNER JOIN detalles_pedidos dp ON p.id_pedido = dp.id_pedido
                INNER JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE p.id_restaurante = ? AND (? IS NULL OR DATE(p.fecha) = ?)`,
                [idRestaurante, fecha, fecha]
            );

            if (!pedidos || pedidos.length === 0) {
                return res.json([]);
            }

            res.json(pedidos);
        } catch (err) {
            console.error('Error al obtener los pedidos:', err);
            res.status(500).json({ message: 'Error al obtener los pedidos' });
        }
    });

    // Procesar un pedido
    router.post('/procesar-pedido', isAuthenticated, async (req, res) => {
        const { productos } = req.body;
        const idRestaurante = req.session.user.id_restaurante;

        if (!productos || productos.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron productos para procesar.' });
        }

        // Validar que cada producto tiene un id válido
        for (const producto of productos) {
            if (!producto.id_producto || !producto.cantidad) {
                return res.status(400).json({ message: 'Datos de producto incompletos.' });
            }
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            let totalPedido = 0;

            for (const producto of productos) {
                const [recetas] = await connection.query(
                    `SELECT r.id_ingrediente, r.cantidad AS cantidad_receta, i.stock 
                    FROM recetas r
                    INNER JOIN ingredientes i ON r.id_ingrediente = i.id_ingrediente
                    WHERE r.id_producto = ? AND r.id_restaurante = ?`,
                    [producto.id_producto, idRestaurante]
                );

                for (const receta of recetas) {
                    const nuevoStock = receta.stock - receta.cantidad_receta * producto.cantidad;

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
                    [producto.id_producto, idRestaurante]
                );

                if (!productoInfo.length) {
                    throw new Error(`El producto ID ${producto.id_producto} no se encontró para el restaurante ${idRestaurante}`);
                }

                totalPedido += productoInfo[0].precio * producto.cantidad;
            }

            const [pedidoResult] = await connection.query(
                `INSERT INTO pedidos (fecha, total, id_restaurante) VALUES (NOW(), ?, ?)`,
                [totalPedido, idRestaurante]
            );

            const pedidoId = pedidoResult.insertId;

            for (const producto of productos) {
                const [productoInfo] = await connection.query(
                    `SELECT precio FROM productos WHERE id_producto = ? AND id_restaurante = ?`,
                    [producto.id_producto, idRestaurante]
                );

                await connection.query(
                    `INSERT INTO detalles_pedidos (id_pedido, id_producto, cantidad, subtotal, id_restaurante) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [pedidoId, producto.id_producto, producto.cantidad, productoInfo[0].precio * producto.cantidad, idRestaurante]
                );
            }

            await connection.commit();
            res.status(200).json({ message: 'Pedido procesado correctamente.', pedidoId });
        } catch (error) {
            console.error('Error al procesar el pedido:', error);
            await connection.rollback();
            res.status(500).json({ message: `Error al procesar el pedido: ${error.message}` });
        } finally {
            connection.release();
        }
    });



    // Ruta para obtener ingredientes con stock bajo del restaurante
    router.get('/stock-bajo', isAuthenticated, async (req, res) => {
        const idRestaurante = req.session.user.id_restaurante;

        try {
            const [ingredientes] = await db.query(
                `SELECT id_ingrediente AS id, nombre, stock, stock_minimo 
                FROM ingredientes 
                WHERE stock <= stock_minimo AND id_restaurante = ?`,
                [idRestaurante]
            );

            res.json(ingredientes);
        } catch (error) {
            console.error('Error al obtener ingredientes con stock bajo:', error);
            res.status(500).json({ message: 'Error al consultar el stock bajo.' });
        }
    });

    // Ruta para añadir un nuevo producto con sus ingredientes
    router.post('/nuevo-producto', isAuthenticated, async (req, res) => {
        const { nombre, precio, ingredientes } = req.body;
        const idRestaurante = req.session.user.id_restaurante;

        if (!nombre || !precio || !ingredientes || ingredientes.length === 0) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios, incluyendo al menos un ingrediente.' });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Insertar el producto
            const [productoResult] = await connection.query(
                `INSERT INTO productos (nombre, precio, id_restaurante) VALUES (?, ?, ?)`,
                [nombre, precio, idRestaurante]
            );

            const idProducto = productoResult.insertId;

            // Insertar ingredientes y recetas
            for (const ingrediente of ingredientes) {
                const { nombre, stockInicial, stockMinimo, cantidad } = ingrediente;

                const [ingredienteResult] = await connection.query(
                    `INSERT INTO ingredientes (nombre, stock, stock_minimo, id_restaurante) 
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        stock = stock + VALUES(stock), 
                        stock_minimo = VALUES(stock_minimo),
                        id_ingrediente = LAST_INSERT_ID(id_ingrediente)`,
                    [nombre, stockInicial, stockMinimo, idRestaurante]
                );

                const idIngrediente = ingredienteResult.insertId;

                await connection.query(
                    `INSERT INTO recetas (id_producto, id_ingrediente, cantidad, id_restaurante) 
                    VALUES (?, ?, ?, ?)`,
                    [idProducto, idIngrediente, cantidad, idRestaurante]
                );
            }

            await connection.commit();
            res.status(200).json({ message: 'Producto añadido correctamente.' });
        } catch (error) {
            console.error('Error al añadir producto:', error);
            await connection.rollback();
            res.status(500).json({ message: 'Error al guardar el producto.' });
        } finally {
            connection.release();
        }
    });

    router.get('/producto/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params;
        const idRestaurante = req.session.user.id_restaurante;

        try {
            const [producto] = await db.query(
                `SELECT id_producto, nombre, precio 
                FROM productos 
                WHERE id_producto = ? AND id_restaurante = ?`,
                [id, idRestaurante]
            );

            if (producto.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }

            const [ingredientes] = await db.query(
                `SELECT i.id_ingrediente, i.nombre AS nombre_ingrediente, r.cantidad, i.stock, i.stock_minimo 
                 FROM recetas r
                 INNER JOIN ingredientes i ON r.id_ingrediente = i.id_ingrediente
                 WHERE r.id_producto = ? AND r.id_restaurante = ?`,
                [id, idRestaurante]
            );
            

            res.json({ producto: producto[0], ingredientes });
        } catch (error) {
            console.error('Error al obtener producto:', error);
            res.status(500).json({ message: 'Error al obtener el producto.' });
        }
    });

    router.put('/producto/:id', isAuthenticated, async (req, res) => {
        const { id } = req.params;
        const { nombre, precio, ingredientes } = req.body;
        const idRestaurante = req.session.user.id_restaurante;

        if (!nombre || !precio || !ingredientes || ingredientes.length === 0) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios, incluyendo al menos un ingrediente.' });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Actualizar el producto
            await connection.query(
                `UPDATE productos SET nombre = ?, precio = ? WHERE id_producto = ? AND id_restaurante = ?`,
                [nombre, precio, id, idRestaurante]
            );

            // Actualizar ingredientes y recetas
            for (const ingrediente of ingredientes) {
                const { id_ingrediente, cantidad, stock, stock_minimo } = ingrediente;

                await connection.query(
                    `UPDATE ingredientes 
                    SET stock = ?, stock_minimo = ? 
                    WHERE id_ingrediente = ? AND id_restaurante = ?`,
                    [stock, stock_minimo, id_ingrediente, idRestaurante]
                );

                await connection.query(
                    `UPDATE recetas 
                    SET cantidad = ? 
                    WHERE id_producto = ? AND id_ingrediente = ? AND id_restaurante = ?`,
                    [cantidad, id, id_ingrediente, idRestaurante]
                );
            }

            await connection.commit();
            res.status(200).json({ message: 'Producto modificado correctamente.' });
        } catch (error) {
            console.error('Error al modificar producto:', error);
            await connection.rollback();
            res.status(500).json({ message: 'Error al modificar el producto.' });
        } finally {
            connection.release();
        }
    });

    // Ruta para obtener todos los productos con sus ingredientes
    router.get('/productos-completos', isAuthenticated, async (req, res) => {
        const idRestaurante = req.session.user.id_restaurante;
    
        try {
            const [productos] = await db.query(
                `SELECT id_producto, nombre, CAST(precio AS DECIMAL(10, 2)) AS precio 
                 FROM productos 
                 WHERE id_restaurante = ?`,
                [idRestaurante]
            );
    
            const productosCompletos = await Promise.all(
                productos.map(async (producto) => {
                    const [ingredientes] = await db.query(
                        `SELECT i.id_ingrediente, i.nombre AS nombre_ingrediente, i.stock, i.stock_minimo, r.cantidad
                         FROM recetas r
                         INNER JOIN ingredientes i ON r.id_ingrediente = i.id_ingrediente
                         WHERE r.id_producto = ? AND i.id_restaurante = ?`,
                        [producto.id_producto, idRestaurante]
                    );
                    return { ...producto, ingredientes };
                })
            );
    
            res.json(productosCompletos);
        } catch (error) {
            console.error("Error al obtener productos completos:", error);
            res.status(500).json({ message: "Error al cargar los productos." });
        }
    });
    
// Ruta para eliminar un producto
router.delete('/producto/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const idRestaurante = req.session.user.id_restaurante;

    try {
        await db.query(
            `DELETE FROM recetas WHERE id_producto = ? AND id_restaurante = ?`,
            [id, idRestaurante]
        );

        await db.query(
            `DELETE FROM productos WHERE id_producto = ? AND id_restaurante = ?`,
            [id, idRestaurante]
        );

        res.status(200).json({ message: 'Producto eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto.' });
    }
});

    module.exports = router;
