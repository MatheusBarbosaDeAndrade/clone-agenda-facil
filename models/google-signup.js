import database from "infra/database.js";
import { audit } from "infra/audit.js";
import user from "models/user.js";
import session from "models/session.js";
import emailVerification from "models/email-verification.js";
import { generateToken, hashToken } from "infra/crypto.js";
import {
  appendSetCookie,
  parseCookies,
  serializeCookie,
} from "infra/request.js";

const COOKIE = "agendafacil_cadastro_google";

async function create(res, profile) {
  const token = generateToken(32);
  await database.query(
    `INSERT INTO cadastros_pendentes (token_hash, google_sub, email, nome, expira_em)
     VALUES ($1, $2, $3, $4, now() + interval '30 minutes')`,
    [hashToken(token), profile.sub, profile.email, profile.nome],
  );
  appendSetCookie(res, serializeCookie(COOKIE, token, { maxAge: 30 * 60 }));
}

async function find(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token || token.length > 200) return null;
  const result = await database.query(
    "SELECT * FROM cadastros_pendentes WHERE token_hash = $1 AND expira_em > now()",
    [hashToken(token)],
  );
  const row = result.rows[0];
  return row
    ? {
        tokenHash: row.token_hash,
        googleSub: row.google_sub,
        email: row.email,
        nome: row.nome,
      }
    : null;
}

async function consume(res, pending) {
  await database.query(
    "DELETE FROM cadastros_pendentes WHERE token_hash = $1",
    [pending.tokenHash],
  );
  appendSetCookie(res, serializeCookie(COOKIE, "", { maxAge: 0 }));
}

/**
 * Encontra a conta correspondente a um login Google já validado.
 * - Já vinculada (google_sub): retorna.
 * - Mesmo e-mail e e-mail confirmado: vincula (mesmo dono, ambos verificados).
 * - Mesmo e-mail NÃO confirmado: pode ter sido cadastrado por um terceiro
 *   ("sequestro prévio de conta"). O dono real, comprovado pelo Google, assume
 *   a conta: a senha definida por quem a criou é descartada e todas as sessões
 *   abertas são encerradas.
 * - Sem conta: retorna null (segue para completar o cadastro).
 */
async function resolveExisting(req, profile) {
  const linked = await user.findByGoogleSub(profile.sub);
  if (linked) return linked;
  const existing = await user.findForGoogleLink(profile.email);
  if (!existing) return null;
  if (existing.verificado) {
    await user.linkGoogle(existing.id, profile.sub);
  } else {
    await user.reclaimUnverified(existing.id, profile.sub);
    await session.destroyAllForUser(existing.id);
    await emailVerification.discard(existing.id);
    await audit(req, existing.id, "conta_recuperada_google");
  }
  return user.findById(existing.id);
}

const googleSignup = { create, find, consume, resolveExisting };
export default googleSignup;
