import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* =========================================================
   POST — REGISTRAR ASISTENCIA AUTOMÁTICAMENTE POR DNI
   ========================================================= */
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Falta el DNI" });
        }

        // 1️⃣ BUSCAR ALUMNO
        const alumnoQuery = await pool.query(
            "SELECT * FROM alumnos WHERE dni = $1",
            [dni]
        );

        if (alumnoQuery.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const alumno = alumnoQuery.rows[0];

        // FORMAR LISTA DE PLANES PARA MOSTRAR
        let planes = [];
        if (alumno.plan_eg) planes.push("EG");
        if (alumno.plan_personalizado) planes.push("Personalizado");
        if (alumno.plan_running) planes.push("Running");

        alumno.planes = planes.length ? planes.join(" - ") : "Sin plan";

        // 2️⃣ VERIFICAR VENCIMIENTO CUOTA
        const hoy = new Date();
        const fechaVenc = new Date(alumno.fecha_vencimiento);
        const vencido = fechaVenc < hoy;

        // 3️⃣ CONTAR ASISTENCIAS DE LA SEMANA
        const asistQuery = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha >= date_trunc('week', CURRENT_DATE)
            `,
            [alumno.id]
        );

        const asistenciasSemana = Number(asistQuery.rows[0].total);
        const limite = alumno.dias_semana ?? 0;

        // 4️⃣ BLOQUEAR SI SUPERÓ EL LÍMITE SEMANAL
        if (limite > 0 && asistenciasSemana >= limite) {
            return res.json({
                alumno,
                asistencias_semana: asistenciasSemana,
                limite_semanal: limite,
                alerta_dias: "❗ Ya llegaste a tu límite semanal",
                alerta_cuota: null,
                se_registro: false
            });
        }

        // 5️⃣ REGISTRAR ASISTENCIA AUTOMÁTICAMENTE
        await pool.query(
            "INSERT INTO asistencias (id_alumno, fecha, hora) VALUES ($1, CURRENT_DATE, CURRENT_TIME)",
            [alumno.id]
        );

        // 6️⃣ RESPUESTA FINAL
        return res.json({
            alumno,
            asistencias_semana: asistenciasSemana + 1,
            limite_semanal: limite,
            alerta_dias: null,
            alerta_cuota: vencido ? "⚠ Cuota vencida" : null,
            se_registro: true
        });

    } catch (error) {
        console.error("ERROR POST /asistencias:", error);
        return res.status(500).json({ error: "Error registrando asistencia" });
    }
});

export default router;
