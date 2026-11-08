import { normalizePhone, registerSchema } from "lib/validation.js";
import { formatPhone, maskPhone, addDays } from "lib/format.js";

describe("validação e formatação", () => {
  test("normaliza telefones brasileiros", () => {
    expect(normalizePhone("(11) 99999-8888")).toBe("11999998888");
    expect(normalizePhone("+55 11 99999-8888")).toBe("11999998888");
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
    expect(maskPhone("1199999")).toBe("(11) 9999-9");
  });

  test("cadastro de prestador exige local e tipo de serviço", () => {
    const base = {
      nome: "Maria Silva",
      telefone: "11999998888",
      email: "m@x.com",
      senha: "senha1234",
      aceiteTermos: true,
    };
    expect(
      registerSchema.safeParse({ papel: "cliente", ...base }).success,
    ).toBe(true);
    const provider = registerSchema.safeParse({ papel: "prestador", ...base });
    expect(provider.success).toBe(false);
    expect(
      registerSchema.safeParse({
        papel: "prestador",
        ...base,
        local: "Rua A, 1",
        especialidade: "Mecânico",
      }).success,
    ).toBe(true);
  });

  test("rejeita papel inválido (ex.: tentativa de virar admin)", () => {
    expect(registerSchema.safeParse({ papel: "admin" }).success).toBe(false);
  });

  test("soma dias em datas de calendário", () => {
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
  });
});
