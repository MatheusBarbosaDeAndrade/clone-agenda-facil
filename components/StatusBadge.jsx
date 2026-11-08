import { APPOINTMENT_STATUS } from "lib/constants.js";

export default function StatusBadge({ status, concluidoTone }) {
  const config = APPOINTMENT_STATUS[status] || { label: status, tone: "info" };
  const tone =
    status === "concluido" && concluidoTone ? concluidoTone : config.tone;
  return <span className={`badge badge-${tone}`}>{config.label}</span>;
}
