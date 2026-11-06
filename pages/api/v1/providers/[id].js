import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findById } from "models/provider.js";
import { NotFoundError } from "infra/errors.js";

async function handler(req, res) {
  await requireAuth(req);
  const { id } = req.query;
  const provider = await findById(id);

  if (!provider) {
    throw new NotFoundError("Prestador não encontrado");
  }

  return res.status(200).json(provider);
}

export default injectController(handler, ["GET"]);
