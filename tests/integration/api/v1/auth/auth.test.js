import {
  prepare,
  request,
  createUser,
  resetRateLimits,
} from "tests/orchestrator.js";

beforeAll(prepare);

describe("Autenticação", () => {
  test("cadastro valida os campos e exige consentimento", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        papel: "cliente",
        nome: "Jo",
        telefone: "123",
        email: "x",
        senha: "abc",
        aceiteTermos: false,
      },
    });
    expect(response.status).toBe(400);
    expect(Object.keys(response.data.fields).sort()).toEqual([
      "aceiteTermos",
      "email",
      "nome",
      "senha",
      "telefone",
    ]);
  });

  test("cadastro cria sessão segura e impede e-mail duplicado", async () => {
    const user = await createUser({ email: "duplicado@exemplo.com" });
    expect(user.cookie).toMatch(/^agendafacil_sessao=/);
    const dup = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        papel: "cliente",
        nome: "Outra Pessoa",
        telefone: "11977776666",
        email: "DUPLICADO@exemplo.com",
        senha: "senhaForte123",
        aceiteTermos: true,
      },
    });
    expect(dup.status).toBe(409);
    expect(dup.data.fields.email).toBeDefined();
  });

  test("login por e-mail ou telefone, com mensagem genérica em caso de erro", async () => {
    const user = await createUser({ telefone: "(21) 98765-4321" });
    const byEmail = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: user.email, senha: user.senha },
    });
    expect(byEmail.status).toBe(200);
    const byPhone = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: "21987654321", senha: user.senha },
    });
    expect(byPhone.status).toBe(200);

    const wrong = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: user.email, senha: "errada123" },
    });
    const unknown = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: "nao@existe.com", senha: "errada123" },
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.data.message).toBe(unknown.data.message);
  });

  test("bloqueia requisições de outra origem (CSRF)", async () => {
    const user = await createUser();
    const response = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: user.email, senha: user.senha },
      headers: { Origin: "https://site-malicioso.com" },
    });
    expect(response.status).toBe(403);
  });

  test("limita tentativas de login (força bruta)", async () => {
    const user = await createUser();
    let last;
    for (let i = 0; i < 9; i++) {
      last = await request("/api/v1/auth/login", {
        method: "POST",
        body: { identificador: user.email, senha: "errada123" },
      });
    }
    expect(last.status).toBe(429);
  });

  test("limita cadastros em massa por IP", async () => {
    await resetRateLimits();
    let last;
    for (let i = 0; i < 11; i++) {
      last = await request("/api/v1/auth/register", {
        method: "POST",
        body: {
          papel: "cliente",
          nome: "Robô Spam",
          telefone: `1197${String(1000000 + i)}`.slice(0, 11),
          email: `spam${i}@exemplo.com`,
          senha: "senhaForte123",
          aceiteTermos: true,
        },
      });
    }
    expect(last.status).toBe(429);
    expect(last.headers.get("retry-after")).toBeTruthy();
  });

  test("logout invalida a sessão no servidor", async () => {
    const user = await createUser();
    expect(
      (await request("/api/v1/users/me", { cookie: user.cookie })).status,
    ).toBe(200);
    await request("/api/v1/auth/logout", {
      method: "POST",
      cookie: user.cookie,
    });
    expect(
      (await request("/api/v1/users/me", { cookie: user.cookie })).status,
    ).toBe(401);
  });

  test("recuperação de senha não revela se o e-mail existe", async () => {
    const user = await createUser();
    const exists = await request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: user.email },
    });
    const missing = await request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "ninguem@exemplo.com" },
    });
    expect(exists.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(exists.data).toEqual(missing.data);
  });
});

describe("Redirecionamento após login", () => {
  test("ignora destinos externos (open redirect)", async () => {
    const user = await createUser();
    for (const next of ["//evil.com", "/\\evil.com", "https://evil.com"]) {
      const response = await request(
        `/api/v1/auth/login?next=${encodeURIComponent(next)}`,
        {
          method: "POST",
          body: { identificador: user.email, senha: user.senha },
        },
      );
      expect(response.data.redirectTo).toBe("/cliente/inicio");
    }
    const ok = await request(
      `/api/v1/auth/login?next=${encodeURIComponent("/cliente/chat")}`,
      {
        method: "POST",
        body: { identificador: user.email, senha: user.senha },
      },
    );
    expect(ok.data.redirectTo).toBe("/cliente/chat");
  });
});
