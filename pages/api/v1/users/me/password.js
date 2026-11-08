import { createHandler, requireUser } from "infra/controller.js";
import { audit } from "infra/audit.js";
import { verifyPassword } from "infra/crypto.js";
import { ValidationError } from "infra/errors.js";
import { rateLimit } from "infra/rate-limit.js";
import { changePasswordSchema } from "lib/validation.js";
import user from "models/user.js";
import session from "models/session.js";

async function changePassword(req, res) {
  const { user: me, sessaoId } = await requireUser(req);
  await rateLimit({
    key: `password:${me.id}`,
    limit: 10,
    windowSeconds: 15 * 60,
  });
  const { senhaAtual, novaSenha } = changePasswordSchema.parse(req.body || {});
  if (me.temSenha) {
    const valid = await verifyPassword(
      senhaAtual,
      await user.findPasswordHash(me.id),
    );
    if (!valid)
      throw new ValidationError({
        message: "Senha atual incorreta.",
        fields: { senhaAtual: "Senha atual incorreta." },
      });
  }
  await user.updatePassword(me.id, novaSenha);
  await session.destroyAllForUser(me.id, sessaoId);
  await audit(req, me.id, "senha_alterada");
  res.status(200).json({ ok: true });
}

export default createHandler({ PUT: changePassword });
