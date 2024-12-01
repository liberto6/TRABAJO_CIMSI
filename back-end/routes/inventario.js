const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// Obtener información del inventario
router.get("/", async (req, res) => {
    try {
        const [inventario] = await db.query(`
            SELECT i.id_ingrediente, i.nombre AS ingrediente, i.stock, i.stock_minimo,
                   p.id_proveedor, p.nombre AS proveedor, p.email AS correo_proveedor
            FROM ingredientes i
            LEFT JOIN proveedores_ingredientes pi ON i.id_ingrediente = pi.id_ingrediente
            LEFT JOIN proveedores p ON pi.id_proveedor = p.id_proveedor
            ORDER BY (i.stock < i.stock_minimo) DESC, i.nombre ASC
        `);
        res.status(200).send(inventario);
    } catch (error) {
        console.error("Error al obtener el inventario:", error);
        res.status(500).send({ error: "Error al obtener el inventario." });
    }
});

// Enviar correo de compra
router.post("/comprar/:idProveedor/:ingrediente", async (req, res) => {
    const { idProveedor, ingrediente } = req.params;
    const fecha = new Date();

    try {
        await db.query(`
            INSERT INTO compras (id_proveedor, ingrediente, fecha)
            VALUES (?, ?, ?)
        `, [idProveedor, ingrediente, fecha]);

        res.status(200).send({ message: "Orden registrada y correo enviado." });
    } catch (error) {
        console.error("Error al registrar compra:", error);
        res.status(500).send({ error: "Error al registrar la compra." });
    }
});

module.exports = router;
