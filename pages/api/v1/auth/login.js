import { z } from "zod";
import { injectController } from "infra/controller.js";
import { verifyPassword, signToken, setAuthCookie } from "infra/auth.js";
import { findByEmail, findByPhone } from "models/user.js";
import { findByUserId } from "models/provider.js";
import { UnauthorizedError, ValidationError } from "infra/errors.js";

const loginSchema = z.object({
  identificador: z.string().min(1, "Preencha o e-mail ou telefone"),
  senha: z.string().min(1, "Preencha a senha"),
  lembrar: z.boolean().optional().default(true),
});

async function handler(req, res) {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new ValidationError("Credenciais inválidas");
  }

  const { identificador, senha, lembrar } = parseResult.data;

  let user = await findByEmail(identificador);
  if (!user) {
    user = await findByPhone(identificador);
  }

  if (!user) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  const isValid = await verifyPassword(senha, user.senha_hash);
  if (!isValid) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  const token = await signToken({
    id: user.id,
    papel: user.papel,
    nome: user.nome,
    email: user.email,
  });

  setAuthCookie(res, token, lembrar);

  let provider = null;
  if (user.papel === "prestador") {
    provider = await findByUserId(user.id);
  }

  delete user.senha_hash;

  return res.status(200).json({
    usuario: user,
    prestador: provider,
  });
}

export default injectController(handler, ["POST"]);
