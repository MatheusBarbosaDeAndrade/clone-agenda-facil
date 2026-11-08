// Popula o banco de DESENVOLVIMENTO com dados de demonstração semelhantes ao
// protótipo. Usa a própria API (o servidor `npm run dev` deve estar rodando),
// garantindo que senhas e dados pessoais passem pela mesma criptografia.
//
// Uso: npm run dev:seed
import pg from "pg";
import { getConnectionConfig } from "../db-config.mjs";

if (process.env.NODE_ENV === "production") {
  console.error("[seed] proibido em produção.");
  process.exit(1);
}

const BASE = process.env.APP_URL || "http://localhost:3000";
const PASSWORD = "senha1234";

async function call(path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(`${method} ${path}: ${data?.message || response.status}`);
  return {
    data,
    cookie: response.headers.getSetCookie?.()[0]?.split(";")[0] || cookie,
  };
}

async function account(user) {
  try {
    return (
      await call("/api/v1/auth/register", {
        method: "POST",
        body: { ...user, senha: PASSWORD, aceiteTermos: true },
      })
    ).cookie;
  } catch {
    return (
      await call("/api/v1/auth/login", {
        method: "POST",
        body: { identificador: user.email, senha: PASSWORD },
      })
    ).cookie;
  }
}

const providers = [
  {
    nome: "Ana Paula Ribeiro",
    email: "ana@agendafacil.dev",
    telefone: "91988887777",
    especialidade: "Psicóloga Clínica",
    local: "Travessa Timbó - Marco, 2584, Belém, Pará",
    bio: "Psicóloga com mais de 8 anos de experiência em terapia cognitivo-comportamental. Dedicada a promover o bem-estar e autoconhecimento dos meus clientes.",
  },
  {
    nome: "Lucas Guedes",
    email: "lucas@agendafacil.dev",
    telefone: "11977776666",
    especialidade: "Product Designer",
    local: "Av. Paulista, 1000, São Paulo, SP",
    bio: "Mentoria para portfólio, design de interfaces mobile e aceleração de carreira na área de tecnologia e inovação.",
  },
  {
    nome: "Julia Mendes",
    email: "julia@agendafacil.dev",
    telefone: "21966665555",
    especialidade: "Nutricionista",
    local: "Rua das Laranjeiras, 300, Rio de Janeiro, RJ",
    bio: "Tratamento focado em emagrecimento saudável, reeducação alimentar consciente e melhora de performance esportiva.",
  },
  {
    nome: "Maria Silva",
    email: "maria@agendafacil.dev",
    telefone: "91955554444",
    especialidade: "Consultoria de Negócios",
    local: "Av. Nazaré, 500, Belém, Pará",
    bio: "Consultora empresarial com foco em planejamento estratégico, diagnóstico organizacional e mentoria para pequenos negócios.",
  },
];

const clients = [
  {
    nome: "João Silva",
    email: "joao@agendafacil.dev",
    telefone: "11999998888",
  },
  {
    nome: "Roberto Alves",
    email: "roberto@agendafacil.dev",
    telefone: "11988881111",
  },
  {
    nome: "Fernanda Lima",
    email: "fernanda@agendafacil.dev",
    telefone: "11988882222",
  },
  {
    nome: "Carlos Henrique",
    email: "carlos@agendafacil.dev",
    telefone: "11988883333",
  },
];

const blocks = [];
for (const dia of [1, 2, 3, 4, 5]) {
  for (const [inicio, fim] of [
    ["08:00", "10:00"],
    ["10:00", "12:00"],
    ["14:00", "16:00"],
    ["16:00", "18:00"],
  ]) {
    if (dia === 3 && inicio === "14:00") continue;
    blocks.push({ diaSemana: dia, inicio, fim });
  }
}

const db = new pg.Client(getConnectionConfig());
await db.connect();

console.log("[seed] criando contas...");
const providerCookies = [];
for (const p of providers) {
  const cookie = await account({ papel: "prestador", ...p });
  providerCookies.push(cookie);
  await call("/api/v1/availability", {
    method: "PUT",
    body: { blocos: blocks },
    cookie,
  });
  const me = (await call("/api/v1/users/me", { cookie })).data;
  await call("/api/v1/users/me", {
    method: "PATCH",
    cookie,
    body: {
      nome: me.nome,
      email: me.email,
      telefone: me.telefone,
      prestador: { ...me.prestador, bio: p.bio },
    },
  });
}
const clientCookies = [];
for (const c of clients)
  clientCookies.push(await account({ papel: "cliente", ...c }));

const ids = {};
for (const row of (
  await db.query(
    "SELECT id, email FROM usuarios WHERE email LIKE '%@agendafacil.dev'",
  )
).rows) {
  ids[row.email] = row.id;
}

const existing = await db.query(
  "SELECT count(*)::int AS n FROM agendamentos WHERE cliente_id = $1",
  [ids["joao@agendafacil.dev"]],
);
if (existing.rows[0].n > 0) {
  console.log("[seed] agendamentos já existem — pulando.");
} else {
  console.log("[seed] criando agendamentos futuros...");
  async function bookNext(clientCookie, providerEmail, skip = 0) {
    const providerId = ids[providerEmail];
    const { data } = await call(
      `/api/v1/providers/${providerId}/slots?dias=14`,
      { cookie: clientCookie },
    );
    const free = Object.entries(data.horarios).flatMap(([d, hs]) =>
      hs.map((h) => [d, h]),
    );
    const [dataISO, hora] = free[skip];
    return (
      await call("/api/v1/appointments", {
        method: "POST",
        cookie: clientCookie,
        body: { prestadorId: providerId, data: dataISO, hora },
      })
    ).data;
  }
  const a1 = await bookNext(clientCookies[0], "ana@agendafacil.dev", 1);
  await call(`/api/v1/appointments/${a1.id}/status`, {
    method: "PATCH",
    cookie: providerCookies[0],
    body: { status: "confirmado" },
  });
  await bookNext(clientCookies[0], "lucas@agendafacil.dev", 6);

  const m1 = await bookNext(clientCookies[1], "maria@agendafacil.dev", 2);
  await call(`/api/v1/appointments/${m1.id}/status`, {
    method: "PATCH",
    cookie: providerCookies[3],
    body: { status: "confirmado" },
  });
  await bookNext(clientCookies[2], "maria@agendafacil.dev", 5);
  const m3 = await bookNext(clientCookies[3], "maria@agendafacil.dev", 9);
  await call(`/api/v1/appointments/${m3.id}/status`, {
    method: "PATCH",
    cookie: providerCookies[3],
    body: { status: "confirmado" },
  });

  console.log("[seed] criando histórico...");
  const past = [
    [
      "joao@agendafacil.dev",
      "maria@agendafacil.dev",
      "Auditoria Inicial",
      20,
      "concluido",
      5,
    ],
    [
      "joao@agendafacil.dev",
      "lucas@agendafacil.dev",
      "Mentoria para Portfólio de UX/UI",
      45,
      "cancelado",
      null,
    ],
    [
      "joao@agendafacil.dev",
      "julia@agendafacil.dev",
      "Consulta Nutricional",
      70,
      "concluido",
      4,
    ],
    [
      "joao@agendafacil.dev",
      "ana@agendafacil.dev",
      "Sessão de Psicoterapia Individual",
      95,
      "nao_compareceu",
      null,
    ],
    [
      "roberto@agendafacil.dev",
      "maria@agendafacil.dev",
      "Diagnóstico Organizacional",
      10,
      "concluido",
      5,
    ],
    [
      "fernanda@agendafacil.dev",
      "maria@agendafacil.dev",
      "Mentoria de Planejamento",
      15,
      "concluido",
      5,
    ],
    [
      "carlos@agendafacil.dev",
      "maria@agendafacil.dev",
      "Sessão de Alinhamento",
      3,
      "cancelado",
      null,
    ],
  ];
  for (const [client, provider, servico, daysAgo, status, nota] of past) {
    await db.query(
      `INSERT INTO agendamentos (prestador_id, cliente_id, servico, inicio, fim, status, avaliacao, avaliado_em, criado_em)
       VALUES ($1, $2, $3, date_trunc('hour', now()) - make_interval(days => $4::int), date_trunc('hour', now()) - make_interval(days => $4::int) + interval '1 hour',
               $5::status_agendamento, $6::smallint, CASE WHEN $6::int IS NULL THEN NULL ELSE now() END, now() - make_interval(days => $4::int + 2))`,
      [ids[provider], ids[client], servico, daysAgo, status, nota],
    );
  }

  console.log("[seed] criando conversas e avisos...");
  const conv = (
    await call("/api/v1/conversations", {
      method: "POST",
      cookie: clientCookies[0],
      body: { usuarioId: ids["ana@agendafacil.dev"] },
    })
  ).data;
  await call(`/api/v1/conversations/${conv.id}/messages`, {
    method: "POST",
    cookie: providerCookies[0],
    body: { texto: "Olá, João! Confirmo nossa sessão. Alguma dúvida inicial?" },
  });
  await call(`/api/v1/conversations/${conv.id}/messages`, {
    method: "POST",
    cookie: clientCookies[0],
    body: {
      texto:
        "Oi, Dra. Ana! Ótimo, nenhuma dúvida. Já reservei o horário. Nos vemos lá!",
    },
  });
  const conv2 = (
    await call("/api/v1/conversations", {
      method: "POST",
      cookie: clientCookies[0],
      body: { usuarioId: ids["lucas@agendafacil.dev"] },
    })
  ).data;
  await call(`/api/v1/conversations/${conv2.id}/messages`, {
    method: "POST",
    cookie: clientCookies[0],
    body: { texto: "Posso levar meu portfólio impresso?" },
  });
  await call(`/api/v1/conversations/${conv2.id}/messages`, {
    method: "POST",
    cookie: providerCookies[1],
    body: { texto: "Pode ser sim, perfeito." },
  });

  await call("/api/v1/notices", {
    method: "POST",
    cookie: providerCookies[3],
    body: {
      titulo: "Feriado - Sem atendimento",
      texto:
        "Informo que não haverá expediente durante o feriado. Os horários desse dia foram bloqueados na agenda.",
      cor: "marrom",
    },
  });
  await call("/api/v1/notices", {
    method: "POST",
    cookie: providerCookies[3],
    body: {
      titulo: "Horário alterado na próxima semana",
      texto:
        "Prezados clientes, excepcionalmente na próxima terça-feira os atendimentos do período da manhã serão remarcados para o período da tarde devido a treinamentos de capacitação.",
      cor: "azul",
    },
  });
}

await db.end();
console.log(`\n[seed] pronto! Senha de todas as contas: ${PASSWORD}`);
console.log("  Cliente:   joao@agendafacil.dev");
console.log(
  "  Prestador: maria@agendafacil.dev (dashboard completo) | ana@agendafacil.dev",
);
