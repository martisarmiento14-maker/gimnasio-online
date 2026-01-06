import express from "express";
import db from "../database/db.js";

const router = express.Router();

/* =====================================================
   📊 ALTAS / RENOVACIONES DEL MES
   (según FECHA DE PAGO)
===================================================== */
router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT
                tipo,
                COUNT(*) AS cantidad
            FROM pagos
            WHERE to_char(fecha_pago, 'YYYY-MM') = $1
            GROUP BY tipo
        `;

        const result = await db.query(query, [mes]);

        let altas = 0;
        let renovaciones = 0;

        result.rows.forEach(r => {
            if (r.tipo === "alta") altas = Number(r.cantidad);
            if (r.tipo === "renovacion") renovaciones = Number(r.cantidad);
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

/* =====================================================
   💪 PLANES DEL MES
   (según FECHA DE PAGO – historial independiente)
===================================================== */
router.get("/planes", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT
                plan,
                COUNT(*) AS cantidad
            FROM pagos
            WHERE
                to_char(fecha_pago, 'YYYY-MM') = $1
                AND plan IS NOT NULL
            GROUP BY plan
        `;

        const result = await db.query(query, [mes]);

        const stats = {
            eg: 0,
            personalizado: 0,
            running: 0,
            mma: 0,

            running_eg: 0,
            running_personalizado: 0,
            mma_eg: 0,
            mma_personalizado: 0,
            mma_running_eg: 0,
            mma_running_personalizado: 0
        };

        result.rows.forEach(({ plan, cantidad }) => {
            const p = plan.split("+").sort().join("+");

            // individuales
            if (p === "eg") stats.eg += Number(cantidad);
            if (p === "personalizado") stats.personalizado += Number(cantidad);
            if (p === "running") stats.running += Number(cantidad);
            if (p === "mma") stats.mma += Number(cantidad);

            // combos dobles
            if (p === "eg+running") stats.running_eg += Number(cantidad);
            if (p === "personalizado+running") stats.running_personalizado += Number(cantidad);
            if (p === "eg+mma") stats.mma_eg += Number(cantidad);
            if (p === "mma+personalizado") stats.mma_personalizado += Number(cantidad);

            // combos triples
            if (p === "eg+mma+running") stats.mma_running_eg += Number(cantidad);
            if (p === "mma+personalizado+running") stats.mma_running_personalizado += Number(cantidad);
        });

        res.json(stats);

    } catch (error) {
        console.error("ERROR PLANES:", error);
        res.status(500).json({ error: "Error estadísticas planes" });
    }
});

/* =====================================================
   📅 DÍAS EG / PERSONALIZADO
   (congelados en el pago, NO desde alumnos)
===================================================== */
router.get("/planes-dias", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT
                SUM(CASE WHEN plan = 'eg' AND dias_eg_pers = 3 THEN 1 ELSE 0 END) AS eg_3_dias,
                SUM(CASE WHEN plan = 'eg' AND dias_eg_pers = 5 THEN 1 ELSE 0 END) AS eg_5_dias,
                SUM(CASE WHEN plan = 'personalizado' AND dias_eg_pers = 3 THEN 1 ELSE 0 END) AS pers_3_dias,
                SUM(CASE WHEN plan = 'personalizado' AND dias_eg_pers = 5 THEN 1 ELSE 0 END) AS pers_5_dias
            FROM pagos
            WHERE to_char(fecha_pago, 'YYYY-MM') = $1
        `;

        const result = await db.query(query, [mes]);

        res.json(result.rows[0] || {
            eg_3_dias: 0,
            eg_5_dias: 0,
            pers_3_dias: 0,
            pers_5_dias: 0
        });

    } catch (error) {
        console.error("ERROR PLANES-DIAS:", error);
        res.status(500).json({ error: "Error estadísticas planes-dias" });
    }
});

/* =====================================================
   💰 INGRESOS DEL MES
   (solo FECHA DE PAGO – incluye pagos 0)
===================================================== */
router.get("/ingresos", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

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
            if (data[r.metodo_pago]) {
                data[r.metodo_pago] = {
                    total: Number(r.total),
                    personas: Number(r.personas)
                };
            }
        });

        res.json(data);

    } catch (error) {
        console.error("ERROR INGRESOS:", error);
        res.status(500).json({ error: "Error estadísticas ingresos" });
    }
});

export default router;
