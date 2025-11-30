import express from "express";
import db from "../database/db.js";

const router = express.Router();

// Obtener todos los alumnos
router.get("/", (req, res) => {
  const sql = "SELECT * FROM alumnos ORDER BY id_alumno DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al obtener alumnos" });
        }
    res.json(results);
    });
});

// Crear nuevo alumno
router.post("/", (req, res) => {
    const datos = req.body;

    const sql = "INSERT INTO alumnos SET ?";
    db.query(sql, datos, (err, result) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al crear alumno" });
        }
    res.json({ message: "Alumno creado", id: result.insertId });
    });
});

// Editar alumno
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const datos = req.body;

    const sql = "UPDATE alumnos SET ? WHERE id_alumno = ?";
    db.query(sql, [datos, id], (err) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al actualizar alumno" });
        }
    res.json({ message: "Alumno actualizado" });
    });
});

// Eliminar alumno
router.delete("/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM alumnos WHERE id_alumno = ?";
    db.query(sql, id, (err) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al eliminar alumno" });
            }
    res.json({ message: "Alumno eliminado" });
    });
});

export default router;
