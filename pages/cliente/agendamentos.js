import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CalendarCheck, History } from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import Avatar from "components/Avatar.jsx";
import StatusBadge from "components/StatusBadge.jsx";
import Modal from "components/Modal.jsx";
import EmptyState from "components/EmptyState.jsx";
import AppointmentModal from "components/AppointmentModal.jsx";
import { openChatWith } from "components/ChatView.jsx";
import { useToast } from "components/Toast.jsx";
import { api } from "lib/api.js";
import { formatDateTime } from "lib/format.js";
import { withPageAuth } from "infra/page-auth.js";
import appointment from "models/appointment.js";

export default function MeusAgendamentos({
  user,
  upcoming: initialUpcoming,
  history: initialHistory,
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [tab, setTab] = useState(
    router.query.aba === "historico" ? "historico" : "agendados",
  );
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [history, setHistory] = useState(initialHistory);
  const [details, setDetails] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function refresh() {
    const [u, h] = await Promise.all([
      api("/api/v1/appointments?aba=agendados"),
      api("/api/v1/appointments?aba=historico"),
    ]);
    setUpcoming(u);
    setHistory(h);
  }

  async function cancel() {
    setCancelling(true);
    try {
      await api(`/api/v1/appointments/${cancelTarget.id}/status`, {
        method: "PATCH",
        body: { status: "cancelado" },
      });
      notify("Agendamento cancelado.");
      setCancelTarget(null);
      await refresh();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setCancelling(false);
    }
  }

  const list = tab === "agendados" ? upcoming : history;

  return (
    <DashboardLayout
      user={user}
      title="Meus Agendamentos"
      subtitle="Acompanhe o status e histórico de todas as suas solicitações com prestadores."
    >
      <div className="tabs" role="tablist">
        {[
          ["agendados", "Agendados"],
          ["historico", "Histórico"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card">
          {tab === "agendados" ? (
            <EmptyState icon={CalendarCheck} title="Nenhum agendamento ativo">
              <Link href="/cliente/prestadores">Encontre um prestador</Link> e
              agende seu primeiro horário.
            </EmptyState>
          ) : (
            <EmptyState icon={History} title="Seu histórico está vazio">
              Atendimentos concluídos e cancelados aparecerão aqui.
            </EmptyState>
          )}
        </div>
      ) : (
        <div className="appt-list">
          {list.map((a) => (
            <article key={a.id} className="card appt-row">
              <div className="who">
                <Avatar
                  name={a.prestador?.nome || "?"}
                  src={a.prestador?.avatarUrl}
                  size={48}
                />
                <div style={{ minWidth: 0 }}>
                  <h3>{a.prestador?.nome || "Prestador removido"}</h3>
                  <div className="muted">{a.servico}</div>
                </div>
              </div>
              <div className="when">{formatDateTime(a.inicio)}</div>
              <div className="status">
                <StatusBadge status={a.status} concluidoTone="success" />
              </div>
              <div className="actions">
                {tab === "agendados" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setCancelTarget(a)}
                    >
                      Cancelar
                    </button>
                    {a.prestador && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          openChatWith(a.prestador.id, "/cliente", notify)
                        }
                      >
                        Chat
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setDetails(a)}
                    >
                      Ver Detalhes
                    </button>
                    {a.prestador && (
                      <Link
                        href={`/cliente/prestadores/${a.prestador.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Agendar Novamente
                      </Link>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <AppointmentModal
        appointment={details}
        viewer="cliente"
        onClose={() => setDetails(null)}
        onChange={(updated) => {
          setDetails(updated);
          refresh();
        }}
        onChat={(id) => openChatWith(id, "/cliente", notify)}
      />

      <Modal
        open={Boolean(cancelTarget)}
        title="Cancelar agendamento"
        onClose={() => setCancelTarget(null)}
      >
        {cancelTarget && (
          <p>
            Deseja cancelar o agendamento com{" "}
            <strong>{cancelTarget.prestador?.nome}</strong> em{" "}
            <strong>{formatDateTime(cancelTarget.inicio)}</strong>? O horário
            ficará disponível para outras pessoas.
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline btn-md"
            onClick={() => setCancelTarget(null)}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-danger btn-md"
            disabled={cancelling}
            onClick={cancel}
          >
            Cancelar agendamento
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth("cliente", async (ctx, user) => {
  const [upcoming, history] = await Promise.all([
    appointment.listForClient(user.id, "agendados"),
    appointment.listForClient(user.id, "historico"),
  ]);
  return { props: { upcoming, history } };
});
