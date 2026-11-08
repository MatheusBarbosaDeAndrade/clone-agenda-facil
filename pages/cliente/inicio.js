import { useState } from "react";
import { useRouter } from "next/router";
import { Search, Users } from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import ProviderCard from "components/ProviderCard.jsx";
import EmptyState from "components/EmptyState.jsx";
import { firstName } from "lib/format.js";
import { withPageAuth } from "infra/page-auth.js";
import provider from "models/provider.js";

export default function ClienteInicio({ user, providers }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <DashboardLayout
      user={user}
      title={`Olá, ${firstName(user.nome)}!`}
      subtitle="Encontre os melhores prestadores de serviços e organize seus agendamentos de forma inteligente."
    >
      <form
        className="search"
        role="search"
        style={{ marginBottom: 44 }}
        onSubmit={(e) => {
          e.preventDefault();
          router.push({
            pathname: "/cliente/prestadores",
            query: q.trim() ? { q: q.trim() } : {},
          });
        }}
      >
        <Search size={20} />
        <label htmlFor="busca" className="sr-only">
          Buscar prestadores
        </label>
        <input
          id="busca"
          className="input"
          style={{ height: 54, borderRadius: 10 }}
          placeholder="Busque por prestadores, especialidades ou categorias (ex: Psicólogo, Designer)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <h2 className="section-title">Prestadores em Destaque</h2>
      {providers.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="Nenhum prestador cadastrado ainda">
            Assim que novos profissionais se cadastrarem, eles aparecerão aqui.
          </EmptyState>
        </div>
      ) : (
        <div className="grid-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth("cliente", async () => ({
  props: { providers: await provider.search({ limit: 6 }) },
}));
