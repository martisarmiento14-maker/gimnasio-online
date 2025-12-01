import express from "express";
const router = express.Router();
import db from "../database/db.js";

// -------------------------------
// Obtener rango de semana actual
// -------------------------------
function getRangoSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 domingo, 1 lunes...
    const diffLunes = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { lunes, domingo };
}

// -------------------------------
// POST /asistencias
// Registrar asistencia por DNI
// -------------------------------
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Debe enviar un DNI" });
        }

        // 1) Buscar Alumno
        const alumnoRes = await db.query(
            "SELECT * FROM alumnos WHERE dni = $1",
            [dni]
        );

        if (alumnoRes.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const alumno = alumnoRes.rows[0];
        const idAlumno = alumno.id;

        // 2) Obtener límite semanal
        const limiteSemanal = alumno.dias_semana;

        // 3) Buscar última cuota
        const cuotaRes = await db.query(
            `SELECT *
             FROM cuotas
             WHERE id_alumno = $1
             ORDER BY fecha_vencimiento DESC
             LIMIT 1`,
            [idAlumno]
        );

        const cuota = cuotaRes.rows[0] || null;

        let estadoCuota = null;
        let alertaCuota = null;

        if (cuota) {
            const hoy = new Date();
            const vto = new Date(cuota.fecha_vencimiento);

            if (vto < hoy) {
                estadoCuota = "vencida";
                alertaCuota = "La cuota está vencida. Deberías regularizar el pago.";
            } else {
                estadoCuota = "vigente";
            }
        }

        // 4) Obtener rango semana
        const { lunes, domingo } = getRangoSemanaActual();

        // 5) Contar asistencias de esta semana
        const asistRes = await db.query(
            `SELECT COUNT(*) AS total
             FROM asistencias
             WHERE id_alumno = $1
             AND fecha BETWEEN $2 AND $3`,
            [idAlumno, lunes, domingo]
        );

        const asistenciasSemana = Number(asistRes.rows[0].total);

        // 6) Verificar límite semanal
        if (limiteSemanal && asistenciasSemana >= limiteSemanal) {
            return res.json({
                se_registro: false,
                mensaje: `Ya usaste tus ${limiteSemanal} días de entrenamiento esta semana.`,
                asistencias_semana: asistenciasSemana,
                alerta_cuota: alertaCuota
            });
        }

        // 7) Registrar asistencia
        await db.query(
            `INSERT INTO asistencias (id_alumno, fecha, hora)
            VALUES ($1, CURRENT_DATE, CURRENT_TIME)`,
            [idAlumno]
        );

        return res.json({
            se_registro: true,
            mensaje: "Asistencia registrada correctamente",
            asistencias_semana: asistenciasSemana + 1,
            alerta_cuota: alertaCuota
        });

    } catch (err) {
        console.error("ERROR ASISTENCIAS:", err);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

export default router;
