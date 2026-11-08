import database from "infra/database.js";
import { generateToken, hashToken } from "infra/crypto.js";
import { buildEmailHtml, sendEmail } from "infra/email.js";
import { getAppUrl } from "infra/request.js";
import user from "models/user.js";

const TOKEN_TTL_HOURS = 24;

/** Gera um novo link (invalidando os anteriores) e envia para o e-mail atual da conta. */
async function send(usuarioId) {
  const found = await user.findByIdOrThrow(usuarioId);
  if (found.emailVerificado) return false;
  const token = generateToken(32);
  await database.transaction(async (tx) => {
    await tx.query(
      "DELETE FROM tokens_verificacao_email WHERE usuario_id = $1",
      [usuarioId],
    );
    await tx.query(
      `INSERT INTO tokens_verificacao_email (token_hash, usuario_id, email, expira_em)
       VALUES ($1, $2, lower($3), now() + make_interval(hours => $4))`,
      [hashToken(token), usuarioId, found.email, TOKEN_TTL_HOURS],
    );
  });
  const link = `${getAppUrl()}/verificar-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: found.email,
    subject: "Confirme seu e-mail — AgendaFácil",
    text: `Olá, ${found.nome}!\n\nConfirme seu e-mail para ativar sua conta no AgendaFácil (link válido por ${TOKEN_TTL_HOURS} horas):\n${link}\n\nSe você não criou esta conta, ignore este e-mail.`,
    html: buildEmailHtml({
      title: "Confirme seu e-mail",
      paragraphs: [
        `Olá, ${found.nome}!`,
        `Para ativar sua conta no AgendaFácil, confirme que este e-mail é seu. O link é válido por ${TOKEN_TTL_HOURS} horas.`,
      ],
      button: { href: link, label: "Confirmar e-mail" },
    }),
  });
  return true;
}

/**
 * Confirma o e-mail. O token só vale para o e-mail em que foi emitido: se a
 * pessoa trocou o e-mail depois, o link antigo deixa de funcionar.
 * Retorna o id do usuário ou null.
 */
async function confirm(token) {
  return database.transaction(async (tx) => {
    const result = await tx.query(
      `DELETE FROM tokens_verificacao_email t
       USING usuarios u
       WHERE t.token_hash = $1 AND t.usuario_id = u.id
         AND t.expira_em > now() AND lower(t.email) = lower(u.email)
       RETURNING t.usuario_id`,
      [hashToken(token)],
    );
    const usuarioId = result.rows[0]?.usuario_id;
    if (!usuarioId) return null;
    await tx.query(
      "UPDATE usuarios SET email_verificado_em = COALESCE(email_verificado_em, now()) WHERE id = $1",
      [usuarioId],
    );
    return usuarioId;
  });
}

async function discard(usuarioId) {
  await database.query(
    "DELETE FROM tokens_verificacao_email WHERE usuario_id = $1",
    [usuarioId],
  );
}

const emailVerification = { send, confirm, discard };
export default emailVerification;
