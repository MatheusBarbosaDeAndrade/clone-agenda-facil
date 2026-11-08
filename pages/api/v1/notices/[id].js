import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { noticeSchema } from "lib/validation.js";
import notice from "models/notice.js";

async function update(req, res) {
  const { user: me } = await requireUser(req, "prestador");
  const id = z.uuid().parse(req.query.id);
  res
    .status(200)
    .json(await notice.update(id, me.id, noticeSchema.parse(req.body || {})));
}

async function remove(req, res) {
  const { user: me } = await requireUser(req, "prestador");
  const id = z.uuid().parse(req.query.id);
  await notice.remove(id, me.id);
  res.status(204).end();
}

export default createHandler({ PUT: update, DELETE: remove });
