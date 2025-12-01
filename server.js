// server.js
import express from "express";
console.log("Backend actualizado para redeploy");

import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Base de datos
import db from "./database/db.js";

// Rutas
import loginRoutes from "./routes/login.js";
import alumnosRoutes from "./routes/alumnos.js";
import adminRoutes from "./routes/admin.js";
import asistenciasRoutes from "./routes/asistencias.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/login", loginRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/admin", adminRoutes);
app.use("/asistencias", asistenciasRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🟢 Servidor corriendo en puerto ${PORT}`);
});
