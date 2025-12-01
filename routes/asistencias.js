// routes/asistencias.js
import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* ============================================
   REGISTRAR ASISTENCIA (BUSCAR POR DNI)
   ============================================ */
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Faltó el DNI" });
        }

        // 1) Buscar alumno por DNI
        const alumnoQuery = await pool.query(
            "SELECT * FROM alumnos WHERE dni = $1",
            [dni]
        );

        if (alumnoQuery.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const alumno = alumnoQuery.rows[0];

        // 2) Verificar vencimiento
        const hoy = new Date();
        const fechaVenc = new Date(alumno.fecha_vencimiento);
        const vencido = fechaVenc < hoy;

        // 3) Ver cuántas asistencias lleva esta semana
        const asistenciasSemanaQuery = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha >= date_trunc('week', CURRENT_DATE)
            `,
            [alumno.id]
        );

        const asistenciasSemana = parseInt(asistenciasSemanaQuery.rows[0].total);

        // 4) Ver si agotó las clases del plan semanal
        let bloqueado = false;
        if (alumno.dias_semana > 0 && asistenciasSemana >= alumno.dias_semana) {
            bloqueado = true;
        }

        // 5) CASO BLOQUEADO POR LÍMITE SEMANAL
        if (bloqueado) {
            return res.json({
                ...alumno,
                vencido,
                bloqueado,
                mensaje: "❗ Ya agotaste tus entrenamientos de esta semana",
                asistenciaRegistrada: false
            });
        }

        // 6) Registrar asistencia (vencido o no)
        await pool.query(
            "INSERT INTO asistencias (id_alumno, fecha, hora) VALUES ($1, CURRENT_DATE, CURRENT_TIME)",
            [alumno.id]
        );

        // 7) Respuesta final
        res.json({
            ...alumno,
            vencido,
            bloqueado: false,
            mensaje: vencido
                ? "⚠ Alumno con cuota vencida (se registró asistencia)"
                : "Asistencia registrada correctamente",
            asistenciaRegistrada: true
        });

    } catch (error) {
        console.error("ERROR POST /asistencias:", error);
        res.status(500).json({ error: "Error al registrar asistencia" });
    }
});

export default router;
