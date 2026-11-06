import database from "infra/database.js";

export async function findByEmail(email) {
  const result = await database.query(
    `SELECT * FROM usuarios WHERE lower(email) = lower($1)`,
    [email],
  );
  return result.rows[0] || null;
}

export async function findByPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, "");
  const result = await database.query(
    `SELECT * FROM usuarios WHERE telefone = $1`,
    [cleanPhone],
  );
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await database.query(
    `SELECT u.id, u.papel, u.nome, u.email, u.telefone, u.avatar_url, u.criado_em, u.atualizado_em,
            p.id as prestador_id, p.especialidade, p.categoria, p.bio, p.local, p.avaliacao
     FROM usuarios u
     LEFT JOIN prestadores p ON p.usuario_id = u.id
     WHERE u.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function createUser({ nome, email, telefone, senhaHash, papel }) {
  const cleanPhone = telefone.replace(/\D/g, "");
  const result = await database.query(
    `INSERT INTO usuarios (nome, email, telefone, senha_hash, papel)
     VALUES ($1, lower($2), $3, $4, $5)
     RETURNING id, papel, nome, email, telefone, avatar_url, criado_em`,
    [nome, email, cleanPhone, senhaHash, papel],
  );
  return result.rows[0];
}

export async function updateUser(id, { nome, email, telefone, avatarUrl }) {
  const cleanPhone = telefone ? telefone.replace(/\D/g, "") : undefined;
  const result = await database.query(
    `UPDATE usuarios
     SET nome = COALESCE($2, nome),
         email = COALESCE(lower($3), email),
         telefone = COALESCE($4, telefone),
         avatar_url = COALESCE($5, avatar_url),
         atualizado_em = now()
     WHERE id = $1
     RETURNING id, papel, nome, email, telefone, avatar_url`,
    [id, nome, email, cleanPhone, avatarUrl],
  );
  return result.rows[0];
}

export async function updatePassword(id, newPasswordHash) {
  await database.query(
    `UPDATE usuarios SET senha_hash = $2, atualizado_em = now() WHERE id = $1`,
    [id, newPasswordHash],
  );
}
