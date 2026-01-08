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
// ==========================
// 📊 ALTAS vs RENOVACIONES (REAL)
// ==========================
router.get("/altas", async (req, res) => {
    const { mes } = req.query;

    if (!mes) {
        return res.status(400).json({ error: "mes requerido (YYYY-MM)" });
    }

    try {
        // 1️⃣ Total alumnos activos ese mes
        const totalResult = await db.query(
            `
            SELECT COUNT(DISTINCT id_alumno) AS total
            FROM membresias
            WHERE periodo_mes = $1
            `,
            [mes]
        );

        // 2️⃣ Altas: primera vez que el alumno aparece
        const altasResult = await db.query(
            `
            SELECT COUNT(*) AS altas
            FROM (
                SELECT id_alumno, MIN(periodo_mes) AS primer_mes
                FROM membresias
                GROUP BY id_alumno
            ) t
            WHERE primer_mes = $1
            `,
            [mes]
        );

        const total = Number(totalResult.rows[0].total);
        const altas = Number(altasResult.rows[0].altas);
        const renovaciones = total - altas;

        res.json({
            altas,
            renovaciones,
            total
        });

    } catch (error) {
        console.error("ERROR ALTAS:", error);
        res.status(500).json({ error: "Error estadísticas altas" });
    }
});

router.get("/planes", async (req, res) => {
  const { mes } = req.query;

  const result = await db.query(`
    SELECT plan, COUNT(*) cantidad
    FROM membresias
    WHERE periodo_mes = $1
    GROUP BY plan
  `, [mes]);

  const data = {};
  result.rows.forEach(r => data[r.plan] = Number(r.cantidad));

  res.json(data);
});
router.get("/planes-dias", async (req, res) => {
  const { mes } = req.query;

  const result = await db.query(`
    SELECT plan, dias_por_semana, COUNT(*) cantidad
    FROM membresias
    WHERE periodo_mes = $1
    GROUP BY plan, dias_por_semana
  `, [mes]);

  const data = {
    eg_3_dias: 0,
    eg_5_dias: 0,
    pers_3_dias: 0,
    pers_5_dias: 0
  };

  result.rows.forEach(r => {
    if (r.plan === "eg" && r.dias_por_semana === 3) data.eg_3_dias = r.cantidad;
    if (r.plan === "eg" && r.dias_por_semana === 5) data.eg_5_dias = r.cantidad;
    if (r.plan === "personalizado" && r.dias_por_semana === 3) data.pers_3_dias = r.cantidad;
    if (r.plan === "personalizado" && r.dias_por_semana === 5) data.pers_5_dias = r.cantidad;
  });

  res.json(data);
});
router.get("/ingresos", async (req, res) => {
  const { mes } = req.query;

  const result = await db.query(`
    SELECT metodo_pago, SUM(monto) total
    FROM pagos
    WHERE TO_CHAR(fecha_pago, 'YYYY-MM') = $1
    GROUP BY metodo_pago
  `, [mes]);

  const data = {
    efectivo: { total: 0 },
    transferencia: { total: 0 }
  };

  result.rows.forEach(r => {
    data[r.metodo_pago] = { total: Number(r.total) };
  });

  res.json(data);
});


export default router;
