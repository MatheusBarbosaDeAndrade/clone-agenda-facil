import { injectController } from "infra/controller.js";
import { clearAuthCookie } from "infra/auth.js";

async function handler(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ mensagem: "Sessão encerrada com sucesso" });
}

export default injectController(handler, ["POST"]);
