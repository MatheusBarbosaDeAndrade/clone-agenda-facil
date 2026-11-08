import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { isoDateSchema } from "lib/validation.js";
import { todayISO } from "lib/format.js";
import availability from "models/availability.js";
import provider from "models/provider.js";

const querySchema = z.object({
  id: z.uuid(),
  de: isoDateSchema.optional(),
  dias: z.coerce.number().int().min(1).max(14).default(5),
});

async function slots(req, res) {
  await requireUser(req);
  const { id, de, dias } = querySchema.parse(req.query);
  await provider.findById(id);
  const from = de && de >= todayISO() ? de : todayISO();
  res
    .status(200)
    .json({ de: from, horarios: await availability.freeSlots(id, from, dias) });
}

export default createHandler({ GET: slots });
