import { z } from "zod";
import { createHandler, requireUser } from "infra/controller.js";
import { audit } from "infra/audit.js";
import { rateLimit } from "infra/rate-limit.js";
import { emailSchema } from "lib/validation.js";
import user from "models/user.js";
import emailVerification from "models/email-verification.js";

const schema = z.object({ email: emailSchema.optional() });

/** Reenvia o link de confirmação; opcionalmente corrige um e-mail digitado errado. */
async function resend(req, res) {
  const { user: me } = await requireUser(req, null, { allowUnverified: true });
  if (me.emailVerificado) return res.status(200).json({ verificado: true });
  await rateLimit({
    key: `verify-email:${me.id}`,
    limit: 5,
    windowSeconds: 60 * 60,
  });
  const { email } = schema.parse(req.body || {});
  if (email && email !== me.email) {
    await user.changeUnverifiedEmail(me.id, email);
    await audit(req, me.id, "email_corrigido");
  }
  await emailVerification.send(me.id);
  res.status(200).json({ enviado: true, email: email || me.email });
}

export default createHandler({ POST: resend });
