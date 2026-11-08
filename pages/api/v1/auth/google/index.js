import { buildAuthorizationUrl, isGoogleEnabled } from "infra/google.js";

export default function googleStart(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (!isGoogleEnabled())
    return res.redirect(302, "/login?erro=google_indisponivel");
  res.setHeader("Cache-Control", "no-store");
  res.redirect(
    302,
    buildAuthorizationUrl(res, { remember: req.query.lembrar === "1" }),
  );
}
