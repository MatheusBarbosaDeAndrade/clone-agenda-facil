import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { audit } from "infra/audit.js";
import appointment from "models/appointment.js";

const schema = z.object({
  status: z.enum(["confirmado", "cancelado", "concluido", "nao_compareceu"], {
    error: "Status inválido.",
  }),
});

async function updateStatus(req, res) {
  const { user: me } = await requireUser(req);
  const id = z.uuid().parse(req.query.id);
  const { status } = schema.parse(req.body || {});
  const updated = await appointment.updateStatus(id, me, status);
  await audit(req, me.id, `agendamento_${status}`);
  res.status(200).json(updated);
}

export default createHandler({ PATCH: updateStatus });
