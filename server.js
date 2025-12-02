import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.js";
import alumnosRoutes from "./routes/alumnos.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/alumnos", alumnosRoutes);

app.listen(process.env.PORT || 3000, () =>
    console.log("Servidor andando en puerto 3000")
);
