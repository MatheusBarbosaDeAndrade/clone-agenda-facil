class AppError extends Error {
  constructor({ name, message, action, statusCode, cause, fields }) {
    super(message, { cause });
    this.name = name;
    this.action = action;
    this.statusCode = statusCode;
    this.fields = fields;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

export class ValidationError extends AppError {
  constructor({ message, action, fields } = {}) {
    super({
      name: "ValidationError",
      message: message || "Os dados enviados são inválidos.",
      action: action || "Revise os campos destacados e tente novamente.",
      statusCode: 400,
      fields,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor({ message, action } = {}) {
    super({
      name: "UnauthorizedError",
      message: message || "Você precisa estar autenticado.",
      action: action || "Faça login para continuar.",
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor({ message, action } = {}) {
    super({
      name: "ForbiddenError",
      message: message || "Você não tem permissão para esta ação.",
      action: action || "Verifique se está usando a conta correta.",
      statusCode: 403,
    });
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super({
      name: "EmailNotVerifiedError",
      message: "Confirme seu e-mail para continuar.",
      action: "Clique no link que enviamos para o seu e-mail.",
      statusCode: 403,
    });
  }
}

export class NotFoundError extends AppError {
  constructor({ message, action } = {}) {
    super({
      name: "NotFoundError",
      message: message || "Recurso não encontrado.",
      action: action || "Verifique se o endereço está correto.",
      statusCode: 404,
    });
  }
}

export class ConflictError extends AppError {
  constructor({ message, action, fields } = {}) {
    super({
      name: "ConflictError",
      message: message || "Conflito com dados existentes.",
      action: action || "Revise os dados e tente novamente.",
      statusCode: 409,
      fields,
    });
  }
}

export class MethodNotAllowedError extends AppError {
  constructor() {
    super({
      name: "MethodNotAllowedError",
      message: "Método não permitido para este endpoint.",
      action: "Verifique o método HTTP utilizado.",
      statusCode: 405,
    });
  }
}

export class TooManyRequestsError extends AppError {
  constructor({ retryAfter } = {}) {
    super({
      name: "TooManyRequestsError",
      message: "Muitas tentativas em pouco tempo.",
      action: "Aguarde alguns minutos e tente novamente.",
      statusCode: 429,
    });
    this.retryAfter = retryAfter;
  }
}

export class ServiceError extends AppError {
  constructor({ message, cause } = {}) {
    super({
      name: "ServiceError",
      message: message || "Serviço indisponível no momento.",
      action: "Tente novamente em instantes.",
      statusCode: 503,
      cause,
    });
  }
}

export class InternalServerError extends AppError {
  constructor({ cause } = {}) {
    super({
      name: "InternalServerError",
      message: "Ocorreu um erro inesperado.",
      action: "Tente novamente. Se persistir, contate o suporte.",
      statusCode: 500,
      cause,
    });
  }
}
