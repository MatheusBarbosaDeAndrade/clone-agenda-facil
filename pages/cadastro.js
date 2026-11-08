import { useState } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { PasswordField, SubmitButton, TextField } from "components/Field.jsx";
import {
  ConsentCheckbox,
  PhoneField,
  ProviderFields,
  RoleToggle,
} from "components/RoleFields.jsx";
import { api } from "lib/api.js";
import { redirectIfAuthenticated } from "infra/page-auth.js";
import { isGoogleEnabled } from "infra/google.js";

export default function Cadastro({ googleEnabled, perfilInicial }) {
  const [form, setForm] = useState({
    papel: perfilInicial,
    nome: "",
    telefone: "",
    local: "",
    especialidade: "",
    email: "",
    senha: "",
    aceiteTermos: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");
    const body = { ...form };
    if (body.papel === "cliente") {
      delete body.local;
      delete body.especialidade;
    }
    try {
      const result = await api("/api/v1/auth/register", {
        method: "POST",
        body,
      });
      window.location.href = result.redirectTo;
    } catch (error) {
      setErrors(error.fields);
      setMessage(error.message);
      setLoading(false);
    }
  }

  const isProvider = form.papel === "prestador";

  return (
    <AuthLayout
      pageTitle="Criar conta"
      text="Crie sua conta em menos de 2 minutos e comece a receber agendamentos online hoje mesmo."
    >
      <h1>Comece gratuitamente</h1>
      <p className="lead">
        Escolha o tipo de perfil e preencha as informações.
      </p>

      <RoleToggle
        value={form.papel}
        onChange={(papel) => setForm((f) => ({ ...f, papel }))}
      />

      {message && Object.keys(errors).length === 0 && (
        <div className="alert alert-error" role="alert">
          <CircleAlert size={18} />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <TextField
          label="Nome completo"
          placeholder="Ex: Maria Silva"
          autoComplete="name"
          value={form.nome}
          onChange={set("nome")}
          error={errors.nome}
          maxLength={120}
          required
        />
        <PhoneField
          value={form.telefone}
          onChange={(telefone) => setForm((f) => ({ ...f, telefone }))}
          error={errors.telefone}
        />
        {isProvider && <ProviderFields form={form} set={set} errors={errors} />}
        <TextField
          label="E-mail"
          type="email"
          placeholder="maria@email.com"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          required
        />
        <PasswordField
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.senha}
          onChange={set("senha")}
          error={errors.senha}
          hint="Mínimo de 8 caracteres, com letras e números."
          required
        />
        <ConsentCheckbox
          checked={form.aceiteTermos}
          onChange={(aceiteTermos) => setForm((f) => ({ ...f, aceiteTermos }))}
          error={errors.aceiteTermos}
        />
        <SubmitButton loading={loading}>Cadastrar</SubmitButton>
      </form>

      {googleEnabled && !isProvider && (
        <>
          <div className="divider">ou</div>
          <a className="btn btn-outline btn-block" href="/api/v1/auth/google">
            Entrar com o Google
          </a>
        </>
      )}

      <p className="auth-foot">
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}

export const getServerSideProps = redirectIfAuthenticated(async (ctx) => ({
  props: {
    googleEnabled: isGoogleEnabled(),
    perfilInicial: ctx.query.perfil === "prestador" ? "prestador" : "cliente",
  },
}));
