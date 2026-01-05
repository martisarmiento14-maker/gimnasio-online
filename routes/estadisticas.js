import express from "express";
import db from "../database/db.js";

const router = express.Router();

/*
GET /estadisticas?mes=YYYY-MM
*/
router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;

        if (!mes) {
            return res.status(400).json({ error: "Falta parámetro mes" });
        }

        const fechaInicio = `${mes}-01`;
        const fechaFin = `${mes}-31`;

        const query = `
            SELECT
                tipo,
                COUNT(DISTINCT alumno_id) AS cantidad
            FROM pagos
            WHERE fecha_pago BETWEEN $1 AND $2
            GROUP BY tipo
        `;

        const result = await db.query(query, [fechaInicio, fechaFin]);

        let altas = 0;
        let renovaciones = 0;

        result.rows.forEach(row => {
            if (row.tipo === "alta") altas = Number(row.cantidad);
            if (row.tipo === "renovacion") renovaciones = Number(row.cantidad);
        });

        res.json({
            mes,
            altas,
            renovaciones,
            total: altas + renovaciones
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
