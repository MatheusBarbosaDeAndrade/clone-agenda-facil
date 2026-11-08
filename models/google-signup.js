import database from "infra/database.js";
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

const googleSignup = { create, find, consume };
export default googleSignup;
