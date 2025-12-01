import express from "express";
import pool from "../database/db.js";

const router = express.Router();

/* ============================================
   🔹 GET — OBTENER TODOS LOS ALUMNOS
   ============================================ */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alumnos ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET ALUMNOS:", error);
        res.status(500).json({ error: "Error obteniendo alumnos" });
    }
});

/* ============================================
   🔹 GET — OBTENER ALUMNO POR ID
   ============================================ */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM alumnos WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR GET ALUMNO ID:", error);
        res.status(500).json({ error: "Error obteniendo alumno" });
    }
});

/* ============================================
   🔹 HELPER — CALCULAR DÍAS SEGÚN PLANES
   ============================================ */
function calcularDias(plan_eg, plan_personalizado, plan_running, dias_eg_o_pers) {
    let total = 0;

    if (plan_eg) total += dias_eg_o_pers;
    if (plan_personalizado) total += dias_eg_o_pers;
    if (plan_running) total += 2;

    return total;
}

/* ============================================
   🔹 POST — CREAR ALUMNO
   ============================================ */
router.post("/", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            equipo,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo
        } = req.body;

        // Validación combinaciones
        if (plan_eg && plan_personalizado) {
            return res.status(400).json({ error: "EG y Personalizado no pueden combinarse" });
        }

        const query = `
            INSERT INTO alumnos (
                nombre, apellido, dni, telefono, nivel, equipo,
                plan_eg, plan_personalizado, plan_running,
                dias_semana, fecha_vencimiento, activo
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *;
        `;

        const values = [
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            equipo,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo
        ];

        const result = await pool.query(query, values);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR CREAR ALUMNO:", error);
        res.status(500).json({ error: "Error creando alumno" });
    }
});

/* ============================================
   🔹 PUT — EDITAR ALUMNO
   ============================================ */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            equipo,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo
        } = req.body;

        // Validación combinaciones
        if (plan_eg && plan_personalizado) {
            return res.status(400).json({ error: "EG y Personalizado no pueden combinarse" });
        }

        const query = `
            UPDATE alumnos SET
                nombre = $1,
                apellido = $2,
                dni = $3,
                telefono = $4,
                nivel = $5,
                equipo = $6,
                plan_eg = $7,
                plan_personalizado = $8,
                plan_running = $9,
                dias_semana = $10,
                fecha_vencimiento = $11,
                activo = $12
            WHERE id = $13
            RETURNING *;
        `;

        const values = [
            nombre,
            apellido,
            dni,
            telefono,
            nivel,
            equipo,
            plan_eg,
            plan_personalizado,
            plan_running,
            dias_semana,
            fecha_vencimiento,
            activo,
            id
        ];

        const result = await pool.query(query, values);

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR EDITANDO ALUMNO:", error);
        res.status(500).json({ error: "Error editando alumno" });
    }
});

/* ============================================
   🔹 PUT — RENOVAR CUOTA (+1 MES)
   ============================================ */
router.put("/:id/renovar", async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener alumno
        const alumno = await pool.query("SELECT * FROM alumnos WHERE id = $1", [id]);

        if (alumno.rows.length === 0) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }

        const fechaActual = new Date();
        const fechaVenc = new Date(alumno.rows[0].fecha_vencimiento);

        let nuevaFecha;

        if (fechaVenc >= fechaActual) {
            nuevaFecha = new Date(fechaVenc.setMonth(fechaVenc.getMonth() + 1));
        } else {
            nuevaFecha = new Date(fechaActual.setMonth(fechaActual.getMonth() + 1));
        }

        const result = await pool.query(
            "UPDATE alumnos SET fecha_vencimiento = $1 WHERE id = $2 RETURNING *",
            [nuevaFecha, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("ERROR RENOVAR CUOTA:", error);
        res.status(500).json({ error: "Error renovando cuota" });
    }
});

/* ============================================
   🔹 DELETE — ELIMINAR ALUMNO
   ============================================ */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM alumnos WHERE id = $1", [id]);

        res.json({ message: "Alumno eliminado correctamente" });
    } catch (error) {
        console.error("ERROR ELIMINAR ALUMNO:", error);
        res.status(500).json({ error: "Error eliminando alumno" });
    }
});

export default router;
