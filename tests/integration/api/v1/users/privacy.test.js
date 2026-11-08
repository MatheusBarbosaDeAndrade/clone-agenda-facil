import { prepare, request, createUser, query } from "tests/orchestrator.js";

beforeAll(prepare);

const rawQuery = query;

describe("Privacidade e LGPD", () => {
  test("telefone e mensagens ficam criptografados no banco", async () => {
    const provider = await createUser({
      papel: "prestador",
      telefone: "11912345678",
    });
    const client = await createUser();
    const [row] = await rawQuery(
      "SELECT telefone_cifrado, telefone_indice FROM usuarios WHERE id = $1",
      [provider.id],
    );
    expect(row.telefone_cifrado).toMatch(/^v1:/);
    expect(row.telefone_cifrado).not.toContain("912345678");
    expect(row.telefone_indice).not.toContain("912345678");

    const { data: conv } = await request("/api/v1/conversations", {
      method: "POST",
      cookie: client.cookie,
      body: { usuarioId: provider.id },
    });
    await request(`/api/v1/conversations/${conv.id}/messages`, {
      method: "POST",
      cookie: client.cookie,
      body: { texto: "mensagem secreta" },
    });
    const [msg] = await rawQuery(
      "SELECT texto_cifrado FROM mensagens WHERE conversa_id = $1",
      [conv.id],
    );
    expect(msg.texto_cifrado).not.toContain("secreta");
    const read = await request(`/api/v1/conversations/${conv.id}/messages`, {
      cookie: provider.cookie,
    });
    expect(read.data[0].texto).toBe("mensagem secreta");
  });

  test("senha é armazenada com hash scrypt", async () => {
    const user = await createUser();
    const [row] = await rawQuery(
      "SELECT senha_hash FROM usuarios WHERE id = $1",
      [user.id],
    );
    expect(row.senha_hash.startsWith("scrypt$")).toBe(true);
    expect(row.senha_hash).not.toContain(user.senha);
  });

  test("consentimento é registrado com versão no cadastro", async () => {
    const user = await createUser();
    const rows = await rawQuery(
      "SELECT documento, versao FROM consentimentos WHERE usuario_id = $1 ORDER BY documento",
      [user.id],
    );
    expect(rows.map((r) => r.documento)).toEqual([
      "politica_de_privacidade",
      "termos_de_uso",
    ]);
  });

  test("titular exporta seus dados (portabilidade)", async () => {
    const user = await createUser();
    const response = await request("/api/v1/users/me/export", {
      cookie: user.cookie,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.data.titular.email).toBe(user.email);
    expect(response.data.consentimentos).toHaveLength(2);
  });

  test("titular corrige seus dados", async () => {
    const user = await createUser();
    const updated = await request("/api/v1/users/me", {
      method: "PATCH",
      cookie: user.cookie,
      body: {
        nome: "Nome Corrigido",
        email: user.email,
        telefone: "11955554444",
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.data.nome).toBe("Nome Corrigido");
    expect(updated.data.telefone).toBe("11955554444");
  });

  test("exclusão de conta remove dados pessoais e encerra a sessão", async () => {
    const user = await createUser();
    const wrong = await request("/api/v1/users/me", {
      method: "DELETE",
      cookie: user.cookie,
      body: { senha: "errada", confirmacao: "EXCLUIR" },
    });
    expect(wrong.status).toBe(400);
    const deleted = await request("/api/v1/users/me", {
      method: "DELETE",
      cookie: user.cookie,
      body: { senha: user.senha, confirmacao: "EXCLUIR" },
    });
    expect(deleted.status).toBe(200);
    expect(
      (await rawQuery("SELECT 1 FROM usuarios WHERE id = $1", [user.id]))
        .length,
    ).toBe(0);
    expect(
      (await rawQuery("SELECT 1 FROM sessoes WHERE usuario_id = $1", [user.id]))
        .length,
    ).toBe(0);
    expect(
      (await request("/api/v1/users/me", { cookie: user.cookie })).status,
    ).toBe(401);
  });

  test("fotos de perfil exigem autenticação e validam o conteúdo", async () => {
    const user = await createUser();
    const fake = await request("/api/v1/users/me/avatar", {
      method: "PUT",
      cookie: user.cookie,
      body: { imagem: "data:image/png;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+" },
    });
    expect(fake.status).toBe(400);
    expect((await request(`/api/v1/avatars/${user.id}`)).status).toBe(401);
  });
});

test("rotina de retenção remove contas nunca confirmadas após 7 dias", async () => {
  const stale = await createUser({ verified: false });
  const fresh = await createUser({ verified: false });
  await query(
    "UPDATE usuarios SET criado_em = now() - interval '8 days' WHERE id = $1",
    [stale.id],
  );
  const { runMaintenance } = await import("infra/maintenance.mjs");
  await runMaintenance((sql) =>
    query(sql).then((rows) => ({ rowCount: rows.length })),
  );
  expect(
    await query("SELECT 1 FROM usuarios WHERE id = $1", [stale.id]),
  ).toHaveLength(0);
  expect(
    await query("SELECT 1 FROM usuarios WHERE id = $1", [fresh.id]),
  ).toHaveLength(1);
});
