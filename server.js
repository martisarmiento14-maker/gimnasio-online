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

// 🚨 CORS DEFINITIVO
app.use(cors({
    origin: [
        "https://gimnasio-online-frontend.onrender.com",
        "https://gimnasio-online-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:5501"   // <--- AGREGADO PARA LIVE SERVER
    ],
    methods: "GET,POST,PUT,DELETE",
    credentials: true
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
