import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
import { TIME_BLOCKS, TIMEZONE, BOOKING_WINDOW_DAYS } from "lib/constants.js";
import { addDays, todayISO } from "lib/format.js";

async function listBlocks(prestadorId) {
  const result = await database.query(
    `SELECT dia_semana, to_char(inicio, 'HH24:MI') AS inicio, to_char(fim, 'HH24:MI') AS fim
     FROM disponibilidades WHERE prestador_id = $1 ORDER BY dia_semana, inicio`,
    [prestadorId],
  );
  return result.rows.map((r) => ({
    diaSemana: r.dia_semana,
    inicio: r.inicio,
    fim: r.fim,
  }));
}

async function replaceBlocks(prestadorId, blocos) {
  const allowed = new Set(TIME_BLOCKS.map((b) => `${b.inicio}-${b.fim}`));
  const unique = new Map();
  for (const bloco of blocos) {
    const key = `${bloco.inicio}-${bloco.fim}`;
    if (!allowed.has(key)) {
      throw new ValidationError({
        message: `Bloco de horário inválido: ${key}.`,
      });
    }
    unique.set(`${bloco.diaSemana}|${key}`, bloco);
  }
  await database.transaction(async (tx) => {
    await tx.query("DELETE FROM disponibilidades WHERE prestador_id = $1", [
      prestadorId,
    ]);
    for (const bloco of unique.values()) {
      await tx.query(
        "INSERT INTO disponibilidades (prestador_id, dia_semana, inicio, fim) VALUES ($1, $2, $3, $4)",
        [prestadorId, bloco.diaSemana, bloco.inicio, bloco.fim],
      );
    }
  });
}

/**
 * Horários livres por dia, calculados no Postgres no fuso da aplicação:
 * - divide cada bloco ativo em intervalos com a duração do atendimento;
 * - remove horários passados e os que conflitam com agendamentos ativos.
 * Retorna { 'YYYY-MM-DD': ['09:00', ...] }.
 */
async function freeSlots(prestadorId, fromISO, days, client = database) {
  const today = todayISO();
  const maxDate = addDays(today, BOOKING_WINDOW_DAYS);
  const result = await client.query(
    `WITH cfg AS (
       SELECT make_interval(mins => duracao_minutos) AS dur FROM prestadores WHERE usuario_id = $1
     ),
     dias AS (
       SELECT d::date AS dia FROM generate_series($2::date, $2::date + ($3::int - 1), interval '1 day') d
       WHERE d::date BETWEEN $5::date AND $6::date
     ),
     candidatos AS (
       SELECT dias.dia, s AS local_ts, (s AT TIME ZONE $4) AS ini, ((s + cfg.dur) AT TIME ZONE $4) AS fim
       FROM dias
       JOIN disponibilidades b ON b.prestador_id = $1 AND b.dia_semana = extract(dow FROM dias.dia)
       CROSS JOIN cfg
       CROSS JOIN LATERAL generate_series(dias.dia + b.inicio, dias.dia + b.fim - cfg.dur, cfg.dur) s
     )
     SELECT to_char(c.dia, 'YYYY-MM-DD') AS dia, to_char(c.local_ts, 'HH24:MI') AS hora
     FROM candidatos c
     WHERE c.ini > now() + interval '15 minutes'
       AND NOT EXISTS (
         SELECT 1 FROM agendamentos a
         WHERE a.prestador_id = $1 AND a.status IN ('pendente', 'confirmado')
           AND a.inicio < c.fim AND a.fim > c.ini)
     ORDER BY c.local_ts`,
    [prestadorId, fromISO, days, TIMEZONE, today, maxDate],
  );
  const map = {};
  for (let i = 0; i < days; i++) map[addDays(fromISO, i)] = [];
  for (const row of result.rows) {
    if (map[row.dia]) map[row.dia].push(row.hora);
  }
  return map;
}

const availability = { listBlocks, replaceBlocks, freeSlots };
export default availability;
