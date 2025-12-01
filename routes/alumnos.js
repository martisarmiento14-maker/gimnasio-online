import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// =====================================
// FUNCIÓN: Asignación automática equilibrada de equipos
// =====================================
async function asignarEquipoAutomatico() {
    const countBlanco = await pool.query(
        "SELECT COUNT(*) FROM alumnos WHERE equipo = 'blanco'"
    );
    const countMorado = await pool.query(
        "SELECT COUNT(*) FROM alumnos WHERE equipo = 'morado'"
    );

    const blanco = Number(countBlanco.rows[0].count);
    const morado = Number(countMorado.rows[0].count);

    if (blanco < morado) return "blanco";
    if (morado < blanco) return "morado";

    return Math.random() < 0.5 ? "blanco" : "morado";
}

// =====================================
// GET — Lista TODOS los alumnos
// (el frontend decide si filtra activos/inactivos)
// =====================================
router.get("/", async (req, res) => {
    try {
        const sql = "SELECT * FROM alumnos ORDER BY id ASC";
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo alumnos:", error);
        res.status(500).json({ error: "Error al obtener alumnos" });
    }
});

// =====================================
// GET — Detalle alumno por ID
// =====================================
router.get("/:id/detalle", async (req, res) => {
    try {
        const sql = "SELECT * FROM alumnos WHERE id = $1";
        const result = await pool.query(sql, [req.params.id]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Alumno no encontrado" });

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error obteniendo detalle:", error);
        res.status(500).json({ error: "Error al obtener detalle" });
    }
});

// =====================================
// POST — Crear alumno nuevo
// =====================================
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            edad,
            email,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana
        } = req.body;

        // EQUIPO AUTOMÁTICO EQUILIBRADO
        const equipo = await asignarEquipoAutomatico();

        // FECHA DE VENCIMIENTO: +30 días por defecto
        const fecha_vencimiento = new Date();
        fecha_vencimiento.setDate(fecha_vencimiento.getDate() + 30);

        const sql = `
            INSERT INTO alumnos
            (nombre, apellido, edad, email, telefono, nivel, equipo, 
             plan_eg, plan_personalizado, plan_running, dias_semana,
             fecha_vencimiento, activo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1)
            RETURNING *;
        `;

        const result = await pool.query(sql, [
            nombre,
            apellido,
            edad,
            email,
            telefono,
            nivel,
            equipo,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento
        ]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creando alumno:", error);
        res.status(500).json({ error: "Error al crear alumno" });
    }
});

// =====================================
// PUT — EDITAR alumno
// =====================================
router.put("/:id", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            edad,
            email,
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
            nombre=$1, apellido=$2, edad=$3, email=$4, telefono=$5,
            nivel=$6, plan_eg=$7, plan_personalizado=$8, plan_running=$9,
            dias_semana=$10, fecha_vencimiento=$11
            WHERE id=$12
            RETURNING *;
        `;

        const result = await pool.query(sql, [
            nombre,
            apellido,
            edad,
            email,
            telefono,
            nivel,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            req.params.id
        ]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error al editar alumno:", error);
        res.status(500).json({ error: "Error al editar alumno" });
    }
});

// =====================================
// PUT — Cambiar equipo (desde cuotas)
// =====================================
router.put("/:id/equipo", async (req, res) => {
    try {
        const { equipo } = req.body;

        const sql = `
            UPDATE alumnos SET equipo=$1
            WHERE id=$2 RETURNING *;
        `;

        const result = await pool.query(sql, [equipo, req.params.id]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error cambiando equipo:", error);
        res.status(500).json({ error: "Error al cambiar equipo" });
    }
});

// =====================================
// PUT — Activar alumno
// =====================================
router.put("/:id/activar", async (req, res) => {
    try {
        const sql = `
            UPDATE alumnos SET activo=1
            WHERE id=$1 RETURNING *;
        `;
        const result = await pool.query(sql, [req.params.id]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error activando alumno:", error);
        res.status(500).json({ error: "Error al activar alumno" });
    }
});

// =====================================
// PUT — Desactivar alumno
// =====================================
router.put("/:id/desactivar", async (req, res) => {
    try {
        const sql = `
            UPDATE alumnos SET activo=0
            WHERE id=$1 RETURNING *;
        `;
        const result = await pool.query(sql, [req.params.id]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error desactivando alumno:", error);
        res.status(500).json({ error: "Error al desactivar alumno" });
    }
});

// =====================================
// DELETE — Borrar alumno
// =====================================
router.delete("/:id", async (req, res) => {
    try {
        const sql = "DELETE FROM alumnos WHERE id=$1";
        await pool.query(sql, [req.params.id]);
        res.json({ mensaje: "Alumno eliminado" });

    } catch (error) {
        console.error("Error eliminando alumno:", error);
        res.status(500).json({ error: "Error al eliminar alumno" });
    }
});

export default router;
