// routes/alumnos.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =============================
   1) OBTENER TODOS LOS ALUMNOS
   ============================= */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alumnos ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /alumnos:", error);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

/* =============================
   2) OBTENER ALUMNO POR DNI
   ============================= */
router.get("/dni/:dni", async (req, res) => {
    try {
        const { dni } = req.params;
        const result = await pool.query("SELECT * FROM alumnos WHERE dni = $1", [dni]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR GET /alumnos/dni:", error);
        res.status(500).json({ error: "Error al buscar alumno" });
    }
});

/* =============================
   3) CREAR ALUMNO
   ============================= */
router.post("/", async (req, res) => {
    try {
        const {
            nombre, apellido, dni, telefono, nivel,
            equipo, plan_eg, plan_personalizado, plan_running,
            dias_semana, fecha_vencimiento
        } = req.body;

        const sql = `
            INSERT INTO alumnos
            (nombre, apellido, dni, telefono, nivel, equipo, plan_eg, plan_personalizado, plan_running, dias_semana, fecha_vencimiento, activo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
            RETURNING *;
        `;

        const values = [
            nombre, apellido, dni, telefono, nivel,
            equipo, plan_eg, plan_personalizado, plan_running,
            dias_semana, fecha_vencimiento
        ];

        const result = await pool.query(sql, values);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR POST /alumnos:", error);
        res.status(500).json({ error: "Error al crear alumno" });
    }
});

/* =============================
   4) ACTUALIZAR ALUMNO
   ============================= */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre, apellido, dni, telefono, nivel,
            plan_eg, plan_personalizado, plan_running,
            dias_semana, fecha_vencimiento
        } = req.body;

        const sql = `
            UPDATE alumnos
            SET nombre=$1, apellido=$2, dni=$3, telefono=$4, nivel=$5,
                plan_eg=$6, plan_personalizado=$7, plan_running=$8,
                dias_semana=$9, fecha_vencimiento=$10
            WHERE id=$11
            RETURNING *;
        `;

        const result = await pool.query(sql, [
            nombre, apellido, dni, telefono, nivel,
            plan_eg, plan_personalizado, plan_running,
            dias_semana, fecha_vencimiento, id
        ]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR PUT /alumnos:", error);
        res.status(500).json({ error: "Error al actualizar alumno" });
    }
});

/* =============================
   5) BORRAR ALUMNO
   ============================= */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM alumnos WHERE id = $1", [id]);
        res.json({ message: "Alumno eliminado" });
    } catch (error) {
        console.error("ERROR DELETE /alumnos:", error);
        res.status(500).json({ error: "Error al borrar alumno" });
    }
});

/* =============================
   6) LISTAR VENCIDOS
   ============================= */
router.get("/vencidos", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM alumnos
            WHERE fecha_vencimiento < CURRENT_DATE
            AND activo = true
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /alumnos/vencidos:", error);
        res.status(500).json({ error: "Error al obtener vencidos" });
    }
});

/* =============================
   7) LISTAR POR VENCER (7 días)
   ============================= */
router.get("/por-vencer", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM alumnos
            WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            AND activo = true
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /alumnos/por-vencer:", error);
        res.status(500).json({ error: "Error al obtener por vencer" });
    }
});

export default router;
