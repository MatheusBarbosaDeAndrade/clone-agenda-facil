export const CATEGORIAS = [
  "Psicologia",
  "Design",
  "Nutrição",
  "Consultoria",
  "Medicina",
  "Educação",
  "Outros",
];

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const STATUS_AGENDAMENTO_BADGE = {
  pendente: { label: "Pendente", class: "bg-amber-100 text-amber-800" },
  confirmado: { label: "Confirmado", class: "bg-emerald-100 text-emerald-800" },
  concluido: { label: "Concluído", class: "bg-blue-100 text-blue-800" },
  cancelado: { label: "Cancelado", class: "bg-rose-100 text-rose-800" },
  nao_compareceu: {
    label: "Não compareceu",
    class: "bg-orange-100 text-orange-800",
  },
};
