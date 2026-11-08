export class ApiError extends Error {
  constructor(body, status) {
    super(body?.message || "Não foi possível concluir a ação.");
    this.status = status;
    this.action = body?.action;
    this.fields = body?.fields || {};
  }
}

/** fetch para a API interna: JSON, cookies de sessão e erros padronizados. */
export async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      { message: "Sem conexão com o servidor. Verifique sua internet." },
      0,
    );
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (
      response.status === 403 &&
      data?.name === "EmailNotVerifiedError" &&
      typeof window !== "undefined"
    ) {
      window.location.href = "/confirmar-email";
    }
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !path.startsWith("/api/v1/auth/")
    ) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(data, response.status);
  }
  return data;
}
