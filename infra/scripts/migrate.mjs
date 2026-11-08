// Uso: node infra/scripts/migrate.mjs [up|down] [quantidade]
import { runner } from "node-pg-migrate";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConnectionConfig } from "../db-config.mjs";

const direction = process.argv[2] === "down" ? "down" : "up";
const count = process.argv[3]
  ? Number(process.argv[3])
  : direction === "down"
    ? 1
    : Infinity;
const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

const client = new pg.Client(getConnectionConfig({ unpooled: true }));
await client.connect();
try {
  const migrations = await runner({
    dbClient: client,
    dir,
    direction,
    count,
    migrationsTable: "pgmigrations",
    log: () => {},
  });
  if (migrations.length === 0) {
    console.log(`[migrations] nenhuma migração pendente (${direction}).`);
  } else {
    for (const migration of migrations) {
      console.log(`[migrations] ${direction}: ${migration.name}`);
    }
  }
} finally {
  await client.end();
}
