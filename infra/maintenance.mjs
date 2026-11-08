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
