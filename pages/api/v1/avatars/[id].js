import { createHandler, requireUser } from "infra/controller.js";
import { NotFoundError } from "infra/errors.js";
import user from "models/user.js";

const UUID = /^[0-9a-f-]{36}$/i;

// Fotos de perfil são dados pessoais: só usuários autenticados podem vê-las.
async function getAvatar(req, res) {
  await requireUser(req);
  const id = String(req.query.id);
  if (!UUID.test(id)) throw new NotFoundError();
  const avatar = await user.getAvatar(id);
  if (!avatar) throw new NotFoundError();
  res.setHeader("Content-Type", avatar.mime);
  res.setHeader("Cache-Control", "private, max-age=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.status(200).send(avatar.conteudo);
}

export default createHandler({ GET: getAvatar });
