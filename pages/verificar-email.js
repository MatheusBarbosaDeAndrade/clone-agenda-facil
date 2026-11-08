import Link from "next/link";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { audit } from "infra/audit.js";
import { homePathFor } from "infra/page-auth.js";
import emailVerification from "models/email-verification.js";
import session from "models/session.js";
import user from "models/user.js";

export default function VerificarEmail({ ok, destino }) {
  return (
    <AuthLayout
      pageTitle="Confirmação de e-mail"
      text="Sua segurança em primeiro lugar."
    >
      <h1>{ok ? "E-mail confirmado!" : "Link inválido"}</h1>
      {ok ? (
        <div
          className="alert alert-success"
          role="status"
          style={{ marginTop: 20 }}
        >
          <CircleCheckBig size={22} />
          <div>
            <strong>Tudo certo!</strong>
            Sua conta está ativa. Você já pode usar o AgendaFácil.
          </div>
        </div>
      ) : (
        <div
          className="alert alert-error"
          role="alert"
          style={{ marginTop: 20 }}
        >
          <CircleAlert size={18} />
          <span>
            Este link de confirmação é inválido, já foi usado ou expirou. Entre
            na sua conta para receber um novo.
          </span>
        </div>
      )}
      <Link href={destino} className="btn btn-primary btn-block">
        {ok && destino !== "/login" ? "Continuar" : "Ir para o login"}
      </Link>
    </AuthLayout>
  );
}

export async function getServerSideProps(ctx) {
  ctx.res.setHeader("Cache-Control", "no-store");
  ctx.res.setHeader("Referrer-Policy", "no-referrer");
  const token =
    typeof ctx.query.token === "string" ? ctx.query.token.slice(0, 200) : "";
  const usuarioId = token ? await emailVerification.confirm(token) : null;
  if (usuarioId) await audit(ctx.req, usuarioId, "email_confirmado");

  // Se a pessoa já estiver logada nesta conta, segue direto para o painel.
  const current = await session.findValid(ctx.req);
  const logged = current ? await user.findById(current.usuarioId) : null;
  const destino = logged?.emailVerificado
    ? homePathFor(logged.papel)
    : "/login";
  return { props: { ok: Boolean(usuarioId), destino } };
}
