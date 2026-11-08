/**
 * Schema inicial do AgendaFácil.
 *
 * Decisões relacionadas à LGPD / segurança:
 * - Telefone é armazenado criptografado (AES-256-GCM) + índice cego (HMAC)
 *   para permitir login por telefone sem guardar o número em claro.
 * - Mensagens do chat são armazenadas criptografadas.
 * - Sessões e tokens de recuperação são guardados apenas como hash.
 * - Ao excluir uma conta, agendamentos ficam com o titular anonimizado
 *   (ON DELETE SET NULL) para preservar o histórico da outra parte.
 */

exports.up = (pgm) => {
  pgm.createType("papel_usuario", ["cliente", "prestador"]);
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
    papel: { type: "papel_usuario", notNull: true },
    nome: { type: "varchar(120)", notNull: true },
    email: { type: "varchar(254)", notNull: true },
    telefone_cifrado: { type: "text" },
    telefone_indice: { type: "varchar(64)" },
    senha_hash: { type: "text" },
    google_sub: { type: "varchar(255)", unique: true },
    ultimo_acesso_em: { type: "timestamptz" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    atualizado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("usuarios", "lower(email)", {
    name: "usuarios_email_unico",
    unique: true,
  });
  pgm.createIndex("usuarios", "telefone_indice", {
    name: "usuarios_telefone_unico",
    unique: true,
    where: "telefone_indice IS NOT NULL",
  });

  pgm.createTable("avatares", {
    usuario_id: {
      type: "uuid",
      primaryKey: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    conteudo: { type: "bytea", notNull: true },
    mime: { type: "varchar(32)", notNull: true },
    atualizado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("prestadores", {
    usuario_id: {
      type: "uuid",
      primaryKey: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    especialidade: { type: "varchar(120)", notNull: true },
    bio: { type: "text", notNull: true, default: "" },
    local: { type: "varchar(200)", notNull: true },
    duracao_minutos: { type: "smallint", notNull: true, default: 60 },
  });
  pgm.addConstraint(
    "prestadores",
    "prestadores_duracao_valida",
    "CHECK (duracao_minutos IN (30, 45, 60, 90, 120))",
  );

  pgm.createTable("disponibilidades", {
    prestador_id: {
      type: "uuid",
      notNull: true,
      references: "prestadores(usuario_id)",
      onDelete: "CASCADE",
    },
    dia_semana: { type: "smallint", notNull: true },
    inicio: { type: "time", notNull: true },
    fim: { type: "time", notNull: true },
  });
  pgm.addConstraint("disponibilidades", "disponibilidades_pk", {
    primaryKey: ["prestador_id", "dia_semana", "inicio"],
  });
  pgm.addConstraint(
    "disponibilidades",
    "disponibilidades_validas",
    "CHECK (dia_semana BETWEEN 0 AND 6 AND fim > inicio)",
  );

  pgm.createTable("agendamentos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    prestador_id: {
      type: "uuid",
      references: "prestadores(usuario_id)",
      onDelete: "SET NULL",
    },
    cliente_id: { type: "uuid", references: "usuarios", onDelete: "SET NULL" },
    servico: { type: "varchar(160)", notNull: true },
    inicio: { type: "timestamptz", notNull: true },
    fim: { type: "timestamptz", notNull: true },
    status: { type: "status_agendamento", notNull: true, default: "pendente" },
    avaliacao: { type: "smallint" },
    avaliado_em: { type: "timestamptz" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    atualizado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint(
    "agendamentos",
    "agendamentos_avaliacao_valida",
    "CHECK (avaliacao IS NULL OR avaliacao BETWEEN 1 AND 5)",
  );
  pgm.createIndex("agendamentos", ["prestador_id", "inicio"], {
    name: "agendamentos_sem_duplicidade",
    unique: true,
    where: "status IN ('pendente', 'confirmado')",
  });
  pgm.createIndex("agendamentos", ["cliente_id", "inicio"]);

  pgm.createTable("avisos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    prestador_id: {
      type: "uuid",
      notNull: true,
      references: "prestadores(usuario_id)",
      onDelete: "CASCADE",
    },
    titulo: { type: "varchar(120)", notNull: true },
    texto: { type: "varchar(2000)", notNull: true },
    cor: { type: "varchar(16)", notNull: true, default: "azul" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    atualizado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("avisos", ["prestador_id", "criado_em"]);

  pgm.createTable("conversas", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    cliente_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    prestador_id: {
      type: "uuid",
      notNull: true,
      references: "prestadores(usuario_id)",
      onDelete: "CASCADE",
    },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    atualizado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("conversas", "conversas_par_unico", {
    unique: ["cliente_id", "prestador_id"],
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
      references: "conversas",
      onDelete: "CASCADE",
    },
    autor_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    texto_cifrado: { type: "text", notNull: true },
    lida_em: { type: "timestamptz" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("mensagens", ["conversa_id", "criado_em"]);

  pgm.createTable("sessoes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    token_hash: { type: "char(64)", notNull: true, unique: true },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    persistente: { type: "boolean", notNull: true, default: false },
    expira_em: { type: "timestamptz", notNull: true },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("sessoes", "usuario_id");
  pgm.createIndex("sessoes", "expira_em");

  pgm.createTable("tokens_recuperacao", {
    token_hash: { type: "char(64)", primaryKey: true },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    expira_em: { type: "timestamptz", notNull: true },
    usado_em: { type: "timestamptz" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("cadastros_pendentes", {
    token_hash: { type: "char(64)", primaryKey: true },
    google_sub: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(254)", notNull: true },
    nome: { type: "varchar(120)", notNull: true },
    expira_em: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("consentimentos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    documento: { type: "varchar(40)", notNull: true },
    versao: { type: "varchar(20)", notNull: true },
    aceito_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("consentimentos", "usuario_id");

  // Registros de acesso (Marco Civil da Internet, art. 15: 6 meses).
  // usuario_id não tem FK para que o registro sobreviva à exclusão da conta
  // pelo período legal, sem conter nome/e-mail/telefone.
  pgm.createTable("registros_auditoria", {
    id: { type: "bigserial", primaryKey: true },
    usuario_id: { type: "uuid" },
    acao: { type: "varchar(60)", notNull: true },
    ip: { type: "varchar(45)" },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("registros_auditoria", "criado_em");
  pgm.createIndex("registros_auditoria", "usuario_id");

  pgm.createTable("limites_requisicao", {
    chave: { type: "varchar(200)", primaryKey: true },
    contador: { type: "integer", notNull: true, default: 0 },
    janela_inicio: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("limites_requisicao");
  pgm.dropTable("registros_auditoria");
  pgm.dropTable("consentimentos");
  pgm.dropTable("cadastros_pendentes");
  pgm.dropTable("tokens_recuperacao");
  pgm.dropTable("sessoes");
  pgm.dropTable("mensagens");
  pgm.dropTable("conversas");
  pgm.dropTable("avisos");
  pgm.dropTable("agendamentos");
  pgm.dropTable("disponibilidades");
  pgm.dropTable("prestadores");
  pgm.dropTable("avatares");
  pgm.dropTable("usuarios");
  pgm.dropType("status_agendamento");
  pgm.dropType("papel_usuario");
};
