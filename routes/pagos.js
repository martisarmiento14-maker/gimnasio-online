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
        dias_por_semana,
        cantidad_meses = 1
    } = req.body;

    try {
        // ===============================
        // 1️⃣ TRAER FECHA DE VENCIMIENTO
        // ===============================
        const alumnoRes = await db.query(
            `SELECT fecha_vencimiento FROM alumnos WHERE id = $1`,
            [id_alumno]
        );

        if (alumnoRes.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no existe" });
        }

        const fechaVencimiento = alumnoRes.rows[0].fecha_vencimiento;

        if (!fechaVencimiento) {
            return res.status(400).json({
                error: "Alumno sin fecha de vencimiento"
            });
        }

        // 👉 MES SIGUIENTE AL VENCIMIENTO
        const inicio = new Date(fechaVencimiento);
        inicio.setMonth(inicio.getMonth() + 1);
        inicio.setDate(1);

        // ===============================
        // 2️⃣ REGISTRAR EL PAGO (1 VEZ)
        // ===============================
        await db.query(
            `
            INSERT INTO pagos
            (id_alumno, monto, metodo_pago, fecha_pago, tipo, plan, dias_por_semana)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
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

        // ===============================
        // 3️⃣ GENERAR MEMBRESÍAS
        // ===============================
        const meses = generarMeses(inicio, cantidad_meses);

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

        res.json({
            ok: true,
            meses
        });

    } catch (error) {
        console.error("❌ ERROR PAGO:", error);
        res.status(500).json({
            error: "Error registrando pago"
        });
    }
});

export default router;

