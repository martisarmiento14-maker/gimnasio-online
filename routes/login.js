// routes/login.js
import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

/* ============================================
   LOGIN
   ============================================ */
router.post("/", async (req, res) => {
    try {
        const { usuario, clave } = req.body;

        if (!usuario || !clave) {
            return res.status(400).json({ error: "Falta usuario o contraseña" });
        }

        // 1) Buscar usuario en BD
        const query = "SELECT * FROM administrador WHERE usuario = $1";
        const result = await pool.query(query, [usuario]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Usuario incorrecto" });
        }

        const admin = result.rows[0];

        // 2) Comparar contraseña
        const esValida = await bcrypt.compare(clave, admin.clave_hash);

        if (!esValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // 3) Crear token
        const token = jwt.sign(
            { id: admin.id, usuario: admin.usuario },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        // 4) Enviar token
        res.json({
            message: "Login exitoso",
            token
        });

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ error: "Error en el login" });
    }
});

export default router;
