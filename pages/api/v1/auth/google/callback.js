import { audit } from "infra/audit.js";
import { handleCallback, isGoogleEnabled } from "infra/google.js";
import { homePathFor } from "infra/page-auth.js";
import { rateLimitByIp } from "infra/rate-limit.js";
import user from "models/user.js";
import session from "models/session.js";
import googleSignup from "models/google-signup.js";

export default async function googleCallback(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" || !isGoogleEnabled())
    return res.redirect(302, "/login");
  try {
    await rateLimitByIp(req, "google", 30, 15 * 60);
    const result = await handleCallback(req, res);
    if (result.error)
      return res.redirect(302, `/login?erro=google_${result.error}`);
    const { profile, remember } = result;

    let found = await user.findByGoogleSub(profile.sub);
    if (!found) {
      // E-mail verificado pelo Google: vincula à conta existente.
      found = await user.findByEmail(profile.email);
      if (found) await user.linkGoogle(found.id, profile.sub);
    }
    if (found) {
      await session.create(res, found.id, remember);
      await audit(req, found.id, "login_google");
      return res.redirect(302, homePathFor(found.papel));
    }

    // Conta nova: precisa escolher o perfil, informar telefone e aceitar os termos.
    await googleSignup.create(res, profile);
    return res.redirect(302, "/completar-cadastro");
  } catch (error) {
    console.error("[google] falha no callback:", error.message);
    return res.redirect(302, "/login?erro=google_falha");
  }
}
