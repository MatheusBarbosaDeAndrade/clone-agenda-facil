import {
  encrypt,
  decrypt,
  blindIndex,
  hashPassword,
  verifyPassword,
  hashToken,
} from "infra/crypto.js";

describe("infra/crypto", () => {
  test("criptografa e descriptografa com IV aleatório", () => {
    const a = encrypt("11999998888");
    const b = encrypt("11999998888");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("11999998888");
  });

  test("detecta adulteração do texto cifrado (GCM)", () => {
    const value = encrypt("dado sensível");
    const parts = value.split(":");
    parts[3] = Buffer.from("adulterado").toString("base64url");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  test("índice cego é determinístico e não revela o valor", () => {
    expect(blindIndex("phone:11999998888")).toBe(
      blindIndex("phone:11999998888"),
    );
    expect(blindIndex("phone:11999998888")).not.toContain("99999");
  });

  test("hash de senha verifica apenas a senha correta", async () => {
    const hash = await hashPassword("minhaSenha123");
    expect(await verifyPassword("minhaSenha123", hash)).toBe(true);
    expect(await verifyPassword("outraSenha123", hash)).toBe(false);
    expect(await verifyPassword("minhaSenha123", null)).toBe(false);
  });

  test("hash de token tem 64 caracteres hex", () => {
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
