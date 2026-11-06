import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";
import { CATEGORIAS } from "lib/constants.js";

export default function ClienteBuscarPrestadores() {
  const [providers, setProviders] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (router.query.busca) {
      setBusca(router.query.busca);
    }
  }, [router.query]);

  useEffect(() => {
    async function fetchProviders() {
      const params = new URLSearchParams();
      if (busca) params.append("busca", busca);
      if (categoria) params.append("categoria", categoria);
      const data = await apiFetch(`/providers?${params.toString()}`);
      setProviders(data);
    }
    fetchProviders();
  }, [busca, categoria]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar por nome ou especialidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((p) => (
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
                {p.bio || "Sem biografia cadastrada."}
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
  );
}

ClienteBuscarPrestadores.getLayout = (page) => (
  <DashboardLayout role="cliente">{page}</DashboardLayout>
);
