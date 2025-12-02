import express from "express";
console.log("Backend actualizado para redeploy");

import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import db from "./database/db.js";

import loginRoutes from "./routes/login.js";
import alumnosRoutes from "./routes/alumnos.js";
import adminRoutes from "./routes/admin.js";
import asistenciasRoutes from "./routes/asistencias.js";

const app = express();

// CORS CONFIGURADO CORRECTAMENTE
app.use(cors({
    origin: "https://gimnasio-online-frontend.onrender.com",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization"
}));

app.use(express.json());

// Rutas
app.use("/login", loginRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/admin", adminRoutes);
app.use("/asistencias", asistenciasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🟢 Servidor corriendo en puerto ${PORT}`);
});
