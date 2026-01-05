import express from "express";
import db from "../database/db.js";

const router = express.Router();
router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) {
            return res.status(400).json({ error: "Falta mes" });
        }

        const query = `
            SELECT
                tipo,
                COUNT(DISTINCT id_alumno) AS cantidad
            FROM pagos
            WHERE fecha_pago IS NOT NULL
            AND tipo IS NOT NULL
            AND date_trunc('month', fecha_pago) = date_trunc('month', $1::date)
            GROUP BY tipo
        `;

        const result = await db.query(query, [`${mes}-01`]);

        let altas = 0;
        let renovaciones = 0;

        result.rows.forEach(r => {
            if (r.tipo.toLowerCase() === "alta") altas = Number(r.cantidad);
            if (r.tipo.toLowerCase() === "renovacion") renovaciones = Number(r.cantidad);
        });

        res.json({
            mes,
            altas,
            renovaciones,
            total: altas + renovaciones
        });

    } catch (error) {
        console.error("🔥 ERROR ESTADISTICAS:", error);
        res.status(500).json({
            error: "Error estadísticas",
            detalle: error.message
        });
    }
});

export default router;
