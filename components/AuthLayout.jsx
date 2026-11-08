import Head from "next/head";
import Logo from "components/Logo.jsx";

export default function AuthLayout({ title, text, pageTitle, children }) {
  return (
    <>
      <Head>
        <title>{`${pageTitle} | AgendaFácil`}</title>
      </Head>
      <div className="auth">
        <aside className="auth-aside">
          <Logo variant="light" />
          <div className="auth-aside-content">
            <h2>
              {title || "Agende com facilidade e multiplique seus resultados."}
            </h2>
            <p>{text}</p>
          </div>
          <footer>
            © {new Date().getFullYear()} AgendaFácil. Todos os direitos
            reservados.
          </footer>
        </aside>
        <main className="auth-main">
          <div className="auth-card">
            <div className="auth-mobile-logo">
              <Logo />
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
