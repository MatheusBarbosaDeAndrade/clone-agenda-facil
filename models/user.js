import database from "infra/database.js";
import { encrypt, decrypt, blindIndex, hashPassword } from "infra/crypto.js";
import { ConflictError, NotFoundError } from "infra/errors.js";
import { LEGAL_VERSIONS } from "lib/constants.js";
import { normalizePhone } from "lib/validation.js";

const USER_COLUMNS = `
  u.id, u.papel, u.nome, u.email, u.telefone_cifrado, u.senha_hash IS NOT NULL AS tem_senha,
  u.google_sub IS NOT NULL AS tem_google, u.criado_em, u.ultimo_acesso_em,
  av.atualizado_em AS avatar_atualizado_em,
  p.especialidade, p.bio, p.local, p.duracao_minutos`;

const USER_JOINS = `
  FROM usuarios u
  LEFT JOIN prestadores p ON p.usuario_id = u.id
  LEFT JOIN avatares av ON av.usuario_id = u.id`;

export function avatarUrl(id, updatedAt) {
  if (!updatedAt) return null;
  return `/api/v1/avatars/${id}?v=${new Date(updatedAt).getTime()}`;
}

function toPublic(row) {
  if (!row) return null;
  const user = {
    id: row.id,
    papel: row.papel,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone_cifrado ? decrypt(row.telefone_cifrado) : "",
    temSenha: row.tem_senha,
    temGoogle: row.tem_google,
    avatarUrl: avatarUrl(row.id, row.avatar_atualizado_em),
    criadoEm: new Date(row.criado_em).toISOString(),
  };
  if (row.papel === "prestador") {
    user.prestador = {
      especialidade: row.especialidade,
      bio: row.bio,
      local: row.local,
      duracaoMinutos: row.duracao_minutos,
    };
  }
  return user;
}

function translateUniqueViolation(error) {
  if (error?.pgCode !== "23505") return error;
  if (error.constraint === "usuarios_email_unico") {
    return new ConflictError({
      message: "Este e-mail já está cadastrado.",
      action: "Faça login ou use a recuperação de senha.",
      fields: { email: "Este e-mail já está cadastrado." },
    });
  }
  if (error.constraint === "usuarios_telefone_unico") {
    return new ConflictError({
      message: "Este telefone já está cadastrado.",
      action: "Faça login ou use outro número.",
      fields: { telefone: "Este telefone já está cadastrado." },
    });
  }
  if (error.constraint === "usuarios_google_sub_key") {
    return new ConflictError({
      message: "Esta conta Google já está vinculada.",
    });
  }
  return error;
}

async function create(data) {
  const phone = normalizePhone(data.telefone);
  const senhaHash = data.senha ? await hashPassword(data.senha) : null;
  try {
    return await database.transaction(async (tx) => {
      const inserted = await tx.query(
        `INSERT INTO usuarios (papel, nome, email, telefone_cifrado, telefone_indice, senha_hash, google_sub)
         VALUES ($1, $2, lower($3), $4, $5, $6, $7) RETURNING id`,
        [
          data.papel,
          data.nome,
          data.email,
          encrypt(phone),
          blindIndex(`phone:${phone}`),
          senhaHash,
          data.googleSub || null,
        ],
      );
      const id = inserted.rows[0].id;
      if (data.papel === "prestador") {
        await tx.query(
          `INSERT INTO prestadores (usuario_id, especialidade, local) VALUES ($1, $2, $3)`,
          [id, data.especialidade, data.local],
        );
      }
      // Registro do consentimento (LGPD art. 8º, §2º: ônus da prova do controlador).
      for (const [documento, versao] of Object.entries(LEGAL_VERSIONS)) {
        await tx.query(
          "INSERT INTO consentimentos (usuario_id, documento, versao) VALUES ($1, $2, $3)",
          [id, documento, versao],
        );
      }
      return id;
    });
  } catch (error) {
    throw translateUniqueViolation(error);
  }
}

async function findById(id) {
  const result = await database.query(
    `SELECT ${USER_COLUMNS} ${USER_JOINS} WHERE u.id = $1`,
    [id],
  );
  return toPublic(result.rows[0]);
}

async function findByIdOrThrow(id) {
  const user = await findById(id);
  if (!user) throw new NotFoundError({ message: "Usuário não encontrado." });
  return user;
}

/** Busca para autenticação: retorna também o hash da senha. */
async function findCredentials(identifier) {
  const value = String(identifier).trim();
  let result;
  if (value.includes("@")) {
    result = await database.query(
      "SELECT id, papel, senha_hash FROM usuarios WHERE lower(email) = lower($1)",
      [value],
    );
  } else {
    const phone = normalizePhone(value);
    result = await database.query(
      "SELECT id, papel, senha_hash FROM usuarios WHERE telefone_indice = $1",
      [blindIndex(`phone:${phone}`)],
    );
  }
  return result.rows[0] || null;
}

async function findPasswordHash(id) {
  const result = await database.query(
    "SELECT senha_hash FROM usuarios WHERE id = $1",
    [id],
  );
  return result.rows[0]?.senha_hash || null;
}

async function findByEmail(email) {
  const result = await database.query(
    `SELECT ${USER_COLUMNS} ${USER_JOINS} WHERE lower(u.email) = lower($1)`,
    [email],
  );
  return toPublic(result.rows[0]);
}

async function findByGoogleSub(sub) {
  const result = await database.query(
    `SELECT ${USER_COLUMNS} ${USER_JOINS} WHERE u.google_sub = $1`,
    [sub],
  );
  return toPublic(result.rows[0]);
}

async function linkGoogle(id, sub) {
  try {
    await database.query(
      "UPDATE usuarios SET google_sub = $2, atualizado_em = now() WHERE id = $1",
      [id, sub],
    );
  } catch (error) {
    throw translateUniqueViolation(error);
  }
}

async function updateProfile(id, { nome, telefone, email }) {
  const phone = normalizePhone(telefone);
  try {
    await database.query(
      `UPDATE usuarios
         SET nome = $2, email = lower($3), telefone_cifrado = $4, telefone_indice = $5, atualizado_em = now()
       WHERE id = $1`,
      [id, nome, email, encrypt(phone), blindIndex(`phone:${phone}`)],
    );
  } catch (error) {
    throw translateUniqueViolation(error);
  }
  return findByIdOrThrow(id);
}

async function updatePassword(id, password) {
  const senhaHash = await hashPassword(password);
  await database.query(
    "UPDATE usuarios SET senha_hash = $2, atualizado_em = now() WHERE id = $1",
    [id, senhaHash],
  );
}

async function touchLastAccess(id) {
  await database.query(
    `UPDATE usuarios SET ultimo_acesso_em = now()
     WHERE id = $1 AND (ultimo_acesso_em IS NULL OR ultimo_acesso_em < now() - interval '1 minute')`,
    [id],
  );
}

async function setAvatar(id, buffer, mime) {
  await database.query(
    `INSERT INTO avatares (usuario_id, conteudo, mime, atualizado_em) VALUES ($1, $2, $3, now())
     ON CONFLICT (usuario_id) DO UPDATE SET conteudo = EXCLUDED.conteudo, mime = EXCLUDED.mime, atualizado_em = now()`,
    [id, buffer, mime],
  );
}

async function removeAvatar(id) {
  await database.query("DELETE FROM avatares WHERE usuario_id = $1", [id]);
}

async function getAvatar(id) {
  const result = await database.query(
    "SELECT conteudo, mime, atualizado_em FROM avatares WHERE usuario_id = $1",
    [id],
  );
  return result.rows[0] || null;
}

const user = {
  create,
  findById,
  findByIdOrThrow,
  findCredentials,
  findPasswordHash,
  findByEmail,
  findByGoogleSub,
  linkGoogle,
  updateProfile,
  updatePassword,
  touchLastAccess,
  setAvatar,
  removeAvatar,
  getAvatar,
};

export default user;
