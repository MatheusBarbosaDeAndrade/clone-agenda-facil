import { Pool } from "pg";
import { ServiceError } from "infra/errors.js";
import { getConnectionConfig } from "infra/db-config.mjs";

// Reaproveita o pool entre recarregamentos do Next em desenvolvimento.
const globalForDb = globalThis;

function getPool() {
  if (!globalForDb.__agendaFacilPool) {
    globalForDb.__agendaFacilPool = new Pool({
      ...getConnectionConfig(),
      // Em serverless (Vercel) cada instância deve abrir poucas conexões.
      max: Number(
        process.env.POSTGRES_POOL_MAX || (process.env.VERCEL === "1" ? 3 : 10),
      ),
      idleTimeoutMillis: process.env.VERCEL === "1" ? 5_000 : 30_000,
      connectionTimeoutMillis: 5_000,
    });
    globalForDb.__agendaFacilPool.on("error", (error) => {
      console.error("[database] erro inesperado no pool:", error.message);
    });
  }
  return globalForDb.__agendaFacilPool;
}

async function query(queryObject, values) {
  try {
    return await getPool().query(queryObject, values);
  } catch (error) {
    throw wrapError(error);
  }
}

async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback({
      query: (text, values) => client.query(text, values),
    });
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw wrapError(error);
  } finally {
    client.release();
  }
}

function wrapError(error) {
  // Erros de negócio já tratados passam direto; erros do driver viram
  // ServiceError, preservando o código do Postgres para tratamento específico.
  if (error && error.statusCode) return error;
  const wrapped = new ServiceError({
    message: "Erro na conexão com o banco de dados.",
    cause: error,
  });
  wrapped.pgCode = error?.code;
  wrapped.constraint = error?.constraint;
  return wrapped;
}

const database = { query, transaction, getPool };

export default database;
