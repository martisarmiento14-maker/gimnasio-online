import express from "express";
import db from "../database/db.js";

const router = express.Router();

// Registrar una nueva cuota
router.post("/", (req, res) => {
    const datos = req.body;

    const sql = "INSERT INTO cuotas SET ?";
    db.query(sql, datos, (err) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al registrar cuota" });
        }
        res.json({ message: "Cuota registrada" });
    });
});

// Obtener historial de cuotas de un alumno
router.get("/historial/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM cuotas WHERE id_alumno = ? ORDER BY fecha_pago DESC";
    db.query(sql, id, (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al obtener historial" });
        }
        res.json(results);
    });
});

// Obtener última cuota pagada (para estado del alumno)
router.get("/ultima/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM cuotas WHERE id_alumno = ? ORDER BY fecha_pago DESC LIMIT 1";
    db.query(sql, id, (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al obtener estado" });
        }
        res.json(results[0] || null);
    });
});

export default router;
