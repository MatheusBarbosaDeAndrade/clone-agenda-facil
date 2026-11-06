import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { findByUserId } from "models/provider.js";
import { createNotice, getNoticesByProviderId } from "models/notice.js";

async function handler(req, res) {
  const session = await requireAuth(req);
  const provider = await findByUserId(session.id);

  if (req.method === "GET") {
    const notices = await getNoticesByProviderId(provider.id);
    return res.status(200).json(notices);
  }

  if (req.method === "POST") {
    const { titulo, texto, cor } = req.body;
    const notice = await createNotice({
      prestadorId: provider.id,
      titulo,
      texto,
      cor,
    });
    return res.status(201).json(notice);
  }
}

export default injectController(handler, ["GET", "POST"]);
