import { useState, useEffect } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import { apiFetch } from "services/api.js";
import { DIAS_SEMANA } from "lib/constants.js";

export default function PrestadorAgenda() {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const blocosPadrao = ["08:00", "10:00", "14:00", "16:00"];

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch("/availability");
        setGrid(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleSlot(dia_semana, inicio) {
    setGrid((prev) => {
      const index = prev.findIndex(
        (item) =>
          item.dia_semana === dia_semana && item.inicio === `${inicio}:00`,
      );
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ativo: !next[index].ativo };
        return next;
      } else {
        const fimHour = parseInt(inicio.split(":")[0]) + 2;
        const fim = `${String(fimHour).padStart(2, "0")}:00:00`;
        return [
          ...prev,
          { dia_semana, inicio: `${inicio}:00`, fim, ativo: true },
        ];
      }
    });
  }

  function isAtivo(dia_semana, inicio) {
    const item = grid.find(
      (i) => i.dia_semana === dia_semana && i.inicio.startsWith(inicio),
    );
    return item ? item.ativo : false;
  }

  async function handleSave() {
    setSaving(true);
    setMensagem("");
    try {
      await apiFetch("/availability", { method: "PUT", body: grid });
      setMensagem("Disponibilidade salva com sucesso!");
    } catch (err) {
      setMensagem("Erro ao salvar disponibilidade.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>A carregar agenda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Gerir Disponibilidade
          </h2>
          <p className="text-sm text-gray-500">
            Selecione os blocos de horário para atendimento semanal.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#1B2A4E] text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          {saving ? "A salvar..." : "Salvar alterações"}
        </button>
      </div>

      {mensagem && (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {mensagem}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
          <div
            key={dia}
            className="bg-white p-4 rounded-xl border border-gray-200 text-center"
          >
            <h4 className="font-bold text-sm text-gray-800 border-b pb-2 mb-3">
              {DIAS_SEMANA[dia]}
            </h4>
            <div className="space-y-2">
              {blocosPadrao.map((bloco) => {
                const ativo = isAtivo(dia, bloco);
                return (
                  <button
                    key={bloco}
                    onClick={() => toggleSlot(dia, bloco)}
                    className={`w-full py-2 px-1 text-xs font-semibold rounded-lg border transition ${
                      ativo
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {bloco} {ativo ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

PrestadorAgenda.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
