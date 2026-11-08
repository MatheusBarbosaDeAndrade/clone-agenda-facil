import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
} from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import Avatar from "components/Avatar.jsx";
import { SubmitButton } from "components/Field.jsx";
import { openChatWith } from "components/ChatView.jsx";
import { useToast } from "components/Toast.jsx";
import { api } from "lib/api.js";
import { addDays, describeISODate, todayISO } from "lib/format.js";
import { BOOKING_WINDOW_DAYS, NOTICE_COLORS } from "lib/constants.js";
import { withPageAuth } from "infra/page-auth.js";
import provider from "models/provider.js";
import availability from "models/availability.js";
import notice from "models/notice.js";

const WINDOW = 5;

export default function AgendarHorario({
  user,
  provider: p,
  notices,
  initial,
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [from, setFrom] = useState(initial.de);
  const [slots, setSlots] = useState(initial.horarios);
  const [day, setDay] = useState(
    () =>
      Object.keys(initial.horarios).find((d) => initial.horarios[d].length) ||
      initial.de,
  );
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const today = todayISO();
  const maxFrom = addDays(today, BOOKING_WINDOW_DAYS - WINDOW + 1);

  async function load(start) {
    setLoading(true);
    try {
      const data = await api(
        `/api/v1/providers/${p.id}/slots?de=${start}&dias=${WINDOW}`,
      );
      setFrom(data.de);
      setSlots(data.horarios);
      const firstFree = Object.keys(data.horarios).find(
        (d) => data.horarios[d].length,
      );
      setDay(firstFree || data.de);
      setTime("");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => setTime(""), [day]);

  async function confirm() {
    setBooking(true);
    try {
      await api("/api/v1/appointments", {
        method: "POST",
        body: { prestadorId: p.id, data: day, hora: time },
      });
      notify("Agendamento solicitado! Aguarde a confirmação do prestador.");
      router.push("/cliente/agendamentos");
    } catch (error) {
      notify(error.message, "error");
      if (error.status === 409) load(from);
      setBooking(false);
    }
  }

  const days = Object.keys(slots);
  const head = describeISODate(days[0] || from);
  const selected = describeISODate(day);
  const daySlots = slots[day] || [];

  return (
    <DashboardLayout
      user={user}
      title="Agendar Horário"
      subtitle="Preencha o formulário selecionando a data ideal e horário disponível."
    >
      <div className="booking">
        <section className="card profile-card">
          <Avatar name={p.nome} src={p.avatarUrl} size={96} />
          <h2>{p.nome}</h2>
          <div className="specialty" style={{ fontSize: 14 }}>
            {p.especialidade}
          </div>
          {p.mediaAvaliacao !== null && (
            <div className="rating-inline" style={{ marginTop: 8 }}>
              <Star size={14} fill="currentColor" />{" "}
              {p.mediaAvaliacao.toFixed(1)} · {p.totalAvaliacoes} avaliações
            </div>
          )}
          <hr />
          <div className="about">
            <h3>Sobre o Profissional</h3>
            <p>
              {p.bio || "Este profissional ainda não adicionou uma descrição."}
            </p>
            <h3>Localização</h3>
            <p>{p.local}</p>
            {notices.length > 0 && (
              <>
                <h3>Avisos</h3>
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="notice-mini"
                    style={{ borderLeftColor: NOTICE_COLORS[n.cor] }}
                  >
                    <strong>{n.titulo}</strong>
                    <span>{n.texto}</span>
                  </div>
                ))}
              </>
            )}
            <button
              type="button"
              className="btn btn-outline btn-block"
              style={{ marginTop: 8 }}
              onClick={() => openChatWith(p.id, "/cliente", notify)}
            >
              <MessageCircle size={16} /> Enviar mensagem
            </button>
          </div>
        </section>

        <div className="booking-col">
          <section className="card card-pad">
            <div className="calendar-head">
              <h2>
                {head.monthLong}, {head.year}
              </h2>
              <div className="calendar-nav">
                <button
                  type="button"
                  aria-label="Dias anteriores"
                  disabled={loading || from <= today}
                  onClick={() =>
                    load(
                      addDays(from, -WINDOW) < today
                        ? today
                        : addDays(from, -WINDOW),
                    )
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Próximos dias"
                  disabled={loading || from >= maxFrom}
                  onClick={() => load(addDays(from, WINDOW))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="days" role="group" aria-label="Dias">
              {days.map((d) => {
                const info = describeISODate(d);
                const free = slots[d].length;
                return (
                  <button
                    key={d}
                    type="button"
                    className="day"
                    aria-pressed={d === day}
                    disabled={!free || loading}
                    onClick={() => setDay(d)}
                    aria-label={`${info.weekdayLong}, ${info.day} de ${info.monthLong}${free ? "" : " — sem horários"}`}
                  >
                    <small>{info.weekdayShort}</small>
                    <strong>{info.day}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card card-pad">
            <h2
              className="section-title"
              style={{ fontSize: 16, marginBottom: 18 }}
            >
              Horários Disponíveis ({selected.weekdayLong}, {selected.day} de{" "}
              {selected.monthShort})
            </h2>
            {daySlots.length === 0 ? (
              <div className="empty" style={{ padding: "16px 0" }}>
                <CalendarX size={28} />
                <p>
                  {p.temAgenda
                    ? "Sem horários livres nestes dias. Use as setas para ver outros dias."
                    : "Este prestador ainda não abriu horários na agenda."}
                </p>
              </div>
            ) : (
              <div className="slots" role="group" aria-label="Horários">
                {daySlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="slot"
                    aria-pressed={t === time}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </section>

          <SubmitButton
            type="button"
            loading={booking}
            disabled={!time || booking}
            onClick={confirm}
            style={{ height: 48 }}
          >
            Confirmar Agendamento
          </SubmitButton>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth("cliente", async (ctx) => {
  const id = String(ctx.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { notFound: true };
  try {
    const p = await provider.findById(id);
    const de = todayISO();
    const [notices, horarios] = await Promise.all([
      notice.listByProvider(id, 3),
      availability.freeSlots(id, de, WINDOW),
    ]);
    return { props: { provider: p, notices, initial: { de, horarios } } };
  } catch (error) {
    if (error.statusCode === 404) return { notFound: true };
    throw error;
  }
});
