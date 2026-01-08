import express from "express";
import db from "../database/db.js";
import generarMeses from "./generarMeses.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const {
        id_alumno,
        monto,
        metodo_pago,
        tipo,
        plan,
        dias_por_semana
    } = req.body;

    const cantidad_meses = Number(req.body.cantidad_meses || 1);


    if (isNaN(cantidad_meses) || cantidad_meses < 1) {
        return res.status(400).json({
            error: "cantidad_meses inválida"
        });
    }


    try {
        const pagoResult = await db.query(
            `
            INSERT INTO pagos
            (id_alumno, monto, metodo_pago, fecha_pago, tipo, plan, dias_por_semana)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
            RETURNING id, fecha_pago
            `,
            [
                id_alumno,
                monto,
                metodo_pago,
                tipo,
                plan || null,
                dias_por_semana || null
            ]
        );

        const { id: id_pago, fecha_pago } = pagoResult.rows[0];

        const meses = generarMeses(new Date(fecha_pago), cantidad_meses);

        for (const periodo_mes of meses) {
            await db.query(
                `
                INSERT INTO membresias
                (id_alumno, periodo_mes, tipo, plan, dias_por_semana)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id_alumno, periodo_mes) DO NOTHING
                `,
                [
                    id_alumno,
                    periodo_mes,
                    tipo,
                    plan || null,
                    dias_por_semana || null
                ]
            );
        }
        console.log("🧪 fecha_pago:", fecha_pago);
        console.log("🧪 cantidad_meses:", cantidad_meses);
        console.log("🧪 meses generados:", meses);


        res.json({
            ok: true,
            mensaje: "Pago y membresías registradas correctamente",
            id_pago,
            meses
        });

    } catch (error) {
        console.error("❌ ERROR REAL:", error);
        res.status(500).json({ error: "Error registrando pago" });
    }
});

export default router;
