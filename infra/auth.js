import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { parse, serialize } from "cookie";
import { UnauthorizedError } from "infra/errors.js";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "desenvolvimento_secret_key_agenda_facil_123456",
);

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (err) {
    return null;
  }
}

export function setAuthCookie(res, token, remember = true) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  if (remember) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60; // 7 dias
  }

  const serialized = serialize("agenda_facil_token", token, cookieOptions);
  res.setHeader("Set-Cookie", serialized);
}

export function clearAuthCookie(res) {
  const serialized = serialize("agenda_facil_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", serialized);
}

export async function getSession(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.agenda_facil_token;

  if (!token) {
    return null;
  }

  const session = await verifyToken(token);
  return session;
}

export async function requireAuth(req) {
  const session = await getSession(req);
  if (!session) {
    throw new UnauthorizedError("Sessão inválida ou expirada");
  }
  return session;
}
