import pg from "pg";
import { getConnectionConfig } from "../db-config.mjs";

const deadline = Date.now() + 60_000;
process.stdout.write("[database] aguardando o Postgres aceitar conexões");
while (true) {
  const client = new pg.Client(getConnectionConfig());
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    console.log("\n[database] pronto!");
    break;
  } catch {
    await client.end().catch(() => {});
    if (Date.now() > deadline) {
      console.error("\n[database] tempo esgotado.");
      process.exit(1);
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
