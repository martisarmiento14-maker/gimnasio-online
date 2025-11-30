import express from "express";
import pool from "../database/db.js";

const router = express.Router();

// Obtener todos los alumnos
router.get("/", (req, res) => {
    const sql = "SELECT * FROM alumnos ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ ERROR SQL:", err);
            return res.status(500).json({ error: "Error al obtener alumnos" });
        }

        res.json(results);
    });
});

// Crear nuevo alumno
router.post("/", async (req, res) => {
    try {
        const { nombre, apellido, edad, email, telefono } = req.body;

        const sql = `
            INSERT INTO alumnos (nombre, apellido, edad, email, telefono)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const result = await pool.query(sql, [
            nombre,
            apellido,
            edad,
            email,
            telefono
        ]);

        return res.json({
            mensaje: "Alumno creado correctamente",
            alumno: result.rows[0]
        });
    } catch (err) {
        console.error("❌ ERROR SQL:", err);
        return res.status(500).json({ error: "Error al crear alumno" });
    }
});

export default router;
