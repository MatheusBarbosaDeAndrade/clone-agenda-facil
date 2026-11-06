import database from "infra/database.js";
import { ConflictError } from "infra/errors.js";

export async function createAppointment({
  prestadorId,
  clienteId,
  servico,
  data,
  hora,
}) {
  try {
    const result = await database.query(
      `INSERT INTO agendamentos (prestador_id, cliente_id, servico, data, hora, status)
       VALUES ($1, $2, $3, $4, $5, 'pendente')
       RETURNING *`,
      [prestadorId, clienteId, servico, data, hora],
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new ConflictError("Horário indisponível");
    }
    throw error;
  }
}

export async function findById(id) {
  const result = await database.query(
    `SELECT a.*,
            u_cli.nome as cliente_nome, u_cli.avatar_url as cliente_avatar,
            u_pro.nome as prestador_nome, u_pro.avatar_url as prestador_avatar,
            p.especialidade
     FROM agendamentos a
     JOIN usuarios u_cli ON u_cli.id = a.cliente_id
     JOIN prestadores p ON p.id = a.prestador_id
     JOIN usuarios u_pro ON u_pro.id = p.usuario_id
     WHERE a.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function updateStatus(id, newStatus) {
  const result = await database.query(
    `UPDATE agendamentos
     SET status = $2, atualizado_em = now()
     WHERE id = $1
     RETURNING *`,
    [id, newStatus],
  );
  return result.rows[0];
}

export async function listAppointments({ userId, papel, status, busca, tipo }) {
  let queryText = "";
  const params = [];

  if (papel === "cliente") {
    queryText = `
      SELECT a.*, u_pro.nome as outro_nome, u_pro.avatar_url as outro_avatar, p.especialidade
      FROM agendamentos a
      JOIN prestadores p ON p.id = a.prestador_id
      JOIN usuarios u_pro ON u_pro.id = p.usuario_id
      WHERE a.cliente_id = $1
    `;
    params.push(userId);
  } else {
    queryText = `
      SELECT a.*, u_cli.nome as outro_nome, u_cli.avatar_url as outro_avatar
      FROM agendamentos a
      JOIN prestadores p ON p.id = a.prestador_id
      JOIN usuarios u_cli ON u_cli.id = a.cliente_id
      WHERE p.usuario_id = $1
    `;
    params.push(userId);
  }

  if (tipo === "agendados") {
    queryText += ` AND a.status IN ('pendente', 'confirmado') AND a.data >= CURRENT_DATE`;
  } else if (tipo === "historico") {
    queryText += ` AND (a.status IN ('concluido', 'cancelado', 'nao_compareceu') OR a.data < CURRENT_DATE)`;
  }

  if (status) {
    params.push(status);
    queryText += ` AND a.status = $${params.length}`;
  }

  if (busca) {
    params.push(`%${busca}%`);
    queryText += ` AND (a.servico ILIKE $${params.length} OR u_cli.nome ILIKE $${params.length} OR u_pro.nome ILIKE $${params.length})`;
  }

  queryText += ` ORDER BY a.data DESC, a.hora DESC`;

  const result = await database.query(queryText, params);
  return result.rows;
}

export async function getProviderSummary(providerId) {
  const totalAgendamentos = await database.query(
    `SELECT COUNT(*) FROM agendamentos WHERE prestador_id = $1`,
    [providerId],
  );

  const novosClientes = await database.query(
    `SELECT COUNT(DISTINCT cliente_id)
     FROM agendamentos
     WHERE prestador_id = $1 AND criado_em >= NOW() - INTERVAL '30 days'`,
    [providerId],
  );

  const avaliacaoRes = await database.query(
    `SELECT avaliacao FROM prestadores WHERE id = $1`,
    [providerId],
  );

  const proximos = await database.query(
    `SELECT a.*, u.nome as cliente_nome, u.avatar_url as cliente_avatar
     FROM agendamentos a
     JOIN usuarios u ON u.id = a.cliente_id
     WHERE a.prestador_id = $1 AND a.data >= CURRENT_DATE
     ORDER BY a.data ASC, a.hora ASC
     LIMIT 5`,
    [providerId],
  );

  return {
    totalAgendamentos: Number(totalAgendamentos.rows[0].count),
    novosClientes: Number(novosClientes.rows[0].count),
    avaliacao: Number(avaliacaoRes.rows[0]?.avaliacao || 5.0),
    horariosLivresProximos: 12,
    proximosAgendamentos: proximos.rows,
  };
}
