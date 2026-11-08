import database from "infra/database.js";
import { generateToken, hashToken } from "infra/crypto.js";
import { buildEmailHtml, sendEmail } from "infra/email.js";
import { getAppUrl } from "infra/request.js";
import { ValidationError } from "infra/errors.js";
import user from "models/user.js";
import session from "models/session.js";

const TOKEN_TTL_MINUTES = 30;

/** Sempre "sucesso" para quem chama: não revela se o e-mail existe. */
async function request(email) {
  const found = await user.findByEmail(email);
  if (!found) return;
  await database.query("DELETE FROM tokens_recuperacao WHERE usuario_id = $1", [
    found.id,
  ]);
  const token = generateToken(32);
  await database.query(
    `INSERT INTO tokens_recuperacao (token_hash, usuario_id, expira_em)
     VALUES ($1, $2, now() + make_interval(mins => $3))`,
    [hashToken(token), found.id, TOKEN_TTL_MINUTES],
  );
  const link = `${getAppUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: found.email,
    subject: "Recuperação de senha — AgendaFácil",
    text: `Olá, ${found.nome}!\n\nRecebemos uma solicitação para redefinir sua senha. Acesse o link abaixo (válido por ${TOKEN_TTL_MINUTES} minutos):\n${link}\n\nSe você não solicitou, ignore este e-mail.`,
    html: buildEmailHtml({
      title: "Recuperação de senha",
      paragraphs: [
        `Olá, ${found.nome}!`,
        `Recebemos uma solicitação para redefinir sua senha. O link é válido por ${TOKEN_TTL_MINUTES} minutos.`,
      ],
      button: { href: link, label: "Redefinir senha" },
    }),
  });
  return found.id;
}

async function validate(token) {
  const result = await database.query(
    `SELECT usuario_id FROM tokens_recuperacao
     WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now()`,
    [hashToken(token)],
  );
  return result.rows[0]?.usuario_id || null;
}

async function consume(token, novaSenha) {
  const usuarioId = await validate(token);
  if (!usuarioId) {
    throw new ValidationError({
      message: "Link de recuperação inválido ou expirado.",
      action: "Solicite um novo link de recuperação.",
    });
  }
  await database.query(
    "UPDATE tokens_recuperacao SET usado_em = now() WHERE token_hash = $1",
    [hashToken(token)],
  );
  await user.updatePassword(usuarioId, novaSenha);
  // Encerra todas as sessões abertas: quem tinha acesso indevido é desconectado.
  await session.destroyAllForUser(usuarioId);
  return usuarioId;
}

const passwordReset = { request, validate, consume };
export default passwordReset;
