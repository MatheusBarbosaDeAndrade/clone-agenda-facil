import { useState } from "react";
import { CircleAlert, CircleCheckBig, MailCheck } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { SubmitButton, TextField } from "components/Field.jsx";
import { api } from "lib/api.js";
import { homePathFor } from "infra/page-auth.js";
import session from "models/session.js";
import user from "models/user.js";

export default function ConfirmarEmail({ email: initialEmail, devMailbox }) {
  const [email, setEmail] = useState(initialEmail);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend(event) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const body = editing ? { email: newEmail } : {};
      const result = await api("/api/v1/auth/email-verification", {
        method: "POST",
        body,
      });
      if (result.verificado) {
        window.location.href = "/login";
        return;
      }
      setEmail(result.email);
      setEditing(false);
      setMessage(`Enviamos um novo link para ${result.email}.`);
    } catch (err) {
      setError(err.fields?.email || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <AuthLayout
      pageTitle="Confirme seu e-mail"
      text="Falta pouco! Confirme seu e-mail para proteger sua conta e começar a agendar."
    >
      <div className="feature-icon" style={{ marginBottom: 20 }}>
        <MailCheck size={22} />
      </div>
      <h1>Confirme seu e-mail</h1>
      <p className="lead">
        Enviamos um link de confirmação para <strong>{email}</strong>. Abra o
        e-mail e clique em “Confirmar e-mail” para ativar sua conta. Verifique
        também a caixa de spam.
      </p>

      {devMailbox && (
        <div className="alert alert-info" role="note">
          <span>
            <strong>Ambiente de desenvolvimento</strong>
            Os e-mails não saem para a internet. Veja o link de confirmação na
            caixa local em{" "}
            <a href={devMailbox} target="_blank" rel="noopener noreferrer">
              {devMailbox}
            </a>{" "}
            (ou no terminal do <code>npm run dev</code>).
          </span>
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          <CircleCheckBig size={20} />
          <span>{message}</span>
        </div>
      )}
      {error && !editing && (
        <div className="alert alert-error" role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {editing ? (
        <form onSubmit={resend} noValidate>
          <TextField
            label="E-mail correto"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            error={error}
          />
          <SubmitButton loading={loading}>Salvar e reenviar link</SubmitButton>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <>
          <SubmitButton type="button" loading={loading} onClick={resend}>
            Reenviar link
          </SubmitButton>
          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ marginTop: 12 }}
            onClick={() => setEditing(true)}
          >
            Digitei o e-mail errado
          </button>
        </>
      )}

      <p className="auth-foot">
        Já confirmou? <a href="/login">Entrar</a> ·{" "}
        <button
          type="button"
          onClick={logout}
          style={{
            background: "none",
            border: "none",
            color: "var(--blue)",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            font: "inherit",
          }}
        >
          Sair
        </button>
      </p>
    </AuthLayout>
  );
}

export async function getServerSideProps(ctx) {
  ctx.res.setHeader("Cache-Control", "private, no-store");
  const current = await session.findValid(ctx.req);
  const found = current ? await user.findById(current.usuarioId) : null;
  if (!found) return { redirect: { destination: "/login", permanent: false } };
  if (found.emailVerificado)
    return {
      redirect: { destination: homePathFor(found.papel), permanent: false },
    };
  const devMailbox =
    process.env.NODE_ENV !== "production" &&
    process.env.SMTP_HOST === "localhost"
      ? "http://localhost:8025"
      : null;
  return { props: { email: found.email, devMailbox } };
}
