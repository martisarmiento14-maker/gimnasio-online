import express from "express";
import pool from "../database/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// LOGIN
router.post("/", async (req, res) => {
    try {
        const { usuario, clave } = req.body;

        if (!usuario || !clave) {
            return res.status(400).json({ error: "Falta usuario o contraseña" });
        }

        // BUSCAR EN TABLA USUARIOS (email)
        const query = "SELECT * FROM usuarios WHERE email = $1";
        const result = await pool.query(query, [usuario]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Usuario incorrecto" });
        }

        const user = result.rows[0];

        // COMPARAR CONTRASEÑA SIN HASH
        if (user.password !== clave) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // CREAR TOKEN
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        res.json({
            message: "Login exitoso",
            token
        });

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ error: "Error en login" });
    }
});

export default router;
