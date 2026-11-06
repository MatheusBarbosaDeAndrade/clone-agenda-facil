exports.up = (pgm) => {
  pgm.createType("papel", ["cliente", "prestador"]);
  pgm.createType("status_agendamento", [
    "pendente",
    "confirmado",
    "concluido",
    "cancelado",
    "nao_compareceu",
  ]);

  pgm.createTable("usuarios", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    papel: { type: "papel", notNull: true },
    nome: { type: "varchar(120)", notNull: true },
    email: { type: "varchar(254)", notNull: true },
    telefone: { type: "varchar(20)", notNull: true },
    senha_hash: { type: "text", notNull: true },
    avatar_url: { type: "text" },
    criado_em: { type: "timestamptz", default: pgm.func("now()") },
    atualizado_em: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createIndex("usuarios", "lower(email)", {
    name: "idx_usuarios_email_unique",
    unique: true,
  });
  pgm.createIndex("usuarios", "telefone", { name: "idx_usuarios_telefone" });

  pgm.createTable("prestadores", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    usuario_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: '"usuarios"',
      onDelete: "CASCADE",
    },
    especialidade: { type: "varchar(120)", notNull: true },
    categoria: { type: "varchar(60)", notNull: true },
    bio: { type: "text", default: "" },
    local: { type: "varchar(160)", notNull: true },
    avaliacao: { type: "numeric(2,1)", default: 5.0 },
  });

  pgm.createTable("disponibilidades", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    prestador_id: {
      type: "uuid",
      notNull: true,
      references: '"prestadores"',
      onDelete: "CASCADE",
    },
    dia_semana: { type: "smallint", notNull: true },
    inicio: { type: "time", notNull: true },
    fim: { type: "time", notNull: true },
    ativo: { type: "boolean", default: false },
  });

  pgm.addConstraint(
    "disponibilidades",
    "check_dia_semana",
    "CHECK (dia_semana BETWEEN 0 AND 6)",
  );
  pgm.createIndex(
    "disponibilidades",
    ["prestador_id", "dia_semana", "inicio"],
    {
      name: "idx_disponibilidades_unique",
      unique: true,
    },
  );

  pgm.createTable("agendamentos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    prestador_id: { type: "uuid", notNull: true, references: '"prestadores"' },
    cliente_id: { type: "uuid", notNull: true, references: '"usuarios"' },
    servico: { type: "varchar(160)", notNull: true },
    data: { type: "date", notNull: true },
    hora: { type: "time", notNull: true },
    status: { type: "status_agendamento", default: "pendente" },
    criado_em: { type: "timestamptz", default: pgm.func("now()") },
    atualizado_em: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createIndex("agendamentos", ["prestador_id", "data", "hora"], {
    name: "idx_agendamentos_anti_duplicidade",
    unique: true,
    where: "status IN ('pendente', 'confirmado')",
  });

  pgm.createTable("avisos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    prestador_id: {
      type: "uuid",
      notNull: true,
      references: '"prestadores"',
      onDelete: "CASCADE",
    },
    titulo: { type: "varchar(120)", notNull: true },
    texto: { type: "text", notNull: true },
    cor: { type: "varchar(10)", default: "azul" },
    criado_em: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createTable("conversas", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    cliente_id: { type: "uuid", notNull: true, references: '"usuarios"' },
    prestador_id: { type: "uuid", notNull: true, references: '"prestadores"' },
    criado_em: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createIndex("conversas", ["cliente_id", "prestador_id"], {
    name: "idx_conversas_unique",
    unique: true,
  });

  pgm.createTable("mensagens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    conversa_id: {
      type: "uuid",
      notNull: true,
      references: '"conversas"',
      onDelete: "CASCADE",
    },
    autor_id: { type: "uuid", notNull: true, references: '"usuarios"' },
    texto: { type: "text", notNull: true },
    lida: { type: "boolean", default: false },
    enviada_em: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createIndex("mensagens", ["conversa_id", "enviada_em"]);

  pgm.createTable("reset_senha_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: '"usuarios"',
      onDelete: "CASCADE",
    },
    token_hash: { type: "text", notNull: true },
    expira_em: { type: "timestamptz", notNull: true },
    usado: { type: "boolean", default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("reset_senha_tokens");
  pgm.dropTable("mensagens");
  pgm.dropTable("conversas");
  pgm.dropTable("avisos");
  pgm.dropTable("agendamentos");
  pgm.dropTable("disponibilidades");
  pgm.dropTable("prestadores");
  pgm.dropTable("usuarios");
  pgm.dropType("status_agendamento");
  pgm.dropType("papel");
};
