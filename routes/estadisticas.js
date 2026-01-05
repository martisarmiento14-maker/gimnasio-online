import express from "express";
import db from "../database/db.js";

const router = express.Router();

/* =====================================================
   📊 ESTADÍSTICAS FINANZAS (por mes y año)
===================================================== */
router.get("/", async (req, res) => {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y año requeridos" });
        }

        /* ================= PAGOS ================= */
        const pagos = await db.query(`
            SELECT 
                metodo_pago,
                SUM(monto) AS total
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR FROM fecha_pago) = $2
            GROUP BY metodo_pago
        `, [mes, anio]);

        const ingresos = {
            efectivo: 0,
            transferencia: 0
        };

        pagos.rows.forEach(p => {
            ingresos[p.metodo_pago] = Number(p.total);
        });

        /* ================= PLANES ================= */
        const planes = await db.query(`
            SELECT 
                tipo,
                COUNT(*) AS cantidad
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR FROM fecha_pago) = $2
            GROUP BY tipo
        `, [mes, anio]);

        const planesData = {
            altas: { eg: 0, personalizado: 0, running: 0 },
            renovaciones: { eg: 0, personalizado: 0, running: 0 }
        };

        planes.rows.forEach(p => {
            if (p.tipo === "alta") planesData.altas.eg += Number(p.cantidad);
            if (p.tipo === "renovacion") planesData.renovaciones.eg += Number(p.cantidad);
        });

        /* ================= EVOLUCIÓN ================= */
        const evolucion = await db.query(`
            SELECT 
                TO_CHAR(fecha_pago, 'YYYY-MM') AS mes,
                SUM(monto) AS ingresos,
                COUNT(*) FILTER (WHERE tipo = 'renovacion') AS renovaciones
            FROM pagos
            GROUP BY mes
            ORDER BY mes
        `);

        res.json({
            ingresos,
            planes: planesData,
            evolucion: evolucion.rows
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
