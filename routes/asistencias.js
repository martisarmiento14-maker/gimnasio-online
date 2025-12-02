import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* =====================================================
   REGISTRAR ASISTENCIA (BACKEND DEFINITIVO)
   ===================================================== */
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) return res.status(400).json({ error: "Faltó el DNI" });

        // 1) Buscar alumno activo por DNI
        const alumnoQuery = await pool.query(
            "SELECT * FROM alumnos WHERE dni = $1 AND activo = 1",
            [dni]
        );

        if (alumnoQuery.rows.length === 0) {
            return res.status(404).json({ error: "No existe un alumno activo con ese DNI" });
        }

        const alumno = alumnoQuery.rows[0];

        // 2) Lógica de planes (para mostrar en frontend)
        let planes = [];
        if (alumno.plan_eg) planes.push("EG");
        if (alumno.plan_personalizado) planes.push("Personalizado");
        if (alumno.plan_running) planes.push("Running");

        alumno.planes = planes.length ? planes.join(" + ") : "Sin plan";

        // 3) Verificar vencimiento
        const hoy = new Date();
        const fechaVenc = new Date(alumno.fecha_vencimiento);
        const vencido = fechaVenc < hoy;

        // 4) Cantidad de asistencias de la semana
        const asistenciasSemanaQuery = await pool.query(
            `
            SELECT COUNT(*) 
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha >= date_trunc('week', CURRENT_DATE)
            `,
            [alumno.id]
        );

        const asistenciasSemana = parseInt(asistenciasSemanaQuery.rows[0].count);

        // 5) Comprobar si YA REGISTRÓ HOY (evita que duplique)
        const hoyAsistencia = await pool.query(
            `
            SELECT 1 
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha = CURRENT_DATE
            `,
            [alumno.id]
        );

        const yaRegistroHoy = hoyAsistencia.rows.length > 0;

        // 6) Caso: ya alcanzó su límite semanal
        if (alumno.dias_semana > 0 && asistenciasSemana >= alumno.dias_semana && !yaRegistroHoy) {
            return res.json({
                alumno,
                asistencias_semana: asistenciasSemana,
                limite_semanal: alumno.dias_semana,
                se_registro: false,
                alerta_dias: "❗ Ya agotaste tus días de entrenamiento esta semana",
                alerta_cuota: vencido ? "⚠ Cuota vencida" : null
            });
        }

        // 7) Si ya pasó hoy → NO registrar de nuevo
        if (yaRegistroHoy) {
            return res.json({
                alumno,
                asistencias_semana: asistenciasSemana,
                limite_semanal: alumno.dias_semana,
                se_registro: false,
                alerta_dias: "⚠ Ya registraste asistencia hoy",
                alerta_cuota: vencido ? "⚠ Cuota vencida" : null
            });
        }

        // 8) Registrar asistencia
        await pool.query(
            "INSERT INTO asistencias (id_alumno, fecha, hora) VALUES ($1, CURRENT_DATE, CURRENT_TIME)",
            [alumno.id]
        );

        // 9) Respuesta final
        return res.json({
            alumno,
            asistencias_semana: asistenciasSemana + 1,
            limite_semanal: alumno.dias_semana,
            se_registro: true,
            alerta_dias: null,
            alerta_cuota: vencido ? "⚠ Cuota vencida" : null
        });

    } catch (error) {
        console.error("ERROR POST /asistencias:", error);
        res.status(500).json({ error: "Error al registrar asistencia" });
    }
});

export default router;
