import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({
            error: "mes es requerido (YYYY-MM)"
        });
    }

    try {
        const result = await db.query(
            `
            SELECT
                m.id_alumno,
                a.nombre,
                m.plan,
                m.dias_por_semana
            FROM membresias m
            JOIN alumnos a ON a.id = m.id_alumno
            WHERE m.periodo_mes = $1
            ORDER BY a.nombre
            `,
            [mes]
        );

        res.json({
            mes,
            total_alumnos: result.rows.length,
            alumnos: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error obteniendo estadísticas"
        });
    }
});

export default router;
