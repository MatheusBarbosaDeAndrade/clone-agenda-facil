import {
  prepare,
  request,
  createUser,
  query,
  BASE_URL,
} from "tests/orchestrator.js";
import { hashToken } from "infra/crypto.js";
import database from "infra/database.js";
import googleSignup from "models/google-signup.js";

beforeAll(prepare);
afterAll(() => database.getPool().end());

const fakeReq = { headers: {}, socket: { remoteAddress: "127.0.0.1" } };

async function issueToken(
  usuarioId,
  email,
  token = `token-de-teste-${Math.random()}`,
) {
  await query(
    `INSERT INTO tokens_verificacao_email (token_hash, usuario_id, email, expira_em)
     VALUES ($1, $2, $3, now() + interval '1 hour')`,
    [hashToken(token), usuarioId, email],
  );
  return token;
}

async function isVerified(id) {
  const [row] = await query(
    "SELECT email_verificado_em IS NOT NULL AS ok FROM usuarios WHERE id = $1",
    [id],
  );
  return row.ok;
}

describe("Confirmação de e-mail", () => {
  test("cadastro leva à confirmação e bloqueia o uso até confirmar", async () => {
    const user = await createUser({ verified: false });
    const me = await request("/api/v1/users/me", { cookie: user.cookie });
    expect(me.data.emailVerificado).toBe(false);

    const blocked = await request("/api/v1/providers", { cookie: user.cookie });
    expect(blocked.status).toBe(403);
    expect(blocked.data.name).toBe("EmailNotVerifiedError");

    const page = await fetch(`${BASE_URL}/cliente/inicio`, {
      headers: { Cookie: user.cookie },
      redirect: "manual",
    });
    expect(page.headers.get("location")).toContain("/confirmar-email");

    // Direitos do titular continuam disponíveis mesmo sem confirmar.
    expect(
      (await request("/api/v1/users/me/export", { cookie: user.cookie }))
        .status,
    ).toBe(200);
  });

  test("resposta do cadastro direciona para a confirmação", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: {
        papel: "cliente",
        nome: "Nova Pessoa",
        telefone: "11966660000",
        email: `nova-${Date.now()}@exemplo.com`,
        senha: "senhaForte123",
        aceiteTermos: true,
      },
    });
    expect(response.status).toBe(201);
    expect(response.data.redirectTo).toBe("/confirmar-email");
  });

  test("link válido confirma o e-mail e não pode ser reutilizado", async () => {
    const user = await createUser({ verified: false });
    const token = await issueToken(user.id, user.email);
    const page = await fetch(
      `${BASE_URL}/verificar-email?token=${encodeURIComponent(token)}`,
    );
    expect(await page.text()).toContain("E-mail confirmado!");
    expect(await isVerified(user.id)).toBe(true);
    expect(
      (await request("/api/v1/providers", { cookie: user.cookie })).status,
    ).toBe(200);

    const again = await fetch(
      `${BASE_URL}/verificar-email?token=${encodeURIComponent(token)}`,
    );
    expect(await again.text()).toContain("Link inválido");
  });

  test("link emitido para um e-mail antigo não confirma o e-mail novo", async () => {
    const user = await createUser({ verified: false });
    const token = await issueToken(user.id, user.email);
    const changed = await request("/api/v1/auth/email-verification", {
      method: "POST",
      cookie: user.cookie,
      body: { email: `corrigido-${Date.now()}@exemplo.com` },
    });
    expect(changed.status).toBe(200);
    await fetch(
      `${BASE_URL}/verificar-email?token=${encodeURIComponent(token)}`,
    );
    expect(await isVerified(user.id)).toBe(false);
  });

  test("trocar o e-mail no perfil exige nova confirmação", async () => {
    const user = await createUser();
    const updated = await request("/api/v1/users/me", {
      method: "PATCH",
      cookie: user.cookie,
      body: {
        nome: user.nome,
        telefone: user.telefone,
        email: `trocado-${Date.now()}@exemplo.com`,
      },
    });
    expect(updated.data.emailVerificado).toBe(false);
    expect(
      (await request("/api/v1/providers", { cookie: user.cookie })).status,
    ).toBe(403);
  });

  test("prestador sem e-mail confirmado não aparece nas buscas nem recebe agendamentos", async () => {
    const provider = await createUser({
      papel: "prestador",
      verified: false,
      nome: "Prestador Fantasma",
    });
    const client = await createUser();
    const list = await request(
      `/api/v1/providers?q=${encodeURIComponent("Fantasma")}`,
      { cookie: client.cookie },
    );
    expect(list.data).toHaveLength(0);
    const chat = await request("/api/v1/conversations", {
      method: "POST",
      cookie: client.cookie,
      body: { usuarioId: provider.id },
    });
    expect(chat.status).toBe(404);
  });

  test("redefinir a senha pelo link do e-mail também confirma o e-mail", async () => {
    const user = await createUser({ verified: false });
    const token = "token-de-recuperacao-para-teste-1234567890";
    await query(
      `INSERT INTO tokens_recuperacao (token_hash, usuario_id, expira_em) VALUES ($1, $2, now() + interval '10 minutes')`,
      [hashToken(token), user.id],
    );
    const reset = await request("/api/v1/auth/reset-password", {
      method: "POST",
      body: { token, senha: "outraSenha123" },
    });
    expect(reset.status).toBe(200);
    expect(await isVerified(user.id)).toBe(true);
  });
});

describe("Login com Google: proteção contra sequestro prévio de conta", () => {
  test("conta não confirmada criada por terceiro: o dono do e-mail assume e o invasor perde o acesso", async () => {
    const victimEmail = `vitima-${Date.now()}@gmail.com`;
    const attacker = await createUser({
      verified: false,
      email: victimEmail,
      senha: "senhaDoInvasor1",
    });

    const found = await googleSignup.resolveExisting(fakeReq, {
      sub: `google-${Date.now()}`,
      email: victimEmail,
      nome: "Vítima",
    });
    expect(found.id).toBe(attacker.id);
    expect(found.temSenha).toBe(false);
    expect(found.temGoogle).toBe(true);
    expect(found.emailVerificado).toBe(true);

    // A sessão aberta pelo invasor foi encerrada e a senha dele não funciona mais.
    expect(
      (await request("/api/v1/users/me", { cookie: attacker.cookie })).status,
    ).toBe(401);
    const login = await request("/api/v1/auth/login", {
      method: "POST",
      body: { identificador: victimEmail, senha: "senhaDoInvasor1" },
    });
    expect(login.status).toBe(401);
  });

  test("conta com e-mail confirmado é vinculada mantendo a senha e as sessões do dono", async () => {
    const owner = await createUser();
    const found = await googleSignup.resolveExisting(fakeReq, {
      sub: `google-dono-${Date.now()}`,
      email: owner.email,
      nome: owner.nome,
    });
    expect(found.id).toBe(owner.id);
    expect(found.temSenha).toBe(true);
    expect(found.temGoogle).toBe(true);
    expect(
      (await request("/api/v1/users/me", { cookie: owner.cookie })).status,
    ).toBe(200);
  });

  test("e-mail sem conta segue para completar o cadastro", async () => {
    const found = await googleSignup.resolveExisting(fakeReq, {
      sub: `google-novo-${Date.now()}`,
      email: `novo-${Date.now()}@gmail.com`,
      nome: "Novo",
    });
    expect(found).toBeNull();
  });
});
