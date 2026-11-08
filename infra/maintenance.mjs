// Rotina de retenção de dados (LGPD art. 15/16 — término do tratamento).
// Executada automaticamente a cada hora pelo servidor (instrumentation.js)
// e também disponível via `npm run maintenance`.
export const RETENTION_SQL = [
  ["sessões expiradas", "DELETE FROM sessoes WHERE expira_em < now()"],
  [
    "tokens de recuperação",
    "DELETE FROM tokens_recuperacao WHERE expira_em < now() - interval '1 day'",
  ],
  [
    "contas com e-mail não confirmado (> 7 dias)",
    "DELETE FROM usuarios WHERE email_verificado_em IS NULL AND criado_em < now() - interval '7 days'",
  ],
  [
    "links de confirmação de e-mail",
    "DELETE FROM tokens_verificacao_email WHERE expira_em < now()",
  ],
  [
    "cadastros pendentes",
    "DELETE FROM cadastros_pendentes WHERE expira_em < now()",
  ],
  [
    "limites de requisição",
    "DELETE FROM limites_requisicao WHERE janela_inicio < now() - interval '1 day'",
  ],
  [
    "registros de acesso (> 6 meses)",
    "DELETE FROM registros_auditoria WHERE criado_em < now() - interval '6 months'",
  ],
];

export async function runMaintenance(queryFn) {
  const report = {};
  for (const [label, sql] of RETENTION_SQL) {
    const result = await queryFn(sql);
    report[label] = result.rowCount;
  }
  return report;
}
