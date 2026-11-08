import Link from "next/link";
import { CalendarClock } from "lucide-react";

export default function Logo({ variant = "dark", href = "/" }) {
  return (
    <Link
      href={href}
      className={`logo ${variant === "light" ? "logo-light" : ""}`}
      aria-label="AgendaFácil — início"
    >
      <span className="logo-mark" aria-hidden="true">
        <CalendarClock size={20} strokeWidth={2.2} />
      </span>
      AgendaFácil
    </Link>
  );
}
