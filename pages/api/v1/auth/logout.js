import { createHandler } from "infra/controller.js";
import { audit } from "infra/audit.js";
import session from "models/session.js";

async function logout(req, res) {
  const current = await session.findValid(req);
  await session.destroy(req, res);
  if (current) await audit(req, current.usuarioId, "logout");
  res.status(200).json({ redirectTo: "/login" });
}

export default createHandler({ POST: logout });
