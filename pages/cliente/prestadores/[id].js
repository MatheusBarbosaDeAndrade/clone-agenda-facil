import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";

export default function AgendarHorario() {
  const router = useRouter();
  const { id } = router.query;
  const [provider, setProvider] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/providers/${id}`).then(setProvider).catch(console.error);
    apiFetch(`/providers/${id}/available-days`)
      .then(setAvailableDays)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    apiFetch(`/providers/${id}/slots?data=${selectedDate}`)
      .then(setSlots)
      .catch(console.error);
  }, [id, selectedDate]);

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);

    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: {
          providerId: id,
          servico: provider.especialidade,
          data: selectedDate,
          hora: selectedSlot,
        },
      });
      router.push("/cliente/agendamentos");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!provider) return <div>A carregar prestador...</div>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <Avatar name={provider.nome} url={provider.avatar_url} size="lg" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          {provider.nome}
        </h2>
        <p className="text-sm font-semibold text-blue-600">
          {provider.especialidade}
        </p>
        <p className="text-sm text-gray-500 mt-1">📍 {provider.local}</p>
        <div className="mt-6">
          <h4 className="font-bold text-sm text-gray-700">Sobre</h4>
          <p className="text-sm text-gray-600 mt-1">
            {provider.bio || "Sem biografia."}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 mb-2">1. Selecione a Data</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {selectedDate && (
          <div>
            <h3 className="font-bold text-gray-900 mb-2">
              2. Selecione o Horário
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 text-sm font-medium rounded-lg border ${
                    selectedSlot === slot
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={!selectedDate || !selectedSlot || submitting}
          className="w-full py-3 bg-[#1B2A4E] text-white font-medium rounded-lg disabled:opacity-50 hover:bg-slate-800"
        >
          {submitting ? "A agendar..." : "Confirmar Agendamento"}
        </button>
      </div>
    </div>
  );
}

AgendarHorario.getLayout = (page) => (
  <DashboardLayout role="cliente">{page}</DashboardLayout>
);
