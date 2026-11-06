export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function formatTime(timeString) {
  if (!timeString) return "";
  return timeString.substring(0, 5);
}

export function formatDateTime(dateISO) {
  if (!dateISO) return "";
  const date = new Date(dateISO);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}
