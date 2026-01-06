import express from "express";
import db from "../database/db.js";

const router = express.Router();

// ===============================
// 📊 ALTAS / RENOVACIONES POR MES
// (mes del pago → vencimiento mes siguiente)
// ===============================
router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT
                p.tipo,
                COUNT(DISTINCT p.id_alumno) AS cantidad
            FROM pagos p
            WHERE to_char(p.fecha_pago, 'YYYY-MM') = $1
            GROUP BY p.tipo
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


// ===============================
// 💪 PLANES DEL MES
// (según vencimiento - 1 mes)
// ===============================
router.get("/planes", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT p.plan
            FROM pagos p
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE to_char(a.fecha_vencimiento - interval '1 month', 'YYYY-MM') = $1
            AND p.plan IS NOT NULL
        `;

        const result = await db.query(query, [mes]);

        const stats = {
            // individuales
            eg: 0,
            personalizado: 0,
            running: 0,
            mma: 0,

            // combos
            running_eg: 0,
            running_personalizado: 0,
            mma_eg: 0,
            mma_personalizado: 0,
            mma_running_eg: 0,
            mma_running_personalizado: 0
        };

        result.rows.forEach(({ plan }) => {
            const p = plan.split("+").sort().join("+");

            // =====================
            // INDIVIDUALES
            // =====================
            if (p === "eg") stats.eg++;
            if (p === "personalizado") stats.personalizado++;
            if (p === "running") stats.running++;
            if (p === "mma") stats.mma++;

            // =====================
            // COMBOS DOBLES
            // =====================
            if (p === "eg+running") stats.running_eg++;
            if (p === "personalizado+running") stats.running_personalizado++;
            if (p === "eg+mma") stats.mma_eg++;
            if (p === "mma+personalizado") stats.mma_personalizado++;

            // =====================
            // COMBOS TRIPLES
            // =====================
            if (p === "eg+mma+running") stats.mma_running_eg++;
            if (p === "mma+personalizado+running") stats.mma_running_personalizado++;
        });

        res.json(stats);

    } catch (error) {
        console.error("ERROR PLANES:", error);
        res.status(500).json({ error: "Error estadísticas planes" });
    }
});


// ======================================
// 📅 PLAN EG / PERSONALIZADO – DÍAS
// (según vencimiento - 1 mes)
// ======================================
router.get("/planes-dias", async (req, res) => {
    try {
        const { mes } = req.query;
        if (!mes) return res.status(400).json({ error: "Falta mes" });

        const query = `
            SELECT
                SUM(CASE WHEN p.plan = 'eg' AND a.dias_eg_pers = 3 THEN 1 ELSE 0 END) AS eg_3_dias,
                SUM(CASE WHEN p.plan = 'eg' AND a.dias_eg_pers = 5 THEN 1 ELSE 0 END) AS eg_5_dias,

                SUM(CASE WHEN p.plan = 'personalizado' AND a.dias_eg_pers = 3 THEN 1 ELSE 0 END) AS pers_3_dias,
                SUM(CASE WHEN p.plan = 'personalizado' AND a.dias_eg_pers = 5 THEN 1 ELSE 0 END) AS pers_5_dias
            FROM pagos p
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE to_char(a.fecha_vencimiento - interval '1 month', 'YYYY-MM') = $1
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

// ===============================
// 💰 INGRESOS DEL MES
// (según FECHA DE PAGO)
// ===============================
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
