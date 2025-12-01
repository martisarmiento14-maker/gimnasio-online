import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import "./database/db.js";

import alumnosRoutes from "./routes/alumnos.js";
import cuotasRoutes from "./routes/cuotas.js";
import asistenciasRoutes from "./routes/asistencias.js";
import loginRoutes from "./routes/login.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", loginRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/cuotas", cuotasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor escuchando en puerto " + PORT);
});

