import express from "express";
import db from "../database/db.js";

const router = express.Router();

// ==========================
// 💰 INGRESOS DEL MES
// ==========================
router.get("/ingresos", async (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({
            error: "mes requerido (YYYY-MM)"
        });
    }

    try {
        const result = await db.query(
            `
            SELECT
                metodo_pago,
                SUM(monto) AS total
            FROM pagos
            WHERE TO_CHAR(fecha_pago, 'YYYY-MM') = $1
            GROUP BY metodo_pago
            `,
            [mes]
        );

        const respuesta = {
            efectivo: 0,
            transferencia: 0,
            total: 0
        };

        result.rows.forEach(r => {
            const monto = Number(r.total);

            if (r.metodo_pago === "efectivo") {
                respuesta.efectivo = monto;
            }

            if (r.metodo_pago === "transferencia") {
                respuesta.transferencia = monto;
            }

            respuesta.total += monto;
        });

        res.json(respuesta);

    } catch (error) {
        console.error("ERROR INGRESOS:", error);
        res.status(500).json({
            error: "Error obteniendo ingresos"
        });
    }
});
// ==========================
// 👥 ALUMNOS DEL MES (ALTAS + RENOVACIONES)
// ==========================
router.get("/alumnos", async (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({
            error: "mes requerido (YYYY-MM)"
        });
    }

    try {
        const result = await db.query(
            `
            SELECT
                COUNT(DISTINCT id_alumno) AS total
            FROM pagos
            WHERE TO_CHAR(fecha_pago, 'YYYY-MM') = $1
            `,
            [mes]
        );

        res.json({
            total: Number(result.rows[0].total)
        });

    } catch (error) {
        console.error("ERROR ALUMNOS MES:", error);
        res.status(500).json({
            error: "Error obteniendo alumnos del mes"
        });
    }
});

export default router;
