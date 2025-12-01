// routes/admin.js
import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* =============================
   1) LISTAR TODOS LOS ALUMNOS
   ============================= */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alumnos ORDER BY apellido ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /admin:", error);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

/* =============================
   2) CAMBIAR EQUIPO (blanco/morado)
   ============================= */
router.put("/equipo/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { equipo } = req.body;

        const result = await pool.query(`
            UPDATE alumnos 
            SET equipo = $1 
            WHERE id = $2
            RETURNING *;
        `, [equipo, id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR PUT /admin/equipo:", error);
        res.status(500).json({ error: "Error al actualizar equipo" });
    }
});

/* =============================
   3) ACTIVAR ALUMNO
   ============================= */
router.put("/activar/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE alumnos
            SET activo = true
            WHERE id = $1
            RETURNING *;
        `, [id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR PUT /admin/activar:", error);
        res.status(500).json({ error: "Error al activar alumno" });
    }
});

/* =============================
   4) DESACTIVAR ALUMNO
   ============================= */
router.put("/desactivar/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE alumnos
            SET activo = false
            WHERE id = $1
            RETURNING *;
        `, [id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR PUT /admin/desactivar:", error);
        res.status(500).json({ error: "Error al desactivar alumno" });
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
        console.error("ERROR DELETE /admin:", error);
        res.status(500).json({ error: "Error al eliminar alumno" });
    }
});

/* =============================
   6) FILTRAR POR EQUIPO
   ============================= */
router.get("/equipo/:equipo", async (req, res) => {
    try {
        const { equipo } = req.params;

        const result = await pool.query(`
            SELECT * FROM alumnos
            WHERE equipo = $1
            ORDER BY apellido ASC;
        `, [equipo]);

        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /admin/equipo:", error);
        res.status(500).json({ error: "Error al filtrar por equipo" });
    }
});

/* =============================
   7) LISTAR SOLO ACTIVOS
   ============================= */
router.get("/activos", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM alumnos
            WHERE activo = true
            ORDER BY apellido ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /admin/activos:", error);
        res.status(500).json({ error: "Error al obtener activos" });
    }
});

/* =============================
   8) LISTAR SOLO INACTIVOS
   ============================= */
router.get("/inactivos", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM alumnos
            WHERE activo = false
            ORDER BY apellido ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /admin/inactivos:", error);
        res.status(500).json({ error: "Error al obtener inactivos" });
    }
});

export default router;
