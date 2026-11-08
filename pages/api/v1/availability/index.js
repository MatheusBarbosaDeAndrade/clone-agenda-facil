import { createHandler, requireUser } from "infra/controller.js";
import { availabilitySchema } from "lib/validation.js";
import availability from "models/availability.js";

async function getBlocks(req, res) {
  const { user: me } = await requireUser(req, "prestador");
  res.status(200).json(await availability.listBlocks(me.id));
}

async function saveBlocks(req, res) {
  const { user: me } = await requireUser(req, "prestador");
  const { blocos } = availabilitySchema.parse(req.body || {});
  await availability.replaceBlocks(me.id, blocos);
  res.status(200).json(await availability.listBlocks(me.id));
}

export default createHandler({ GET: getBlocks, PUT: saveBlocks });
