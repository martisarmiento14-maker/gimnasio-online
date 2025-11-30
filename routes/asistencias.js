import express from "express";
import db from "../database/db.js";

const router = express.Router();

// Registrar asistencia
router.post("/", (req, res) => {
    const datos = req.body;

    const sql = "INSERT INTO asistencias SET ?";
    db.query(sql, datos, (err) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al registrar asistencia" });
        }
        res.json({ message: "Asistencia registrada" });
    });
});

// Obtener asistencias de un alumno
router.get("/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM asistencias WHERE id_alumno = ? ORDER BY fecha DESC";
    db.query(sql, id, (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al obtener asistencias" });
        }
        res.json(results);
    });
});

export default router;
