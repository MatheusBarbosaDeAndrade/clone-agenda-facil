import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findByUserId } from "models/provider.js";
import {
  getAvailabilityByProviderId,
  setAvailability,
} from "models/availability.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const provider = await findByUserId(session.id);

  if (req.method === "GET") {
    const data = await getAvailabilityByProviderId(provider.id);
    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    const items = req.body;
    const updated = await setAvailability(provider.id, items);
    return res.status(200).json(updated);
  }
}

export default injectController(handler, ["GET", "PUT"]);
