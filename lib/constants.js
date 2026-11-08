export const APP_NAME = "AgendaFácil";

export const TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE || "America/Sao_Paulo";

// Versões dos documentos legais. Ao alterar o conteúdo de /termos ou
// /privacidade, incremente a versão: novos aceites serão registrados.
export const LEGAL_VERSIONS = {
  termos_de_uso: "2026-11-08",
  politica_de_privacidade: "2026-11-08",
};

// Blocos de disponibilidade exibidos em "Minha Agenda".
export const TIME_BLOCKS = [
  { inicio: "08:00", fim: "10:00" },
  { inicio: "10:00", fim: "12:00" },
  { inicio: "14:00", fim: "16:00" },
  { inicio: "16:00", fim: "18:00" },
  { inicio: "18:00", fim: "20:00" },
];

// Ordem de exibição: segunda a domingo. Valor = dia da semana do Postgres (0 = domingo).
export const WEEK_DAYS = [
  { value: 1, label: "Segunda", short: "SEG" },
  { value: 2, label: "Terça", short: "TER" },
  { value: 3, label: "Quarta", short: "QUA" },
  { value: 4, label: "Quinta", short: "QUI" },
  { value: 5, label: "Sexta", short: "SEX" },
  { value: 6, label: "Sábado", short: "SÁB" },
  { value: 0, label: "Domingo", short: "DOM" },
];

export const SERVICE_DURATIONS = [30, 45, 60, 90, 120];

export const APPOINTMENT_STATUS = {
  pendente: { label: "Pendente", tone: "warning" },
  confirmado: { label: "Confirmado", tone: "success" },
  concluido: { label: "Concluído", tone: "info" },
  cancelado: { label: "Cancelado", tone: "danger" },
  nao_compareceu: { label: "Não compareceu", tone: "warning" },
};

export const NOTICE_COLORS = {
  azul: "#3b82f6",
  marrom: "#92400e",
  verde: "#059669",
  vermelho: "#dc2626",
};

export const BOOKING_WINDOW_DAYS = 60;
