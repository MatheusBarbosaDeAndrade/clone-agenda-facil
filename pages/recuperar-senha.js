import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { SubmitButton, TextField } from "components/Field.jsx";
import { api } from "lib/api.js";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/v1/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(err.fields?.email || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      pageTitle="Recuperar senha"
      text="Não se preocupe. O processo de recuperação de acesso é seguro, rápido e prático."
    >
      <h1>Recuperar senha</h1>
      <p className="lead">
        Digite seu email para que possamos lhe enviar as instruções de
        recuperação.
      </p>
      <form onSubmit={submit} noValidate>
        <TextField
          label="Endereço de email"
          type="email"
          placeholder="Ex: maria@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />
        <SubmitButton
          loading={loading}
          style={{ marginTop: 6, marginBottom: 24 }}
        >
          Enviar link de recuperação
        </SubmitButton>
      </form>
      {sent && (
        <div className="alert alert-success" role="status">
          <CircleCheckBig size={22} />
          <div>
            <strong>Link enviado!</strong>
            Se o e-mail estiver cadastrado, você receberá o link. Verifique sua
            caixa de entrada e spam.
          </div>
        </div>
      )}
      {!sent && error && !error.includes("e-mail") && (
        <div className="alert alert-error" role="alert">
          <CircleAlert size={18} /> <span>{error}</span>
        </div>
      )}
      <p className="auth-foot">
        Voltar para o <Link href="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}
