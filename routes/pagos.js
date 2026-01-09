import express from "express";
import db from "../database/db.js";

const router = express.Router();

function generarPeriodos(desdeYYYYMM, cantidad) {
    const [y, m] = desdeYYYYMM.split("-").map(Number);
    const meses = [];

    let year = y;
    let month = m;

    for (let i = 0; i < cantidad; i++) {
        month++;

        if (month > 12) {
            month = 1;
            year++;
        }

        meses.push(`${year}-${String(month).padStart(2, "0")}`);
    }

    return meses;
}

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
        // 1️⃣ Traer fecha de vencimiento
        const alumnoRes = await db.query(
            `SELECT fecha_vencimiento FROM alumnos WHERE id = $1`,
            [id_alumno]
        );

        if (alumnoRes.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no existe" });
        }

        const fechaVenc = alumnoRes.rows[0].fecha_vencimiento; // YYYY-MM-DD
        const baseYYYYMM = fechaVenc.slice(0, 7); // 🔥 CLAVE

        // 2️⃣ Registrar pago (UNA VEZ)
        await db.query(
            `
            INSERT INTO pagos
            (id_alumno, monto, metodo_pago, fecha_pago, tipo, plan, dias_por_semana)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
            `,
            [id_alumno, monto, metodo_pago, tipo, plan, dias_por_semana]
        );

        // 3️⃣ Generar membresías
        const periodos = generarPeriodos(baseYYYYMM, cantidad_meses);

        for (const periodo_mes of periodos) {
            await db.query(
                `
                INSERT INTO membresias
                (id_alumno, periodo_mes, tipo, plan, dias_por_semana)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id_alumno, periodo_mes) DO NOTHING
                `,
                [id_alumno, periodo_mes, tipo, plan, dias_por_semana]
            );
        }

        res.json({
            ok: true,
            periodos
        });

    } catch (error) {
        console.error("❌ ERROR PAGO:", error);
        res.status(500).json({ error: "Error registrando pago" });
    }
});

export default router;


