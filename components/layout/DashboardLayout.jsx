import Link from "next/router";
import { useRouter } from "next/router";
import { useAuth, useRequireAuth } from "context/AuthContext.js";
import Avatar from "components/ui/Avatar.jsx";
import {
  Calendar,
  Clock,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Home,
  Search,
} from "lucide-react";

export default function DashboardLayout({ children, role }) {
  const { user, loading } = useRequireAuth(role);
  const { logout } = useAuth();
  const router = useRouter();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B2A4E]"></div>
      </div>
    );
  }

  const prestadorLinks = [
    { href: "/prestador/inicio", label: "Início", icon: Home },
    { href: "/prestador/agenda", label: "Minha Agenda", icon: Clock },
    { href: "/prestador/agendamentos", label: "Agendamentos", icon: Calendar },
    { href: "/prestador/avisos", label: "Avisos", icon: Bell },
    { href: "/prestador/chat", label: "Chat", icon: MessageSquare },
    { href: "/prestador/perfil", label: "Perfil", icon: User },
  ];

  const clienteLinks = [
    { href: "/cliente/inicio", label: "Início", icon: Home },
    { href: "/cliente/prestadores", label: "Buscar Prestadores", icon: Search },
    {
      href: "/cliente/agendamentos",
      label: "Meus Agendamentos",
      icon: Calendar,
    },
    { href: "/cliente/chat", label: "Chat", icon: MessageSquare },
    { href: "/cliente/perfil", label: "Perfil", icon: User },
  ];

  const links = role === "prestador" ? prestadorLinks : clienteLinks;

  return (
    <div className="min-h-screen flex bg-[#F4F6FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B2A4E] text-white flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 text-xl font-bold border-b border-slate-700 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white">
              A
            </div>
            AgendaFácil
          </div>
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = router.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            {role === "prestador" ? "Painel do Prestador" : "Painel do Cliente"}
          </h1>
          <div className="flex items-center gap-3">
            <Avatar name={user.nome} url={user.avatar_url} size="sm" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user.nome}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
