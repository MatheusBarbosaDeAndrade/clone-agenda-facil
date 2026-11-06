import { injectController } from "infra/controller.js";
import { requireAuth } from "infra/auth.js";
import { getAvailabilityByProviderId } from "models/availability.js";

async function handler(req, res) {
  await requireAuth(req);
  const { id, mes } = req.query;

  const availabilities = await getAvailabilityByProviderId(id);
  const activeDaysOfWeek = new Set(
    availabilities.filter((a) => a.ativo).map((a) => a.dia_semana),
  );

  const [yearStr, monthStr] = mes ? mes.split("-") : [];
  const now = new Date();
  const year = yearStr ? parseInt(yearStr) : now.getFullYear();
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const availableDays = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    if (activeDaysOfWeek.has(dayOfWeek)) {
      const formattedDay = String(day).padStart(2, "0");
      availableDays.push(
        `${year}-${String(month + 1).padStart(2, "0")}-${formattedDay}`,
      );
    }
  }

  return res.status(200).json(availableDays);
}

export default injectController(handler, ["GET"]);
