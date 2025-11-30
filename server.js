
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import "./database/db.js";

// Importar rutas
import loginRoutes from "./routes/login.js";
import alumnosRoutes from "./routes/alumnos.js";
import asistenciasRoutes from "./routes/asistencias.js";
import cuotasRoutes from "./routes/cuotas.js";

const app = express();

// ======================
// Middlewares
// ======================
app.use(cors());               // Permite conexión desde tu frontend en Render
app.use(express.json());       // Habilita JSON en requests

// ======================
// Rutas
// ======================
app.use("/login", loginRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/cuotas", cuotasRoutes);


// ======================
// Puerto (Render o Local)
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});

export default app;
