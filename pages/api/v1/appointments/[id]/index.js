import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import appointment from "models/appointment.js";

async function getOne(req, res) {
  const { user: me } = await requireUser(req);
  const id = z.uuid().parse(req.query.id);
  res.status(200).json(await appointment.findForUser(id, me));
}

export default createHandler({ GET: getOne });
