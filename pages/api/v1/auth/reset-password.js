import { createHandler } from "infra/controller.js";
import { rateLimitByIp } from "infra/rate-limit.js";
import { audit } from "infra/audit.js";
import { resetPasswordSchema } from "lib/validation.js";
import passwordReset from "models/password-reset.js";

async function reset(req, res) {
  await rateLimitByIp(req, "reset", 20, 60 * 60);
  const { token, senha } = resetPasswordSchema.parse(req.body || {});
  const usuarioId = await passwordReset.consume(token, senha);
  await audit(req, usuarioId, "senha_redefinida");
  res.status(200).json({ ok: true });
}

export default createHandler({ POST: reset });
