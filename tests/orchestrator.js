import pg from "pg";

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function waitForWebServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/status`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    "Servidor web não respondeu. Rode `npm run dev` antes dos testes.",
  );
}

export async function query(sql, values) {
  const client = new pg.Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
  await client.connect();
  try {
    return (await client.query(sql, values)).rows;
  } finally {
    await client.end();
  }
}

async function clearDatabase() {
  await query(
    `TRUNCATE usuarios, registros_auditoria, limites_requisicao, cadastros_pendentes RESTART IDENTITY CASCADE`,
  );
}

/** Zera os contadores de rate limit (os limites são testados explicitamente em auth.test.js). */
export async function resetRateLimits() {
  await query("DELETE FROM limites_requisicao");
}

export async function prepare() {
  await waitForWebServer();
  await clearDatabase();
}

/** Requisição JSON que guarda o cookie de sessão retornado. */
export async function request(
  path,
  { method = "GET", body, cookie, headers = {} } = {},
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  const setCookie = response.headers.getSetCookie?.()[0];
  return {
    status: response.status,
    data,
    headers: response.headers,
    cookie: setCookie ? setCookie.split(";")[0] : cookie,
  };
}

let counter = 0;
export async function createUser(overrides = {}) {
  counter += 1;
  const papel = overrides.papel || "cliente";
  const body = {
    papel,
    nome: `Usuário Teste ${counter}`,
    telefone: `1198${String(1000000 + counter).slice(-7)}`,
    email: `teste${counter}-${Date.now()}@exemplo.com`,
    senha: "senhaForte123",
    aceiteTermos: true,
    ...(papel === "prestador"
      ? { local: "Rua Teste, 100", especialidade: "Consultoria" }
      : {}),
    ...overrides,
  };
  await resetRateLimits();
  const result = await request("/api/v1/auth/register", {
    method: "POST",
    body,
  });
  if (result.status !== 201) throw new Error(JSON.stringify(result.data));
  const me = await request("/api/v1/users/me", { cookie: result.cookie });
  return { ...body, id: me.data.id, cookie: result.cookie };
}
