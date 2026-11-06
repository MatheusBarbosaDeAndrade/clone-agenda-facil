import database from "infra/database.js";

export async function createProvider({
  usuarioId,
  especialidade,
  categoria,
  local,
  bio = "",
}) {
  const result = await database.query(
    `INSERT INTO prestadores (usuario_id, especialidade, categoria, local, bio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [usuarioId, especialidade, categoria, local, bio],
  );
  return result.rows[0];
}

export async function findByUserId(usuarioId) {
  const result = await database.query(
    `SELECT * FROM prestadores WHERE usuario_id = $1`,
    [usuarioId],
  );
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await database.query(
    `SELECT p.*, u.nome, u.email, u.telefone, u.avatar_url
     FROM prestadores p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function listProviders({ busca = "", categoria = "" }) {
  let queryText = `
    SELECT p.*, u.nome, u.avatar_url
    FROM prestadores p
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    params.push(`%${busca}%`);
    queryText += ` AND (u.nome ILIKE $${params.length} OR p.especialidade ILIKE $${params.length} OR p.categoria ILIKE $${params.length})`;
  }

  if (categoria) {
    params.push(categoria);
    queryText += ` AND p.categoria = $${params.length}`;
  }

  queryText += ` ORDER BY p.avaliacao DESC`;

  const result = await database.query(queryText, params);
  return result.rows;
}

export async function updateProvider(usuarioId, { especialidade, bio, local }) {
  const result = await database.query(
    `UPDATE prestadores
     SET especialidade = COALESCE($2, especialidade),
         bio = COALESCE($3, bio),
         local = COALESCE($4, local)
     WHERE usuario_id = $1
     RETURNING *`,
    [usuarioId, especialidade, bio, local],
  );
  return result.rows[0];
}
