import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// ==============================
// LISTAR TODAS LAS CUOTAS
// ==============================
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM cuotas");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener cuotas" });
    }
});

// ==============================
// HISTORIAL DE UN ALUMNO
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
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

// ==============================
// CREAR NUEVA CUOTA
// ==============================
router.post("/", async (req, res) => {
    try {
        const { id_alumno, monto, fecha_pago, fecha_vencimiento, metodo_pago, comentarios } = req.body;

        const sql = `
            INSERT INTO cuotas (id_alumno, monto, fecha_pago, fecha_vencimiento, metodo_pago, comentarios)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            id_alumno,
            monto,
            fecha_pago,
            fecha_vencimiento,
            metodo_pago,
            comentarios
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Error al crear cuota" });
    }
});

export default router;
