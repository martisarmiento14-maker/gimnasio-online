import express from "express";
import db from "../database/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// LOGIN DEL ADMINISTRADOR
router.post("/", (req, res) => {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const sql = "SELECT * FROM administrador WHERE usuario = ?";
    db.query(sql, [usuario], async (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error interno" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const admin = results[0];

        const coincide = await bcrypt.compare(clave, admin.clave_hash);

        if (!coincide) {
            return res.status(401).json({ error: "Clave incorrecta" });
        }

        res.json({
            message: "Login exitoso",
            usuario: admin.usuario
        });
    });
});

export default router;
