import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowDown,
  BellDot,
  Calendar,
  ClipboardList,
  House,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Logo from "components/Logo.jsx";
import Avatar from "components/Avatar.jsx";
import { api } from "lib/api.js";

const NAV = {
  cliente: [
    { href: "/cliente/inicio", label: "Início", icon: House },
    {
      href: "/cliente/prestadores",
      label: "Buscar Prestadores",
      icon: Calendar,
    },
    {
      href: "/cliente/agendamentos",
      label: "Meus Agendamentos",
      icon: ClipboardList,
    },
    { href: "/cliente/chat", label: "Chat", icon: MessageCircle },
    { href: "/cliente/perfil", label: "Perfil", icon: User },
  ],
  prestador: [
    { href: "/prestador/inicio", label: "Início", icon: House },
    { href: "/prestador/agenda", label: "Minha Agenda", icon: Calendar },
    {
      href: "/prestador/agendamentos",
      label: "Agendamentos",
      icon: ClipboardList,
    },
    { href: "/prestador/avisos", label: "Avisos", icon: BellDot },
    { href: "/prestador/chat", label: "Chat", icon: MessageCircle },
    { href: "/prestador/perfil", label: "Perfil", icon: User },
  ],
};

async function logout() {
  try {
    await api("/api/v1/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}

function UserChip({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const base = user.papel === "prestador" ? "/prestador" : "/cliente";

  useEffect(() => {
    if (!open) return;
    const close = (event) =>
      !ref.current?.contains(event.target) && setOpen(false);
    const esc = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="user-chip" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={user.nome} src={user.avatarUrl} size={36} />
        <span className="user-name">
          {user.nome.split(" ").slice(0, 2).join(" ")}
        </span>
        <ArrowDown size={16} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <Link href={`${base}/perfil`} role="menuitem">
            <User size={16} /> Meu perfil
          </Link>
          <Link href={`${base}/perfil#privacidade`} role="menuitem">
            <ShieldCheck size={16} /> Privacidade e dados
          </Link>
          <hr />
          <button type="button" role="menuitem" onClick={logout}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  user,
  title,
  subtitle,
  actions,
  showUser = true,
  children,
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV[user.papel] || [];

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  return (
    <>
      <Head>
        <title>{`${title} | AgendaFácil`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="app">
        <div className="mobile-bar">
          <Logo variant="light" href={items[0]?.href} />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        </div>
        <div
          className={`backdrop ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`sidebar ${menuOpen ? "open" : ""}`}
          aria-label="Menu principal"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Logo variant="light" href={items[0]?.href} />
            {menuOpen && (
              <button
                type="button"
                className="icon-btn"
                style={{ color: "#fff" }}
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <nav>
            {items.map(({ href, label, icon: Icon }) => {
              const active =
                router.pathname === href ||
                router.pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className="nav-item"
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              className="nav-item nav-logout"
              onClick={logout}
            >
              <LogOut size={20} strokeWidth={1.8} />
              Sair
            </button>
          </nav>
        </aside>
        <main className="main">
          <div className="page-head">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="page-head-actions">
              {actions}
              {showUser && <UserChip user={user} />}
            </div>
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
