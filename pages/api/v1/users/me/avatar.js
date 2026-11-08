import { createHandler, requireUser } from "infra/controller.js";
import { ValidationError } from "infra/errors.js";
import { rateLimit } from "infra/rate-limit.js";
import user from "models/user.js";

const MAX_BYTES = 300 * 1024;

// Confere a assinatura real do arquivo (não confia no mime informado).
function detectMime(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return "image/jpeg";
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  return null;
}

async function upload(req, res) {
  const { user: me } = await requireUser(req);
  await rateLimit({
    key: `avatar:${me.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });
  const data = String(req.body?.imagem || "");
  const match = data.match(
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match)
    throw new ValidationError({
      message: "Envie uma imagem PNG, JPEG ou WebP.",
    });
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES)
    throw new ValidationError({
      message: "A imagem deve ter no máximo 300 KB.",
    });
  const mime = detectMime(buffer);
  if (!mime)
    throw new ValidationError({ message: "Arquivo de imagem inválido." });
  await user.setAvatar(me.id, buffer, mime);
  res.status(200).json(await user.findById(me.id));
}

async function remove(req, res) {
  const { user: me } = await requireUser(req);
  await user.removeAvatar(me.id);
  res.status(200).json(await user.findById(me.id));
}

export const config = { api: { bodyParser: { sizeLimit: "500kb" } } };
export default createHandler({ PUT: upload, DELETE: remove });
