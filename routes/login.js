import express from "express";
import db from "../database/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// LOGIN DEL ADMINISTRADOR
router.post("/", async (req, res) => {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        const sql = "SELECT * FROM administrador WHERE usuario = $1";
        const { rows } = await db.query(sql, [usuario]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const admin = rows[0];

        const coincide = await bcrypt.compare(clave, admin.clave_hash);

        if (!coincide) {
            return res.status(401).json({ error: "Clave incorrecta" });
        }

        res.json({
            message: "Login exitoso",
            usuario: admin.usuario
        });

    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
