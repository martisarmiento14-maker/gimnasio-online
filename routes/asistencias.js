import express from "express";
import db from "../database/db.js";

const router = express.Router();

// ----------------------------------------------------------
//  Obtener lunes y domingo de la semana actual
// ----------------------------------------------------------
function getRangoSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=domingo, 1=lunes...
    const diffLunes = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { lunes, domingo };
}

// ----------------------------------------------------------
//  POST /asistencias → Registrar asistencia por DNI
// ----------------------------------------------------------
router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Debe enviar un DNI" });
        }

        // ----------------------------------------------------------
        // 1) Buscar alumno por DNI
        // ----------------------------------------------------------
        const sqlAlumno = `SELECT * FROM alumnos WHERE dni = $1 AND activo = 1`;
        const resultAlumno = await db.query(sqlAlumno, [dni]);

        if (resultAlumno.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const alumno = resultAlumno.rows[0];
        const idAlumno = alumno.id;
        const limiteSemanal = alumno.dias_semana || null;

        // Armar texto del plan
        const planesArr = [];
        if (alumno.plan_eg) planesArr.push("Plan EG");
        if (alumno.plan_personalizado) planesArr.push("Personalizado");
        if (alumno.plan_running) planesArr.push("Running");

        const textoPlanes = planesArr.length ? planesArr.join(" + ") : "-";

        // ----------------------------------------------------------
        // 2) Buscar última cuota (usamos fecha_pago como vencimiento)
        // ----------------------------------------------------------
        const sqlCuota = `
            SELECT *
            FROM cuotas
            WHERE id_alumno = $1
            ORDER BY fecha_pago DESC
            LIMIT 1
        `;
        const resultCuota = await db.query(sqlCuota, [idAlumno]);

        const cuota = resultCuota.rows.length ? resultCuota.rows[0] : null;

        let alertaCuota = null;
        let estadoCuota = null;

        if (cuota) {
            const hoy = new Date();
            const vto = new Date(cuota.fecha_pago);

            if (vto < hoy) {
                estadoCuota = "vencida";
                alertaCuota = "La cuota está vencida. Regularizá el pago.";
            } else {
                estadoCuota = "vigente";
            }
        }

        // ----------------------------------------------------------
        // 3) Contar asistencias semanales
        // ----------------------------------------------------------
        const { lunes, domingo } = getRangoSemanaActual();

        const sqlCount = `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha BETWEEN $2 AND $3
        `;

        const resultAsist = await db.query(sqlCount, [idAlumno, lunes, domingo]);
        const asistenciasSemana = Number(resultAsist.rows[0].total);

        let seRegistra = true;
        let alertaDias = null;
        let asistenciasSemanaFinal = asistenciasSemana;

        // Si ya usó todos sus días
        if (limiteSemanal && asistenciasSemana >= limiteSemanal) {
            seRegistra = false;
            alertaDias = `Ya usaste tus ${limiteSemanal} días de entrenamiento esta semana.`;
        }

        // ----------------------------------------------------------
        // 4) Registrar asistencia (solo si se permite)
        // ----------------------------------------------------------
        if (seRegistra) {
            const sqlInsert = `
                INSERT INTO asistencias (id_alumno, fecha, hora)
                VALUES ($1, CURRENT_DATE, CURRENT_TIME)
            `;
            await db.query(sqlInsert, [idAlumno]);

            asistenciasSemanaFinal++;
        }

        // ----------------------------------------------------------
        // 5) Respuesta final al frontend
        // ----------------------------------------------------------
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
                ? {
                    fecha_vencimiento: cuota.fecha_pago,
                    estado: estadoCuota,
                }
                : null,
            limite_semanal: limiteSemanal,
            asistencias_semana: asistenciasSemanaFinal,
            alerta_cuota: alertaCuota,
            alerta_dias: alertaDias,
        });

    } catch (error) {
        console.error("ERROR EN /asistencias:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
