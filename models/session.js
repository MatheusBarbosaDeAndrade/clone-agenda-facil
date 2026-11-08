import database from "infra/database.js";
import { generateToken, hashToken } from "infra/crypto.js";
import {
  appendSetCookie,
  isSecureContext,
  parseCookies,
  serializeCookie,
} from "infra/request.js";

const PERSISTENT_TTL_SECONDS = 30 * 24 * 60 * 60; // "Lembrar-me": 30 dias
const SHORT_TTL_SECONDS = 12 * 60 * 60; // sessão comum: 12 horas

export function sessionCookieName() {
  // O prefixo __Host- impede que subdomínios sobrescrevam o cookie (exige HTTPS).
  return isSecureContext() ? "__Host-agendafacil_sessao" : "agendafacil_sessao";
}

async function create(res, usuarioId, persistent = false) {
  const token = generateToken(32);
  const ttl = persistent ? PERSISTENT_TTL_SECONDS : SHORT_TTL_SECONDS;
  await database.query(
    `INSERT INTO sessoes (token_hash, usuario_id, persistente, expira_em)
     VALUES ($1, $2, $3, now() + make_interval(secs => $4))`,
    [hashToken(token), usuarioId, persistent, ttl],
  );
  appendSetCookie(
    res,
    serializeCookie(
      sessionCookieName(),
      token,
      persistent ? { maxAge: ttl } : {},
    ),
  );
  return token;
}

/** Retorna { sessaoId, usuarioId } ou null. */
async function findValid(req) {
  const token = parseCookies(req)[sessionCookieName()];
  if (!token || token.length > 200) return null;
  const result = await database.query(
    `SELECT s.id, s.usuario_id FROM sessoes s
     WHERE s.token_hash = $1 AND s.expira_em > now()`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  return row ? { sessaoId: row.id, usuarioId: row.usuario_id } : null;
}

async function destroy(req, res) {
  const token = parseCookies(req)[sessionCookieName()];
  if (token) {
    await database.query("DELETE FROM sessoes WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }
  clearCookie(res);
}

function clearCookie(res) {
  appendSetCookie(res, serializeCookie(sessionCookieName(), "", { maxAge: 0 }));
}

async function destroyAllForUser(usuarioId, exceptSessionId = null) {
  await database.query(
    "DELETE FROM sessoes WHERE usuario_id = $1 AND ($2::uuid IS NULL OR id <> $2)",
    [usuarioId, exceptSessionId],
  );
}

const session = { create, findValid, destroy, clearCookie, destroyAllForUser };
export default session;
