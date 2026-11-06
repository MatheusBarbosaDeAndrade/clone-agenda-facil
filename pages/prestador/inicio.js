import { useEffect, useState } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Badge from "components/ui/Badge.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";
import { formatDate, formatTime } from "lib/dates.js";

export default function PrestadorInicio() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    apiFetch("/dashboard/summary").then(setSummary).catch(console.error);
  }, []);

  if (!summary) return <div>A carregar resumo...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">
            Total Agendamentos
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {summary.totalAgendamentos}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">
            Novos Clientes (30d)
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {summary.novosClientes}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Avaliação Média</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {summary.avaliacao} ⭐
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-500">
            Horários Livres (7d)
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {summary.horariosLivresProximos}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Próximos Agendamentos
          </h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Serviço</th>
              <th className="px-6 py-3">Data e Hora</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {summary.proximosAgendamentos.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 flex items-center gap-3">
                  <Avatar
                    name={item.cliente_nome}
                    url={item.cliente_avatar}
                    size="sm"
                  />
                  <span className="font-medium text-gray-900">
                    {item.cliente_nome}
                  </span>
                </td>
                <td className="px-6 py-4">{item.servico}</td>
                <td className="px-6 py-4">
                  {formatDate(item.data)} às {formatTime(item.hora)}
                </td>
                <td className="px-6 py-4">
                  <Badge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PrestadorInicio.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
