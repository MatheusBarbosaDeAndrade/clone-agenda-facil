import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "context/AuthContext.js";
import { CATEGORIAS } from "lib/constants.js";

export default function CadastroPage() {
  const [papel, setPapel] = useState("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const payload = {
        papel,
        nome,
        email,
        telefone,
        senha,
        especialidade,
        local,
      };
      const user = await register(payload);
      if (user.papel === "prestador") {
        router.push("/prestador/inicio");
      } else {
        router.push("/cliente/inicio");
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F4F6FA]">
      <div className="max-w-md w-full mx-auto my-auto p-8 bg-white rounded-xl border border-gray-200 my-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Comece gratuitamente
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Escolha o tipo de perfil e preencha as informações.
        </p>

        <div className="flex border-b my-4">
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              papel === "cliente"
                ? "border-b-2 border-[#1B2A4E] text-[#1B2A4E]"
                : "text-gray-400"
            }`}
            onClick={() => setPapel("cliente")}
          >
            Cliente
          </button>
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              papel === "prestador"
                ? "border-b-2 border-[#1B2A4E] text-[#1B2A4E]"
                : "text-gray-400"
            }`}
            onClick={() => setPapel("prestador")}
          >
            Prestador
          </button>
        </div>

        {erro && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm mb-4">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome completo
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="text"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {papel === "prestador" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Especialidade / Categoria
                </label>
                <select
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Localização
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Belém, Pará"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1B2A4E] text-white font-medium rounded-lg hover:bg-slate-800 transition"
          >
            {loading ? "A cadastrar..." : "Cadastrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-600 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
