import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,  // <-- ESTA LÍNEA ES LA CLAVE
});

pool.getConnection()
    .then(() => {
        console.log("Conectado a Railway MySQL 🚀");
    })
    .catch((err) => {
        console.error("❌ Error al conectar a Railway:", err);
    });

export default pool;
