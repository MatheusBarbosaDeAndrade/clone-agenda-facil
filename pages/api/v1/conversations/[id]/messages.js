import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { getMessages, sendMessage } from "models/chat.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const { id } = req.query;

  if (req.method === "GET") {
    const { depois } = req.query;
    const messages = await getMessages(id, session.id, depois);
    return res.status(200).json(messages);
  }

  if (req.method === "POST") {
    const { texto } = req.body;
    const message = await sendMessage({
      conversaId: id,
      autorId: session.id,
      texto,
    });
    return res.status(201).json(message);
  }
}

export default injectController(handler, ["GET", "POST"]);
