import { useState, useEffect } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Badge from "components/ui/Badge.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";
import { formatDate, formatTime } from "lib/dates.js";

export default function PrestadorAgendamentos() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");

  async function loadData() {
    try {
      const params = new URLSearchParams();
      if (busca) params.append("busca", busca);
      if (status) params.append("status", status);
      const data = await apiFetch(`/appointments?${params.toString()}`);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
  }, [busca, status]);

  async function updateStatus(id, newStatus) {
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Buscar cliente ou serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-80"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
          <option value="nao_compareceu">Não compareceu</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Serviço</th>
              <th className="px-6 py-3">Data e Hora</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 flex items-center gap-3">
                  <Avatar
                    name={item.outro_nome}
                    url={item.outro_avatar}
                    size="sm"
                  />
                  <span className="font-medium text-gray-900">
                    {item.outro_nome}
                  </span>
                </td>
                <td className="px-6 py-4">{item.servico}</td>
                <td className="px-6 py-4">
                  {formatDate(item.data)} às {formatTime(item.hora)}
                </td>
                <td className="px-6 py-4">
                  <Badge status={item.status} />
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {item.status === "pendente" && (
                    <button
                      onClick={() => updateStatus(item.id, "confirmado")}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs"
                    >
                      Confirmar
                    </button>
                  )}
                  {item.status === "confirmado" && (
                    <button
                      onClick={() => updateStatus(item.id, "concluido")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                    >
                      Concluir
                    </button>
                  )}
                  {["pendente", "confirmado"].includes(item.status) && (
                    <button
                      onClick={() => updateStatus(item.id, "cancelado")}
                      className="px-3 py-1 bg-rose-600 text-white rounded text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PrestadorAgendamentos.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
