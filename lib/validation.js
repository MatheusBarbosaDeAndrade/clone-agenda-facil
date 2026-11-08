import { z } from "zod";
import { SERVICE_DURATIONS, NOTICE_COLORS } from "lib/constants.js";

export const nameSchema = z
  .string({ error: "Informe o nome." })
  .trim()
  .min(3, "O nome deve ter pelo menos 3 caracteres.")
  .max(120, "O nome deve ter no máximo 120 caracteres.");

export const emailSchema = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .max(254, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

export function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    digits = digits.slice(2);
  }
  return digits;
}

export const phoneSchema = z
  .string({ error: "Informe o telefone." })
  .transform(normalizePhone)
  .refine(
    (d) => /^[1-9]{2}9?\d{8}$/.test(d),
    "Informe um telefone válido com DDD.",
  );

export const passwordSchema = z
  .string({ error: "Informe a senha." })
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .refine(
    (v) => /[A-Za-z]/.test(v) && /\d/.test(v),
    "Use letras e números na senha.",
  );

export const providerFieldsSchema = z.object({
  local: z
    .string({ error: "Informe o local." })
    .trim()
    .min(3, "Informe o local de atendimento.")
    .max(200),
  especialidade: z
    .string({ error: "Informe o tipo de serviço." })
    .trim()
    .min(3, "Informe o tipo de serviço.")
    .max(120),
});

const consentSchema = z.literal(true, {
  error: "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
});

const baseRegister = {
  nome: nameSchema,
  telefone: phoneSchema,
  email: emailSchema,
  senha: passwordSchema,
  aceiteTermos: consentSchema,
};

export const registerSchema = z.discriminatedUnion("papel", [
  z.object({ papel: z.literal("cliente"), ...baseRegister }),
  z.object({
    papel: z.literal("prestador"),
    ...baseRegister,
    ...providerFieldsSchema.shape,
  }),
]);

export const googleCompleteSchema = z.discriminatedUnion("papel", [
  z.object({
    papel: z.literal("cliente"),
    telefone: phoneSchema,
    aceiteTermos: consentSchema,
  }),
  z.object({
    papel: z.literal("prestador"),
    telefone: phoneSchema,
    aceiteTermos: consentSchema,
    ...providerFieldsSchema.shape,
  }),
]);

export const loginSchema = z.object({
  identificador: z
    .string({ error: "Informe seu e-mail ou telefone." })
    .trim()
    .min(3, "Informe seu e-mail ou telefone.")
    .max(254),
  senha: z
    .string({ error: "Informe a senha." })
    .min(1, "Informe a senha.")
    .max(128),
  lembrar: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  senha: passwordSchema,
});

export const profileUpdateSchema = z.object({
  nome: nameSchema,
  telefone: phoneSchema,
  email: emailSchema,
});

export const providerProfileSchema = z.object({
  ...providerFieldsSchema.shape,
  bio: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .default(""),
  duracaoMinutos: z.coerce
    .number()
    .refine((v) => SERVICE_DURATIONS.includes(v), "Duração inválida."),
});

export const changePasswordSchema = z.object({
  senhaAtual: z.string().max(128).optional().default(""),
  novaSenha: passwordSchema,
});

export const availabilitySchema = z.object({
  blocos: z
    .array(
      z.object({
        diaSemana: z.number().int().min(0).max(6),
        inicio: z.string().regex(/^\d{2}:\d{2}$/),
        fim: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(7 * 24),
});

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const bookingSchema = z.object({
  prestadorId: z.uuid("Prestador inválido."),
  data: isoDateSchema,
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
});

export const noticeSchema = z.object({
  titulo: z
    .string({ error: "Informe o título." })
    .trim()
    .min(3, "Informe o título.")
    .max(120),
  texto: z
    .string({ error: "Informe a mensagem." })
    .trim()
    .min(3, "Escreva a mensagem do aviso.")
    .max(2000),
  cor: z.enum(Object.keys(NOTICE_COLORS)).default("azul"),
});

export const messageSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem.")
    .max(2000, "Mensagem muito longa."),
});

export const deleteAccountSchema = z.object({
  senha: z.string().max(128).optional().default(""),
  confirmacao: z.literal("EXCLUIR", {
    error: 'Digite "EXCLUIR" para confirmar.',
  }),
});
