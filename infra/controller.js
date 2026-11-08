import { ZodError } from "zod";
import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors.js";
import { getAllowedOrigins } from "infra/request.js";
import session from "models/session.js";
import user from "models/user.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Proteção contra CSRF (defesa em profundidade, além do cookie SameSite=Lax):
 * requisições que alteram estado devem vir da própria origem e em JSON.
 */
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    const allowed = getAllowedOrigins();
    if (process.env.NODE_ENV !== "production" && req.headers.host) {
      allowed.add(`http://${req.headers.host}`);
    }
    if (!allowed.has(origin)) {
      throw new ForbiddenError({
        message: "Origem da requisição não permitida.",
      });
    }
  }
  const contentLength = Number(req.headers["content-length"] || 0);
  const contentType = String(req.headers["content-type"] || "");
  if (contentLength > 0 && !contentType.startsWith("application/json")) {
    throw new ValidationError({ message: "Envie os dados no formato JSON." });
  }
}

export function handleError(error, res) {
  if (error instanceof ZodError) {
    const fields = {};
    for (const issue of error.issues) {
      const key = issue.path[0] ?? "geral";
      if (!fields[key]) fields[key] = issue.message;
    }
    const validation = new ValidationError({
      message: Object.values(fields)[0] || undefined,
      fields,
    });
    return res.status(400).json(validation);
  }
  if (error?.statusCode && typeof error.toJSON === "function") {
    if (error.statusCode >= 500) {
      console.error(
        `[api] ${error.name}:`,
        error.cause?.message || error.message,
      );
    }
    if (error.retryAfter)
      res.setHeader("Retry-After", String(error.retryAfter));
    return res.status(error.statusCode).json(error);
  }
  console.error("[api] erro inesperado:", error);
  return res.status(500).json(new InternalServerError({ cause: error }));
}

/**
 * Cria um handler de API com roteamento por método.
 *   export default createHandler({ GET: async (req, res, ctx) => {...} })
 */
export function createHandler(handlers) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const method = req.method === "HEAD" ? "GET" : req.method;
    const fn = handlers[method];
    try {
      if (!fn) {
        res.setHeader("Allow", Object.keys(handlers).join(", "));
        throw new MethodNotAllowedError();
      }
      if (!SAFE_METHODS.has(method)) assertSameOrigin(req);
      await fn(req, res);
    } catch (error) {
      handleError(error, res);
    }
  };
}

/** Exige sessão válida; opcionalmente restringe por papel. */
export async function requireUser(req, papel) {
  const current = await session.findValid(req);
  if (!current) throw new UnauthorizedError();
  const found = await user.findById(current.usuarioId);
  if (!found) throw new UnauthorizedError();
  if (papel && found.papel !== papel) throw new ForbiddenError();
  user.touchLastAccess(found.id).catch(() => {});
  return { user: found, sessaoId: current.sessaoId };
}
