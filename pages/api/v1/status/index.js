import database from "infra/database.js";
import { createHandler } from "infra/controller.js";

async function getStatus(req, res) {
  const updatedAt = new Date().toISOString();
  let databaseStatus = "healthy";
  try {
    await database.query("SELECT 1");
  } catch {
    databaseStatus = "unavailable";
  }
  res.status(databaseStatus === "healthy" ? 200 : 503).json({
    status: databaseStatus === "healthy" ? "ok" : "degraded",
    updated_at: updatedAt,
    dependencies: { database: { status: databaseStatus } },
  });
}

export default createHandler({ GET: getStatus });
