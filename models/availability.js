import database from "infra/database.js";

export async function getAvailabilityByProviderId(providerId) {
  const result = await database.query(
    `SELECT * FROM disponibilidades
     WHERE prestador_id = $1
     ORDER BY dia_semana ASC, inicio ASC`,
    [providerId],
  );
  return result.rows;
}

export async function setAvailability(providerId, items) {
  return await database.withTransaction(async (client) => {
    await client.query(`DELETE FROM disponibilidades WHERE prestador_id = $1`, [
      providerId,
    ]);

    for (const item of items) {
      await client.query(
        `INSERT INTO disponibilidades (prestador_id, dia_semana, inicio, fim, ativo)
         VALUES ($1, $2, $3, $4, $5)`,
        [providerId, item.dia_semana, item.inicio, item.fim, item.ativo],
      );
    }

    const updated = await client.query(
      `SELECT * FROM disponibilidades WHERE prestador_id = $1 ORDER BY dia_semana ASC, inicio ASC`,
      [providerId],
    );
    return updated.rows;
  });
}

export async function createDefaultAvailability(providerId) {
  const defaultBlocks = [
    { dia_semana: 1, inicio: "08:00", fim: "10:00", ativo: true },
    { dia_semana: 1, inicio: "10:00", fim: "12:00", ativo: true },
    { dia_semana: 1, inicio: "14:00", fim: "16:00", ativo: true },
    { dia_semana: 1, inicio: "16:00", fim: "18:00", ativo: true },
    { dia_semana: 2, inicio: "08:00", fim: "10:00", ativo: true },
    { dia_semana: 2, inicio: "10:00", fim: "12:00", ativo: true },
    { dia_semana: 2, inicio: "14:00", fim: "16:00", ativo: true },
    { dia_semana: 2, inicio: "16:00", fim: "18:00", ativo: true },
    { dia_semana: 3, inicio: "08:00", fim: "10:00", ativo: true },
    { dia_semana: 3, inicio: "10:00", fim: "12:00", ativo: true },
    { dia_semana: 3, inicio: "14:00", fim: "16:00", ativo: true },
    { dia_semana: 3, inicio: "16:00", fim: "18:00", ativo: true },
    { dia_semana: 4, inicio: "08:00", fim: "10:00", ativo: true },
    { dia_semana: 4, inicio: "10:00", fim: "12:00", ativo: true },
    { dia_semana: 4, inicio: "14:00", fim: "16:00", ativo: true },
    { dia_semana: 4, inicio: "16:00", fim: "18:00", ativo: true },
    { dia_semana: 5, inicio: "08:00", fim: "10:00", ativo: true },
    { dia_semana: 5, inicio: "10:00", fim: "12:00", ativo: true },
    { dia_semana: 5, inicio: "14:00", fim: "16:00", ativo: true },
    { dia_semana: 5, inicio: "16:00", fim: "18:00", ativo: true },
    { dia_semana: 0, inicio: "08:00", fim: "10:00", ativo: false },
    { dia_semana: 6, inicio: "08:00", fim: "10:00", ativo: false },
  ];

  await setAvailability(providerId, defaultBlocks);
}
