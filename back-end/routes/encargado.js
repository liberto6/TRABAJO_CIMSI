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
router.get('/empleados', isAuthenticated, async (req, res) => {
    try {
        const [empleados] = await db.query(
            'SELECT id_usuario, nombre, email, rol FROM usuarios WHERE rol = "empleado"'
        );
        res.json(empleados);
    } catch (err) {
        console.error('Error al obtener los empleados:', err);
        res.status(500).json({ message: 'Error al obtener los empleados' });
    }
});

router.post('/empleados', isAuthenticated, async (req, res) => {
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const [existingEmail] = await db.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        await db.query(
            'INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, "empleado")',
            [nombre, email, contraseña]
        );
        res.json({ message: 'Empleado añadido con éxito' });
    } catch (err) {
        console.error('Error al añadir el empleado:', err);
        res.status(500).json({ message: 'Error al añadir el empleado' });
    }
});

router.delete('/empleados/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        res.json({ message: 'Empleado eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar el empleado:', err);
        res.status(500).json({ message: 'Error al eliminar el empleado' });
    }
});
router.get('/nombre', isAuthenticated, (req, res) => {
    const user = req.session.user;
    if (user && user.role === 'encargado') {
        res.json({ nombre: user.nombre });
    } else {
        res.status(404).json({ error: 'Encargado no encontrado o no autorizado' });
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

router.get('/ver-pedidos', isAuthenticated, async (req, res) => {
    const { fecha } = req.query;

    try {
        let query = `
            SELECT p.id AS pedido_id, p.fecha, p.total, dp.producto_id, pr.nombre AS producto_nombre, dp.cantidad, dp.subtotal
            FROM pedidos p
            INNER JOIN detalles_pedidos dp ON p.id = dp.pedido_id
            INNER JOIN productos pr ON dp.producto_id = pr.id
        `;
        const params = [];

        if (fecha) {
            query += ' WHERE DATE(p.fecha) = ?';
            params.push(fecha);
        }

        const [pedidos] = await db.query(query, params);

        if (!pedidos || pedidos.length === 0) {
            return res.json([]);
        }

        // Agrupamos los pedidos por ID para estructurarlos mejor
        const pedidosAgrupados = pedidos.reduce((acc, pedido) => {
            const { pedido_id, fecha, total, producto_id, producto_nombre, cantidad, subtotal } = pedido;

            if (!acc[pedido_id]) {
                acc[pedido_id] = {
                    id: pedido_id,
                    fecha,
                    total,
                    productos: [],
                };
            }

            acc[pedido_id].productos.push({
                id: producto_id,
                nombre: producto_nombre,
                cantidad,
                subtotal,
            });

            return acc;
        }, {});

        // Convertimos los pedidos en un array
        const pedidosArray = Object.values(pedidosAgrupados);

        res.json(pedidosArray);
    } catch (err) {
        console.error('Error al obtener los pedidos:', err);
        res.status(500).json({ message: 'Error al obtener los pedidos' });
    }
});

router.post('/procesar-pedido', isAuthenticated, async (req, res) => {
    const { productos } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'No hay productos en el pedido' });
    }

    try {
        // Iniciar una transacción
        await db.query('START TRANSACTION');

        // Crear el pedido
        const [pedidoResult] = await db.query('INSERT INTO pedidos (fecha, total) VALUES (NOW(), 0)');
        const pedidoId = pedidoResult.insertId;

        let totalPedido = 0;

        // Insertar los detalles del pedido
        for (const producto of productos) {
            const [productoData] = await db.query('SELECT precio FROM productos WHERE id = ?', [producto.id]);
            const precio = productoData[0].precio;
            const subtotal = precio * producto.cantidad;

            totalPedido += subtotal;

            await db.query(
                'INSERT INTO detalles_pedidos (pedido_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)',
                [pedidoId, producto.id, producto.cantidad, subtotal]
            );
        }

        // Actualizar el total del pedido
        await db.query('UPDATE pedidos SET total = ? WHERE id = ?', [totalPedido, pedidoId]);

        // Confirmar la transacción
        await db.query('COMMIT');

        res.json({ message: 'Pedido procesado con éxito', pedidoId });
    } catch (err) {
        // Revertir la transacción en caso de error
        await db.query('ROLLBACK');
        console.error('Error al procesar el pedido:', err);
        res.status(500).json({ message: 'Error al procesar el pedido' });
    }
});

router.post('/actualizar-stock-minimo', isAuthenticated, async (req, res) => {
    const { ingredienteId, stockMinimo } = req.body;

    // Validar los datos
    if (!ingredienteId || stockMinimo === undefined) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }

    try {
        // Actualizar el stock mínimo en la base de datos
        const [resultado] = await db.query(
            'UPDATE ingredientes SET stock_minimo = ? WHERE id = ?',
            [stockMinimo, ingredienteId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Ingrediente no encontrado.' });
        }

        res.json({ message: 'Stock mínimo actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar el stock mínimo:', error);
        res.status(500).json({ message: 'Error al actualizar el stock mínimo.' });
    }
});


module.exports = router;
