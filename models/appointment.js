import database from "infra/database.js";
import { decrypt } from "infra/crypto.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "infra/errors.js";
import { TIMEZONE } from "lib/constants.js";
import { avatarUrl } from "models/user.js";
import availability from "models/availability.js";

const MAX_ACTIVE_PER_CLIENT = 10;

const SELECT = `
  SELECT a.id, a.servico, a.inicio, a.fim, a.status, a.avaliacao, a.criado_em,
         a.inicio <= now() AS ja_iniciou,
         a.prestador_id, pu.nome AS prestador_nome, p.especialidade AS prestador_especialidade,
         pav.atualizado_em AS prestador_avatar,
         a.cliente_id, cu.nome AS cliente_nome, cu.telefone_cifrado AS cliente_telefone,
         cav.atualizado_em AS cliente_avatar
  FROM agendamentos a
  LEFT JOIN usuarios pu ON pu.id = a.prestador_id
  LEFT JOIN prestadores p ON p.usuario_id = a.prestador_id
  LEFT JOIN avatares pav ON pav.usuario_id = a.prestador_id
  LEFT JOIN usuarios cu ON cu.id = a.cliente_id
  LEFT JOIN avatares cav ON cav.usuario_id = a.cliente_id`;

function toPublic(row, viewer) {
  const item = {
    id: row.id,
    servico: row.servico,
    inicio: new Date(row.inicio).toISOString(),
    fim: new Date(row.fim).toISOString(),
    status: row.status,
    avaliacao: row.avaliacao,
    jaIniciou: row.ja_iniciou,
    prestador: row.prestador_id
      ? {
          id: row.prestador_id,
          nome: row.prestador_nome,
          especialidade: row.prestador_especialidade,
          avatarUrl: avatarUrl(row.prestador_id, row.prestador_avatar),
        }
      : null,
    cliente: row.cliente_id
      ? {
          id: row.cliente_id,
          nome: row.cliente_nome,
          avatarUrl: avatarUrl(row.cliente_id, row.cliente_avatar),
        }
      : null,
  };
  // O telefone do cliente só é exposto ao prestador do próprio agendamento.
  if (viewer === "prestador" && item.cliente && row.cliente_telefone) {
    item.cliente.telefone = decrypt(row.cliente_telefone);
  }
  return item;
}

async function book(clienteId, { prestadorId, data, hora }) {
  return database.transaction(async (tx) => {
    // Serializa agendamentos do mesmo prestador para evitar dupla reserva.
    await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [prestadorId]);

    const providerResult = await tx.query(
      "SELECT especialidade FROM prestadores WHERE usuario_id = $1",
      [prestadorId],
    );
    if (!providerResult.rows[0])
      throw new NotFoundError({ message: "Prestador não encontrado." });
    if (prestadorId === clienteId)
      throw new ValidationError({ message: "Agendamento inválido." });

    const active = await tx.query(
      `SELECT count(*)::int AS total FROM agendamentos
       WHERE cliente_id = $1 AND status IN ('pendente', 'confirmado') AND inicio > now()`,
      [clienteId],
    );
    if (active.rows[0].total >= MAX_ACTIVE_PER_CLIENT) {
      throw new ValidationError({
        message: `Você já possui ${MAX_ACTIVE_PER_CLIENT} agendamentos ativos.`,
        action: "Conclua ou cancele algum agendamento antes de marcar outro.",
      });
    }

    const slots = await availability.freeSlots(prestadorId, data, 1, tx);
    if (!(slots[data] || []).includes(hora)) {
      throw new ConflictError({
        message: "Este horário não está mais disponível.",
        action: "Escolha outro horário.",
      });
    }

    const inserted = await tx.query(
      `INSERT INTO agendamentos (prestador_id, cliente_id, servico, inicio, fim)
       SELECT $1, $2, p.especialidade,
              ($3::date + $4::time) AT TIME ZONE $5,
              ($3::date + $4::time + make_interval(mins => p.duracao_minutos)) AT TIME ZONE $5
       FROM prestadores p WHERE p.usuario_id = $1
       RETURNING id`,
      [prestadorId, clienteId, data, hora, TIMEZONE],
    );
    return inserted.rows[0].id;
  });
}

async function findForUser(id, viewer) {
  const result = await database.query(`${SELECT} WHERE a.id = $1`, [id]);
  const row = result.rows[0];
  const isOwner =
    row &&
    ((viewer.papel === "cliente" && row.cliente_id === viewer.id) ||
      (viewer.papel === "prestador" && row.prestador_id === viewer.id));
  if (!isOwner)
    throw new NotFoundError({ message: "Agendamento não encontrado." });
  return toPublic(row, viewer.papel);
}

async function listForClient(clienteId, aba = "agendados") {
  const upcoming = aba !== "historico";
  const result = await database.query(
    `${SELECT}
     WHERE a.cliente_id = $1 AND ${
       upcoming
         ? "a.status IN ('pendente', 'confirmado') AND a.fim > now()"
         : "NOT (a.status IN ('pendente', 'confirmado') AND a.fim > now())"
     }
     ORDER BY a.inicio ${upcoming ? "ASC" : "DESC"}
     LIMIT 200`,
    [clienteId],
  );
  return result.rows.map((row) => toPublic(row, "cliente"));
}

async function listForProvider(
  prestadorId,
  { proximos = false, limit = 500 } = {},
) {
  const result = await database.query(
    `${SELECT}
     WHERE a.prestador_id = $1 ${
       proximos
         ? "AND a.status IN ('pendente', 'confirmado') AND a.fim > now()"
         : ""
     }
     ORDER BY ${proximos ? "a.inicio ASC" : "(a.status IN ('pendente','confirmado') AND a.fim > now()) DESC, a.inicio DESC"}
     LIMIT $2`,
    [prestadorId, limit],
  );
  return result.rows.map((row) => toPublic(row, "prestador"));
}

const PROVIDER_TRANSITIONS = {
  confirmado: { from: ["pendente"], requiresStarted: false },
  cancelado: { from: ["pendente", "confirmado"], requiresStarted: false },
  concluido: { from: ["confirmado", "pendente"], requiresStarted: true },
  nao_compareceu: { from: ["confirmado", "pendente"], requiresStarted: true },
};

async function updateStatus(id, viewer, novoStatus) {
  const current = await findForUser(id, viewer);
  if (viewer.papel === "cliente") {
    if (novoStatus !== "cancelado") throw new ForbiddenError();
    if (
      !["pendente", "confirmado"].includes(current.status) ||
      current.jaIniciou
    ) {
      throw new ValidationError({
        message: "Este agendamento não pode mais ser cancelado.",
      });
    }
  } else {
    const rule = PROVIDER_TRANSITIONS[novoStatus];
    if (!rule || !rule.from.includes(current.status)) {
      throw new ValidationError({
        message: "Alteração de status não permitida.",
      });
    }
    if (rule.requiresStarted && !current.jaIniciou) {
      throw new ValidationError({
        message:
          "Só é possível marcar este status após o horário do atendimento.",
      });
    }
  }
  await database.query(
    "UPDATE agendamentos SET status = $2, atualizado_em = now() WHERE id = $1",
    [id, novoStatus],
  );
  return findForUser(id, viewer);
}

async function rate(id, viewer, nota) {
  const current = await findForUser(id, viewer);
  if (viewer.papel !== "cliente") throw new ForbiddenError();
  if (current.status !== "concluido") {
    throw new ValidationError({
      message: "Só é possível avaliar atendimentos concluídos.",
    });
  }
  if (current.avaliacao)
    throw new ConflictError({ message: "Este atendimento já foi avaliado." });
  await database.query(
    "UPDATE agendamentos SET avaliacao = $2, avaliado_em = now(), atualizado_em = now() WHERE id = $1",
    [id, nota],
  );
  return findForUser(id, viewer);
}

/** Indicadores do painel do prestador. */
async function providerSummary(prestadorId) {
  const result = await database.query(
    `WITH base AS (SELECT * FROM agendamentos WHERE prestador_id = $1),
     primeiros AS (
       SELECT cliente_id, min(criado_em) AS primeiro FROM base
       WHERE cliente_id IS NOT NULL GROUP BY cliente_id
     )
     SELECT
       (SELECT count(*) FROM base WHERE status <> 'cancelado')::int AS total,
       (SELECT count(*) FROM base WHERE criado_em >= date_trunc('month', now() AT TIME ZONE $2) AT TIME ZONE $2)::int AS mes_atual,
       (SELECT count(*) FROM base WHERE criado_em >= (date_trunc('month', now() AT TIME ZONE $2) - interval '1 month') AT TIME ZONE $2
                                     AND criado_em < date_trunc('month', now() AT TIME ZONE $2) AT TIME ZONE $2)::int AS mes_anterior,
       (SELECT count(*) FROM primeiros WHERE primeiro >= now() - interval '30 days')::int AS novos_clientes,
       (SELECT count(*) FROM primeiros WHERE primeiro >= now() - interval '7 days')::int AS novos_semana,
       (SELECT count(*) FROM primeiros WHERE primeiro >= now() - interval '14 days' AND primeiro < now() - interval '7 days')::int AS novos_semana_anterior,
       (SELECT round(avg(avaliacao)::numeric, 1) FROM base WHERE avaliacao IS NOT NULL) AS media,
       (SELECT count(*) FROM base WHERE avaliacao IS NOT NULL)::int AS avaliacoes`,
    [prestadorId, TIMEZONE],
  );
  const row = result.rows[0];
  return {
    total: row.total,
    mesAtual: row.mes_atual,
    mesAnterior: row.mes_anterior,
    novosClientes: row.novos_clientes,
    novosSemana: row.novos_semana,
    novosSemanaAnterior: row.novos_semana_anterior,
    media: row.media === null ? null : Number(row.media),
    avaliacoes: row.avaliacoes,
  };
}

const appointment = {
  book,
  findForUser,
  listForClient,
  listForProvider,
  updateStatus,
  rate,
  providerSummary,
};
export default appointment;
