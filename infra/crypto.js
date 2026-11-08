import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

// ---------------------------------------------------------------------------
// Chaves
// ---------------------------------------------------------------------------
// DATA_ENCRYPTION_KEY: 32 bytes em base64 (gere com `npm run secrets:generate`).
// A partir dela derivamos (HKDF) uma subchave para criptografia e outra para
// índices cegos (HMAC). Assim um único segredo precisa ser guardado.

let cachedKeys = null;

function getKeys() {
  if (cachedKeys) return cachedKeys;
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "DATA_ENCRYPTION_KEY não definida. Gere uma com `npm run secrets:generate`.",
    );
  }
  const master = Buffer.from(raw, "base64");
  if (master.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY deve conter 32 bytes em base64.");
  }
  const derive = (info) =>
    Buffer.from(crypto.hkdfSync("sha256", master, "agenda-facil", info, 32));
  cachedKeys = {
    encryption: derive("encryption:v1"),
    blindIndex: derive("blind-index:v1"),
  };
  return cachedKeys;
}

// ---------------------------------------------------------------------------
// Criptografia de campos (AES-256-GCM) — dados pessoais em repouso
// ---------------------------------------------------------------------------
const CIPHER_VERSION = "v1";

export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKeys().encryption, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    CIPHER_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decrypt(payload) {
  if (!payload) return null;
  const [version, iv, tag, data] = String(payload).split(":");
  if (version !== CIPHER_VERSION || !iv || !tag || data === undefined) {
    throw new Error("Formato de dado criptografado inválido.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKeys().encryption,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Índice cego: permite buscar por igualdade sem armazenar o valor em claro. */
export function blindIndex(value) {
  return crypto
    .createHmac("sha256", getKeys().blindIndex)
    .update(String(value))
    .digest("base64url");
}

// ---------------------------------------------------------------------------
// Senhas (scrypt, parâmetros recomendados pela OWASP)
// ---------------------------------------------------------------------------
const SCRYPT_PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(
    password.normalize("NFKC"),
    salt,
    KEY_LENGTH,
    SCRYPT_PARAMS,
  );
  return [
    "scrypt",
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

// Hash fixo usado quando o usuário não existe, para que o tempo de resposta do
// login não revele se uma conta está cadastrada (enumeração de usuários).
let dummyHashPromise = null;
function getDummyHash() {
  if (!dummyHashPromise) dummyHashPromise = hashPassword("dummy-password-0");
  return dummyHashPromise;
}

export async function verifyPassword(password, storedHash) {
  const hash = storedHash || (await getDummyHash());
  const [algorithm, N, r, p, salt, expected] = hash.split("$");
  if (algorithm !== "scrypt") return false;
  const expectedBuffer = Buffer.from(expected, "base64url");
  const derived = await scrypt(
    String(password).normalize("NFKC"),
    Buffer.from(salt, "base64url"),
    expectedBuffer.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 },
  );
  const matches = crypto.timingSafeEqual(derived, expectedBuffer);
  return Boolean(storedHash) && matches;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Tokens (sessão, recuperação) são guardados apenas como hash SHA-256. */
export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}
