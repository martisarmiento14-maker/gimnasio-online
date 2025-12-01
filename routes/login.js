import express from "express";
import db from "../database/db";
// import bcrypt from "bcrypt";   ← BORRA esto si no usas bcrypt

const router = express.Router();

// LOGIN DEL ADMINISTRADOR
router.post("/", (req, res) => {
    const { usuario, clave } = req.body;

    console.log("=> Datos recibidos:", usuario, clave);

    const sql = "SELECT * FROM usuarios WHERE email = $1";

    db.query(sql, [usuario], (err, result) => {
        if (err) {
            console.error("=> ERROR SQL:", err);
            return res.status(500).json({ error: "Error interno" });
        }

        console.log("=> RESULTADO SQL:", result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = result.rows[0];

        console.log("=> Usuario encontrado:", user);

        if (user.password === clave) {
            return res.json({ mensaje: "Login exitoso", usuario: user });
        }

        return res.status(401).json({ error: "Clave incorrecta" });
    });
});

export default router;
