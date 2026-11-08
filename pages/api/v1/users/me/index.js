import { createHandler, requireUser } from "infra/controller.js";
import { audit } from "infra/audit.js";
import { verifyPassword } from "infra/crypto.js";
import { ValidationError } from "infra/errors.js";
import {
  deleteAccountSchema,
  profileUpdateSchema,
  providerProfileSchema,
} from "lib/validation.js";
import user from "models/user.js";
import provider from "models/provider.js";
import privacy from "models/privacy.js";
import session from "models/session.js";

async function getMe(req, res) {
  const { user: me } = await requireUser(req);
  res.status(200).json(me);
}

/** LGPD art. 18, III — correção de dados. */
async function updateMe(req, res) {
  const { user: me } = await requireUser(req);
  const body = req.body || {};
  const data = profileUpdateSchema.parse(body);
  if (me.papel === "prestador" && body.prestador) {
    const providerData = providerProfileSchema.parse(body.prestador);
    await provider.updateProfile(me.id, providerData);
  }
  const updated = await user.updateProfile(me.id, data);
  await audit(req, me.id, "perfil_atualizado");
  res.status(200).json(updated);
}

/** LGPD art. 18, VI — eliminação dos dados pessoais. */
async function deleteMe(req, res) {
  const { user: me } = await requireUser(req);
  const { senha } = deleteAccountSchema.parse(req.body || {});
  if (me.temSenha) {
    const valid = await verifyPassword(
      senha,
      await user.findPasswordHash(me.id),
    );
    if (!valid)
      throw new ValidationError({
        message: "Senha incorreta.",
        fields: { senha: "Senha incorreta." },
      });
  }
  await audit(req, me.id, "conta_excluida");
  await privacy.deleteAccount(me.id);
  session.clearCookie(res);
  res.status(200).json({ redirectTo: "/?conta=excluida" });
}

export default createHandler({ GET: getMe, PATCH: updateMe, DELETE: deleteMe });
