import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findById, updateStatus } from "models/appointment.js";
import { ForbiddenError, NotFoundError } from "infra/errors.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const { id } = req.query;
  const { status: newStatus } = req.body;

  const appointment = await findById(id);
  if (!appointment) {
    throw new NotFoundError("Agendamento não encontrado");
  }

  if (session.papel === "cliente") {
    if (appointment.cliente_id !== session.id || newStatus !== "cancelado") {
      throw new ForbiddenError("Ação não permitida para este utilizador");
    }
  }

  const updated = await updateStatus(id, newStatus);
  return res.status(200).json(updated);
}

export default injectController(handler, ["PATCH"]);
