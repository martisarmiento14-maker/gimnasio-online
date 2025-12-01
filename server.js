// ===============================
//   SERVER.JS (VERSIÓN CORRECTA)
// ===============================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Conexión a la base
import db from "./database/db.js";

// Importar rutas
import loginRoutes from "./routes/login.js";
import alumnosRoutes from "./routes/alumnos.js";
import asistenciasRoutes from "./routes/asistencias.js";
import cuotasRoutes from "./routes/cuotas.js";

// Crear app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/login", loginRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/cuotas", cuotasRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
});

export default app;
