import { createHandler, requireUser } from "infra/controller.js";
import provider from "models/provider.js";

async function list(req, res) {
  await requireUser(req);
  const termo = typeof req.query.q === "string" ? req.query.q : "";
  res.status(200).json(await provider.search({ termo }));
}

export default createHandler({ GET: list });
