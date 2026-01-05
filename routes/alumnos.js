import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// ==========================
//  GET - TODOS LOS ALUMNOS
// ==========================
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alumnos ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR LISTAR ALUMNOS:", error);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

// ==========================
//  GET - UN SOLO ALUMNO
// ==========================
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM alumnos WHERE id = $1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR GET ALUMNO:", error);
        res.status(500).json({ error: "Error al obtener alumno" });
    }
});

// ==========================
//  POST - CREAR ALUMNO + PAGO ALTA
// ==========================
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            fecha_vencimiento,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            dias_eg_pers,
            // 👇 VIENEN DEL FORM DE ALTA
            monto,
            metodo_pago
        } = req.body;

        // =======================================================
        //   📌 ASIGNACIÓN DE EQUIPO (TU LÓGICA ORIGINAL)
        // =======================================================

        const totalAlumnos = await pool.query("SELECT COUNT(*) FROM alumnos");
        const total = Number(totalAlumnos.rows[0].count);

        let equipoAsignado = "morado";

        if (total === 0) {
            equipoAsignado = "morado";
        } else if (total === 1) {
            equipoAsignado = "blanco";
        } else {
            const nivelAlumno = nivel;

            const countMoradoNivel = await pool.query(
                "SELECT COUNT(*) FROM alumnos WHERE equipo = 'morado' AND nivel = $1",
                [nivelAlumno]
            );
            const countBlancoNivel = await pool.query(
                "SELECT COUNT(*) FROM alumnos WHERE equipo = 'blanco' AND nivel = $1",
                [nivelAlumno]
            );

            const moradoNivel = Number(countMoradoNivel.rows[0].count);
            const blancoNivel = Number(countBlancoNivel.rows[0].count);

            if (moradoNivel < blancoNivel) {
                equipoAsignado = "morado";
            } else if (blancoNivel < moradoNivel) {
                equipoAsignado = "blanco";
            } else {
                const countMoradoTotal = await pool.query(
                    "SELECT COUNT(*) FROM alumnos WHERE equipo = 'morado'"
                );
                const countBlancoTotal = await pool.query(
                    "SELECT COUNT(*) FROM alumnos WHERE equipo = 'blanco'"
                );

                const moradoTotal = Number(countMoradoTotal.rows[0].count);
                const blancoTotal = Number(countBlancoTotal.rows[0].count);

                if (moradoTotal < blancoTotal) {
                    equipoAsignado = "morado";
                } else if (blancoTotal < moradoTotal) {
                    equipoAsignado = "blanco";
                } else {
                    const countNivel = await pool.query(
                        "SELECT COUNT(*) FROM alumnos WHERE nivel = $1",
                        [nivelAlumno]
                    );

                    equipoAsignado =
                        Number(countNivel.rows[0].count) % 2 === 0
                            ? "morado"
                            : "blanco";
                }
            }
        }

        // =======================================================
        //  INSERT ALUMNO
        // =======================================================

        const alumnoResult = await pool.query(
            `
            INSERT INTO alumnos 
            (nombre, apellido, dni, telefono, nivel, equipo,
             plan_eg, plan_personalizado, plan_running,
             dias_semana, dias_eg_pers, fecha_vencimiento, activo)
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1)
            RETURNING *;
            `,
            [
                nombre,
                apellido,
                dni,
                telefono,
                nivel,
                equipoAsignado,
                plan_eg,
                plan_personalizado,
                plan_running,
                dias_semana,
                dias_eg_pers,
                fecha_vencimiento
            ]
        );

        const alumno = alumnoResult.rows[0];

        // =======================================================
        //  💰 INSERT PAGO DE ALTA (CLAVE PARA ESTADÍSTICAS)
        // =======================================================

        if (monto && metodo_pago) {
            await pool.query(
                `
                INSERT INTO pagos
                (id_alumno, monto, metodo_pago,fecha_pago, tipo)
                VALUES ($1, $2, $3, CURRENT_DATE, 'alta')
                `,
                [
                    alumno.id,
                    Number(monto),
                    metodo_pago
                ]
            );
        }

        res.json(alumno);

    } catch (error) {
        console.error("ERROR CREAR ALUMNO:", error);
        res.status(500).json({ error: "Error creando alumno" });
    }
});

// ==========================
//  PUT - EDITAR ALUMNO
// ==========================
router.put("/:id", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            fecha_vencimiento,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            dias_eg_pers,
        } = req.body;

        const result = await pool.query(
            `
            UPDATE alumnos SET
                nombre = $1,
                apellido = $2,
                dni = $3,
                telefono = $4,
                nivel = $5,
                fecha_vencimiento = $6,
                plan_eg = $7,
                plan_personalizado = $8,
                plan_running = $9,
                dias_semana = $10,
                dias_eg_pers = $11
            WHERE id = $12
            RETURNING *;
            `,
            [
                nombre,
                apellido,
                dni,
                telefono,
                nivel,
                fecha_vencimiento,
                plan_eg,
                plan_personalizado,
                plan_running,
                dias_semana,
                dias_eg_pers,
                req.params.id
            ]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR EDITAR ALUMNO:", error);
        res.status(500).json({ error: "Error actualizando alumno" });
    }
});

// ==========================
//  DELETE - ELIMINAR ALUMNO
// ==========================
router.delete("/:id", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM alumnos WHERE id = $1",
            [req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("ERROR ELIMINAR ALUMNO:", error);
        res.status(500).json({ error: "Error borrando alumno" });
    }
});

export default router;
