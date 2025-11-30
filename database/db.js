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
