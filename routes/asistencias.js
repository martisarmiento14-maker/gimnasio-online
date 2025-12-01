// routes/asistencias.js
const express = require("express");
const router = express.Router();
const pool = require("../database/db"); // PostgreSQL

// ---------------------------------------
// OBTENER LUNES Y DOMINGO DE LA SEMANA ACTUAL
// ---------------------------------------
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

// ---------------------------------------
// POST /asistencias  → Registrar asistencia por DNI
// ---------------------------------------
router.post("/", async (req, res) => {
    const { dni } = req.body;

    if (!dni) {
        return res.status(400).json({ error: "Debe enviar un DNI" });
    }

    try {
        // -----------------------------------------------------
        // 1) Buscar alumno por DNI
        // -----------------------------------------------------
        const alumnoRes = await pool.query(
            "SELECT * FROM alumnos WHERE dni = $1 AND activo = 1",
            [dni]
        );

        if (alumnoRes.rowCount === 0) {
            return res.status(404).json({ error: "Alumno no encontrado o inactivo" });
        }

        const alumno = alumnoRes.rows[0];
        const idAlumno = alumno.id;

        // Limite por semana
        const limiteSemanal = alumno.dias_semana || null;

        // Texto del plan igual que tu versión vieja
        const planesArr = [];
        if (alumno.plan_eg) planesArr.push("Plan EG");
        if (alumno.plan_personalizado) planesArr.push("Personalizado");
        if (alumno.plan_running) planesArr.push("Running");

        const textoPlanes = planesArr.length ? planesArr.join(" + ") : "-";

        // -----------------------------------------------------
        // 2) Fecha de vencimiento → VIENE DESDE ALUMNOS AHORA
        // -----------------------------------------------------
        let estadoCuota = null;
        let alertaCuota = null;

        if (alumno.fecha_vencimiento) {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);

            const vto = new Date(alumno.fecha_vencimiento);
            vto.setHours(0,0,0,0);

            if (vto < hoy) {
                estadoCuota = "vencida";
                alertaCuota = "La cuota está vencida. Deberías regularizar el pago.";
            } else {
                estadoCuota = "vigente";
            }
        }

        // -----------------------------------------------------
        // 3) Contar asistencias de esta semana
        // -----------------------------------------------------
        const { lunes, domingo } = getRangoSemanaActual();

        const asistRes = await pool.query(
            `SELECT COUNT(*) AS total
             FROM asistencias
             WHERE id_alumno = $1
             AND fecha BETWEEN $2 AND $3`,
            [idAlumno, lunes, domingo]
        );

        const asistenciasSemana = Number(asistRes.rows[0].total);
        let seRegistra = true;
        let alertaDias = null;

        if (limiteSemanal && asistenciasSemana >= limiteSemanal) {
            seRegistra = false;
            alertaDias = `Ya usaste tus ${limiteSemanal} días de entrenamiento esta semana.`;
        }

        // -----------------------------------------------------
        // 4) Registrar asistencia (si corresponde)
        // -----------------------------------------------------
        let asistenciasSemanaFinal = asistenciasSemana;

        if (seRegistra) {
            await pool.query(
                "INSERT INTO asistencias (id_alumno, fecha) VALUES ($1, NOW())",
                [idAlumno]
            );

            asistenciasSemanaFinal++;
        }

        // -----------------------------------------------------
        // 5) Respuesta final
        // -----------------------------------------------------
        return res.json({
            se_registro: seRegistra,
            alumno: {
                id: alumno.id,
                nombre: alumno.nombre,
                apellido: alumno.apellido,
                dni: alumno.dni,
                nivel: alumno.nivel,
                equipo: alumno.equipo,
                planes: textoPlanes,
                telefono: alumno.telefono
            },
            cuota: alumno.fecha_vencimiento
                ? {
                    fecha_vencimiento: alumno.fecha_vencimiento,
                    estado: estadoCuota,
                }
                : null,

            limite_semanal: limiteSemanal,
            asistencias_semana: asistenciasSemanaFinal,

            alerta_cuota: alertaCuota,
            alerta_dias: alertaDias,
        });

    } catch (error) {
        console.error("Error registrando asistencia:", error);
        res.status(500).json({ error: "Error de servidor" });
    }
});

module.exports = router;
