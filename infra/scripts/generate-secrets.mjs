import crypto from "node:crypto";

console.log(
  "# Valores para as variáveis de ambiente de produção (Vercel ou .env.production)",
);
console.log(`DATA_ENCRYPTION_KEY=${crypto.randomBytes(32).toString("base64")}`);
console.log(`CRON_SECRET=${crypto.randomBytes(32).toString("base64url")}`);
console.log(
  `POSTGRES_PASSWORD=${crypto.randomBytes(24).toString("base64url")}  # apenas para VPS/Docker`,
);
console.log(
  "# ATENÇÃO: guarde DATA_ENCRYPTION_KEY em local seguro (ex.: gerenciador de senhas).",
);
console.log(
  "# Se ela for perdida, telefones e mensagens criptografados não poderão ser lidos.",
);
