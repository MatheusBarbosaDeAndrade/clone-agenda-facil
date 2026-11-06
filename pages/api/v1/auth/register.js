import { z } from "zod";
import { injectController } from "infra/controller.js";
import { hashPassword, signToken, setAuthCookie } from "infra/auth.js";
import { findByEmail, findByPhone, createUser } from "models/user.js";
import { createProvider } from "models/provider.js";
import { createDefaultAvailability } from "models/availability.js";
import { ValidationError, ConflictError } from "infra/errors.js";

const registerSchema = z.object({
  papel: z.enum(["cliente", "prestador"]),
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  local: z.string().optional(),
  especialidade: z.string().optional(),
});

async function handler(req, res) {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const fields = {};
    for (const issue of parseResult.error.issues) {
      fields[issue.path[0]] = issue.message;
    }
    throw new ValidationError("Dados de cadastro inválidos", fields);
  }

  const data = parseResult.data;

  if (data.papel === "prestador") {
    if (!data.local || !data.especialidade) {
      throw new ValidationError(
        "Local e especialidade são obrigatórios para prestador",
        {
          local: !data.local ? "Campo obrigatório" : undefined,
          especialidade: !data.especialidade ? "Campo obrigatório" : undefined,
        },
      );
    }
  }

  const existingEmail = await findByEmail(data.email);
  if (existingEmail) {
    throw new ConflictError("E-mail já cadastrado");
  }

  const existingPhone = await findByPhone(data.telefone);
  if (existingPhone) {
    throw new ConflictError("Telefone já cadastrado");
  }

  const senhaHash = await hashPassword(data.senha);
  const user = await createUser({
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    senhaHash,
    papel: data.papel,
  });

  let provider = null;
  if (data.papel === "prestador") {
    provider = await createProvider({
      usuarioId: user.id,
      especialidade: data.especialidade,
      categoria: data.especialidade,
      local: data.local,
    });

    await createDefaultAvailability(provider.id);
  }

  const token = await signToken({
    id: user.id,
    papel: user.papel,
    nome: user.nome,
    email: user.email,
  });

  setAuthCookie(res, token, true);

  return res.status(201).json({
    usuario: user,
    prestador: provider,
  });
}

export default injectController(handler, ["POST"]);
