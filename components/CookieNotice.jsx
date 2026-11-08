import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "agendafacil_aviso_cookies";

/**
 * O AgendaFácil usa apenas cookies estritamente necessários (sessão e
 * segurança), que dispensam consentimento (LGPD art. 7º, V e IX). Ainda assim,
 * informamos o titular de forma transparente (art. 6º, VI).
 */
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;
  return (
    <div
      className="cookie-notice"
      role="region"
      aria-label="Aviso sobre cookies"
    >
      <strong>Sua privacidade importa</strong>
      Usamos apenas cookies essenciais para manter você conectado com segurança.
      Não usamos cookies de publicidade ou rastreamento. Saiba mais na nossa{" "}
      <Link href="/privacidade">Política de Privacidade</Link>.
      <div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            try {
              window.localStorage.setItem(KEY, "1");
            } catch {}
            setVisible(false);
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
