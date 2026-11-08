import { useMemo, useState } from "react";
import { ArrowDown, ClipboardList, Search } from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import Avatar from "components/Avatar.jsx";
import StatusBadge from "components/StatusBadge.jsx";
import EmptyState from "components/EmptyState.jsx";
import AppointmentModal from "components/AppointmentModal.jsx";
import { openChatWith } from "components/ChatView.jsx";
import { useToast } from "components/Toast.jsx";
import { APPOINTMENT_STATUS } from "lib/constants.js";
import { formatDateTime } from "lib/format.js";
import { withPageAuth } from "infra/page-auth.js";
import appointment from "models/appointment.js";

function normalize(text) {
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function PrestadorAgendamentos({ user, appointments: initial }) {
  const { notify } = useToast();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState(null);

  const filtered = useMemo(() => {
    const term = normalize(q.trim());
    return items.filter((a) => {
      if (status && a.status !== status) return false;
      if (!term) return true;
      return normalize(
        `${a.cliente?.nome || ""} ${a.servico} ${formatDateTime(a.inicio)}`,
      ).includes(term);
    });
  }, [items, q, status]);

  return (
    <DashboardLayout
      user={user}
      title="Meus Agendamentos"
      subtitle="Visualize, filtre e gerencie todos os compromissos agendados por seus clientes."
    >
      <div
        style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}
      >
        <div className="search" style={{ flex: 1, minWidth: 240 }}>
          <Search size={18} />
          <label htmlFor="busca" className="sr-only">
            Buscar
          </label>
          <input
            id="busca"
            className="input"
            placeholder="Buscar cliente, serviço ou data..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label htmlFor="status" className="sr-only">
            Filtrar por status
          </label>
          <select
            id="status"
            className="select"
            style={{
              appearance: "none",
              paddingRight: 44,
              fontWeight: 700,
              minWidth: 164,
            }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {Object.entries(APPOINTMENT_STATUS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ArrowDown
            size={16}
            style={{
              position: "absolute",
              right: 16,
              top: 14,
              pointerEvents: "none",
              color: "var(--text)",
            }}
          />
        </div>
      </div>

      <section className="card table-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              items.length ? "Nenhum resultado" : "Nenhum agendamento ainda"
            }
          >
            {items.length
              ? "Ajuste a busca ou o filtro de status."
              : "Configure sua agenda para começar a receber clientes."}
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
                {filtered.map((a) => (
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
          setItems((list) =>
            list.map((a) => (a.id === updated.id ? updated : a)),
          );
        }}
        onChat={(id) => openChatWith(id, "/prestador", notify)}
      />
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "prestador",
  async (ctx, user) => ({
    props: { appointments: await appointment.listForProvider(user.id) },
  }),
);
