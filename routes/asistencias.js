import express from "express";
import db from "../database/db.js";

const router = express.Router();

function getRangoSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diffLunes = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { lunes, domingo };
}

router.post("/", async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: "Debe enviar un DNI" });
        }

        const sqlAlumno = `SELECT * FROM alumnos WHERE dni = $1 AND activo = 1`;
        const r1 = await db.query(sqlAlumno, [dni]);

        if (r1.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const alumno = r1.rows[0];
        const idAlumno = alumno.id;

        const planesArr = [];
        if (alumno.plan_eg) planesArr.push("Plan EG");
        if (alumno.plan_personalizado) planesArr.push("Personalizado");
        if (alumno.plan_running) planesArr.push("Running");
        const textoPlanes = planesArr.length ? planesArr.join(" + ") : "-";

        // ⚠️ IMPORTANTE: USAMOS fecha_pago COMO VENCIMIENTO
        const sqlCuota = `
            SELECT *
            FROM cuotas
            WHERE id_alumno = $1
            ORDER BY fecha_pago DESC
            LIMIT 1
        `;
        const r2 = await db.query(sqlCuota, [idAlumno]);

        const cuota = r2.rows.length ? r2.rows[0] : null;

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

        const { lunes, domingo } = getRangoSemanaActual();

        const sqlAsist = `
            SELECT COUNT(*) AS total
            FROM asistencias
            WHERE id_alumno = $1
            AND fecha BETWEEN $2 AND $3
        `;

        const r3 = await db.query(sqlAsist, [idAlumno, lunes, domingo]);
        const asistenciasSemana = Number(r3.rows[0].total);

        let seRegistra = true;
        let alertaDias = null;
        let asistenciasSemanaFinal = asistenciasSemana;

        if (alumno.dias_semana && asistenciasSemana >= alumno.dias_semana) {
            seRegistra = false;
            alertaDias = `Ya usaste tus ${alumno.dias_semana} días permitidos esta semana.`;
        }

        if (seRegistra) {
            const sqlInsert = `
                INSERT INTO asistencias (id_alumno, fecha, hora)
                VALUES ($1, CURRENT_DATE, CURRENT_TIME)
            `;
            await db.query(sqlInsert, [idAlumno]);
            asistenciasSemanaFinal++;
        }

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
                    fecha_vencimiento: cuota.fecha_pago, // ESTA ES LA CLAVE
                    estado: estadoCuota,
                }
                : null,
            limite_semanal: alumno.dias_semana,
            asistencias_semana: asistenciasSemanaFinal,
            alerta_cuota: alertaCuota,
            alerta_dias: alertaDias,
        });

    } catch (error) {
        console.error("ERROR ASISTENCIAS:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
