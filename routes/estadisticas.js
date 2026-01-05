import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { mes, anio } = req.query;

    const result = await db.query(`
      SELECT
        p.tipo,
        a.plan_eg,
        a.plan_personalizado,
        a.plan_running,
        a.dias_eg_pers
      FROM pagos p
      JOIN alumnos a ON a.id = p.id_alumno
      WHERE EXTRACT(MONTH FROM p.fecha_pago) = $1
      AND EXTRACT(YEAR FROM p.fecha_pago) = $2
    `, [mes, anio]);

    const totalAlumnos = result.rows.length;

    const planes = {
      eg: 0,
      personalizado: 0,
      running: 0,
      combo_eg: 0,
      combo_pers: 0
    };

    const diasEG = { tres: 0, cinco: 0 };
    const diasPers = { tres: 0, cinco: 0 };

    result.rows.forEach(r => {
      // planes
      if (r.plan_eg) planes.eg++;
      if (r.plan_personalizado) planes.personalizado++;
      if (r.plan_running) planes.running++;

      if (r.plan_eg && r.plan_running) planes.combo_eg++;
      if (r.plan_personalizado && r.plan_running) planes.combo_pers++;

      // días
      if (r.plan_eg) {
        if (r.dias_eg_pers === 3) diasEG.tres++;
        if (r.dias_eg_pers === 5) diasEG.cinco++;
      }

      if (r.plan_personalizado) {
        if (r.dias_eg_pers === 3) diasPers.tres++;
        if (r.dias_eg_pers === 5) diasPers.cinco++;
      }
    });

    res.json({
      totalAlumnos,
      planes,
      diasEG,
      diasPersonalizado: diasPers
    });

  } catch (err) {
    console.error("ERROR ESTADISTICAS:", err);
    res.status(500).json({ error: "Error estadísticas" });
  }
});

export default router;
