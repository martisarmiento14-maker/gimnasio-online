import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false
    }
});

// Wrapper: convierte pool.query en db.query
const db = {
    query: (text, params) => pool.query(text, params),
};

export default db;
