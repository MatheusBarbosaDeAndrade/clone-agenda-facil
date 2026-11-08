import { prepare, request } from "tests/orchestrator.js";

beforeAll(prepare);

describe("GET /api/v1/status", () => {
  test("retorna 200 com o banco saudável", async () => {
    const response = await request("/api/v1/status");
    expect(response.status).toBe(200);
    expect(response.data.status).toBe("ok");
    expect(response.data.dependencies.database.status).toBe("healthy");
    expect(new Date(response.data.updated_at).toISOString()).toBe(
      response.data.updated_at,
    );
  });

  test("envia cabeçalhos de segurança", async () => {
    const response = await request("/api/v1/status");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("x-powered-by")).toBeNull();
  });

  test("rejeita métodos não permitidos", async () => {
    const response = await request("/api/v1/status", { method: "POST" });
    expect(response.status).toBe(405);
  });
});
