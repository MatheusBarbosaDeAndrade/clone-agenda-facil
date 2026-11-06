import { STATUS_AGENDAMENTO_BADGE } from "lib/constants.js";

export default function Badge({ status }) {
  const config = STATUS_AGENDAMENTO_BADGE[status] || {
    label: status,
    class: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}
    >
      {config.label}
    </span>
  );
}
