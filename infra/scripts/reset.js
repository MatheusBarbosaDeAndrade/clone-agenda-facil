const { Pool } = require("pg");
const { execSync } = require("child_process");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5433),
  user: process.env.POSTGRES_USER || "postgres",
  database: process.env.POSTGRES_DB || "agenda_facil_development",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("A recriar o esquema da base de dados...");
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("Esquema limpo com sucesso!");
  } catch (err) {
    console.error("Erro ao limpar base de dados:", err);
  } finally {
    client.release();
    await pool.end();
  }

  console.log("A executar migrations...");
  execSync("npm run migrations:up", { stdio: "inherit" });

  console.log("A executar seed...");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main();
