import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import chat from "models/chat.js";

async function list(req, res) {
  const { user: me } = await requireUser(req);
  res.status(200).json(await chat.listConversations(me));
}

async function start(req, res) {
  const { user: me } = await requireUser(req);
  const { usuarioId } = z.object({ usuarioId: z.uuid() }).parse(req.body || {});
  res.status(200).json({ id: await chat.start(me, usuarioId) });
}

export default createHandler({ GET: list, POST: start });
