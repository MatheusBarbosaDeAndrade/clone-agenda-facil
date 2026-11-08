import Head from "next/head";
import Link from "next/link";
import Logo from "components/Logo.jsx";

export default function LegalLayout({ title, updated, children }) {
  return (
    <>
      <Head>
        <title>{`${title} | AgendaFácil`}</title>
      </Head>
      <header className="landing-header">
        <div className="container">
          <Logo />
          <nav>
            <Link href="/login" className="btn btn-outline btn-md">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn btn-primary btn-md">
              Cadastrar
            </Link>
          </nav>
        </div>
      </header>
      <main className="legal">
        <h1>{title}</h1>
        <p className="updated">Versão {updated}</p>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>
            © {new Date().getFullYear()} AgendaFácil. Todos os direitos
            reservados.
          </span>
          <nav>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

export function getLegalInfo() {
  return {
    controlador: process.env.LEGAL_NAME || "AgendaFácil",
    documento: process.env.LEGAL_DOCUMENT || "",
    endereco: process.env.LEGAL_ADDRESS || "",
    email:
      process.env.PRIVACY_CONTACT_EMAIL || "privacidade@agendafacil.com.br",
    encarregado: process.env.DPO_NAME || "",
    site: process.env.APP_URL || "",
  };
}
