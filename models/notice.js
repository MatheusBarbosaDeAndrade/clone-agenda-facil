import database from "infra/database.js";

export async function createNotice({
  prestadorId,
  titulo,
  texto,
  cor = "azul",
}) {
  const result = await database.query(
    `INSERT INTO avisos (prestador_id, titulo, texto, cor)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [prestadorId, titulo, texto, cor],
  );
  return result.rows[0];
}

export async function getNoticesByProviderId(prestadorId) {
  const result = await database.query(
    `SELECT * FROM avisos WHERE prestador_id = $1 ORDER BY criado_em DESC`,
    [prestadorId],
  );
  return result.rows;
}

export async function findById(id) {
  const result = await database.query(`SELECT * FROM avisos WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] || null;
}

export async function updateNotice(id, { titulo, texto, cor }) {
  const result = await database.query(
    `UPDATE avisos
     SET titulo = COALESCE($2, titulo),
         texto = COALESCE($3, texto),
         cor = COALESCE($4, cor)
     WHERE id = $1
     RETURNING *`,
    [id, titulo, texto, cor],
  );
  return result.rows[0];
}

export async function deleteNotice(id) {
  await database.query(`DELETE FROM avisos WHERE id = $1`, [id]);
}
