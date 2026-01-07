const express = require("express");
const router = express.Router();
const pool = require("../db");
const generarMeses = require("../utils/generarMeses");

/**
 * POST /pagos
 * Registra un pago y genera las membresías correspondientes
 */
router.post("/", async (req, res) => {
  const {
    id_alumno,
    monto,
    metodo_pago,
    tipo,               // 'alta' | 'renovacion'
    plan,
    dias_por_semana,
    cantidad_meses      // 1 o 2
  } = req.body;

  // 🔒 Validaciones básicas
  if (!id_alumno || !monto || !metodo_pago || !tipo || !cantidad_meses) {
    return res.status(400).json({
      error: "Faltan datos obligatorios"
    });
  }

  if (![1, 2].includes(cantidad_meses)) {
    return res.status(400).json({
      error: "cantidad_meses debe ser 1 o 2"
    });
  }

  if (!["alta", "renovacion"].includes(tipo)) {
    return res.status(400).json({
      error: "tipo inválido"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insertar el pago (INGRESO)
    const pagoResult = await client.query(
      `
      INSERT INTO pagos
      (id_alumno, monto, metodo_pago, fecha_pago, tipo, plan, dias_por_semana)
      VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
      RETURNING id
      `,
      [
        id_alumno,
        monto,
        metodo_pago,
        tipo,
        plan || null,
        dias_por_semana || null
      ]
    );

    const id_pago = pagoResult.rows[0].id;

    // 2️⃣ Generar los meses de la membresía
    const meses = generarMeses(new Date(), cantidad_meses);

    // 3️⃣ Insertar membresías (ACTIVIDAD MENSUAL)
    for (const periodo_mes of meses) {
      await client.query(
        `
        INSERT INTO membresias
        (id_alumno, periodo_mes, tipo, plan, dias_por_semana)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id_alumno, periodo_mes) DO NOTHING
        `,
        [
          id_alumno,
          periodo_mes,
          tipo,
          plan || null,
          dias_por_semana || null
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      ok: true,
      mensaje: "Pago y membresías registradas correctamente",
      id_pago,
      meses
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error en /pagos:", error);

    res.status(500).json({
      ok: false,
      error: "Error interno al registrar el pago"
    });
  } finally {
    client.release();
  }
});

module.exports = router;
