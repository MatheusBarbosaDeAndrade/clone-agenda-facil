import database from "infra/database.js";
import { NotFoundError } from "infra/errors.js";

function toPublic(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    texto: row.texto,
    cor: row.cor,
    criadoEm: new Date(row.criado_em).toISOString(),
    atualizadoEm: new Date(row.atualizado_em).toISOString(),
  };
}

async function listByProvider(prestadorId, limit = 100) {
  const result = await database.query(
    "SELECT * FROM avisos WHERE prestador_id = $1 ORDER BY criado_em DESC LIMIT $2",
    [prestadorId, limit],
  );
  return result.rows.map(toPublic);
}

async function create(prestadorId, { titulo, texto, cor }) {
  const result = await database.query(
    "INSERT INTO avisos (prestador_id, titulo, texto, cor) VALUES ($1, $2, $3, $4) RETURNING *",
    [prestadorId, titulo, texto, cor],
  );
  return toPublic(result.rows[0]);
}

async function update(id, prestadorId, { titulo, texto, cor }) {
  const result = await database.query(
    `UPDATE avisos SET titulo = $3, texto = $4, cor = $5, atualizado_em = now()
     WHERE id = $1 AND prestador_id = $2 RETURNING *`,
    [id, prestadorId, titulo, texto, cor],
  );
  if (!result.rows[0])
    throw new NotFoundError({ message: "Aviso não encontrado." });
  return toPublic(result.rows[0]);
}

async function remove(id, prestadorId) {
  const result = await database.query(
    "DELETE FROM avisos WHERE id = $1 AND prestador_id = $2",
    [id, prestadorId],
  );
  if (result.rowCount === 0)
    throw new NotFoundError({ message: "Aviso não encontrado." });
}

const notice = { listByProvider, create, update, remove };
export default notice;
