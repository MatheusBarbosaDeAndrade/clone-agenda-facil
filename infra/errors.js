export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message || "Dados inválidos");
    this.name = "ValidationError";
    this.statusCode = 400;
    this.fields = fields;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Recurso não encontrado") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message = "Conflito de dados") {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}
