import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
      return res.status(400).json({ error: "Mes y año requeridos" });
    }

    /* ===============================
       PAGOS + ALUMNOS DEL MES
    =============================== */
    const result = await db.query(`
      SELECT
        p.tipo,
        p.monto,
        p.metodo_pago,
        a.plan_eg,
        a.plan_personalizado,
        a.plan_running,
        a.dias_eg_pers
      FROM pagos p
      JOIN alumnos a ON a.id = p.alumno_id
      WHERE EXTRACT(MONTH FROM p.fecha_pago) = $1
      AND EXTRACT(YEAR FROM p.fecha_pago) = $2
    `, [mes, anio]);

    /* ===============================
       CONTADORES
    =============================== */
    const alumnos = {
      total: 0,
      nuevos: 0,
      renovaciones: 0,
      planes: {
        eg: 0,
        personalizado: 0,
        running: 0,
        eg_running: 0,
        pers_running: 0
      },
      dias: {
        tres: 0,
        cinco: 0
      }
    };

    const ingresos = {
      total: 0,
      efectivo: 0,
      transferencia: 0
    };

    result.rows.forEach(r => {
      alumnos.total++;

      // altas / renovaciones
      if (r.tipo === "alta") alumnos.nuevos++;
      if (r.tipo === "renovacion") alumnos.renovaciones++;

      // planes
      if (r.plan_eg) alumnos.planes.eg++;
      if (r.plan_personalizado) alumnos.planes.personalizado++;
      if (r.plan_running) alumnos.planes.running++;

      if (r.plan_eg && r.plan_running) alumnos.planes.eg_running++;
      if (r.plan_personalizado && r.plan_running) alumnos.planes.pers_running++;

      // días (solo EG o Personalizado)
      if (r.plan_eg || r.plan_personalizado) {
        if (r.dias_eg_pers === 3) alumnos.dias.tres++;
        if (r.dias_eg_pers === 5) alumnos.dias.cinco++;
      }

      // ingresos
      ingresos.total += Number(r.monto);
      if (r.metodo_pago === "efectivo") ingresos.efectivo += Number(r.monto);
      if (r.metodo_pago === "transferencia") ingresos.transferencia += Number(r.monto);
    });

    res.json({ alumnos, ingresos });

  } catch (err) {
    console.error("ERROR ESTADISTICAS:", err);
    res.status(500).json({ error: "Error estadísticas" });
  }
});

export default router;

