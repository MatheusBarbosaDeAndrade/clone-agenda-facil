import { prepare, request, createUser } from "tests/orchestrator.js";

beforeAll(prepare);

async function setupProvider() {
  const provider = await createUser({ papel: "prestador" });
  const blocos = [];
  for (let dia = 0; dia < 7; dia++) {
    for (const [inicio, fim] of [
      ["08:00", "10:00"],
      ["10:00", "12:00"],
      ["14:00", "16:00"],
      ["16:00", "18:00"],
      ["18:00", "20:00"],
    ]) {
      blocos.push({ diaSemana: dia, inicio, fim });
    }
  }
  const saved = await request("/api/v1/availability", {
    method: "PUT",
    cookie: provider.cookie,
    body: { blocos },
  });
  expect(saved.status).toBe(200);
  return provider;
}

async function firstFreeSlot(providerId, cookie) {
  const { data } = await request(
    `/api/v1/providers/${providerId}/slots?dias=7`,
    { cookie },
  );
  const [dia, horas] = Object.entries(data.horarios).find(
    ([, list]) => list.length > 0,
  );
  return { data: dia, hora: horas[0] };
}

describe("Agendamentos", () => {
  test("cliente agenda, horário some da lista e não pode ser reservado duas vezes", async () => {
    const provider = await setupProvider();
    const client = await createUser();
    const other = await createUser();
    const slot = await firstFreeSlot(provider.id, client.cookie);

    const booked = await request("/api/v1/appointments", {
      method: "POST",
      cookie: client.cookie,
      body: { prestadorId: provider.id, ...slot },
    });
    expect(booked.status).toBe(201);
    expect(booked.data.status).toBe("pendente");

    const again = await request("/api/v1/appointments", {
      method: "POST",
      cookie: other.cookie,
      body: { prestadorId: provider.id, ...slot },
    });
    expect(again.status).toBe(409);

    const { data } = await request(
      `/api/v1/providers/${provider.id}/slots?de=${slot.data}&dias=1`,
      { cookie: client.cookie },
    );
    expect(data.horarios[slot.data]).not.toContain(slot.hora);
  });

  test("reservas simultâneas do mesmo horário: apenas uma é aceita", async () => {
    const provider = await setupProvider();
    const clients = await Promise.all([
      createUser(),
      createUser(),
      createUser(),
    ]);
    const slot = await firstFreeSlot(provider.id, clients[0].cookie);
    const results = await Promise.all(
      clients.map((c) =>
        request("/api/v1/appointments", {
          method: "POST",
          cookie: c.cookie,
          body: { prestadorId: provider.id, ...slot },
        }),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
  });

  test("somente o dono vê o agendamento e o telefone do cliente só aparece para o prestador", async () => {
    const provider = await setupProvider();
    const client = await createUser();
    const intruder = await createUser();
    const slot = await firstFreeSlot(provider.id, client.cookie);
    const { data: created } = await request("/api/v1/appointments", {
      method: "POST",
      cookie: client.cookie,
      body: { prestadorId: provider.id, ...slot },
    });

    expect(
      (
        await request(`/api/v1/appointments/${created.id}`, {
          cookie: intruder.cookie,
        })
      ).status,
    ).toBe(404);
    const asProvider = await request(`/api/v1/appointments/${created.id}`, {
      cookie: provider.cookie,
    });
    expect(asProvider.data.cliente.telefone).toBeDefined();
    const asClient = await request(`/api/v1/appointments/${created.id}`, {
      cookie: client.cookie,
    });
    expect(asClient.data.cliente.telefone).toBeUndefined();
  });

  test("regras de status: cliente só cancela; prestador confirma", async () => {
    const provider = await setupProvider();
    const client = await createUser();
    const slot = await firstFreeSlot(provider.id, client.cookie);
    const { data: created } = await request("/api/v1/appointments", {
      method: "POST",
      cookie: client.cookie,
      body: { prestadorId: provider.id, ...slot },
    });

    const forbidden = await request(
      `/api/v1/appointments/${created.id}/status`,
      {
        method: "PATCH",
        cookie: client.cookie,
        body: { status: "confirmado" },
      },
    );
    expect(forbidden.status).toBe(403);
    const confirmed = await request(
      `/api/v1/appointments/${created.id}/status`,
      {
        method: "PATCH",
        cookie: provider.cookie,
        body: { status: "confirmado" },
      },
    );
    expect(confirmed.data.status).toBe("confirmado");
    const early = await request(`/api/v1/appointments/${created.id}/status`, {
      method: "PATCH",
      cookie: provider.cookie,
      body: { status: "concluido" },
    });
    expect(early.status).toBe(400);
    const cancelled = await request(
      `/api/v1/appointments/${created.id}/status`,
      { method: "PATCH", cookie: client.cookie, body: { status: "cancelado" } },
    );
    expect(cancelled.data.status).toBe("cancelado");
  });

  test("cliente não acessa rotas de prestador", async () => {
    const client = await createUser();
    expect(
      (await request("/api/v1/availability", { cookie: client.cookie })).status,
    ).toBe(403);
    expect(
      (
        await request("/api/v1/notices", {
          method: "POST",
          cookie: client.cookie,
          body: { titulo: "x", texto: "y" },
        })
      ).status,
    ).toBe(403);
  });
});
