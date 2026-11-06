import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1B2A4E] text-white flex items-center justify-center font-bold rounded">
            A
          </div>
          <span className="text-xl font-bold text-[#1B2A4E]">AgendaFácil</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Já tenho uma conta
          </Link>
          <Link
            href="/cadastro"
            className="px-4 py-2 bg-[#1B2A4E] text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
          >
            Cadastrar
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
            A plataforma mais rápida de agendamentos
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1B2A4E] leading-tight mt-4">
            Agende com facilidade e otimize o seu tempo.
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Conectamos prestadores de serviços a clientes numa plataforma
            inteligente, simples e robusta. Tenha o controlo total da sua agenda
            na palma da mão.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/cadastro"
              className="px-6 py-3 bg-[#1B2A4E] text-white font-medium rounded-lg hover:bg-slate-800 transition"
            >
              Criar minha conta
            </Link>
          </div>
        </div>

        <div className="bg-slate-100 p-8 rounded-2xl flex items-center justify-center border border-gray-200">
          <div className="w-full h-64 bg-white rounded-xl shadow-inner border border-gray-200 flex items-center justify-center text-gray-400">
            [ Agenda System Preview ]
          </div>
        </div>
      </main>
    </div>
  );
}
