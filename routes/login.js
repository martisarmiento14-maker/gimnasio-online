import express from "express";
const router = express.Router();
import db from "../database/db.js";

// LOGIN CON EMAIL Y PASSWORD
router.post("/", async (req, res) => {
    try {
        const { usuario, clave } = req.body;

        if (!usuario || !clave) {
            return res.status(400).json({ ok: false, mensaje: "Faltan datos" });
        }

        // Buscar usuario por EMAIL
        const sql = "SELECT * FROM usuarios WHERE email = $1 LIMIT 1";
        const result = await db.query(sql, [usuario]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
        }

        const user = result.rows[0];

        // Comparar password
        if (user.password !== clave) {
            return res.status(401).json({ ok: false, mensaje: "Contraseña incorrecta" });
        }

        // Login OK
        return res.json({
            ok: true,
            mensaje: "Login exitoso",
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ ok: false, mensaje: "Error interno en el servidor" });
    }
});

export default router;
