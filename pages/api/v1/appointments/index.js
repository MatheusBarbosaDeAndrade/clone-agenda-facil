import { createHandler, requireUser } from "infra/controller.js";
import { rateLimit } from "infra/rate-limit.js";
import { bookingSchema } from "lib/validation.js";
import appointment from "models/appointment.js";

async function list(req, res) {
  const { user: me } = await requireUser(req);
  if (me.papel === "prestador") {
    return res.status(200).json(await appointment.listForProvider(me.id));
  }
  const aba = req.query.aba === "historico" ? "historico" : "agendados";
  res.status(200).json(await appointment.listForClient(me.id, aba));
}

async function book(req, res) {
  const { user: me } = await requireUser(req, "cliente");
  await rateLimit({
    key: `booking:${me.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });
  const data = bookingSchema.parse(req.body || {});
  const id = await appointment.book(me.id, data);
  res.status(201).json(await appointment.findForUser(id, me));
}

export default createHandler({ GET: list, POST: book });
