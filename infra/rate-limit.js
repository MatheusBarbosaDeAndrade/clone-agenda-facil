import database from "infra/database.js";
import { blindIndex } from "infra/crypto.js";
import { getClientIp } from "infra/request.js";
import { TooManyRequestsError } from "infra/errors.js";

/**
 * Limite de requisições persistido no Postgres (funciona com várias instâncias).
 * As chaves são armazenadas como HMAC para não guardar IP/e-mail em claro.
 */
export async function rateLimit({ key, limit, windowSeconds }) {
  const hashedKey = blindIndex(`rl:${key}`).slice(0, 64);
  const result = await database.query(
    `INSERT INTO limites_requisicao (chave, contador, janela_inicio)
     VALUES ($1, 1, now())
     ON CONFLICT (chave) DO UPDATE SET
       contador = CASE WHEN limites_requisicao.janela_inicio < now() - make_interval(secs => $2)
                       THEN 1 ELSE limites_requisicao.contador + 1 END,
       janela_inicio = CASE WHEN limites_requisicao.janela_inicio < now() - make_interval(secs => $2)
                       THEN now() ELSE limites_requisicao.janela_inicio END
     RETURNING contador,
       GREATEST(0, EXTRACT(EPOCH FROM (janela_inicio + make_interval(secs => $2) - now())))::int AS restante`,
    [hashedKey, windowSeconds],
  );
  const { contador, restante } = result.rows[0];
  if (contador > limit) {
    throw new TooManyRequestsError({ retryAfter: restante });
  }
}

export function rateLimitByIp(req, scope, limit, windowSeconds) {
  return rateLimit({
    key: `${scope}:ip:${getClientIp(req)}`,
    limit,
    windowSeconds,
  });
}
