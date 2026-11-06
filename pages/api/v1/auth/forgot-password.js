import { injectController } from "infra/controller.js";
import { findByEmail } from "models/user.js";
import database from "infra/database.js";
import crypto from "crypto";

async function handler(req, res) {
  const { email } = req.body;

  if (email) {
    const user = await findByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiraEm = new Date(Date.now() + 3600000); // 1h

      await database.query(
        `INSERT INTO reset_senha_tokens (usuario_id, token_hash, expira_em) VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiraEm],
      );

      console.log(`\n========================================`);
      console.log(
        `[LINK RECURAGEM SENHA]: http://localhost:3000/recuperar-senha?token=${token}`,
      );
      console.log(`========================================\n`);
    }
  }

  return res.status(200).json({
    mensagem:
      "Se o e-mail existir na nossa base de dados, um link de recuperação será enviado.",
  });
}

export default injectController(handler, ["POST"]);
