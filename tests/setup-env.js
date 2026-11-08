// Os testes usam o mesmo ambiente de desenvolvimento (banco no Docker).
const fs = require("node:fs");
const { parseEnv } = require("node:util");

const values = parseEnv(fs.readFileSync(".env.development", "utf8"));
for (const [key, value] of Object.entries(values)) {
  if (process.env[key] === undefined) process.env[key] = value;
}
