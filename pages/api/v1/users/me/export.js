import { createHandler, requireUser } from "infra/controller.js";
import { audit } from "infra/audit.js";
import { rateLimit } from "infra/rate-limit.js";
import privacy from "models/privacy.js";

/** LGPD art. 18, II e V — acesso e portabilidade dos dados. */
async function exportData(req, res) {
  const { user: me } = await requireUser(req);
  await rateLimit({
    key: `export:${me.id}`,
    limit: 10,
    windowSeconds: 60 * 60,
  });
  const data = await privacy.exportData(me.id);
  await audit(req, me.id, "dados_exportados");
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="agendafacil-meus-dados-${date}.json"`,
  );
  res.status(200).send(JSON.stringify(data, null, 2));
}

export default createHandler({ GET: exportData });
