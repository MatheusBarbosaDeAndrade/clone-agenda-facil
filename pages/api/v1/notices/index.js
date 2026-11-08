import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { noticeSchema } from "lib/validation.js";
import notice from "models/notice.js";

async function list(req, res) {
  const { user: me } = await requireUser(req);
  const prestadorId =
    me.papel === "prestador" ? me.id : z.uuid().parse(req.query.prestador);
  res.status(200).json(await notice.listByProvider(prestadorId));
}

async function create(req, res) {
  const { user: me } = await requireUser(req, "prestador");
  res
    .status(201)
    .json(await notice.create(me.id, noticeSchema.parse(req.body || {})));
}

export default createHandler({ GET: list, POST: create });
