import { useState, useEffect } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import { apiFetch } from "services/api.js";
import { formatDate } from "lib/dates.js";

export default function PrestadorAvisos() {
  const [notices, setNotices] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");

  async function loadNotices() {
    try {
      const data = await apiFetch("/notices");
      setNotices(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch("/notices", {
        method: "POST",
        body: { titulo, texto },
      });
      setTitulo("");
      setTexto("");
      loadNotices();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja apagar este aviso?")) return;
    try {
      await apiFetch(`/notices/${id}`, { method: "DELETE" });
      loadNotices();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Aviso</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Título do aviso"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Conteúdo do aviso..."
            required
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1B2A4E] text-white font-medium rounded-lg hover:bg-slate-800"
          >
            Publicar Aviso
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((n) => (
          <div
            key={n.id}
            className="bg-white p-6 rounded-xl border-l-4 border-l-blue-600 border border-gray-200 relative"
          >
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900">{n.titulo}</h4>
              <button
                onClick={() => handleDelete(n.id)}
                className="text-xs text-rose-600 font-semibold"
              >
                Excluir
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{n.texto}</p>
            <p className="text-xs text-gray-400 mt-4">
              Criado em: {formatDate(n.criado_em)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

PrestadorAvisos.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
