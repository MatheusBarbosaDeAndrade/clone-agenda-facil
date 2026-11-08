import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CircleAlert } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { PasswordField, SubmitButton, TextField } from "components/Field.jsx";
import { api } from "lib/api.js";
import { redirectIfAuthenticated } from "infra/page-auth.js";
import { isGoogleEnabled } from "infra/google.js";

const GOOGLE_ERRORS = {
  google_cancelado: "O login com o Google foi cancelado.",
  google_email_nao_verificado: "Seu e-mail do Google não está verificado.",
  google_indisponivel: "O login com o Google não está disponível no momento.",
};

export default function Login({ googleEnabled }) {
  const router = useRouter();
  const [form, setForm] = useState({
    identificador: "",
    senha: "",
    lembrar: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const queryError =
    typeof router.query.erro === "string"
      ? GOOGLE_ERRORS[router.query.erro] ||
        "Não foi possível entrar com o Google. Tente novamente."
      : "";

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");
    try {
      const next =
        typeof router.query.next === "string"
          ? `?next=${encodeURIComponent(router.query.next)}`
          : "";
      const result = await api(`/api/v1/auth/login${next}`, {
        method: "POST",
        body: form,
      });
      window.location.href = result.redirectTo;
    } catch (error) {
      setErrors(error.fields);
      setMessage(error.message);
      setLoading(false);
    }
  }

  const set = (key) => (event) =>
    setForm((f) => ({
      ...f,
      [key]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));

  return (
    <AuthLayout
      pageTitle="Entrar"
      text="Gerencie seus compromissos, acompanhe o fluxo de clientes e acelere suas vendas com nossa plataforma."
    >
      <h1>Bem-vindo de volta</h1>
      <p className="lead">Insira suas credenciais para acessar sua conta.</p>

      {(message || queryError) && (
        <div className="alert alert-error" role="alert">
          <CircleAlert size={18} />
          <span>{message || queryError}</span>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <TextField
          label="Email ou Telefone"
          placeholder="Ex: maria@email.com"
          autoComplete="username"
          value={form.identificador}
          onChange={set("identificador")}
          error={errors.identificador}
          required
        />
        <PasswordField
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.senha}
          onChange={set("senha")}
          error={errors.senha}
          required
        />
        <div className="auth-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.lembrar}
              onChange={set("lembrar")}
            />
            Lembrar-me
          </label>
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </div>
        <SubmitButton loading={loading}>Entrar</SubmitButton>
      </form>

      {googleEnabled && (
        <>
          <div className="divider">ou</div>
          <a
            className="btn btn-outline btn-block"
            href={`/api/v1/auth/google${form.lembrar ? "?lembrar=1" : ""}`}
          >
            Entrar com o Google
          </a>
        </>
      )}

      <p className="auth-foot">
        Não tem uma conta? <Link href="/cadastro">Cadastrar</Link>
      </p>
    </AuthLayout>
  );
}

export const getServerSideProps = redirectIfAuthenticated(async () => ({
  props: { googleEnabled: isGoogleEnabled() },
}));
