export async function apiFetch(endpoint, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`/api/v1${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !endpoint.startsWith("/auth/")
    ) {
      window.location.href = "/login";
    }
    const error = new Error(data.erro || "Erro na requisição");
    error.status = response.status;
    error.fields = data.campos;
    throw error;
  }

  return data;
}
