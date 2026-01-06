import express from "express";
import db from "../database/db.js";

const router = express.Router();

// ===============================
// 📊 ALTAS / RENOVACIONES POR MES
// (según vencimiento)
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
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE to_char(a.fecha_vencimiento, 'YYYY-MM') = $1
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
// (según vencimiento)
// ===============================
router.get("/planes", async (req, res) => {
    try {
        const { mes } = req.query;

        const query = `
            SELECT p.plan
            FROM pagos p
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE to_char(a.fecha_vencimiento, 'YYYY-MM') = $1
            AND p.plan IS NOT NULL
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

// ======================================
// 📅 PLAN EG / PERSONALIZADO – DÍAS
// (según vencimiento)
// ======================================
router.get("/planes-dias", async (req, res) => {
    try {
        const { mes } = req.query;

        const query = `
            SELECT
                SUM(CASE WHEN p.plan = 'eg' AND a.dias_eg_pers = 3 THEN 1 ELSE 0 END) AS eg_3_dias,
                SUM(CASE WHEN p.plan = 'eg' AND a.dias_eg_pers = 5 THEN 1 ELSE 0 END) AS eg_5_dias,

                SUM(CASE WHEN p.plan = 'personalizado' AND a.dias_eg_pers = 3 THEN 1 ELSE 0 END) AS pers_3_dias,
                SUM(CASE WHEN p.plan = 'personalizado' AND a.dias_eg_pers = 5 THEN 1 ELSE 0 END) AS pers_5_dias
            FROM pagos p
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE to_char(a.fecha_vencimiento, 'YYYY-MM') = $1
        `;

        const result = await db.query(query, [mes]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR PLANES-DIAS:", error);
        res.status(500).json({ error: "Error estadísticas planes-dias" });
    }
});

// ===============================
// 💰 INGRESOS DEL MES
// (según fecha de pago)
// ===============================
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
            if (r.metodo_pago === "efectivo" || r.metodo_pago === "transferencia") {
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
