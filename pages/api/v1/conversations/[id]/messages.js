import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { rateLimit } from "infra/rate-limit.js";
import { messageSchema } from "lib/validation.js";
import chat from "models/chat.js";

async function list(req, res) {
  const { user: me } = await requireUser(req);
  const id = z.uuid().parse(req.query.id);
  res.status(200).json(await chat.listMessages(id, me));
}

async function send(req, res) {
  const { user: me } = await requireUser(req);
  await rateLimit({ key: `message:${me.id}`, limit: 60, windowSeconds: 60 });
  const id = z.uuid().parse(req.query.id);
  const { texto } = messageSchema.parse(req.body || {});
  res.status(201).json(await chat.send(id, me, texto));
}

export default createHandler({ GET: list, POST: send });
