import mysql from 'mysql2';

// CONEXIÓN A MYSQL EN RAILWAY DESDE RENDER
export const db = mysql.createConnection({
    host: 'shinkansen.proxy.rlwy.net',
    port: 20021,
    user: 'root',
    password: 'OvIExEXKytNqEDCSzRnETnYgopWHlIPd',
    database: 'railway'
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
