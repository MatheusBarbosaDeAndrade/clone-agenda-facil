import pg from "pg";
import { getConnectionConfig } from "../db-config.mjs";
import { runMaintenance } from "../maintenance.mjs";

const client = new pg.Client(getConnectionConfig());
await client.connect();
try {
  const report = await runMaintenance((sql) => client.query(sql));
  console.log("[maintenance] registros removidos:", report);
} finally {
  await client.end();
}
