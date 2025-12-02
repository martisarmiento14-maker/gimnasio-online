import express from "express";
import db from "../database/db.js";

const router = express.Router();

/* ===========================================
GET — LISTAR SOLO ACTIVOS
=========================================== */
router.get("/", async (req, res) => {
    try {
        const query = "SELECT * FROM alumnos WHERE activo = true ORDER BY id ASC";
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /alumnos:", error);
        res.status(500).json({ error: "Error obteniendo alumnos activos" });
    }
});

export default router;
