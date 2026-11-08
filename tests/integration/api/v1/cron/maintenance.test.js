import { prepare, request } from "tests/orchestrator.js";

beforeAll(prepare);

test("rotina de manutenção exige o segredo do cron", async () => {
  expect((await request("/api/v1/cron/maintenance")).status).toBe(401);
  const wrong = await request("/api/v1/cron/maintenance", {
    headers: { Authorization: "Bearer qualquer-coisa" },
  });
  expect(wrong.status).toBe(401);
});
