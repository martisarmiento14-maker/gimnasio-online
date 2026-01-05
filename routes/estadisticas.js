import express from "express";
import db from "../database/db.js";

const router = express.Router();

/*
GET /estadisticas?mes=YYYY-MM
Ej: /estadisticas?mes=2026-01
*/
router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;

        if (!mes) {
            return res.status(400).json({ error: "Falta parámetro mes" });
        }

        // Primer y último día del mes
        const fechaInicio = `${mes}-01`;
        const fechaFin = `${mes}-31`;

        const query = `
            SELECT COUNT(DISTINCT id_alumno) AS total
            FROM asistencias
            WHERE fecha BETWEEN $1 AND $2
        `;

        const result = await db.query(query, [fechaInicio, fechaFin]);

        res.json({
            total_alumnos_mes: Number(result.rows[0].total)
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
