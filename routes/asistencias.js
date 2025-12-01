import express from "express";
import db from "../database/db.js";

const router = express.Router();

// ----- Fechas: lunes y domingo de la semana actual -----
function getRangoSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo, 1 = lunes...
    const diffLunes = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { lunes, domingo };
}

// ----- POST /asistencias (registrar asistencia por DNI) -----
router.post("/", (req, res) => {
    const { dni } = req.body;

    if (!dni) return res.status(400).json({ error: "Debe enviar un DNI" });

    // 1) Buscar alumno
    const sqlAlumno = "SELECT * FROM alumnos WHERE dni = $1";
    db.query(sqlAlumno, [dni])
        .then((alumnosRes) => {
            if (alumnosRes.rows.length === 0)
                return res.status(404).json({ error: "Alumno no encontrado" });

            const alumno = alumnosRes.rows[0];
            const idAlumno = alumno.id;
            const limiteSemanal = alumno.dias_semana;

            const planesArr = [];
            if (alumno.plan_eg) planesArr.push("Plan EG");
            if (alumno.plan_personalizado) planesArr.push("Personalizado");
            if (alumno.plan_running) planesArr.push("Running");

            const textoPlanes = planesArr.join(" + ") || "-";

            // 2) Cuota
            const sqlCuota = `
                SELECT *
                FROM cuotas
                WHERE id_alumno = $1
                ORDER BY fecha_vencimiento DESC
                LIMIT 1
            `;

            return db
                .query(sqlCuota, [idAlumno])
                .then((cuotaRes) => {
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

                    const { lunes, domingo } = getRangoSemanaActual();

                    const sqlAsist = `
                        SELECT COUNT(*) AS total
                        FROM asistencias
                        WHERE id_alumno = $1
                        AND fecha BETWEEN $2 AND $3
                    `;

                    return db
                        .query(sqlAsist, [idAlumno, lunes, domingo])
                        .then((asistRes) => {
                            const asistenciasSemana = Number(asistRes.rows[0].total);
                            let seRegistra = true;
                            let alertaDias = null;

                            if (limiteSemanal && asistenciasSemana >= limiteSemanal) {
                                seRegistra = false;
                                alertaDias = `Ya usaste tus ${limiteSemanal} días de entrenamiento esta semana.`;
                            }

                            if (!seRegistra) {
                                return res.json({
                                    se_registro: false,
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
                                              fecha_vencimiento: cuota.fecha_vencimiento,
                                              estado: estadoCuota,
                                          }
                                        : null,
                                    limite_semanal: limiteSemanal,
                                    asistencias_semana: asistenciasSemana,
                                    alerta_cuota: alertaCuota,
                                    alerta_dias: alertaDias,
                                });
                            }

                            // INSERTAR ASISTENCIA
                            const sqlInsert = `
                                INSERT INTO asistencias (id_alumno, fecha, hora)
                                VALUES ($1, CURRENT_DATE, CURRENT_TIME)
                            `;

                            return db.query(sqlInsert, [idAlumno]).then(() => {
                                return res.json({
                                    se_registro: true,
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
                                              fecha_vencimiento: cuota.fecha_vencimiento,
                                              estado: estadoCuota,
                                          }
                                        : null,
                                    limite_semanal: limiteSemanal,
                                    asistencias_semana: asistenciasSemana + 1,
                                    alerta_cuota: alertaCuota,
                                    alerta_dias: null,
                                });
                            });
                        });
                });
        })
        .catch((err) => {
            console.error("Error en asistencias:", err);
            res.status(500).json({ error: "Error del servidor" });
        });
});

export default router;
