<<<<<<< HEAD
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
=======
import mysql from "mysql2";

export const db = mysql.createConnection({
    host: "mysql.railway.internal",
    port: 3306,
    user: "root",
    password: "OvIExEXKytNqEDCSzRnETnYgopWHIlPd",
    database: "railway"
});

// Probar conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a Railway:', err);
    return;
    }
    console.log('🚀 Conectado correctamente a Railway MySQL.');
});

export default db;
>>>>>>> cb64933406b9d4a516d0b5df34625f820c62c1ef
