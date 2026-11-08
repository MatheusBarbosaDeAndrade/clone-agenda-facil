import { useState } from "react";
import { CircleAlert } from "lucide-react";
import AuthLayout from "components/AuthLayout.jsx";
import { SubmitButton } from "components/Field.jsx";
import {
  ConsentCheckbox,
  PhoneField,
  ProviderFields,
  RoleToggle,
} from "components/RoleFields.jsx";
import { api } from "lib/api.js";
import googleSignup from "models/google-signup.js";

export default function CompletarCadastro({ nome, email }) {
  const [form, setForm] = useState({
    papel: "cliente",
    telefone: "",
    local: "",
    especialidade: "",
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
      const result = await api("/api/v1/auth/google/complete", {
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

  return (
    <AuthLayout
      pageTitle="Completar cadastro"
      text="Falta pouco! Complete seus dados para começar a usar o AgendaFácil."
    >
      <h1>Olá, {nome.split(" ")[0]}!</h1>
      <p className="lead">
        Você está entrando com <strong>{email}</strong>. Escolha o tipo de
        perfil e complete as informações.
      </p>
      <RoleToggle
        value={form.papel}
        onChange={(papel) => setForm((f) => ({ ...f, papel }))}
      />
      {message && Object.keys(errors).length === 0 && (
        <div className="alert alert-error" role="alert">
          <CircleAlert size={18} /> <span>{message}</span>
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <PhoneField
          value={form.telefone}
          onChange={(telefone) => setForm((f) => ({ ...f, telefone }))}
          error={errors.telefone}
        />
        {form.papel === "prestador" && (
          <ProviderFields form={form} set={set} errors={errors} />
        )}
        <ConsentCheckbox
          checked={form.aceiteTermos}
          onChange={(aceiteTermos) => setForm((f) => ({ ...f, aceiteTermos }))}
          error={errors.aceiteTermos}
        />
        <SubmitButton loading={loading}>Concluir cadastro</SubmitButton>
      </form>
    </AuthLayout>
  );
}

export async function getServerSideProps(ctx) {
  ctx.res.setHeader("Cache-Control", "no-store");
  const pending = await googleSignup.find(ctx.req);
  if (!pending)
    return { redirect: { destination: "/login", permanent: false } };
  return { props: { nome: pending.nome, email: pending.email } };
}
