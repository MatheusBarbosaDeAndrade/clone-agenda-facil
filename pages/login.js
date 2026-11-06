import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "context/AuthContext.js";

export default function LoginPage() {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const user = await login(identificador, senha, true);
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
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-[#1B2A4E] text-white p-12 hidden md:flex flex-col justify-between">
        <div className="text-2xl font-bold">AgendaFácil</div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Agende com facilidade e multiplique os seus resultados.
          </h2>
          <p className="text-slate-300 mt-4">
            Crie a sua conta em menos de 2 minutos e comece a receber
            agendamentos ainda hoje.
          </p>
        </div>
        <p className="text-xs text-slate-400">© 2026 AgendaFácil.</p>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#F4F6FA]">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Insira as suas credenciais para aceder à sua conta.
          </p>

          {erro && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail ou Telefone
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B2A4E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1B2A4E]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1B2A4E] text-white font-medium rounded-lg hover:bg-slate-800 transition"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-blue-600 font-medium">
              Cadastrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
