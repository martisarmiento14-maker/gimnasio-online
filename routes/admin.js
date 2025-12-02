// =====================================
//         RUTA: /alumnos
// =====================================

import express from "express";
import db from "../database/db.js";

const router = express.Router();

/* =====================================================
   1) OBTENER TODOS LOS ALUMNOS
   ===================================================== */
router.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM alumnos ORDER BY apellido ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /alumnos:", error);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

/* =====================================================
   2) OBTENER ALUMNO POR ID
   ===================================================== */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT * FROM alumnos WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR GET /alumnos/:id:", error);
        res.status(500).json({ error: "Error al obtener alumno" });
    }
});

/* =====================================================
   3) CREAR UN NUEVO ALUMNO
   ===================================================== */
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            dni,
            dias_eg_pers,
            equipo
        } = req.body;

        const result = await db.query(`
            INSERT INTO alumnos 
            (nombre, apellido, telefono, nivel, plan_eg, plan_personalizado, plan_running, dias_semana, fecha_vencimiento, activo, dni, dias_eg_pers, equipo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11,$12)
            RETURNING *;
        `, [
            nombre,
            apellido,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            dni,
            dias_eg_pers,
            equipo || "morado"
        ]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR POST /alumnos:", error);
        res.status(500).json({ error: "Error al crear alumno" });
    }
});

/* =====================================================
   4) ACTUALIZAR ALUMNO
   ===================================================== */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            apellido,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo,
            dni,
            dias_eg_pers,
            equipo
        } = req.body;

        const result = await db.query(`
            UPDATE alumnos SET
                nombre = $1,
                apellido = $2,
                telefono = $3,
                nivel = $4,
                plan_eg = $5,
                plan_personalizado = $6,
                plan_running = $7,
                dias_semana = $8,
                fecha_vencimiento = $9,
                activo = $10,
                dni = $11,
                dias_eg_pers = $12,
                equipo = $13
            WHERE id = $14
            RETURNING *;
        `, [
            nombre,
            apellido,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo,
            dni,
            dias_eg_pers,
            equipo || "morado",
            id
        ]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR PUT /alumnos:", error);
        res.status(500).json({ error: "Error al actualizar alumno" });
    }
});

/* =====================================================
   5) BORRAR ALUMNO (con borrado de ASISTENCIAS primero)
   ===================================================== */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ borrar asistencias primero
        await db.query(
            "DELETE FROM asistencias WHERE id_alumno = $1",
            [id]
        );

        // 2️⃣ borrar alumno
        await db.query(
            "DELETE FROM alumnos WHERE id = $1",
            [id]
        );

        res.json({ success: true, message: "Alumno eliminado correctamente" });

    } catch (error) {
        console.error("ERROR DELETE /alumnos:", error);
        res.status(500).json({ error: "Error al eliminar alumno" });
    }
});

export default router;
