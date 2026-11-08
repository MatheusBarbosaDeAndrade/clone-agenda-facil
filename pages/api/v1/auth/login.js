import { createHandler } from "infra/controller.js";
import { rateLimit, rateLimitByIp } from "infra/rate-limit.js";
import { audit } from "infra/audit.js";
import { verifyPassword } from "infra/crypto.js";
import { UnauthorizedError } from "infra/errors.js";
import { homePathFor, safeNext } from "infra/page-auth.js";
import { loginSchema } from "lib/validation.js";
import user from "models/user.js";
import session from "models/session.js";

async function login(req, res) {
  await rateLimitByIp(req, "login", 30, 15 * 60);
  const { identificador, senha, lembrar } = loginSchema.parse(req.body || {});
  await rateLimit({
    key: `login:id:${identificador.toLowerCase()}`,
    limit: 8,
    windowSeconds: 15 * 60,
  });

  const credentials = await user.findCredentials(identificador);
  // verifyPassword roda mesmo sem usuário (tempo constante contra enumeração).
  const valid = await verifyPassword(senha, credentials?.senha_hash);
  if (!credentials || !valid) {
    throw new UnauthorizedError({
      message: "E-mail/telefone ou senha incorretos.",
      action: "Verifique os dados ou recupere sua senha.",
    });
  }
  await session.create(res, credentials.id, lembrar);
  await audit(req, credentials.id, "login");
  res.status(200).json({
    redirectTo: safeNext(req.query.next) || homePathFor(credentials.papel),
  });
}

export default createHandler({ POST: login });
