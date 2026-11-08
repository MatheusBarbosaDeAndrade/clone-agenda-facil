import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import Modal from "components/Modal.jsx";
import StatusBadge from "components/StatusBadge.jsx";
import { api } from "lib/api.js";
import { formatDateTime, formatPhone, formatTime } from "lib/format.js";
import { useToast } from "components/Toast.jsx";

/**
 * Detalhes de um agendamento com as ações permitidas para quem está vendo.
 * onChange(atualizado) é chamado após qualquer alteração.
 */
export default function AppointmentModal({
  appointment,
  viewer,
  onClose,
  onChange,
  onChat,
}) {
  const { notify } = useToast();
  const [loading, setLoading] = useState("");
  const [rating, setRating] = useState(0);

  if (!appointment) return null;
  const a = appointment;
  const isProvider = viewer === "prestador";
  const active = ["pendente", "confirmado"].includes(a.status);

  async function changeStatus(status, successMessage) {
    setLoading(status);
    try {
      const updated = await api(`/api/v1/appointments/${a.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      notify(successMessage);
      onChange?.(updated);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading("");
    }
  }

  async function rate() {
    setLoading("rating");
    try {
      const updated = await api(`/api/v1/appointments/${a.id}/rating`, {
        method: "POST",
        body: { nota: rating },
      });
      notify("Obrigado pela avaliação!");
      onChange?.(updated);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading("");
    }
  }

  const other = isProvider ? a.cliente : a.prestador;

  return (
    <Modal open title="Detalhes do agendamento" onClose={onClose}>
      <dl className="detail-list">
        <div>
          <dt>{isProvider ? "Cliente" : "Prestador"}</dt>
          <dd>{other?.nome || "Usuário removido"}</dd>
        </div>
        {isProvider && a.cliente?.telefone && (
          <div>
            <dt>Telefone</dt>
            <dd>{formatPhone(a.cliente.telefone)}</dd>
          </div>
        )}
        <div>
          <dt>Serviço</dt>
          <dd>{a.servico}</dd>
        </div>
        <div>
          <dt>Data e horário</dt>
          <dd>
            {formatDateTime(a.inicio)} às {formatTime(a.fim)}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={a.status} />
          </dd>
        </div>
        {a.avaliacao && (
          <div>
            <dt>Avaliação</dt>
            <dd className="rating-inline">
              <Star size={14} fill="currentColor" /> {a.avaliacao}/5
            </dd>
          </div>
        )}
      </dl>

      {!isProvider && a.status === "concluido" && !a.avaliacao && (
        <div style={{ marginTop: 24 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            Como foi o atendimento?
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div className="stars" role="radiogroup" aria-label="Nota de 1 a 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= rating ? "on" : ""}
                  onClick={() => setRating(n)}
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                >
                  <Star size={26} fill="currentColor" />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!rating || loading}
              onClick={rate}
            >
              Enviar avaliação
            </button>
          </div>
        </div>
      )}

      <div className="modal-actions">
        {isProvider && a.status === "pendente" && (
          <button
            type="button"
            className="btn btn-primary btn-md"
            disabled={!!loading}
            onClick={() =>
              changeStatus("confirmado", "Agendamento confirmado.")
            }
          >
            Confirmar
          </button>
        )}
        {isProvider && active && a.jaIniciou && (
          <>
            <button
              type="button"
              className="btn btn-primary btn-md"
              disabled={!!loading}
              onClick={() =>
                changeStatus("concluido", "Atendimento concluído.")
              }
            >
              Marcar como concluído
            </button>
            <button
              type="button"
              className="btn btn-outline btn-md"
              disabled={!!loading}
              onClick={() =>
                changeStatus(
                  "nao_compareceu",
                  "Registrado: cliente não compareceu.",
                )
              }
            >
              Não compareceu
            </button>
          </>
        )}
        {active && (isProvider || !a.jaIniciou) && (
          <button
            type="button"
            className="btn btn-outline btn-md"
            disabled={!!loading}
            onClick={() => changeStatus("cancelado", "Agendamento cancelado.")}
          >
            Cancelar agendamento
          </button>
        )}
        {other && onChat && (
          <button
            type="button"
            className="btn btn-outline btn-md"
            onClick={() => onChat(other.id)}
          >
            Conversar
          </button>
        )}
        {!isProvider && a.prestador && (
          <Link
            href={`/cliente/prestadores/${a.prestador.id}`}
            className="btn btn-primary btn-md"
          >
            Agendar Novamente
          </Link>
        )}
      </div>
    </Modal>
  );
}
