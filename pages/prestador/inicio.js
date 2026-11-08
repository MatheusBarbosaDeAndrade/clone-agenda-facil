import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Star,
  User,
} from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import Avatar from "components/Avatar.jsx";
import StatusBadge from "components/StatusBadge.jsx";
import EmptyState from "components/EmptyState.jsx";
import AppointmentModal from "components/AppointmentModal.jsx";
import { openChatWith } from "components/ChatView.jsx";
import { useToast } from "components/Toast.jsx";
import { formatDateTime, firstName, todayISO } from "lib/format.js";
import { withPageAuth } from "infra/page-auth.js";
import appointment from "models/appointment.js";
import availability from "models/availability.js";

function Trend({ current, previous, suffix }) {
  if (!previous) {
    return (
      <span className={`stat-foot ${current ? "" : "neutral"}`}>
        {current ? (
          <>
            <ArrowUp size={12} /> {current} {suffix}
          </>
        ) : (
          `Nenhum ${suffix}`
        )}
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0)
    return <span className="stat-foot neutral">Estável {suffix}</span>;
  const down = pct < 0;
  return (
    <span className={`stat-foot ${down ? "down" : ""}`}>
      {down ? <ArrowDown size={12} /> : <ArrowUp size={12} />} {Math.abs(pct)}%{" "}
      {suffix}
    </span>
  );
}

function ratingLabel(media) {
  if (media >= 4.5) return "Excelente";
  if (media >= 4) return "Muito bom";
  if (media >= 3) return "Bom";
  return "Regular";
}

export default function PrestadorInicio({
  user,
  summary,
  upcoming: initialUpcoming,
  slotsWeek,
  slotsToday,
}) {
  const { notify } = useToast();
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [details, setDetails] = useState(null);

  return (
    <DashboardLayout
      user={user}
      title={`Olá, ${firstName(user.nome)}!`}
      subtitle="Aqui está um resumo de sua agenda para hoje."
    >
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <article className="card stat">
          <div className="stat-top">
            <span className="stat-label">Total Agendamentos</span>
            <span className="stat-icon">
              <ClipboardList size={18} />
            </span>
          </div>
          <div className="stat-value">{summary.total}</div>
          <Trend
            current={summary.mesAtual}
            previous={summary.mesAnterior}
            suffix="este mês"
          />
        </article>
        <article className="card stat">
          <div className="stat-top">
            <span className="stat-label">Novos Clientes</span>
            <span className="stat-icon">
              <User size={18} />
            </span>
          </div>
          <div className="stat-value">{summary.novosClientes}</div>
          <Trend
            current={summary.novosSemana}
            previous={summary.novosSemanaAnterior}
            suffix="esta semana"
          />
        </article>
        <article className="card stat">
          <div className="stat-top">
            <span className="stat-label">Avaliação Média</span>
            <span className="stat-icon">
              <Award size={18} />
            </span>
          </div>
          <div className="stat-value">
            {summary.media !== null ? summary.media.toFixed(1) : "—"}
          </div>
          {summary.media !== null ? (
            <span className="stat-foot">
              <Star size={12} fill="currentColor" />{" "}
              {ratingLabel(summary.media)} ({summary.avaliacoes})
            </span>
          ) : (
            <span className="stat-foot neutral">Sem avaliações ainda</span>
          )}
        </article>
        <article className="card stat">
          <div className="stat-top">
            <span className="stat-label">Horários Disponíveis</span>
            <span className="stat-icon">
              <Calendar size={18} />
            </span>
          </div>
          <div className="stat-value">{slotsWeek}</div>
          {slotsWeek > 0 || slotsToday > 0 ? (
            <span className="stat-foot">{slotsToday} livres hoje</span>
          ) : (
            <Link
              href="/prestador/agenda"
              className="stat-foot"
              style={{ color: "var(--blue)" }}
            >
              Configure sua agenda
            </Link>
          )}
        </article>
      </div>

      <section className="card table-card">
        <h2 className="section-title" style={{ marginBottom: 24 }}>
          Próximos Agendamentos
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="Nenhum agendamento próximo">
            Quando clientes agendarem com você, eles aparecerão aqui.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Data e Horário</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => (
                  <tr
                    key={a.id}
                    className="clickable"
                    onClick={() => setDetails(a)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setDetails(a)}
                  >
                    <td>
                      <span className="person">
                        <Avatar
                          name={a.cliente?.nome || "?"}
                          src={a.cliente?.avatarUrl}
                          size={32}
                        />
                        {a.cliente?.nome || "Cliente removido"}
                      </span>
                    </td>
                    <td>{a.servico}</td>
                    <td>{formatDateTime(a.inicio)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AppointmentModal
        appointment={details}
        viewer="prestador"
        onClose={() => setDetails(null)}
        onChange={(updated) => {
          setDetails(updated);
          setUpcoming((list) =>
            ["pendente", "confirmado"].includes(updated.status)
              ? list.map((a) => (a.id === updated.id ? updated : a))
              : list.filter((a) => a.id !== updated.id),
          );
        }}
        onChat={(id) => openChatWith(id, "/prestador", notify)}
      />
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "prestador",
  async (ctx, user) => {
    const today = todayISO();
    const [summary, upcoming, slots] = await Promise.all([
      appointment.providerSummary(user.id),
      appointment.listForProvider(user.id, { proximos: true, limit: 5 }),
      availability.freeSlots(user.id, today, 7),
    ]);
    const slotsWeek = Object.values(slots).reduce(
      (sum, list) => sum + list.length,
      0,
    );
    return {
      props: {
        summary,
        upcoming,
        slotsWeek,
        slotsToday: slots[today]?.length || 0,
      },
    };
  },
);
