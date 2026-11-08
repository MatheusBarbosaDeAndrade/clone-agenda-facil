import { createHandler } from "infra/controller.js";
import { rateLimitByIp } from "infra/rate-limit.js";
import { audit } from "infra/audit.js";
import { registerSchema } from "lib/validation.js";
import user from "models/user.js";
import session from "models/session.js";
import emailVerification from "models/email-verification.js";

async function register(req, res) {
  await rateLimitByIp(req, "register", 10, 60 * 60);
  const data = registerSchema.parse(req.body || {});
  const id = await user.create(data);
  await session.create(res, id, false);
  await audit(req, id, "conta_criada");
  await emailVerification.send(id);
  res.status(201).json({ redirectTo: "/confirmar-email" });
}

export default createHandler({ POST: register });
