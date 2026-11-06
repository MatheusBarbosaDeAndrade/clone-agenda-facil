const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5433),
  user: process.env.POSTGRES_USER || "postgres",
  database: process.env.POSTGRES_DB || "agenda_facil_development",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("A popular a base de dados (Seed)...");

    const hash = await bcrypt.hash("123456", 10);

    const mariaUser = await client.query(
      `INSERT INTO usuarios (nome, email, telefone, senha_hash, papel)
       VALUES ('Maria Silva', 'maria@demo.com', '91999998888', $1, 'prestador')
       RETURNING id`,
      [hash],
    );
    const mariaId = mariaUser.rows[0].id;

    const mariaProvider = await client.query(
      `INSERT INTO prestadores (usuario_id, especialidade, categoria, local, bio)
       VALUES ($1, 'Consultoria de Negócios', 'Consultoria', 'Belém, PA', 'Especialista em organização de processos e crescimento sustentável.')
       RETURNING id`,
      [mariaId],
    );
    const mariaProviderId = mariaProvider.rows[0].id;

    const joaoUser = await client.query(
      `INSERT INTO usuarios (nome, email, telefone, senha_hash, papel)
       VALUES ('João Silva', 'joao@demo.com', '91988887777', $1, 'cliente')
       RETURNING id`,
      [hash],
    );
    const joaoId = joaoUser.rows[0].id;

    const anaUser = await client.query(
      `INSERT INTO usuarios (nome, email, telefone, senha_hash, papel)
       VALUES ('Dra. Ana Paula', 'ana@demo.com', '91977776666', $1, 'prestador')
       RETURNING id`,
      [hash],
    );
    const anaProvider = await client.query(
      `INSERT INTO prestadores (usuario_id, especialidade, categoria, local, bio)
       VALUES ($1, 'Psicologia Clínica', 'Psicologia', 'Belém, Pará, Brasil', 'Atendimento focado em terapia cognitivo-comportamental.')
       RETURNING id`,
      [anaUser.rows[0].id],
    );

    await client.query(
      `INSERT INTO agendamentos (prestador_id, cliente_id, servico, data, hora, status)
       VALUES ($1, $2, 'Consultoria de Negócios', CURRENT_DATE, '08:00', 'confirmado')`,
      [mariaProviderId, joaoId],
    );

    await client.query(
      `INSERT INTO agendamentos (prestador_id, cliente_id, servico, data, hora, status)
       VALUES ($1, $2, 'Consulta de Psicologia', CURRENT_DATE, '10:00', 'pendente')`,
      [anaProvider.rows[0].id, joaoId],
    );

    console.log("Seed concluído com sucesso!");
  } catch (err) {
    console.error("Erro ao executar Seed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
