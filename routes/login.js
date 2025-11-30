import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.post("/", (req, res) => {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const sql = "SELECT * FROM usuarios WHERE email = ?";

    db.query(sql, [usuario], (err, results) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error interno" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = results[0];

        if (user.password !== clave) {
            return res.status(401).json({ error: "Clave incorrecta" });
        }

        return res.json({ mensaje: "Login exitoso" });
    });
});

export default router;
