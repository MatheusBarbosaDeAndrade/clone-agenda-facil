import Head from "next/head";
import Link from "next/link";
import Logo from "components/Logo.jsx";

export default function NotFound() {
  return (
    <div className="error-page">
      <Head>
        <title>Página não encontrada | AgendaFácil</title>
      </Head>
      <Logo />
      <h1>404</h1>
      <p>A página que você procura não existe ou foi movida.</p>
      <Link href="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
