import database from "infra/database.js";
import { decrypt } from "infra/crypto.js";
import { LEGAL_VERSIONS } from "lib/constants.js";
import user from "models/user.js";

/**
 * LGPD art. 18, II e V — acesso e portabilidade: exporta todos os dados
 * pessoais do titular em formato estruturado (JSON).
 */
async function exportData(usuarioId) {
  const profile = await user.findByIdOrThrow(usuarioId);
  const [
    consents,
    appointments,
    conversations,
    notices,
    availability,
    accessLogs,
  ] = await Promise.all([
    database.query(
      "SELECT documento, versao, aceito_em FROM consentimentos WHERE usuario_id = $1 ORDER BY aceito_em",
      [usuarioId],
    ),
    database.query(
      `SELECT a.id, a.servico, a.inicio, a.fim, a.status, a.avaliacao, a.criado_em,
                pu.nome AS prestador, cu.nome AS cliente
         FROM agendamentos a
         LEFT JOIN usuarios pu ON pu.id = a.prestador_id
         LEFT JOIN usuarios cu ON cu.id = a.cliente_id
         WHERE a.cliente_id = $1 OR a.prestador_id = $1 ORDER BY a.inicio`,
      [usuarioId],
    ),
    database.query(
      `SELECT c.id, cu.nome AS cliente, pu.nome AS prestador
         FROM conversas c JOIN usuarios cu ON cu.id = c.cliente_id JOIN usuarios pu ON pu.id = c.prestador_id
         WHERE c.cliente_id = $1 OR c.prestador_id = $1`,
      [usuarioId],
    ),
    database.query(
      "SELECT titulo, texto, criado_em FROM avisos WHERE prestador_id = $1 ORDER BY criado_em",
      [usuarioId],
    ),
    database.query(
      "SELECT dia_semana, inicio, fim FROM disponibilidades WHERE prestador_id = $1 ORDER BY dia_semana, inicio",
      [usuarioId],
    ),
    database.query(
      "SELECT acao, ip, criado_em FROM registros_auditoria WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 1000",
      [usuarioId],
    ),
  ]);

  const conversas = [];
  for (const conversation of conversations.rows) {
    const messages = await database.query(
      "SELECT autor_id, texto_cifrado, criado_em FROM mensagens WHERE conversa_id = $1 ORDER BY criado_em",
      [conversation.id],
    );
    conversas.push({
      cliente: conversation.cliente,
      prestador: conversation.prestador,
      mensagens: messages.rows.map((m) => ({
        autor: m.autor_id === usuarioId ? "você" : "outra parte",
        texto: (() => {
          try {
            return decrypt(m.texto_cifrado);
          } catch {
            return null;
          }
        })(),
        enviadaEm: m.criado_em,
      })),
    });
  }

  return {
    geradoEm: new Date().toISOString(),
    controlador: "AgendaFácil",
    titular: {
      id: profile.id,
      papel: profile.papel,
      nome: profile.nome,
      email: profile.email,
      telefone: profile.telefone,
      contaGoogleVinculada: profile.temGoogle,
      possuiFotoDePerfil: Boolean(profile.avatarUrl),
      criadoEm: profile.criadoEm,
      ...(profile.prestador ? { perfilProfissional: profile.prestador } : {}),
    },
    consentimentos: consents.rows,
    agendamentos: appointments.rows.map(({ id, ...rest }) => rest),
    conversas,
    avisos: notices.rows,
    disponibilidade: availability.rows,
    registrosDeAcesso: accessLogs.rows,
    observacao:
      "Registros de acesso (IP e data/hora) são mantidos por 6 meses por obrigação legal (Marco Civil da Internet, art. 15).",
  };
}

/**
 * LGPD art. 18, VI — eliminação. Remove a conta e os dados pessoais.
 * Agendamentos permanecem para a outra parte, sem identificar o titular.
 * Registros de acesso são mantidos pelo prazo legal, sem nome/e-mail/telefone.
 */
async function deleteAccount(usuarioId) {
  await database.transaction(async (tx) => {
    // Cancela compromissos futuros para não deixar a outra parte esperando.
    await tx.query(
      `UPDATE agendamentos SET status = 'cancelado', atualizado_em = now()
       WHERE (cliente_id = $1 OR prestador_id = $1)
         AND status IN ('pendente', 'confirmado') AND inicio > now()`,
      [usuarioId],
    );
    await tx.query("DELETE FROM usuarios WHERE id = $1", [usuarioId]);
  });
}

async function listConsents(usuarioId) {
  const result = await database.query(
    "SELECT documento, versao, aceito_em FROM consentimentos WHERE usuario_id = $1 ORDER BY aceito_em DESC",
    [usuarioId],
  );
  return result.rows.map((r) => ({
    documento: r.documento,
    versao: r.versao,
    aceitoEm: new Date(r.aceito_em).toISOString(),
    atual: LEGAL_VERSIONS[r.documento] === r.versao,
  }));
}

const privacy = { exportData, deleteAccount, listConsents };
export default privacy;
