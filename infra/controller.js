import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "infra/errors.js";

export function injectController(handler, allowedMethods = ["GET"]) {
  return async (req, res) => {
    if (!allowedMethods.includes(req.method)) {
      res.setHeader("Allow", allowedMethods);
      return res
        .status(405)
        .json({ erro: `Método ${req.method} não permitido` });
    }

    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
          erro: error.message,
          campos: error.fields,
        });
      }

      if (
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError ||
        error instanceof ConflictError
      ) {
        return res.status(error.statusCode).json({ erro: error.message });
      }

      console.error("Erro interno do servidor:", error);
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };
}
