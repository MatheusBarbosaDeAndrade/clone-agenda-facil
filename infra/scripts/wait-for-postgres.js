const { Client } = require("pg");

const clientConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5433),
  user: process.env.POSTGRES_USER || "postgres",
  database: process.env.POSTGRES_DB || "agenda_facil_development",
  password: process.env.POSTGRES_PASSWORD || "postgres",
};

async function checkPostgres(retries = 30) {
  const client = new Client(clientConfig);
  try {
    await client.connect();
    await client.query("SELECT 1;");
    await client.end();
    console.log("\n🟢 PostgreSQL pronto para aceitar conexões!");
    process.exit(0);
  } catch (error) {
    if (retries === 0) {
      console.error(
        `\n🔴 Falha ao conectar no PostgreSQL. Último erro: ${error.message}`,
      );
      process.exit(1);
    }
    process.stdout.write(".");
    setTimeout(() => checkPostgres(retries - 1), 1000);
  }
}

console.log(
  `🟡 Aguardando PostgreSQL em ${clientConfig.host}:${clientConfig.port}...`,
);
checkPostgres();
