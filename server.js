import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.js";
import alumnosRoutes from "./routes/alumnos.js";
import asistenciasRoutes from "./routes/asistencias.js";
import loginRoutes from "./routes/login.js";
import pagosRoutes from "./routes/pagos.js";


const app = express();

app.use(cors());
app.use(express.json());

// RUTAS PRINCIPALES
app.use("/login", loginRoutes);
app.use("/admin", adminRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/pagos", pagosRoutes);

// SERVIDOR
app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor funcionando en puerto 3000");
});
