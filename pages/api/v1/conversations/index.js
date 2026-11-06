import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import {
  listConversationsForUser,
  getOrCreateConversation,
} from "models/chat.js";

async function handler(req, res) {
  const session = await requireAuth(req);

  if (req.method === "GET") {
    const conversations = await listConversationsForUser(
      session.id,
      session.papel,
    );
    return res.status(200).json(conversations);
  }

  if (req.method === "POST") {
    const { providerId } = req.body;
    const conversation = await getOrCreateConversation({
      clienteId: session.id,
      prestadorId: providerId,
    });
    return res.status(200).json(conversation);
  }
}

export default injectController(handler, ["GET", "POST"]);
