import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { listProviders } from "models/provider.js";

async function handler(req, res) {
  await requireAuth(req);
  const { busca, categoria } = req.query;
  const providers = await listProviders({ busca, categoria });
  return res.status(200).json(providers);
}

export default injectController(handler, ["GET"]);
