
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

/* ===========================================
GET — ESTADÍSTICAS FINANCIERAS COMPLETAS
=========================================== */
router.get("/estadisticas-finanzas", async (req, res) => {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y año requeridos" });
        }

        /* ===============================
        INGRESOS TOTALES Y MÉTODOS DE PAGO
        =============================== */
        const ingresosQuery = await db.query(`
            SELECT
                SUM(monto) AS total,
                SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) AS efectivo,
                SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) AS transferencia
            FROM pagos
            WHERE EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR FROM fecha_pago) = $2
        `, [mes, anio]);

        const ingresos = ingresosQuery.rows[0];

        /* ===============================
        ALUMNOS NUEVOS DEL MES
        =============================== */
        const alumnosNuevosQuery = await db.query(`
            SELECT COUNT(*)
            FROM alumnos
            WHERE EXTRACT(MONTH FROM fecha_alta) = $1
            AND EXTRACT(YEAR FROM fecha_alta) = $2
        `, [mes, anio]);

        const alumnos_nuevos = Number(alumnosNuevosQuery.rows[0].count);

        /* ===============================
        RENOVACIONES DEL MES
        =============================== */
        const renovacionesQuery = await db.query(`
            SELECT COUNT(*)
            FROM pagos
            WHERE tipo = 'renovacion'
            AND EXTRACT(MONTH FROM fecha_pago) = $1
            AND EXTRACT(YEAR FROM fecha_pago) = $2
        `, [mes, anio]);

        const renovaciones = Number(renovacionesQuery.rows[0].count);

        /* ===============================
        PLANES (ALTAS Y RENOVACIONES)
        =============================== */
        const planesQuery = await db.query(`
            SELECT
                p.tipo,
                a.plan_eg,
                a.plan_personalizado,
                a.plan_running
            FROM pagos p
            JOIN alumnos a ON a.id = p.id_alumno
            WHERE EXTRACT(MONTH FROM p.fecha_pago) = $1
            AND EXTRACT(YEAR FROM p.fecha_pago) = $2
        `, [mes, anio]);

        const planes = {
            altas: { eg: 0, personalizado: 0, running: 0 },
            renovaciones: { eg: 0, personalizado: 0, running: 0 }
        };

        planesQuery.rows.forEach(row => {
            const destino = row.tipo === "alta"
                ? planes.altas
                : planes.renovaciones;

            if (row.plan_eg) destino.eg++;
            if (row.plan_personalizado) destino.personalizado++;
            if (row.plan_running) destino.running++;
        });

        /* ===============================
        EVOLUCIÓN MENSUAL
        =============================== */
        const evolucionQuery = await db.query(`
            SELECT
                EXTRACT(MONTH FROM fecha_pago) AS mes,
                SUM(monto) AS ingresos,
                COUNT(*) FILTER (WHERE tipo = 'renovacion') AS renovaciones
            FROM pagos
            WHERE EXTRACT(YEAR FROM fecha_pago) = $1
            GROUP BY mes
            ORDER BY mes
        `, [anio]);

        const meses = [
            "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        const evolucion = evolucionQuery.rows.map(row => ({
            mes: meses[Number(row.mes)],
            ingresos: Number(row.ingresos),
            renovaciones: Number(row.renovaciones)
        }));

        /* ===============================
        RESPUESTA FINAL
        =============================== */
        res.json({
            mes,
            anio,
            ingresos: {
                total: Number(ingresos.total || 0),
                efectivo: Number(ingresos.efectivo || 0),
                transferencia: Number(ingresos.transferencia || 0)
            },
            alumnos_nuevos,
            renovaciones,
            planes,
            evolucion
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS FINANZAS:", error);
        res.status(500).json({ error: "Error obteniendo estadísticas financieras" });
    }
});


export default router;
