import { injectController } from "infra/controller.js";
import { requireAuth, hashPassword, verifyPassword } from "infra/auth.js";
import { updateUser, updatePassword, findById } from "models/user.js";
import { updateProvider } from "models/provider.js";
import { UnauthorizedError } from "infra/errors.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const {
    nome,
    email,
    telefone,
    avatar_url,
    especialidade,
    bio,
    local,
    senhaAtual,
    novaSenha,
  } = req.body;

  if (senhaAtual && novaSenha) {
    const user = await findById(session.id);
    const valid = await verifyPassword(senhaAtual, user.senha_hash);
    if (!valid) {
      throw new UnauthorizedError("Senha atual incorreta");
    }
    const newHash = await hashPassword(novaSenha);
    await updatePassword(session.id, newHash);
  }

  const updatedUser = await updateUser(session.id, {
    nome,
    email,
    telefone,
    avatarUrl: avatar_url,
  });

  if (session.papel === "prestador") {
    await updateProvider(session.id, { especialidade, bio, local });
  }

  return res.status(200).json({ usuario: updatedUser });
}

export default injectController(handler, ["PATCH"]);
