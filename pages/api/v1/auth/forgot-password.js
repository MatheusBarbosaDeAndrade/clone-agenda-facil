import { createHandler } from "infra/controller.js";
import { rateLimit, rateLimitByIp } from "infra/rate-limit.js";
import { audit } from "infra/audit.js";
import { forgotPasswordSchema } from "lib/validation.js";
import passwordReset from "models/password-reset.js";

async function forgot(req, res) {
  await rateLimitByIp(req, "forgot", 10, 60 * 60);
  const { email } = forgotPasswordSchema.parse(req.body || {});
  await rateLimit({
    key: `forgot:email:${email}`,
    limit: 3,
    windowSeconds: 60 * 60,
  });
  const usuarioId = await passwordReset.request(email);
  if (usuarioId) await audit(req, usuarioId, "recuperacao_solicitada");
  // Resposta idêntica exista ou não a conta (evita enumeração de e-mails).
  res.status(200).json({ ok: true });
}

export default createHandler({ POST: forgot });
