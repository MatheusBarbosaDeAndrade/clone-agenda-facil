import database from "infra/database.js";
import { safeEqual } from "infra/crypto.js";
import { handleError } from "infra/controller.js";
import { UnauthorizedError } from "infra/errors.js";
import { runMaintenance } from "infra/maintenance.mjs";

/**
 * Rotina de retenção de dados (LGPD) disparada pelo Vercel Cron.
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>" automaticamente.
 */
export default async function maintenance(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const secret = process.env.CRON_SECRET;
    const header = String(req.headers.authorization || "");
    if (
      !secret ||
      secret.length < 16 ||
      !safeEqual(header, `Bearer ${secret}`)
    ) {
      throw new UnauthorizedError({ message: "Não autorizado." });
    }
    if (req.method !== "GET") return res.status(405).end();
    const report = await runMaintenance((sql) => database.query(sql));
    console.log("[maintenance] registros removidos:", report);
    res.status(200).json({ ok: true, removidos: report });
  } catch (error) {
    handleError(error, res);
  }
}
