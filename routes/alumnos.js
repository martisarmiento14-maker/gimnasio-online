import express from "express";
import pool from "../database/db.js";


const router = express.Router();

// ------------------------------------------------------------
// GET: todos los alumnos
// ------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const sql = "SELECT * FROM alumnos ORDER BY id DESC";
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ ERROR SQL:", err);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

// ------------------------------------------------------------
// GET: detalle por id
// ------------------------------------------------------------
router.get("/:id/detalle", async (req, res) => {
    try {
        const sql = "SELECT * FROM alumnos WHERE id = $1";
        const result = await pool.query(sql, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        res.json({ alumno: result.rows[0] });

    } catch (err) {
        console.error("❌ ERROR SQL:", err);
        res.status(500).json({ error: "Error al obtener detalle" });
    }
});

// ------------------------------------------------------------
// POST: crear alumno COMPLETO
// ------------------------------------------------------------
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento
        } = req.body;

        const sql = `
            INSERT INTO alumnos (
                nombre, apellido, dni, telefono, nivel,
                plan_eg, plan_personalizado, plan_running,
                dias_semana, fecha_vencimiento, activo
            )
            VALUES (
                $1,$2,$3,$4,$5,
                $6,$7,$8,
                $9,$10,1
            )
            RETURNING *
        `;

        const result = await pool.query(sql, [
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento
        ]);

        res.json({
            mensaje: "Alumno creado correctamente",
            alumno: result.rows[0]
        });

    } catch (err) {
        console.error("❌ ERROR SQL:", err);
        res.status(500).json({ error: "Error al crear alumno" });
    }
});

// ------------------------------------------------------------
// PUT: editar alumno COMPLETO
// ------------------------------------------------------------
router.put("/:id", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento
        } = req.body;

        const sql = `
            UPDATE alumnos SET
                nombre = $1,
                apellido = $2,
                dni = $3,
                telefono = $4,
                nivel = $5,
                plan_eg = $6,
                plan_personalizado = $7,
                plan_running = $8,
                dias_semana = $9,
                fecha_vencimiento = $10
            WHERE id = $11
            RETURNING *
        `;

        const result = await pool.query(sql, [
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            req.params.id
        ]);

        res.json({
            mensaje: "Alumno actualizado correctamente",
            alumno: result.rows[0]
        });

    } catch (err) {
        console.error("❌ ERROR SQL:", err);
        res.status(500).json({ error: "Error al editar alumno" });
    }
});
// ACTIVAR ALUMNO
router.put("/:id/activar", async (req, res) => {
    await pool.query(`UPDATE alumnos SET activo = 1 WHERE id = $1`, [req.params.id]);
    res.json({ mensaje: "Alumno activado" });
});

// DESACTIVAR ALUMNO
router.put("/:id/desactivar", async (req, res) => {
    await pool.query(`UPDATE alumnos SET activo = 0 WHERE id = $1`, [req.params.id]);
    res.json({ mensaje: "Alumno desactivado" });
});

// CAMBIAR EQUIPO
router.put("/:id/equipo", async (req, res) => {
    const { equipo } = req.body;
    await pool.query(`UPDATE alumnos SET equipo = $1 WHERE id = $2`, [equipo, req.params.id]);
    res.json({ mensaje: "Equipo actualizado" });
});

// ELIMINAR ALUMNO
router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM alumnos WHERE id = $1", [req.params.id]);
        res.json({ mensaje: "Alumno eliminado" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar alumno" });
    }
});


export default router;

//prueba de sincronizacion
console.log("🔥 Backend actualizado correctamente!");
