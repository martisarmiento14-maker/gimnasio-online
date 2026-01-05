import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { mes } = req.query;

    try {
        const totalAlumnos = await db.query(`
            SELECT tipo, COUNT(*) 
            FROM pagos
            WHERE TO_CHAR(fecha_pago, 'YYYY-MM') = $1
            GROUP BY tipo
        `, [mes]);

        const planes = await db.query(`
            SELECT
                plan_eg,
                plan_personalizado,
                plan_running,
                COUNT(*) as total
            FROM alumnos a
            JOIN pagos p ON a.id = p.alumno_id
            WHERE p.tipo = 'alta'
            AND TO_CHAR(p.fecha_pago, 'YYYY-MM') = $1
            GROUP BY plan_eg, plan_personalizado, plan_running
        `, [mes]);

        const egDias = await db.query(`
            SELECT dias_eg_pers, COUNT(*) 
            FROM alumnos
            WHERE plan_eg = true
            GROUP BY dias_eg_pers
        `);

        const persDias = await db.query(`
            SELECT dias_eg_pers, COUNT(*) 
            FROM alumnos
            WHERE plan_personalizado = true
            GROUP BY dias_eg_pers
        `);

        const ingresos = await db.query(`
            SELECT metodo_pago, SUM(monto)
            FROM pagos
            WHERE TO_CHAR(fecha_pago, 'YYYY-MM') = $1
            GROUP BY metodo_pago
        `, [mes]);

        res.json({
            totalAlumnos: totalAlumnos.rows,
            planes: planes.rows,
            egDias: egDias.rows,
            persDias: persDias.rows,
            ingresos: ingresos.rows
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
