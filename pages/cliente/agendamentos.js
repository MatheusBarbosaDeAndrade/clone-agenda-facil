import { useState, useEffect } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Badge from "components/ui/Badge.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";
import { formatDate, formatTime } from "lib/dates.js";

export default function ClienteAgendamentos() {
  const [tab, setTab] = useState("agendados");
  const [items, setItems] = useState([]);

  async function loadData() {
    try {
      const data = await apiFetch(`/appointments?tipo=${tab}`);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab]);

  async function handleCancel(id) {
    if (!confirm("Deseja cancelar o agendamento?")) return;
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: { status: "cancelado" },
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 font-semibold text-sm ${
            tab === "agendados"
              ? "border-b-2 border-[#1B2A4E] text-[#1B2A4E]"
              : "text-gray-400"
          }`}
          onClick={() => setTab("agendados")}
        >
          Agendados
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm ${
            tab === "historico"
              ? "border-b-2 border-[#1B2A4E] text-[#1B2A4E]"
              : "text-gray-400"
          }`}
          onClick={() => setTab("historico")}
        >
          Histórico
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Avatar
                name={item.outro_nome}
                url={item.outro_avatar}
                size="md"
              />
              <div>
                <h4 className="font-bold text-gray-900">{item.outro_nome}</h4>
                <p className="text-xs text-blue-600 font-medium">
                  {item.servico}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  📅 {formatDate(item.data)} às {formatTime(item.hora)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge status={item.status} />
              {tab === "agendados" &&
                ["pendente", "confirmado"].includes(item.status) && (
                  <button
                    onClick={() => handleCancel(item.id)}
                    className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded hover:bg-rose-100"
                  >
                    Cancelar
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ClienteAgendamentos.getLayout = (page) => (
  <DashboardLayout role="cliente">{page}</DashboardLayout>
);
