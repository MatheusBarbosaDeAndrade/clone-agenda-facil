import { injectController } from "infra/controller.js";
import { hashPassword } from "infra/auth.js";
import { updatePassword } from "models/user.js";
import database from "infra/database.js";
import crypto from "crypto";
import { ValidationError } from "infra/errors.js";

async function handler(req, res) {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha || novaSenha.length < 6) {
    throw new ValidationError("Dados de redefinição de senha inválidos");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenResult = await database.query(
    `SELECT * FROM reset_senha_tokens 
     WHERE token_hash = $1 AND usado = false AND expira_em > NOW()`,
    [tokenHash],
  );

  const tokenRecord = tokenResult.rows[0];
  if (!tokenRecord) {
    throw new ValidationError("Token inválido ou expirado");
  }

  const newHash = await hashPassword(novaSenha);
  await updatePassword(tokenRecord.usuario_id, newHash);

  await database.query(
    `UPDATE reset_senha_tokens SET usado = true WHERE id = $1`,
    [tokenRecord.id],
  );

  return res.status(200).json({ mensagem: "Senha redefinida com sucesso" });
}

export default injectController(handler, ["POST"]);
