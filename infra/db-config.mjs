// Configuração de conexão compartilhada entre a aplicação (Next.js) e os
// scripts de linha de comando (migrações, seed, manutenção).

export function getSslConfig() {
  // Em produção a conexão com o banco deve ser criptografada, a não ser que o
  // banco esteja na mesma rede privada (ex.: docker compose) — nesse caso
  // defina POSTGRES_SSL=disable explicitamente.
  const mode = process.env.POSTGRES_SSL;
  if (mode === "disable") return false;
  if (mode === "require") return { rejectUnauthorized: true };
  if (mode === "no-verify") return { rejectUnauthorized: false };
  const production =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return production ? { rejectUnauthorized: true } : false;
}

/**
 * { unpooled: true } prefere a conexão direta (DATABASE_URL_UNPOOLED, criada
 * pela integração Neon da Vercel) — necessária para as migrações, que usam
 * locks de sessão incompatíveis com o pooler (PgBouncer em modo transação).
 */
export function getConnectionConfig({ unpooled = false } = {}) {
  const url =
    (unpooled && process.env.DATABASE_URL_UNPOOLED) || process.env.DATABASE_URL;
  if (url) {
    return { connectionString: url, ssl: getSslConfig() };
  }
  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSslConfig(),
  };
}
