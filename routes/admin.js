
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

/* ======================================================
   📊 ESTADÍSTICAS FINANZAS
   ====================================================== */
router.get("/estadisticas-finanzas", async (req, res) => {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y año requeridos" });
        }

        /* ======================
           INGRESOS POR MÉTODO
        ====================== */
        const ingresosQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END), 0) AS efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END), 0) AS transferencia
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
              AND EXTRACT(YEAR FROM fecha_pago) = $2
        `;
        const ingresosRes = await db.query(ingresosQuery, [mes, anio]);

        /* ======================
           PLANES (ALTAS / RENOVACIONES)
        ====================== */
        const planesBase = {
            altas: { eg: 0, personalizado: 0, running: 0 },
            renovaciones: { eg: 0, personalizado: 0, running: 0 }
        };

        const planesQuery = `
            SELECT
                p.tipo,
                a.plan_eg,
                a.plan_personalizado,
                a.plan_running
            FROM pagos p
            JOIN alumnos a ON a.id = p.alumno_id
            WHERE EXTRACT(MONTH FROM p.fecha_pago) = $1
              AND EXTRACT(YEAR FROM p.fecha_pago) = $2
        `;
        const planesRes = await db.query(planesQuery, [mes, anio]);

        planesRes.rows.forEach(r => {
            const grupo = r.tipo === "alta" ? "altas" : "renovaciones";
            if (r.plan_eg) planesBase[grupo].eg++;
            if (r.plan_personalizado) planesBase[grupo].personalizado++;
            if (r.plan_running) planesBase[grupo].running++;
        });

        /* ======================
           EVOLUCIÓN MENSUAL
        ====================== */
        const evolucionQuery = `
            SELECT
                TO_CHAR(fecha_pago, 'YYYY-MM') AS mes,
                SUM(monto) AS ingresos,
                COUNT(*) AS movimientos
            FROM pagos
            GROUP BY mes
            ORDER BY mes
        `;
        const evolucionRes = await db.query(evolucionQuery);

        /* ======================
           RESPUESTA FINAL
        ====================== */
        res.json({
            ingresos: ingresosRes.rows[0],
            planes: planesBase,
            evolucion: evolucionRes.rows
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
