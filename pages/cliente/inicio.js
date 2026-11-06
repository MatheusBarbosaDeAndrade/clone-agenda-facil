import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";

export default function ClienteInicio() {
  const [providers, setProviders] = useState([]);
  const [busca, setBusca] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch("/providers").then(setProviders).catch(console.error);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    router.push(`/cliente/prestadores?busca=${encodeURIComponent(busca)}`);
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Encontre os melhores prestadores
        </h2>
        <p className="text-gray-500 mt-1">
          Organize os seus agendamentos de forma simples e rápida.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <input
            type="text"
            placeholder="Busque por nome, especialidade ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-xl"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#1B2A4E] text-white font-medium rounded-xl hover:bg-slate-800"
          >
            Buscar
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Prestadores em Destaque
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4">
                  <Avatar name={p.nome} url={p.avatar_url} size="md" />
                  <div>
                    <h4 className="font-bold text-gray-900">{p.nome}</h4>
                    <p className="text-xs text-blue-600 font-medium">
                      {p.especialidade}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 line-clamp-3">
                  {p.bio || "Sem descrição."}
                </p>
              </div>

              <button
                onClick={() => router.push(`/cliente/prestadores/${p.id}`)}
                className="mt-6 w-full py-2 bg-[#1B2A4E] text-white text-sm font-medium rounded-lg hover:bg-slate-800"
              >
                Agendar Horário
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ClienteInicio.getLayout = (page) => (
  <DashboardLayout role="cliente">{page}</DashboardLayout>
);
