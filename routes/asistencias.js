// backend/routes/asistencias.js
import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Registrar asistencia
router.post("/", async (req, res) => {
    try {
        const { id_alumno, fecha, hora } = req.body;

    const sql = `
        INSERT INTO asistencias (id_alumno, fecha, hora)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const result = await pool.query(sql, [id_alumno, fecha, hora]);

    res.json({
        message: "Asistencia registrada",
        asistencia: result.rows[0],
    });
    } catch (err) {
    console.error("❌ Error SQL:", err);
    res.status(500).json({ error: "Error al registrar asistencia" });
    }
});

// Obtener asistencias de un alumno
router.get("/:id", async (req, res) => {
    try {
        const sql = `
        SELECT *
        FROM asistencias
        WHERE id_alumno = $1
        ORDER BY fecha DESC
    `;
    const result = await pool.query(sql, [req.params.id]);

    res.json(result.rows);
    } catch (err) {
        console.error("❌ Error SQL:", err);
        res.status(500).json({ error: "Error al obtener asistencias" });
    }
});

export default router;
