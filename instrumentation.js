export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const onVercel = process.env.VERCEL === "1";

  if (process.env.NODE_ENV === "production") {
    const missing = ["DATA_ENCRYPTION_KEY"].filter((key) => !process.env[key]);
    if (!process.env.APP_URL && !onVercel) missing.push("APP_URL");
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_HOST) {
      missing.push("DATABASE_URL");
    }
    if (missing.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`,
      );
    }
    if (process.env.APP_URL && !process.env.APP_URL.startsWith("https://")) {
      console.warn(
        "[startup] APP_URL não usa HTTPS — cookies seguros ficarão desativados.",
      );
    }
    if (!process.env.SMTP_HOST) {
      console.warn(
        "[startup] SMTP_HOST não configurado — e-mails de recuperação não serão enviados.",
      );
    }
  }

  // Em serverless (Vercel) não há processo contínuo: a retenção de dados roda
  // pelo Vercel Cron em /api/v1/cron/maintenance (ver vercel.json).
  if (onVercel) return;

  const { default: database } = await import("infra/database.js");
  const { runMaintenance } = await import("infra/maintenance.mjs");
  const run = () =>
    runMaintenance((sql) => database.query(sql)).catch((error) =>
      console.error("[maintenance] falhou:", error.message),
    );
  setTimeout(run, 30_000).unref?.();
  setInterval(run, 60 * 60 * 1000).unref?.();
}
