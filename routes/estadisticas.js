import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { mes } = req.query; // YYYY-MM

    if (!mes) {
        return res.status(400).json({ error: "Mes requerido" });
    }

    const [year, month] = mes.split("-").map(Number);

    try {
        // ===============================
        // 1️⃣ ALTAS + RENOVACIONES
        // ===============================
        const totalAlumnos = await db.query(`
            SELECT tipo, COUNT(*)::int AS count
            FROM pagos
            WHERE EXTRACT(YEAR FROM fecha_pago) = $1
              AND EXTRACT(MONTH FROM fecha_pago) = $2
            GROUP BY tipo
        `, [year, month]);

        // ===============================
        // 2️⃣ PLANES (ALTAS)
        // ===============================
        const planes = await db.query(`
            SELECT
                a.plan_eg,
                a.plan_personalizado,
                a.plan_running,
                COUNT(*)::int AS total
            FROM alumnos a
            JOIN pagos p ON a.id = p.alumno_id
            WHERE p.tipo = 'alta'
              AND EXTRACT(YEAR FROM p.fecha_pago) = $1
              AND EXTRACT(MONTH FROM p.fecha_pago) = $2
            GROUP BY a.plan_eg, a.plan_personalizado, a.plan_running
        `, [year, month]);

        // ===============================
        // 3️⃣ EG por días
        // ===============================
        const egDias = await db.query(`
            SELECT dias_eg_pers, COUNT(*)::int AS count
            FROM alumnos
            WHERE plan_eg = true
            GROUP BY dias_eg_pers
        `);

        // ===============================
        // 4️⃣ PERSONALIZADO por días
        // ===============================
        const persDias = await db.query(`
            SELECT dias_eg_pers, COUNT(*)::int AS count
            FROM alumnos
            WHERE plan_personalizado = true
            GROUP BY dias_eg_pers
        `);

        // ===============================
        // 5️⃣ INGRESOS
        // ===============================
        const ingresos = await db.query(`
            SELECT metodo_pago, SUM(monto)::int AS sum
            FROM pagos
            WHERE EXTRACT(YEAR FROM fecha_pago) = $1
              AND EXTRACT(MONTH FROM fecha_pago) = $2
            GROUP BY metodo_pago
        `, [year, month]);

        res.json({
            totalAlumnos: totalAlumnos.rows,
            planes: planes.rows,
            egDias: egDias.rows,
            persDias: persDias.rows,
            ingresos: ingresos.rows
        });

    } catch (error) {
        console.error("❌ ERROR ESTADISTICAS REAL:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
