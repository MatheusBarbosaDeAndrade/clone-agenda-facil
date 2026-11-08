import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import appointment from "models/appointment.js";

const schema = z.object({ nota: z.number().int().min(1).max(5) });

async function rate(req, res) {
  const { user: me } = await requireUser(req, "cliente");
  const id = z.uuid().parse(req.query.id);
  const { nota } = schema.parse(req.body || {});
  res.status(200).json(await appointment.rate(id, me, nota));
}

export default createHandler({ POST: rate });
