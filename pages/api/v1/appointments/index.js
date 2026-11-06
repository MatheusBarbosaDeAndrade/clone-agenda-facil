import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { createAppointment, listAppointments } from "models/appointment.js";

async function handler(req, res) {
  const session = await requireAuth(req);

  if (req.method === "GET") {
    const { status, busca, tipo } = req.query;
    const items = await listAppointments({
      userId: session.id,
      papel: session.papel,
      status,
      busca,
      tipo,
    });
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    const { providerId, servico, data, hora } = req.body;
    const appointment = await createAppointment({
      prestadorId: providerId,
      clienteId: session.id,
      servico,
      data,
      hora,
    });
    return res.status(201).json(appointment);
  }
}

export default injectController(handler, ["GET", "POST"]);
