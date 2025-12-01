// backend/routes/cuotas.js
import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// ==============================
// LISTAR TODAS LAS CUOTAS (opcional, por si la usás después)
// ==============================
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM cuotas ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error al obtener cuotas:", err);
        res.status(500).json({ error: "Error al obtener cuotas" });
    }
});

// ==============================
// HISTORIAL DE CUOTAS DE UN ALUMNO
// ==============================
router.get("/historial/:id", async (req, res) => {
    try {
        const sql = `
            SELECT *
            FROM cuotas
            WHERE id_alumno = $1
            ORDER BY fecha_vencimiento DESC
        `;
    const result = await pool.query(sql, [req.params.id]);
    res.json(result.rows);
    } catch (err) {
        console.error("❌ Error al obtener historial:", err);
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

// ==============================
// CREAR NUEVA CUOTA (si después querés renovar desde algún form)
// ==============================
router.post("/", async (req, res) => {
    try {
        const {
            id_alumno,
            monto,
            fecha_pago,
            fecha_vencimiento,
            metodo_pago,
            comentarios,
        } = req.body;

    const sql = `
        INSERT INTO cuotas (
            id_alumno, monto, fecha_pago, fecha_vencimiento, metodo_pago, comentarios
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const result = await pool.query(sql, [
        id_alumno,
        monto,
        fecha_pago,
        fecha_vencimiento,
        metodo_pago,
        comentarios,
    ]);

    res.json(result.rows[0]);
    } catch (err) {
    console.error("❌ Error al crear cuota:", err);
    res.status(500).json({ error: "Error al crear cuota" });
    }
});

export default router;
