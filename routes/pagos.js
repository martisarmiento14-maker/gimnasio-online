import express from "express";
import db from "../database/db.js";
import generarMesesDesdeFecha from "./generarMeses.js";


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
        // 1️⃣ fecha vencimiento actual
        const alumnoRes = await db.query(
            `SELECT fecha_vencimiento FROM alumnos WHERE id = $1`,
            [id_alumno]
        );

        if (!alumnoRes.rows.length) {
            return res.status(404).json({ error: "Alumno no existe" });
        }

        const fechaVenc = new Date(alumnoRes.rows[0].fecha_vencimiento);

        // 2️⃣ registrar pago (UNA VEZ)
        await db.query(
            `
            INSERT INTO pagos
            (id_alumno, monto, metodo_pago, fecha_pago, tipo, plan, dias_por_semana)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
            `,
            [id_alumno, monto, metodo_pago, tipo, plan, dias_por_semana]
        );

        // 3️⃣ generar meses desde mes siguiente
        // 3️⃣ generar meses desde mes siguiente
        // 👉 fecha actual de vencimiento
        // 3️⃣ generar meses y nueva fecha de vencimiento
        const fechaActual = new Date(alumnoRes.rows[0].fecha_vencimiento);
        const diaOriginal = fechaActual.getDate();

        // 👉 generar periodos YYYY-MM
        const meses = generarMesesDesdeFecha(fechaActual, cantidad_meses);

        // 👉 calcular nueva fecha de vencimiento
        let nuevaFecha = new Date(fechaActual);
        nuevaFecha.setMonth(nuevaFecha.getMonth() + cantidad_meses);

        // 👉 corregir meses cortos (31 → 30 / feb)
        if (nuevaFecha.getDate() !== diaOriginal) {
            nuevaFecha.setDate(0);
        }

        for (const periodo of meses) {
            await db.query(
                `
                INSERT INTO membresias
                (id_alumno, periodo_mes, tipo, plan, dias_por_semana)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id_alumno, periodo_mes) DO NOTHING
                `,
                [id_alumno, periodo, tipo, plan, dias_por_semana]
            );
        }

        // 4️⃣ actualizar fecha vencimiento al ÚLTIMO MES
        await db.query(
            `UPDATE alumnos SET fecha_vencimiento = $1 WHERE id = $2`,
            [nuevaFecha, id_alumno]
        );

        res.json({ ok: true, meses });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error registrando pago" });
    }
});

export default router;
