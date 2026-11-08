import database from "infra/database.js";
import { encrypt, decrypt } from "infra/crypto.js";
import { ForbiddenError, NotFoundError } from "infra/errors.js";
import { avatarUrl } from "models/user.js";

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

function safeDecrypt(value) {
  try {
    return decrypt(value);
  } catch {
    return "[mensagem indisponível]";
  }
}

function otherSide(viewer) {
  return viewer.papel === "cliente" ? "prestador_id" : "cliente_id";
}

async function listConversations(viewer) {
  const mine = viewer.papel === "cliente" ? "cliente_id" : "prestador_id";
  const other = otherSide(viewer);
  const result = await database.query(
    `SELECT c.id, c.atualizado_em, o.id AS outro_id, o.nome AS outro_nome, o.ultimo_acesso_em,
            p.especialidade, av.atualizado_em AS outro_avatar,
            ult.texto_cifrado AS ultima_texto, ult.criado_em AS ultima_em, ult.autor_id AS ultima_autor,
            (SELECT count(*) FROM mensagens m
              WHERE m.conversa_id = c.id AND m.autor_id <> $1 AND m.lida_em IS NULL)::int AS nao_lidas
     FROM conversas c
     JOIN usuarios o ON o.id = c.${other}
     LEFT JOIN prestadores p ON p.usuario_id = c.prestador_id
     LEFT JOIN avatares av ON av.usuario_id = o.id
     LEFT JOIN LATERAL (
       SELECT texto_cifrado, criado_em, autor_id FROM mensagens
       WHERE conversa_id = c.id ORDER BY criado_em DESC LIMIT 1
     ) ult ON true
     WHERE c.${mine} = $1
     ORDER BY COALESCE(ult.criado_em, c.atualizado_em) DESC
     LIMIT 100`,
    [viewer.id],
  );
  return result.rows.map((row) => {
    const preview = row.ultima_texto ? safeDecrypt(row.ultima_texto) : "";
    return {
      id: row.id,
      outro: {
        id: row.outro_id,
        nome: row.outro_nome,
        avatarUrl: avatarUrl(row.outro_id, row.outro_avatar),
        subtitulo: viewer.papel === "cliente" ? row.especialidade : "Cliente",
        online: isOnline(row.ultimo_acesso_em),
      },
      ultimaMensagem:
        preview.length > 60 ? `${preview.slice(0, 60)}…` : preview,
      ultimaMensagemMinha: row.ultima_autor === viewer.id,
      ultimaEm: new Date(row.ultima_em || row.atualizado_em).toISOString(),
      naoLidas: row.nao_lidas,
    };
  });
}

function isOnline(lastAccess) {
  return (
    Boolean(lastAccess) &&
    Date.now() - new Date(lastAccess).getTime() < ONLINE_WINDOW_MS
  );
}

async function start(viewer, otherId) {
  let clienteId;
  let prestadorId;
  if (viewer.papel === "cliente") {
    clienteId = viewer.id;
    prestadorId = otherId;
    const exists = await database.query(
      `SELECT 1 FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.usuario_id = $1 AND u.email_verificado_em IS NOT NULL`,
      [otherId],
    );
    if (!exists.rows[0])
      throw new NotFoundError({ message: "Prestador não encontrado." });
  } else {
    // Prestador só inicia conversa com quem já agendou com ele.
    clienteId = otherId;
    prestadorId = viewer.id;
    const relation = await database.query(
      "SELECT 1 FROM agendamentos WHERE prestador_id = $1 AND cliente_id = $2 LIMIT 1",
      [prestadorId, clienteId],
    );
    if (!relation.rows[0])
      throw new ForbiddenError({
        message: "Você não possui agendamentos com este cliente.",
      });
  }
  const result = await database.query(
    `INSERT INTO conversas (cliente_id, prestador_id) VALUES ($1, $2)
     ON CONFLICT (cliente_id, prestador_id) DO UPDATE SET atualizado_em = conversas.atualizado_em
     RETURNING id`,
    [clienteId, prestadorId],
  );
  return result.rows[0].id;
}

async function assertMember(conversaId, viewer) {
  const result = await database.query(
    "SELECT cliente_id, prestador_id FROM conversas WHERE id = $1",
    [conversaId],
  );
  const row = result.rows[0];
  if (
    !row ||
    (row.cliente_id !== viewer.id && row.prestador_id !== viewer.id)
  ) {
    throw new NotFoundError({ message: "Conversa não encontrada." });
  }
  return row;
}

async function listMessages(conversaId, viewer) {
  await assertMember(conversaId, viewer);
  await database.query(
    `UPDATE mensagens SET lida_em = now()
     WHERE conversa_id = $1 AND autor_id <> $2 AND lida_em IS NULL`,
    [conversaId, viewer.id],
  );
  const result = await database.query(
    `SELECT id, autor_id, texto_cifrado, criado_em FROM (
       SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY criado_em DESC LIMIT 200
     ) m ORDER BY criado_em ASC`,
    [conversaId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    minha: row.autor_id === viewer.id,
    texto: safeDecrypt(row.texto_cifrado),
    criadoEm: new Date(row.criado_em).toISOString(),
  }));
}

async function send(conversaId, viewer, texto) {
  await assertMember(conversaId, viewer);
  const result = await database.query(
    `INSERT INTO mensagens (conversa_id, autor_id, texto_cifrado) VALUES ($1, $2, $3)
     RETURNING id, criado_em`,
    [conversaId, viewer.id, encrypt(texto)],
  );
  await database.query(
    "UPDATE conversas SET atualizado_em = now() WHERE id = $1",
    [conversaId],
  );
  return {
    id: result.rows[0].id,
    minha: true,
    texto,
    criadoEm: new Date(result.rows[0].criado_em).toISOString(),
  };
}

const chat = { listConversations, start, listMessages, send };
export default chat;
