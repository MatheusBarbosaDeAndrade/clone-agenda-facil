import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Camera, Download, ShieldCheck, Trash2 } from "lucide-react";
import Avatar from "components/Avatar.jsx";
import Modal from "components/Modal.jsx";
import { PasswordField, SubmitButton, TextField } from "components/Field.jsx";
import { PhoneField } from "components/RoleFields.jsx";
import { useToast } from "components/Toast.jsx";
import { api } from "lib/api.js";
import { formatDateLong, formatPhone } from "lib/format.js";
import { SERVICE_DURATIONS } from "lib/constants.js";

const DURATION_LABELS = {
  30: "30 minutos",
  45: "45 minutos",
  60: "1 hora",
  90: "1h30",
  120: "2 horas",
};

const DOC_LABELS = {
  termos_de_uso: "Termos de Uso",
  politica_de_privacidade: "Política de Privacidade",
};

/** Redimensiona a foto no navegador (256×256) antes do envio: menos dados trafegados e armazenados. */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      URL.revokeObjectURL(url);
      let data = canvas.toDataURL("image/webp", 0.85);
      if (!data.startsWith("data:image/webp"))
        data = canvas.toDataURL("image/jpeg", 0.85);
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

export default function ProfileView({ user: initialUser, consents }) {
  const { notify } = useToast();
  const router = useRouter();
  const [user, setUserState] = useState(initialUser);
  // Atualiza o estado local e recarrega as props da página (nome/foto no cabeçalho).
  const setUser = (value) => {
    setUserState(value);
    router.replace(router.asPath, undefined, { scroll: false });
  };
  const isProvider = user.papel === "prestador";
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    nome: user.nome,
    email: user.email,
    telefone: formatPhone(user.telefone),
    especialidade: user.prestador?.especialidade || "",
    local: user.prestador?.local || "",
    bio: user.prestador?.bio || "",
    duracaoMinutos: user.prestador?.duracaoMinutos || 60,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmacao: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ senha: "", confirmacao: "" });
  const [deleteErrors, setDeleteErrors] = useState({});
  const [deleting, setDeleting] = useState(false);

  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const body = {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
      };
      if (isProvider) {
        body.prestador = {
          especialidade: form.especialidade,
          local: form.local,
          bio: form.bio,
          duracaoMinutos: Number(form.duracaoMinutos),
        };
      }
      const updated = await api("/api/v1/users/me", { method: "PATCH", body });
      if (!updated.emailVerificado) {
        // E-mail alterado: precisa confirmar o novo endereço.
        window.location.href = "/confirmar-email";
        return;
      }
      setUser(updated);
      notify("Perfil atualizado com sucesso.");
    } catch (error) {
      setErrors(error.fields);
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return notify("Selecione um arquivo de imagem.", "error");
    try {
      const imagem = await resizeImage(file);
      setUser(
        await api("/api/v1/users/me/avatar", {
          method: "PUT",
          body: { imagem },
        }),
      );
      notify("Foto atualizada.");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function removeAvatar() {
    try {
      setUser(await api("/api/v1/users/me/avatar", { method: "DELETE" }));
      notify("Foto removida.");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordErrors({});
    if (passwords.novaSenha !== passwords.confirmacao) {
      setPasswordErrors({ confirmacao: "As senhas não conferem." });
      return;
    }
    setSavingPassword(true);
    try {
      await api("/api/v1/users/me/password", {
        method: "PUT",
        body: {
          senhaAtual: passwords.senhaAtual,
          novaSenha: passwords.novaSenha,
        },
      });
      setPasswords({ senhaAtual: "", novaSenha: "", confirmacao: "" });
      setUserState((u) => ({ ...u, temSenha: true }));
      notify("Senha alterada. Outras sessões foram encerradas.");
    } catch (error) {
      setPasswordErrors(
        Object.keys(error.fields).length
          ? error.fields
          : { senhaAtual: error.message },
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    setDeleting(true);
    setDeleteErrors({});
    try {
      const result = await api("/api/v1/users/me", {
        method: "DELETE",
        body: deleteForm,
      });
      window.location.href = result.redirectTo;
    } catch (error) {
      setDeleteErrors(
        Object.keys(error.fields).length
          ? error.fields
          : { senha: error.message },
      );
      setDeleting(false);
    }
  }

  return (
    <div className="profile-grid">
      <div>
        <form className="card panel" onSubmit={saveProfile} noValidate>
          <h2>Dados pessoais</h2>
          <p className="panel-sub">Mantenha suas informações atualizadas.</p>

          <div className="avatar-edit">
            <Avatar name={user.nome} src={user.avatarUrl} size={80} />
            <div>
              <div className="btns">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={16} />{" "}
                  {user.avatarUrl ? "Trocar foto" : "Adicionar foto"}
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={removeAvatar}
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>
                JPG, PNG ou WebP. A imagem é reduzida para 256×256 antes do
                envio.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={uploadAvatar}
              />
            </div>
          </div>

          <div className="form-grid">
            <TextField
              className="span-2"
              label="Nome completo"
              value={form.nome}
              onChange={set("nome")}
              error={errors.nome}
              maxLength={120}
              autoComplete="name"
            />
            <TextField
              label="E-mail"
              type="email"
              hint="Ao alterar, enviaremos um link de confirmação."
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              autoComplete="email"
            />
            <PhoneField
              value={form.telefone}
              onChange={(telefone) => setForm((f) => ({ ...f, telefone }))}
              error={errors.telefone}
            />
          </div>

          {isProvider && (
            <>
              <h2 style={{ marginTop: 12 }}>Perfil profissional</h2>
              <p className="panel-sub">
                Estas informações aparecem para os clientes na página de
                agendamento.
              </p>
              <div className="form-grid">
                <TextField
                  label="Tipo de Serviço"
                  value={form.especialidade}
                  onChange={set("especialidade")}
                  error={errors.especialidade}
                  maxLength={120}
                />
                <div className="field">
                  <label htmlFor="duracao">Duração de cada atendimento</label>
                  <select
                    id="duracao"
                    className="select"
                    value={form.duracaoMinutos}
                    onChange={set("duracaoMinutos")}
                  >
                    {SERVICE_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {DURATION_LABELS[d] || `${d} minutos`}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  className="span-2"
                  label="Localização"
                  value={form.local}
                  onChange={set("local")}
                  error={errors.local}
                  maxLength={200}
                />
                <div className="field span-2">
                  <label htmlFor="bio">Sobre você</label>
                  <textarea
                    id="bio"
                    className="textarea"
                    value={form.bio}
                    maxLength={1000}
                    onChange={set("bio")}
                    placeholder="Conte sua experiência e como funciona o seu atendimento."
                  />
                  <span className="field-hint">{form.bio.length}/1000</span>
                </div>
              </div>
            </>
          )}

          <SubmitButton loading={saving} className="btn btn-primary">
            Salvar alterações
          </SubmitButton>
        </form>

        <form className="card panel" onSubmit={changePassword} noValidate>
          <h2>{user.temSenha ? "Alterar senha" : "Definir senha"}</h2>
          <p className="panel-sub">
            {user.temSenha
              ? "Ao alterar a senha, as outras sessões abertas serão encerradas."
              : "Sua conta usa o login com Google. Defina uma senha para também entrar com e-mail."}
          </p>
          <div className="form-grid">
            {user.temSenha && (
              <PasswordField
                className="span-2"
                label="Senha atual"
                autoComplete="current-password"
                value={passwords.senhaAtual}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, senhaAtual: e.target.value }))
                }
                error={passwordErrors.senhaAtual}
              />
            )}
            <PasswordField
              label="Nova senha"
              autoComplete="new-password"
              value={passwords.novaSenha}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, novaSenha: e.target.value }))
              }
              error={passwordErrors.novaSenha}
              hint="Mínimo de 8 caracteres, com letras e números."
            />
            <PasswordField
              label="Confirmar nova senha"
              autoComplete="new-password"
              value={passwords.confirmacao}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirmacao: e.target.value }))
              }
              error={passwordErrors.confirmacao}
            />
          </div>
          <SubmitButton loading={savingPassword} className="btn btn-primary">
            {user.temSenha ? "Alterar senha" : "Definir senha"}
          </SubmitButton>
        </form>
      </div>

      <aside>
        <section className="card panel" id="privacidade">
          <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ShieldCheck size={20} /> Privacidade e dados
          </h2>
          <p className="panel-sub">
            Seus direitos como titular de dados (LGPD, art. 18). Telefone e
            mensagens são armazenados de forma criptografada.
          </p>
          <div className="label" style={{ marginBottom: 10 }}>
            Consentimentos registrados
          </div>
          <ul className="privacy-list">
            {consents.map((c) => (
              <li key={`${c.documento}-${c.versao}`}>
                <span>
                  {DOC_LABELS[c.documento] || c.documento}{" "}
                  <small>(v. {c.versao})</small>
                </span>
                <span>{formatDateLong(c.aceitoEm)}</span>
              </li>
            ))}
          </ul>
          <a
            href="/api/v1/users/me/export"
            className="btn btn-outline btn-block"
            download
          >
            <Download size={16} /> Baixar meus dados (JSON)
          </a>
          <p className="field-hint" style={{ marginTop: 12 }}>
            Leia a <Link href="/privacidade">Política de Privacidade</Link> e os{" "}
            <Link href="/termos">Termos de Uso</Link>.
          </p>
        </section>

        <section className="card panel danger-zone">
          <h2>Excluir conta</h2>
          <p className="panel-sub">
            Remove permanentemente sua conta, fotos, conversas e dados pessoais.
            Agendamentos futuros serão cancelados. Esta ação não pode ser
            desfeita.
          </p>
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} /> Excluir minha conta
          </button>
        </section>
      </aside>

      <Modal
        open={deleteOpen}
        title="Excluir conta"
        onClose={() => setDeleteOpen(false)}
      >
        <form onSubmit={deleteAccount} noValidate>
          <div className="alert alert-error">
            <span>
              Todos os seus dados pessoais serão apagados. Registros de acesso
              (IP e data) são mantidos por 6 meses, conforme exige o Marco Civil
              da Internet, e depois eliminados.
            </span>
          </div>
          {user.temSenha && (
            <PasswordField
              label="Confirme sua senha"
              autoComplete="current-password"
              value={deleteForm.senha}
              onChange={(e) =>
                setDeleteForm((f) => ({ ...f, senha: e.target.value }))
              }
              error={deleteErrors.senha}
            />
          )}
          <TextField
            label='Digite "EXCLUIR" para confirmar'
            value={deleteForm.confirmacao}
            onChange={(e) =>
              setDeleteForm((f) => ({ ...f, confirmacao: e.target.value }))
            }
            error={deleteErrors.confirmacao}
            autoComplete="off"
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline btn-md"
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </button>
            <SubmitButton
              loading={deleting}
              className="btn btn-danger btn-md"
              disabled={deleting || deleteForm.confirmacao !== "EXCLUIR"}
            >
              Excluir definitivamente
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
