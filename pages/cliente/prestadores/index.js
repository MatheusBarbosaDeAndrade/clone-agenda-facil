import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Search, SearchX } from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import ProviderCard from "components/ProviderCard.jsx";
import EmptyState from "components/EmptyState.jsx";
import { api } from "lib/api.js";
import { withPageAuth } from "infra/page-auth.js";
import provider from "models/provider.js";

export default function BuscarPrestadores({
  user,
  initialQuery,
  initialResults,
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(
          await api(`/api/v1/providers?q=${encodeURIComponent(q.trim())}`),
        );
        router.replace(
          { pathname: router.pathname, query: q.trim() ? { q: q.trim() } : {} },
          undefined,
          { shallow: true },
        );
      } catch {
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <DashboardLayout
      user={user}
      title="Buscar Prestadores"
      subtitle="Encontre o profissional ideal e agende em poucos cliques."
    >
      <div className="search" role="search" style={{ marginBottom: 36 }}>
        <Search size={20} />
        <label htmlFor="busca" className="sr-only">
          Buscar prestadores
        </label>
        <input
          id="busca"
          className="input"
          style={{ height: 54, borderRadius: 10 }}
          placeholder="Busque por nome, especialidade ou local..."
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <h2 className="section-title">
        {loading
          ? "Buscando..."
          : `${results.length} prestador${results.length === 1 ? "" : "es"} encontrado${results.length === 1 ? "" : "s"}`}
      </h2>
      {results.length === 0 && !loading ? (
        <div className="card">
          <EmptyState icon={SearchX} title="Nenhum prestador encontrado">
            Tente buscar por outro termo ou especialidade.
          </EmptyState>
        </div>
      ) : (
        <div className="grid-3">
          {results.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth("cliente", async (ctx) => {
  const q = typeof ctx.query.q === "string" ? ctx.query.q.slice(0, 100) : "";
  return {
    props: {
      initialQuery: q,
      initialResults: await provider.search({ termo: q }),
    },
  };
});
