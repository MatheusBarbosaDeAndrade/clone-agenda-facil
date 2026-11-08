import database from "infra/database.js";
import { NotFoundError } from "infra/errors.js";
import { avatarUrl } from "models/user.js";

const PROVIDER_SELECT = `
  SELECT u.id, u.nome, u.ultimo_acesso_em, p.especialidade, p.bio, p.local, p.duracao_minutos,
         av.atualizado_em AS avatar_atualizado_em,
         (SELECT round(avg(a.avaliacao)::numeric, 1) FROM agendamentos a
           WHERE a.prestador_id = u.id AND a.avaliacao IS NOT NULL) AS media_avaliacao,
         (SELECT count(*) FROM agendamentos a
           WHERE a.prestador_id = u.id AND a.avaliacao IS NOT NULL)::int AS total_avaliacoes,
         EXISTS (SELECT 1 FROM disponibilidades d WHERE d.prestador_id = u.id) AS tem_agenda
  FROM prestadores p
  JOIN usuarios u ON u.id = p.usuario_id
  LEFT JOIN avatares av ON av.usuario_id = u.id`;

function toPublic(row) {
  return {
    id: row.id,
    nome: row.nome,
    especialidade: row.especialidade,
    bio: row.bio,
    local: row.local,
    duracaoMinutos: row.duracao_minutos,
    avatarUrl: avatarUrl(row.id, row.avatar_atualizado_em),
    mediaAvaliacao:
      row.media_avaliacao === null ? null : Number(row.media_avaliacao),
    totalAvaliacoes: row.total_avaliacoes,
    temAgenda: row.tem_agenda,
  };
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function search({ termo = "", limit = 30 } = {}) {
  const q = String(termo).trim().slice(0, 100);
  const result = await database.query(
    `${PROVIDER_SELECT}
     WHERE ($1 = '' OR u.nome ILIKE $2 OR p.especialidade ILIKE $2 OR p.bio ILIKE $2 OR p.local ILIKE $2)
     ORDER BY tem_agenda DESC, media_avaliacao DESC NULLS LAST, u.criado_em DESC
     LIMIT $3`,
    [q, `%${escapeLike(q)}%`, limit],
  );
  return result.rows.map(toPublic);
}

async function findById(id) {
  const result = await database.query(`${PROVIDER_SELECT} WHERE u.id = $1`, [
    id,
  ]);
  if (!result.rows[0])
    throw new NotFoundError({ message: "Prestador não encontrado." });
  return toPublic(result.rows[0]);
}

async function updateProfile(
  id,
  { especialidade, local, bio, duracaoMinutos },
) {
  await database.query(
    `UPDATE prestadores SET especialidade = $2, local = $3, bio = $4, duracao_minutos = $5
     WHERE usuario_id = $1`,
    [id, especialidade, local, bio, duracaoMinutos],
  );
}

const provider = { search, findById, updateProfile };
export default provider;
