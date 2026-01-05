
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

        /* =============================
           INGRESOS POR MÉTODO
        ============================= */
        const ingresosQuery = await pool.query(`
            SELECT
                metodo_pago,
                SUM(monto) AS total
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
              AND EXTRACT(YEAR FROM fecha_pago) = $2
            GROUP BY metodo_pago
        `, [mes, anio]);

        const ingresos = {
            efectivo: 0,
            transferencia: 0
        };

        ingresosQuery.rows.forEach(r => {
            ingresos[r.metodo_pago] = Number(r.total);
        });

        /* =============================
           PLANES (ALTAS VS RENOVACIONES)
        ============================= */
        const planesQuery = await pool.query(`
            SELECT
                tipo,
                SUM(CASE WHEN plan_eg THEN 1 ELSE 0 END) AS eg,
                SUM(CASE WHEN plan_personalizado THEN 1 ELSE 0 END) AS personalizado,
                SUM(CASE WHEN plan_running THEN 1 ELSE 0 END) AS running
            FROM pagos
            JOIN alumnos ON alumnos.id = pagos.alumno_id
            WHERE EXTRACT(MONTH FROM pagos.fecha_pago) = $1
              AND EXTRACT(YEAR FROM pagos.fecha_pago) = $2
            GROUP BY tipo
        `, [mes, anio]);

        const planes = {
            altas: { eg: 0, personalizado: 0, running: 0 },
            renovaciones: { eg: 0, personalizado: 0, running: 0 }
        };

        planesQuery.rows.forEach(r => {
            if (r.tipo === "alta") {
                planes.altas = {
                    eg: Number(r.eg),
                    personalizado: Number(r.personalizado),
                    running: Number(r.running)
                };
            }
            if (r.tipo === "renovacion") {
                planes.renovaciones = {
                    eg: Number(r.eg),
                    personalizado: Number(r.personalizado),
                    running: Number(r.running)
                };
            }
        });

        /* =============================
           EVOLUCIÓN MENSUAL
        ============================= */
        const evolucionQuery = await pool.query(`
            SELECT
                TO_CHAR(fecha_pago, 'YYYY-MM') AS mes,
                SUM(monto) AS ingresos,
                COUNT(*) FILTER (WHERE tipo = 'renovacion') AS renovaciones
            FROM pagos
            GROUP BY mes
            ORDER BY mes
        `);

        const evolucion = evolucionQuery.rows.map(r => ({
            mes: r.mes,
            ingresos: Number(r.ingresos),
            renovaciones: Number(r.renovaciones)
        }));

        /* =============================
        RESPUESTA FINAL
        ============================= */
        res.json({
            ingresos,
            planes,
            evolucion
        });

    } catch (error) {
        console.error("❌ ERROR ESTADÍSTICAS:", error);
        res.status(500).json({ error: "Error estadísticas" });
    }
});

export default router;
