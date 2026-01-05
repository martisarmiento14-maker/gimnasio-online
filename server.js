import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.js";
import alumnosRoutes from "./routes/alumnos.js";
import asistenciasRoutes from "./routes/asistencias.js";
import loginRoutes from "./routes/login.js";
import pagosRoutes from "./routes/pagos.js";
import estadisticasRoutes from "./routes/estadisticas.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", loginRoutes);
app.use("/admin", adminRoutes);
app.use("/alumnos", alumnosRoutes);
app.use("/asistencias", asistenciasRoutes);
app.use("/pagos", pagosRoutes);
app.use("/estadisticas", estadisticasRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor funcionando");
});
