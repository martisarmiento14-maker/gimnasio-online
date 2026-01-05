import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { mes } = req.query; // formato: YYYY-MM

    if (!mes) {
        return res.status(400).json({ error: "Mes requerido" });
    }

    try {
        const desde = `${mes}-01`;
        const hasta = `${mes}-31`;

        // ===============================
        // 1️⃣ ALTAS + RENOVACIONES
        // ===============================
        const totalAlumnos = await db.query(`
            SELECT tipo, COUNT(*)::int AS count
            FROM pagos
            WHERE fecha_pago BETWEEN $1 AND $2
            GROUP BY tipo
        `, [desde, hasta]);

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
            AND p.fecha_pago BETWEEN $1 AND $2
            GROUP BY a.plan_eg, a.plan_personalizado, a.plan_running
        `, [desde, hasta]);

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
            WHERE fecha_pago BETWEEN $1 AND $2
            GROUP BY metodo_pago
        `, [desde, hasta]);

        res.json({
            totalAlumnos: totalAlumnos.rows,
            planes: planes.rows,
            egDias: egDias.rows,
            persDias: persDias.rows,
            ingresos: ingresos.rows
        });

    } catch (error) {
        console.error("❌ ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
