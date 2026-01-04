
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
GET — ESTADÍSTICAS GENERALES
=========================================== */
router.get("/estadisticas", async (req, res) => {
    try {
        // Alumnos ingresados este mes
        const alumnosMes = await db.query(`
            SELECT COUNT(*) 
            FROM alumnos
            WHERE fecha_alta >= date_trunc('month', CURRENT_DATE)
        `);

        // Alumnos por plan (solo activos)
        const planes = await db.query(`
            SELECT
                SUM(CASE WHEN plan_eg = true THEN 1 ELSE 0 END) AS eg,
                SUM(CASE WHEN plan_personalizado = true THEN 1 ELSE 0 END) AS personalizado,
                SUM(CASE WHEN plan_running = true THEN 1 ELSE 0 END) AS running
            FROM alumnos
            WHERE activo = 1
        `);

        // Renovaciones del mes
        const renovaciones = await db.query(`
            SELECT COUNT(*)
            FROM alumnos
            WHERE fecha_vencimiento >= date_trunc('month', CURRENT_DATE)
            AND fecha_vencimiento < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
        `);

        res.json({
            alumnos_mes: Number(alumnosMes.rows[0].count),
            planes: planes.rows[0],
            renovaciones_mes: Number(renovaciones.rows[0].count)
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS:", error);
        res.status(500).json({ error: "Error obteniendo estadísticas" });
    }
});
router.post("/pagos", async (req, res) => {
    try {
        const { id_alumno, monto, metodo_pago, tipo } = req.body;

        if (!id_alumno || !monto || !metodo_pago || !tipo) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        await db.query(
            `INSERT INTO pagos (id_alumno, monto, metodo_pago, tipo)
            VALUES ($1, $2, $3, $4)`,
            [id_alumno, monto, metodo_pago, tipo]
        );

        res.json({ ok: true });

    } catch (error) {
        console.error("ERROR REGISTRANDO PAGO:", error);
        res.status(500).json({ error: "Error registrando pago" });
    }
});
router.get("/estadisticas-finanzas", async (req, res) => {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Faltan mes o año" });
        }

        const fechaInicio = `${anio}-${mes}-01`;

        const ingresos = await db.query(`
            SELECT
              COALESCE(SUM(monto), 0) AS total,
              COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END), 0) AS efectivo,
              COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END), 0) AS transferencia
            FROM pagos
            WHERE fecha_pago >= to_date($1, 'YYYY-MM-DD')
              AND fecha_pago < (to_date($1, 'YYYY-MM-DD') + INTERVAL '1 month')
        `, [fechaInicio]);

        const alumnosNuevos = await db.query(`
            SELECT COUNT(DISTINCT id_alumno) AS cantidad
            FROM pagos
            WHERE tipo = 'alta'
              AND fecha_pago >= to_date($1, 'YYYY-MM-DD')
              AND fecha_pago < (to_date($1, 'YYYY-MM-DD') + INTERVAL '1 month')
        `, [fechaInicio]);

        const renovaciones = await db.query(`
            SELECT COUNT(*) AS cantidad
            FROM pagos
            WHERE tipo = 'renovacion'
              AND fecha_pago >= to_date($1, 'YYYY-MM-DD')
              AND fecha_pago < (to_date($1, 'YYYY-MM-DD') + INTERVAL '1 month')
        `, [fechaInicio]);

        res.json({
            mes,
            anio,
            ingresos: ingresos.rows[0],
            alumnos_nuevos: Number(alumnosNuevos.rows[0].cantidad),
            renovaciones: Number(renovaciones.rows[0].cantidad)
        });

    } catch (error) {
        console.error("ERROR ESTADISTICAS FINANZAS:", error);
        res.status(500).json({ error: "Error obteniendo estadísticas financieras" });
    }
});





export default router;
