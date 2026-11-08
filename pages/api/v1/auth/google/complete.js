import { createHandler } from "infra/controller.js";
import { audit } from "infra/audit.js";
import { ValidationError } from "infra/errors.js";
import { homePathFor } from "infra/page-auth.js";
import { googleCompleteSchema } from "lib/validation.js";
import user from "models/user.js";
import session from "models/session.js";
import googleSignup from "models/google-signup.js";

async function complete(req, res) {
  const pending = await googleSignup.find(req);
  if (!pending) {
    throw new ValidationError({
      message: "Sua sessão de cadastro expirou.",
      action: 'Clique em "Entrar com o Google" novamente.',
    });
  }
  const data = googleCompleteSchema.parse(req.body || {});
  const id = await user.create({
    ...data,
    nome: pending.nome,
    email: pending.email,
    googleSub: pending.googleSub,
    senha: null,
  });
  await googleSignup.consume(res, pending);
  await session.create(res, id, false);
  await audit(req, id, "conta_criada_google");
  res.status(201).json({ redirectTo: homePathFor(data.papel) });
}

export default createHandler({ POST: complete });
