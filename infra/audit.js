import database from "infra/database.js";
import { getClientIp } from "infra/request.js";

/**
 * Registro de acesso/auditoria. Nunca grave dados pessoais aqui além do id e
 * do IP (exigido pelo Marco Civil da Internet, retido por 6 meses).
 */
export async function audit(req, usuarioId, acao) {
  try {
    await database.query(
      "INSERT INTO registros_auditoria (usuario_id, acao, ip) VALUES ($1, $2, $3)",
      [usuarioId || null, acao, req ? getClientIp(req) : null],
    );
  } catch (error) {
    console.error("[audit] falha ao registrar ação:", acao, error.message);
  }
}
