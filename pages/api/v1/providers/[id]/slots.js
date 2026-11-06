import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { getAvailabilityByProviderId } from "models/availability.js";
import database from "infra/database.js";

async function handler(req, res) {
  await requireAuth(req);
  const { id, data } = req.query;

  if (!data) {
    return res.status(400).json({ erro: "Data é obrigatória (YYYY-MM-DD)" });
  }

  const dateObj = new Date(`${data}T00:00:00Z`);
  const dayOfWeek = dateObj.getUTCDay();

  const availabilities = await getAvailabilityByProviderId(id);
  const activeBlocks = availabilities.filter(
    (a) => a.dia_semana === dayOfWeek && a.ativo,
  );

  const reservedResult = await database.query(
    `SELECT hora::text FROM agendamentos 
     WHERE prestador_id = $1 AND data = $2 AND status IN ('pendente', 'confirmado')`,
    [id, data],
  );
  const reservedSlots = reservedResult.rows.map((r) => r.hora.substring(0, 5));

  const freeSlots = activeBlocks
    .map((b) => b.inicio.substring(0, 5))
    .filter((slot) => !reservedSlots.includes(slot));

  return res.status(200).json(freeSlots);
}

export default injectController(handler, ["GET"]);
