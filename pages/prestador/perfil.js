import { useState } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import { useAuth } from "context/AuthContext.js";
import { apiFetch } from "services/api.js";

export default function PrestadorPerfil() {
  const { user, reloadUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [local, setLocal] = useState(user?.local || "");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        body: { nome, telefone, bio, local },
      });
      await reloadUser();
      setMensagem("Perfil atualizado com sucesso!");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl border border-gray-200 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Perfil Profissional</h2>
      {mensagem && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
          {mensagem}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Localização
          </label>
          <input
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Biografia / Sobre
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#1B2A4E] text-white rounded-lg font-medium"
        >
          Salvar Perfil
        </button>
      </form>
    </div>
  );
}

PrestadorPerfil.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
