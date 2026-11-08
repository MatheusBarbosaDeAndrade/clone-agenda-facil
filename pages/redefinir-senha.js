import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { PasswordField, SubmitButton } from "components/Field.jsx";
import { api } from "lib/api.js";
import passwordReset from "models/password-reset.js";

export default function RedefinirSenha({ token, valid }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    if (senha !== confirmacao) {
      setErrors({ confirmacao: "As senhas não conferem." });
      return;
    }
    setLoading(true);
    try {
      await api("/api/v1/auth/reset-password", {
        method: "POST",
        body: { token, senha },
      });
      setDone(true);
    } catch (error) {
      setErrors(error.fields);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      pageTitle="Redefinir senha"
      text="Crie uma nova senha forte para proteger sua conta."
    >
      <h1>Redefinir senha</h1>
      {!valid ? (
        <>
          <div
            className="alert alert-error"
            role="alert"
            style={{ marginTop: 20 }}
          >
            <CircleAlert size={18} />
            <span>
              Este link de recuperação é inválido ou expirou. Solicite um novo.
            </span>
          </div>
          <Link href="/recuperar-senha" className="btn btn-primary btn-block">
            Solicitar novo link
          </Link>
        </>
      ) : done ? (
        <>
          <div
            className="alert alert-success"
            role="status"
            style={{ marginTop: 20 }}
          >
            <CircleCheckBig size={22} />
            <div>
              <strong>Senha alterada!</strong>
              Por segurança, todas as sessões abertas foram encerradas.
            </div>
          </div>
          <Link href="/login" className="btn btn-primary btn-block">
            Ir para o login
          </Link>
        </>
      ) : (
        <>
          <p className="lead">Escolha uma nova senha para sua conta.</p>
          {message && Object.keys(errors).length === 0 && (
            <div className="alert alert-error" role="alert">
              <CircleAlert size={18} /> <span>{message}</span>
            </div>
          )}
          <form onSubmit={submit} noValidate>
            <PasswordField
              label="Nova senha"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              error={errors.senha}
              hint="Mínimo de 8 caracteres, com letras e números."
            />
            <PasswordField
              label="Confirmar nova senha"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              error={errors.confirmacao}
            />
            <SubmitButton loading={loading}>Salvar nova senha</SubmitButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export async function getServerSideProps(ctx) {
  ctx.res.setHeader("Cache-Control", "no-store");
  ctx.res.setHeader("Referrer-Policy", "no-referrer");
  const token =
    typeof ctx.query.token === "string" ? ctx.query.token.slice(0, 200) : "";
  const valid = token ? Boolean(await passwordReset.validate(token)) : false;
  return { props: { token, valid } };
}
