import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findByUserId } from "models/provider.js";
import { findById, updateNotice, deleteNotice } from "models/notice.js";
import { ForbiddenError, NotFoundError } from "infra/errors.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const provider = await findByUserId(session.id);
  const { id } = req.query;

  const notice = await findById(id);
  if (!notice) {
    throw new NotFoundError("Aviso não encontrado");
  }

  if (notice.prestador_id !== provider.id) {
    throw new ForbiddenError("Sem permissão para alterar este aviso");
  }

  if (req.method === "PATCH") {
    const updated = await updateNotice(id, req.body);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await deleteNotice(id);
    return res.status(204).end();
  }
}

export default injectController(handler, ["PATCH", "DELETE"]);
