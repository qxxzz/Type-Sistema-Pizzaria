import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

export const dbConfig: sql.config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASS || "P@sswOrd",
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || "PizzariaDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function getConnection() {
  try {
    console.log("Conectando ao banco de dados...");
    const pool = await sql.connect(dbConfig);
    console.log("✅ Conexão bem-sucedida com o SQL Server!");
    return pool;
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
    throw err;
  }
}
