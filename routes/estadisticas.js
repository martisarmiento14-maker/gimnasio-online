import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { mes } = req.query;
        console.log("📅 MES:", mes);

        const result = await db.query("SELECT 1 as test");

        res.json({
            ok: true,
            test: result.rows
        });

    } catch (error) {
        console.error("🔥 ERROR REAL ESTADISTICAS:", error);
        res.status(500).json({
            error: "Error estadísticas",
            detalle: error.message
        });
    }
});

export default router;
