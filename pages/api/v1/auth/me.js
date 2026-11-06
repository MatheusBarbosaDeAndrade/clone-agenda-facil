import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findById as findUserById } from "models/user.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const user = await findUserById(session.id);

  if (!user) {
    return res.status(401).json({ erro: "Sessão inválida" });
  }

  return res.status(200).json({ usuario: user });
}

export default injectController(handler, ["GET"]);
