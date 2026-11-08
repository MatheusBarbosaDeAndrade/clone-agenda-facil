import Link from "next/link";
import { Star } from "lucide-react";
import Avatar from "components/Avatar.jsx";

export default function ProviderCard({ provider }) {
  return (
    <article className="card provider-card">
      <header>
        <Avatar
          name={provider.nome}
          src={provider.avatarUrl}
          size={64}
          square
        />
        <div style={{ minWidth: 0 }}>
          <h3>{provider.nome}</h3>
          <div className="specialty">{provider.especialidade}</div>
          {provider.mediaAvaliacao !== null && (
            <span
              className="rating-inline"
              title={`${provider.totalAvaliacoes} avaliações`}
            >
              <Star size={13} fill="currentColor" />{" "}
              {provider.mediaAvaliacao.toFixed(1)} ({provider.totalAvaliacoes})
            </span>
          )}
        </div>
      </header>
      <p>{provider.bio || `Atendimento em ${provider.local}.`}</p>
      <Link
        href={`/cliente/prestadores/${provider.id}`}
        className="btn btn-primary btn-block"
      >
        Agendar Horário
      </Link>
    </article>
  );
}
