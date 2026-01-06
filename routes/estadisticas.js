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
router.get("/planes", async (req, res) => {
    try {
        const { mes } = req.query;

        const query = `
            SELECT plan
            FROM pagos
            WHERE to_char(a.fecha_vencimiento, 'YYYY-MM') = $1
            AND plan IS NOT NULL
        `;

        const result = await db.query(query, [mes]);

        const conteo = {
            personalizado: 0,
            eg: 0,
            running: 0,
            combo1: 0,
            combo2: 0
        };

        result.rows.forEach(r => {
            if (r.plan === "personalizado") conteo.personalizado++;
            else if (r.plan === "eg") conteo.eg++;
            else if (r.plan === "running") conteo.running++;
            else if (r.plan === "personalizado+running") conteo.combo1++;
            else if (r.plan === "eg+running") conteo.combo2++;
        });

        res.json(conteo);

    } catch (error) {
        console.error("ERROR PLANES:", error);
        res.status(500).json({ error: "Error estadísticas planes" });
    }
});


router.get("/planes-dias", async (req, res) => {
    try {
        const { mes } = req.query;

        const query = `
            SELECT
                SUM(CASE WHEN plan = 'eg' AND dias_por_semana = 3 THEN 1 ELSE 0 END) AS eg_3_dias,
                SUM(CASE WHEN plan = 'eg' AND dias_por_semana = 5 THEN 1 ELSE 0 END) AS eg_5_dias,

                SUM(CASE WHEN plan = 'personalizado' AND dias_por_semana = 3 THEN 1 ELSE 0 END) AS pers_3_dias,
                SUM(CASE WHEN plan = 'personalizado' AND dias_por_semana = 5 THEN 1 ELSE 0 END) AS pers_5_dias
            FROM pagos
            WHERE to_char(a.fecha_vencimiento, 'YYYY-MM') = $1

            AND plan IS NOT NULL
            AND dias_por_semana IS NOT NULL
        `;

        const result = await db.query(query, [mes]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR PLANES-DIAS:", error);
        res.status(500).json({ error: "Error estadísticas planes-dias" });
    }
});


router.get("/ingresos", async (req, res) => {
    try {
        const { mes } = req.query;

        const query = `
            SELECT
                metodo_pago,
                SUM(monto) AS total,
                COUNT(*) AS personas
            FROM pagos
            WHERE to_char(fecha_pago, 'YYYY-MM') = $1
            GROUP BY metodo_pago
        `;

        const result = await db.query(query, [mes]);

        const data = {
            efectivo: { total: 0, personas: 0 },
            transferencia: { total: 0, personas: 0 }
        };

        result.rows.forEach(r => {
            data[r.metodo_pago] = {
                total: Number(r.total),
                personas: Number(r.personas)
            };
        });

        res.json(data);

    } catch (error) {
        console.error("ERROR INGRESOS:", error);
        res.status(500).json({ error: "Error estadísticas ingresos" });
    }
});




export default router;
