import { TIMEZONE } from "lib/constants.js";

const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEKDAYS_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const WEEKDAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

/** Retorna as partes de data/hora de um instante no fuso da aplicação. */
export function zonedParts(value) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(get("weekday"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: get("hour"),
    minute: get("minute"),
    weekday: weekdayIndex,
  };
}

/** "24 Fev, 2026 — 09:00" */
export function formatDateTime(value, separator = "—") {
  const p = zonedParts(value);
  return `${String(p.day).padStart(2, "0")} ${MONTHS_SHORT[p.month - 1]}, ${p.year} ${separator} ${p.hour}:${p.minute}`;
}

/** "24 de Fev, 2026" */
export function formatDateLong(value) {
  const p = zonedParts(value);
  return `${String(p.day).padStart(2, "0")} de ${MONTHS_SHORT[p.month - 1]}, ${p.year}`;
}

export function formatTime(value) {
  const p = zonedParts(value);
  return `${p.hour}:${p.minute}`;
}

/** "09:41", "Ontem" ou "12/02" para listas de conversa. */
export function formatRelativeShort(value) {
  if (!value) return "";
  const p = zonedParts(value);
  const today = zonedParts(new Date());
  const yesterday = zonedParts(new Date(Date.now() - 86_400_000));
  if (p.year === today.year && p.month === today.month && p.day === today.day) {
    return `${p.hour}:${p.minute}`;
  }
  if (
    p.year === yesterday.year &&
    p.month === yesterday.month &&
    p.day === yesterday.day
  ) {
    return "Ontem";
  }
  return `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")}`;
}

// ---- Datas "de calendário" (YYYY-MM-DD) sem fuso ----
export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, amount) {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + amount);
  return toISODate(date);
}

export function todayISO() {
  const p = zonedParts(new Date());
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function describeISODate(iso) {
  const date = parseISODate(iso);
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth(),
    year: date.getUTCFullYear(),
    weekday: date.getUTCDay(),
    weekdayShort: WEEKDAYS_SHORT[date.getUTCDay()],
    weekdayLong: WEEKDAYS_LONG[date.getUTCDay()],
    monthShort: MONTHS_SHORT[date.getUTCMonth()],
    monthLong: MONTHS_LONG[date.getUTCMonth()],
  };
}

export function formatPhone(digits) {
  if (!digits) return "";
  const d = String(digits).replace(/\D/g, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

/** Máscara progressiva para o campo de telefone. */
export function maskPhone(value) {
  const d = String(value).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function firstName(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)[0] || ""
  );
}

export function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
