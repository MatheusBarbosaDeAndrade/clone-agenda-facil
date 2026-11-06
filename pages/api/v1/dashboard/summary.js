import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findByUserId } from "models/provider.js";
import { getProviderSummary } from "models/appointment.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const provider = await findByUserId(session.id);
  const summary = await getProviderSummary(provider.id);
  return res.status(200).json(summary);
}

export default injectController(handler, ["GET"]);
