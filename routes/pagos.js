import express from "express";
import db from "../database/db.js";

const router = express.Router();

// REGISTRAR PAGO
router.post("/", async (req, res) => {
    try {
        const {
            id_alumno,
            monto,
            metodo_pago,
            tipo
        } = req.body;

    const query = `
        INSERT INTO pagos 
        (id_alumno, monto, metodo_pago, fecha_pago, tipo)
        VALUES ($1, $2, $3, CURRENT_DATE, $4)
        RETURNING *
    `;

    const result = await db.query(query, [
        id_alumno,
        monto,
        metodo_pago,
        tipo
    ]);

    res.json(result.rows[0]);

    } catch (error) {
    console.error("ERROR PAGO:", error);
    res.status(500).json({ error: "Error registrando pago" });
    }
});

export default router;
