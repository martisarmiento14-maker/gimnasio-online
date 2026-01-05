
import express from "express";
import db from "../database/db.js";

const router = express.Router();

/* ===========================================
GET — LISTAR TODOS LOS ALUMNOS (activos e inactivos)
=========================================== */
router.get("/", async (req, res) => {
    try {
        const query = "SELECT * FROM alumnos ORDER BY id ASC";
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET /admin:", error);
        res.status(500).json({ error: "Error obteniendo alumnos" });
    }
});

/* ===========================================
PUT — ACTIVAR ALUMNO
=========================================== */
router.put("/:id/activar", async (req, res) => {
    try {
        const { id } = req.params;

        const query = "UPDATE alumnos SET activo = 1 WHERE id = $1 RETURNING *";
        const result = await db.query(query, [id]);

        res.json({ message: "Alumno activado", alumno: result.rows[0] });
    } catch (error) {
        console.error("ERROR ACTIVAR:", error);
        res.status(500).json({ error: "Error al activar alumno" });
    }
});


/* ===========================================
PUT — DESACTIVAR ALUMNO
=========================================== */
router.put("/:id/desactivar", async (req, res) => {
    try {
        const { id } = req.params;

        const query = "UPDATE alumnos SET activo = 0 WHERE id = $1 RETURNING *";
        const result = await db.query(query, [id]);

        res.json({ message: "Alumno desactivado", alumno: result.rows[0] });
    } catch (error) {
        console.error("ERROR DESACTIVAR:", error);
        res.status(500).json({ error: "Error al desactivar alumno" });
    }
});

/* ===========================================
PUT — CAMBIAR EQUIPO (morado/blanco)
=========================================== */
router.put("/:id/equipo", async (req, res) => {
    try {
        const { id } = req.params;
        const { equipo } = req.body;

        const query = "UPDATE alumnos SET equipo = $1 WHERE id = $2 RETURNING *";
        const result = await db.query(query, [equipo, id]);

        res.json({ message: "Equipo actualizado", alumno: result.rows[0] });

    } catch (error) {
        console.error("ERROR EQUIPO:", error);
        res.status(500).json({ error: "Error al cambiar equipo" });
    }
});

/* ===========================================
DELETE — BORRAR ALUMNO
=========================================== */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Borrar asistencias relacionadas
        await db.query("DELETE FROM asistencias WHERE id_alumno = $1", [id]);

        // Borrar el alumno
        const query = "DELETE FROM alumnos WHERE id = $1 RETURNING *";
        const result = await db.query(query, [id]);

        res.json({ message: "Alumno eliminado", alumno: result.rows[0] });

    } catch (error) {
        console.error("ERROR DELETE:", error);
        res.status(500).json({ error: "Error al borrar alumno" });
    }
});

/*
  GET /admin/estadisticas-finanzas?mes=03&anio=2026
*/
router.get("/estadisticas-finanzas", async (req, res) => {
    try {
        const { mes, anio } = req.query;

        // INGRESOS
        const ingresosResult = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END), 0) AS efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END), 0) AS transferencia
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR FROM fecha_pago) = $2
        `, [mes, anio]);

        // PLANES
        const planesResult = await pool.query(`
            SELECT tipo, plan_eg, plan_personalizado, plan_running
            FROM pagos p
            JOIN alumnos a ON a.id = p.alumno_id
            WHERE EXTRACT(MONTH FROM p.fecha_pago) = $1
            AND EXTRACT(YEAR FROM p.fecha_pago) = $2
        `, [mes, anio]);

        // EVOLUCIÓN (ejemplo simple)
        const evolucionResult = await pool.query(`
            SELECT
                TO_CHAR(fecha_pago, 'YYYY-MM') AS mes,
                SUM(monto) AS ingresos,
                COUNT(*) AS renovaciones
            FROM pagos
            GROUP BY mes
            ORDER BY mes
        `);

        res.json({
            ingresos: ingresosResult.rows[0],   // 👈 SIEMPRE existe
            planes: procesarPlanes(planesResult.rows),
            evolucion: evolucionResult.rows
        });

    } catch (error) {
        console.error("❌ ERROR ESTADISTICAS:", error);
        res.status(500).json({
            ingresos: { efectivo: 0, transferencia: 0 },
            planes: {
                altas: { eg: 0, personalizado: 0, running: 0 },
                renovaciones: { eg: 0, personalizado: 0, running: 0 }
            },
            evolucion: []
        });
    }
});

export default router;
