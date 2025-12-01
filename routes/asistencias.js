import express from "express";
const router = express.Router();
import db from "../database/db.js";

// Obtener lunes y domingo de la semana actual
function getRangoSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=domingo, 1=lunes
    const diffLunes = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { lunes, domingo };
}

// POST /asistencias
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;
        if (!dni) return res.status(400).json({ error: "Debe enviar un DNI" });

        // Buscar alumno
        const alumnoRes = await db.query(
            "SELECT * FROM alumnos WHERE dni = $1",
            [dni]
        );

        if (alumnoRes.rows.length === 0)
            return res.status(404).json({ error: "Alumno no encontrado" });

        const alumno = alumnoRes.rows[0];
        const idAlumno = alumno.id;
        const limiteSemanal = alumno.dias_semana;

        // Armar texto de planes
        const planesArr = [];
        if (alumno.plan_eg) planesArr.push("Plan EG");
        if (alumno.plan_personalizado) planesArr.push("Personalizado");
        if (alumno.plan_running) planesArr.push("Running");
        const textoPlanes = planesArr.join(" + ") || "-";

        // Última cuota
        const cuotaRes = await db.query(
            `SELECT fecha_vencimiento
             FROM cuotas
             WHERE id_alumno = $1
             ORDER BY fecha_vencimiento DESC
             LIMIT 1`,
            [idAlumno]
        );

        let cuota = cuotaRes.rows[0] || null;
        let alertaCuota = null;

        if (cuota) {
            const hoy = new Date();
            const vto = new Date(cuota.fecha_vencimiento);
            if (vto < hoy) alertaCuota = "La cuota está vencida. Regularizar el pago.";
        }

        // Asistencias esta semana
        const { lunes, domingo } = getRangoSemanaActual();

        const asistRes = await db.query(
            `SELECT COUNT(*) FROM asistencias
             WHERE id_alumno = $1
             AND fecha BETWEEN $2 AND $3`,
            [idAlumno, lunes, domingo]
        );

        const asistenciasSemana = Number(asistRes.rows[0].count);
        let seRegistra = true;
        let alertaDias = null;

        // Exceso de días → no registrar
        if (limiteSemanal && asistenciasSemana >= limiteSemanal) {
            seRegistra = false;
            alertaDias = `Ya usaste tus ${limiteSemanal} días esta semana.`;
        }

        // Registrar asistencia si corresponde
        if (seRegistra) {
            await db.query(
                `INSERT INTO asistencias (id_alumno, fecha, hora)
                 VALUES ($1, CURRENT_DATE, CURRENT_TIME)`,
                [idAlumno]
            );
        }

        // Respuesta final
        return res.json({
            se_registro: seRegistra,
            alumno: {
                id_alumno: alumno.id,
                nombre: alumno.nombre,
                apellido: alumno.apellido,
                dni: alumno.dni,
                nivel: alumno.nivel,
                equipo: alumno.equipo,
                planes: textoPlanes,
            },
            cuota: cuota
                ? { fecha_vencimiento: cuota.fecha_vencimiento }
                : null,
            limite_semanal: limiteSemanal,
            asistencias_semana: seRegistra
                ? asistenciasSemana + 1
                : asistenciasSemana,
            alerta_cuota: alertaCuota,
            alerta_dias: alertaDias,
        });

    } catch (err) {
        console.error("ERROR ASISTENCIAS:", err);
        res.status(500).json({ error: "Error del servidor" });
    }
});

export default router;
