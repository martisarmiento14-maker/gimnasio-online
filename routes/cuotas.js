import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// ------------------------------------------------------------
// GET: Todas las cuotas
// ------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT c.*, a.nombre, a.apellido
            FROM cuotas c
            LEFT JOIN alumnos a ON c.id_alumno = a.id
            ORDER BY c.fecha_pago DESC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ ERROR SQL GET CUOTAS:", err);
        res.status(500).json({ error: "Error al obtener cuotas" });
    }
});

// ------------------------------------------------------------
// GET: cuotas por alumno
// ------------------------------------------------------------
router.get("/alumno/:id", async (req, res) => {
    try {
        const sql = `
            SELECT *
            FROM cuotas
            WHERE id_alumno = $1
            ORDER BY fecha_pago DESC
        `;
        const result = await pool.query(sql, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ ERROR SQL GET POR ALUMNO:", err);
        res.status(500).json({ error: "Error al obtener cuotas del alumno" });
    }
});

// ------------------------------------------------------------
// POST: Crear cuota
// ------------------------------------------------------------
router.post("/", async (req, res) => {
    try {
        const {
            id_alumno,
            monto,
            fecha_pago,
            metodo_pago,
            comentarios
        } = req.body;

        const sql = `
            INSERT INTO cuotas (
                id_alumno, monto, fecha_pago, metodo_pago, comentarios
            ) VALUES (
                $1, $2, $3, $4, $5
            )
            RETURNING *
        `;

        const result = await pool.query(sql, [
            id_alumno,
            monto,
            fecha_pago,
            metodo_pago,
            comentarios
        ]);

        res.json({
            mensaje: "Cuota creada correctamente",
            cuota: result.rows[0]
        });

    } catch (err) {
        console.error("❌ ERROR SQL POST CUOTAS:", err);
        res.status(500).json({ error: "Error al crear cuota" });
    }
});

// ------------------------------------------------------------
// PUT: Actualizar cuota
// ------------------------------------------------------------
router.put("/:id", async (req, res) => {
    try {
        const {
            id_alumno,
            monto,
            fecha_pago,
            metodo_pago,
            comentarios
        } = req.body;

        const sql = `
            UPDATE cuotas SET
                id_alumno = $1,
                monto = $2,
                fecha_pago = $3,
                metodo_pago = $4,
                comentarios = $5
            WHERE id = $6
            RETURNING *
        `;

        const result = await pool.query(sql, [
            id_alumno,
            monto,
            fecha_pago,
            metodo_pago,
            comentarios,
            req.params.id
        ]);

        res.json({
            mensaje: "Cuota actualizada correctamente",
            cuota: result.rows[0]
        });

    } catch (err) {
        console.error("❌ ERROR SQL PUT CUOTAS:", err);
        res.status(500).json({ error: "Error al actualizar cuota" });
    }
});

// ------------------------------------------------------------
// DELETE: Eliminar cuota
// ------------------------------------------------------------
router.delete("/:id", async (req, res) => {
    try {
        const sql = "DELETE FROM cuotas WHERE id = $1";

        await pool.query(sql, [req.params.id]);

        res.json({ mensaje: "Cuota eliminada correctamente" });

    } catch (err) {
        console.error("❌ ERROR SQL DELETE CUOTAS:", err);
        res.status(500).json({ error: "Error al eliminar cuota" });
    }
});

export default router;
