import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* ============================================================
   📌 LUNES DE ESTA SEMANA (inicio de semana)
============================================================ */
const lunesSQL = `
    (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day')
`;

/* ============================================================
   📌 POST — REGISTRAR ASISTENCIA
============================================================ */
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Falta DNI" });
        }

        // 1) Buscar alumno activo
        const alumnoQuery = await pool.query(
            "SELECT * FROM alumnos WHERE dni = $1 AND activo = 1",
            [dni]
        );

        if (alumnoQuery.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado o desactivado" });
        }

        const alumno = alumnoQuery.rows[0];

        // 2) Vencimiento
        const hoy = new Date();
        const fechaVenc = new Date(alumno.fecha_vencimiento);
        const vencido = fechaVenc < hoy;

        // 3) Límite semanal según planes
        let limiteSemanal = 0;
        if (alumno.plan_eg) limiteSemanal += alumno.dias_semana;
        if (alumno.plan_personalizado) limiteSemanal += alumno.dias_semana;
        if (alumno.plan_running) limiteSemanal += 2;
        if (limiteSemanal === 0) limiteSemanal = alumno.dias_semana;

        // 4) Asistencias esta semana (desde lunes)
        const semanaQuery = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha >= ${lunesSQL}
            `,
            [alumno.id]
        );
        const asistenciasSemana = parseInt(semanaQuery.rows[0].total);

        // 5) Verificar si YA vino hoy
        const hoyQuery = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha = CURRENT_DATE
            `,
            [alumno.id]
        );
        const asistioHoy = parseInt(hoyQuery.rows[0].total) > 0;

        // 🟥 Ya registró hoy
        if (asistioHoy) {
            return res.json({
                ok: false,
                motivo: "ya_registrado",
                mensaje: "Ya registraste asistencia hoy",
                alumno,
                asistenciasSemana,
                asistencias_semana: asistenciasSemana,
                limiteSemanal,
                limite_semanal: limiteSemanal,
                vencido,
            });
        }

        // 🟥 Límite semanal superado
        if (asistenciasSemana >= limiteSemanal) {
            return res.json({
                ok: false,
                motivo: "limite_semana",
                mensaje: "Ya superaste tu límite semanal",
                alumno,
                asistenciasSemana,
                asistencias_semana: asistenciasSemana,
                limiteSemanal,
                limite_semanal: limiteSemanal,
                vencido,
            });
        }

        // 6) Registrar asistencia
        await pool.query(
            "INSERT INTO asistencias (id_alumno, fecha, hora) VALUES ($1, CURRENT_DATE, CURRENT_TIME)",
            [alumno.id]
        );

        const nuevasAsistencias = asistenciasSemana + 1;

        // 🟩 Respuesta final
        return res.json({
            ok: true,
            motivo: vencido ? "vencido" : "ok",
            mensaje: vencido
                ? `Tu cuota está vencida desde ${alumno.fecha_vencimiento}`
                : "Asistencia registrada correctamente",
            alumno,
            asistenciasSemana: nuevasAsistencias,
            asistencias_semana: nuevasAsistencias,
            limiteSemanal,
            limite_semanal: limiteSemanal,
            vencido,
        });

    } catch (error) {
        console.error("ERROR POST /asistencias:", error);
        res.status(500).json({ error: "Error al registrar asistencia" });
    }
});

export default router;
