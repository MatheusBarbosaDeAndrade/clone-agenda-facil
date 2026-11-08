import crypto from "node:crypto";
import { generateToken, safeEqual } from "infra/crypto.js";
import {
  appendSetCookie,
  getAppUrl,
  parseCookies,
  serializeCookie,
} from "infra/request.js";

const COOKIE = "agendafacil_oauth";

export function isGoogleEnabled() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function redirectUri() {
  return `${getAppUrl()}/api/v1/auth/google/callback`;
}

/** Inicia o fluxo OAuth 2.0 (authorization code + PKCE + state). */
export function buildAuthorizationUrl(res, { remember = false } = {}) {
  const state = generateToken(24);
  const verifier = generateToken(48);
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  appendSetCookie(
    res,
    serializeCookie(COOKIE, `${state}.${verifier}.${remember ? 1 : 0}`, {
      maxAge: 600,
    }),
  );
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Valida o retorno do Google e devolve o perfil verificado. */
export async function handleCallback(req, res) {
  const raw = parseCookies(req)[COOKIE] || "";
  appendSetCookie(res, serializeCookie(COOKIE, "", { maxAge: 0 }));
  const [state, verifier, remember] = raw.split(".");
  const { code, state: returnedState, error } = req.query;
  if (error) return { error: "cancelado" };
  if (
    !state ||
    !verifier ||
    !returnedState ||
    !safeEqual(state, returnedState) ||
    !code
  ) {
    return { error: "estado_invalido" };
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: String(code),
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenResponse.ok) return { error: "falha_token" };
  const tokens = await tokenResponse.json();

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    },
  );
  if (!profileResponse.ok) return { error: "falha_perfil" };
  const profile = await profileResponse.json();
  if (!profile.sub || !profile.email || profile.email_verified !== true) {
    return { error: "email_nao_verificado" };
  }
  return {
    profile: {
      sub: String(profile.sub),
      email: String(profile.email).toLowerCase(),
      nome: String(profile.name || profile.email.split("@")[0]).slice(0, 120),
    },
    remember: remember === "1",
  };
}
