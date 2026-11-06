import database from "infra/database.js";

export async function getOrCreateConversation({ clienteId, prestadorId }) {
  const existing = await database.query(
    `SELECT * FROM conversas WHERE cliente_id = $1 AND prestador_id = $2`,
    [clienteId, prestadorId],
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const result = await database.query(
    `INSERT INTO conversas (cliente_id, prestador_id)
     VALUES ($1, $2)
     RETURNING *`,
    [clienteId, prestadorId],
  );
  return result.rows[0];
}

export async function listConversationsForUser(userId, papel) {
  let queryText = "";
  if (papel === "cliente") {
    queryText = `
      SELECT c.id, c.criado_em,
             u.nome as outro_nome, u.avatar_url as outro_avatar,
             m.texto as ultima_mensagem, m.enviada_em as ultima_data,
             (SELECT COUNT(*) FROM mensagens msg WHERE msg.conversa_id = c.id AND msg.autor_id != $1 AND msg.lida = false) as nao_lidas
      FROM conversas c
      JOIN prestadores p ON p.id = c.prestador_id
      JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN LATERAL (
        SELECT texto, enviada_em FROM mensagens WHERE conversa_id = c.id ORDER BY enviada_em DESC LIMIT 1
      ) m ON true
      WHERE c.cliente_id = $1
      ORDER BY COALESCE(m.enviada_em, c.criado_em) DESC
    `;
  } else {
    queryText = `
      SELECT c.id, c.criado_em,
             u.nome as outro_nome, u.avatar_url as outro_avatar,
             m.texto as ultima_mensagem, m.enviada_em as ultima_data,
             (SELECT COUNT(*) FROM mensagens msg WHERE msg.conversa_id = c.id AND msg.autor_id != $1 AND msg.lida = false) as nao_lidas
      FROM conversas c
      JOIN prestadores p ON p.id = c.prestador_id
      JOIN usuarios u ON u.id = c.cliente_id
      LEFT JOIN LATERAL (
        SELECT texto, enviada_em FROM mensagens WHERE conversa_id = c.id ORDER BY enviada_em DESC LIMIT 1
      ) m ON true
      WHERE p.usuario_id = $1
      ORDER BY COALESCE(m.enviada_em, c.criado_em) DESC
    `;
  }

  const result = await database.query(queryText, [userId]);
  return result.rows;
}

export async function getConversationById(id) {
  const result = await database.query(`SELECT * FROM conversas WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] || null;
}

export async function getMessages(conversaId, userId, depoisISO) {
  await database.query(
    `UPDATE mensagens SET lida = true WHERE conversa_id = $1 AND autor_id != $2 AND lida = false`,
    [conversaId, userId],
  );

  let queryText = `SELECT * FROM mensagens WHERE conversa_id = $1`;
  const params = [conversaId];

  if (depoisISO) {
    params.push(depoisISO);
    queryText += ` AND enviada_em > $2`;
  }

  queryText += ` ORDER BY enviada_em ASC`;

  const result = await database.query(queryText, params);
  return result.rows;
}

export async function sendMessage({ conversaId, autorId, texto }) {
  const result = await database.query(
    `INSERT INTO mensagens (conversa_id, autor_id, texto)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversaId, autorId, texto.trim()],
  );
  return result.rows[0];
}
