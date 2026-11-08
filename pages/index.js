import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  CalendarCheck,
  CircleCheck,
  CircleCheckBig,
  Clock,
  MessagesSquare,
  ShieldCheck,
  BellRing,
  Users,
} from "lucide-react";
import Logo from "components/Logo.jsx";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Agendamento em segundos",
    text: "O cliente escolhe o dia e o horário livres e confirma. Sem trocas de mensagens intermináveis.",
  },
  {
    icon: Clock,
    title: "Agenda sempre organizada",
    text: "Defina seus blocos de disponibilidade e deixe o AgendaFácil evitar conflitos e horários duplicados.",
  },
  {
    icon: MessagesSquare,
    title: "Chat integrado",
    text: "Converse com seus clientes ou prestadores diretamente na plataforma, com mensagens criptografadas.",
  },
  {
    icon: BellRing,
    title: "Quadro de avisos",
    text: "Comunique feriados, mudanças de horário e novidades para todos os seus clientes de uma vez.",
  },
  {
    icon: Users,
    title: "Histórico completo",
    text: "Acompanhe atendimentos concluídos, cancelados e avaliações para entender melhor o seu negócio.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e em conformidade com a LGPD",
    text: "Dados sensíveis criptografados, controle total sobre suas informações e exportação a qualquer momento.",
  },
];

export default function Home() {
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("conta") === "excluida") {
      setDeleted(true);
      window.history.replaceState(null, "", "/");
    }
  }, []);

  return (
    <>
      <Head>
        <title>AgendaFácil — Agende com facilidade e otimize seu tempo</title>
      </Head>

      <header className="landing-header">
        <div className="container">
          <Logo />
          <nav>
            <Link href="/login" className="btn btn-outline btn-md">
              Já tenho uma conta
            </Link>
            <Link href="/cadastro" className="btn btn-primary btn-md">
              Cadastrar
            </Link>
          </nav>
        </div>
      </header>

      {deleted && (
        <div className="container" style={{ paddingTop: 24 }}>
          <div className="alert alert-success" role="status">
            <CircleCheck size={20} />
            <div>
              <strong>Conta excluída</strong>
              Seus dados pessoais foram removidos conforme solicitado. Obrigado
              por ter usado o AgendaFácil.
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="hero">
          <div className="container">
            <div>
              <span className="hero-badge">
                <CircleCheckBig size={16} strokeWidth={2.5} />A plataforma mais
                rápida de agendamentos
              </span>
              <h1>Agende com facilidade e otimize seu tempo.</h1>
              <p>
                Conectamos prestadores de serviços aos clientes em uma
                plataforma inteligente, simples e robusta. Tenha o controle
                total da sua agenda na palma da mão.
              </p>
              <div className="hero-actions">
                <Link href="/cadastro" className="btn btn-primary">
                  Criar minha conta
                </Link>
                <a href="#planos" className="btn btn-outline">
                  Conhecer planos
                </a>
              </div>
            </div>
            <div className="hero-image">
              <img
                src="/images/hero.jpg"
                alt="Pessoa organizando a agenda no notebook com o AgendaFácil"
                width={540}
                height={440}
              />
            </div>
          </div>
        </section>

        <section className="section section-alt" id="recursos">
          <div className="container">
            <div className="section-head">
              <h2>Tudo o que você precisa em um só lugar</h2>
              <p>Ferramentas pensadas para quem agenda e para quem atende.</p>
            </div>
            <div className="feature-grid">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="card feature">
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="planos">
          <div className="container">
            <div className="section-head">
              <h2>Planos simples e transparentes</h2>
              <p>Comece agora mesmo, sem cartão de crédito.</p>
            </div>
            <div className="plans">
              <article className="card plan">
                <h3>Cliente</h3>
                <p>Para quem quer agendar serviços.</p>
                <div className="price">
                  Grátis <small>para sempre</small>
                </div>
                <ul>
                  {[
                    "Busca de prestadores por especialidade",
                    "Agendamento online 24 horas",
                    "Histórico e avaliações",
                    "Chat com os prestadores",
                  ].map((item) => (
                    <li key={item}>
                      <CircleCheck size={18} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro?perfil=cliente"
                  className="btn btn-outline btn-block"
                >
                  Criar conta de cliente
                </Link>
              </article>
              <article className="card plan plan-featured">
                <h3>Prestador</h3>
                <p>Para profissionais que atendem com hora marcada.</p>
                <div className="price">
                  Grátis <small>no lançamento</small>
                </div>
                <ul>
                  {[
                    "Agenda com blocos de disponibilidade",
                    "Painel com indicadores do seu negócio",
                    "Gestão de agendamentos e status",
                    "Quadro de avisos para clientes",
                    "Chat com os clientes",
                  ].map((item) => (
                    <li key={item}>
                      <CircleCheck size={18} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro?perfil=prestador"
                  className="btn btn-primary btn-block"
                >
                  Começar como prestador
                </Link>
              </article>
            </div>
          </div>
        </section>
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
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
