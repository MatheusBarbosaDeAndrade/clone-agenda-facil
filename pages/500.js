import Head from "next/head";
import Link from "next/link";
import Logo from "components/Logo.jsx";

export default function ServerError() {
  return (
    <div className="error-page">
      <Head>
        <title>Erro | AgendaFácil</title>
      </Head>
      <Logo />
      <h1>Ops!</h1>
      <p>Ocorreu um erro inesperado. Tente novamente em instantes.</p>
      <Link href="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
