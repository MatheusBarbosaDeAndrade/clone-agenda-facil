import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "components/DashboardLayout.jsx";
import { SubmitButton } from "components/Field.jsx";
import { useToast } from "components/Toast.jsx";
import { api } from "lib/api.js";
import { TIME_BLOCKS, WEEK_DAYS } from "lib/constants.js";
import { withPageAuth } from "infra/page-auth.js";
import availability from "models/availability.js";

const keyOf = (dia, bloco) => `${dia}|${bloco.inicio}|${bloco.fim}`;

export default function MinhaAgenda({ user, blocks }) {
  const { notify } = useToast();
  const initial = useMemo(
    () => new Set(blocks.map((b) => keyOf(b.diaSemana, b))),
    [blocks],
  );
  const [active, setActive] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty =
    active.size !== saved.size || [...active].some((k) => !saved.has(k));

  function toggle(key) {
    setActive((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const blocos = [...active].map((k) => {
        const [dia, inicio, fim] = k.split("|");
        return { diaSemana: Number(dia), inicio, fim };
      });
      await api("/api/v1/availability", { method: "PUT", body: { blocos } });
      setSaved(new Set(active));
      notify("Disponibilidade salva com sucesso.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      user={user}
      title="Gerenciar Disponibilidade"
      subtitle="Selecione os blocos de horários em que você estará ativo para receber agendamentos."
      showUser={false}
      actions={
        <SubmitButton
          type="button"
          className="btn btn-primary"
          loading={saving}
          disabled={saving || !dirty}
          onClick={save}
        >
          Salvar alterações
        </SubmitButton>
      }
    >
      <section className="card schedule-card">
        <div className="schedule">
          {WEEK_DAYS.map((day) => (
            <div key={day.value} className="schedule-col">
              <div className="schedule-day">{day.label}</div>
              {TIME_BLOCKS.map((bloco) => {
                const key = keyOf(day.value, bloco);
                const on = active.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className="block"
                    aria-pressed={on}
                    onClick={() => toggle(key)}
                    aria-label={`${day.label}, ${bloco.inicio} às ${bloco.fim}: ${on ? "disponível" : "bloqueado"}`}
                  >
                    <strong>
                      {bloco.inicio} - {bloco.fim}
                    </strong>
                    <span>{on ? "Disponível" : "Bloqueado"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="field-hint" style={{ marginTop: 28 }}>
          Cada bloco é dividido em horários de {user.prestador.duracaoMinutos}{" "}
          minutos. Altere a duração do atendimento no seu{" "}
          <Link href="/prestador/perfil">perfil</Link>. Agendamentos já marcados
          não são afetados ao bloquear um horário.
        </p>
      </section>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "prestador",
  async (ctx, user) => ({
    props: { blocks: await availability.listBlocks(user.id) },
  }),
);
