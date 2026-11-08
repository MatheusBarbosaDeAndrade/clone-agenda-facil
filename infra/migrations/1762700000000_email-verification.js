/**
 * Verificação de e-mail.
 * - Impede que alguém cadastre o e-mail de outra pessoa e use a conta.
 * - Protege contra o "sequestro prévio de conta": uma conta só é vinculada
 *   ao login com Google sem ressalvas se o e-mail já tiver sido confirmado.
 */
exports.up = (pgm) => {
  pgm.addColumn("usuarios", {
    email_verificado_em: { type: "timestamptz" },
  });
  // Contas anteriores a esta migração são consideradas verificadas.
  pgm.sql("UPDATE usuarios SET email_verificado_em = criado_em");

  pgm.createTable("tokens_verificacao_email", {
    token_hash: { type: "char(64)", primaryKey: true },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    email: { type: "varchar(254)", notNull: true },
    expira_em: { type: "timestamptz", notNull: true },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("tokens_verificacao_email", "usuario_id");
};

exports.down = (pgm) => {
  pgm.dropTable("tokens_verificacao_email");
  pgm.dropColumn("usuarios", "email_verificado_em");
};
