import { useState } from "react";
import { BellRing, Pencil, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "components/DashboardLayout.jsx";
import Modal from "components/Modal.jsx";
import EmptyState from "components/EmptyState.jsx";
import { SubmitButton, TextField } from "components/Field.jsx";
import { useToast } from "components/Toast.jsx";
import { api } from "lib/api.js";
import { NOTICE_COLORS } from "lib/constants.js";
import { formatDateLong } from "lib/format.js";
import { withPageAuth } from "infra/page-auth.js";
import notice from "models/notice.js";

const EMPTY = { titulo: "", texto: "", cor: "azul" };
const COLOR_NAMES = {
  azul: "Azul",
  marrom: "Marrom",
  verde: "Verde",
  vermelho: "Vermelho",
};

export default function Avisos({ user, notices: initial }) {
  const { notify } = useToast();
  const [notices, setNotices] = useState(initial);
  const [editing, setEditing] = useState(null); // null | "novo" | aviso
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  function open(target) {
    setEditing(target);
    setErrors({});
    setForm(
      target === "novo"
        ? EMPTY
        : { titulo: target.titulo, texto: target.texto, cor: target.cor },
    );
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editing === "novo") {
        const created = await api("/api/v1/notices", {
          method: "POST",
          body: form,
        });
        setNotices((list) => [created, ...list]);
        notify("Aviso publicado.");
      } else {
        const updated = await api(`/api/v1/notices/${editing.id}`, {
          method: "PUT",
          body: form,
        });
        setNotices((list) =>
          list.map((n) => (n.id === updated.id ? updated : n)),
        );
        notify("Aviso atualizado.");
      }
      setEditing(null);
    } catch (error) {
      setErrors(error.fields);
      if (!Object.keys(error.fields).length) notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/api/v1/notices/${removing.id}`, { method: "DELETE" });
      setNotices((list) => list.filter((n) => n.id !== removing.id));
      notify("Aviso excluído.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <DashboardLayout
      user={user}
      title="Quadro de Avisos"
      subtitle="Comunique alterações e avisos importantes aos seus clientes."
      showUser={false}
      actions={
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={() => open("novo")}
          style={{ height: 42 }}
        >
          <Plus size={16} strokeWidth={2.5} /> Novo Aviso
        </button>
      }
    >
      {notices.length === 0 ? (
        <div className="card">
          <EmptyState icon={BellRing} title="Nenhum aviso publicado">
            Os avisos aparecem para os clientes na sua página de agendamento.
          </EmptyState>
        </div>
      ) : (
        <div className="notices">
          {notices.map((n) => (
            <article
              key={n.id}
              className="card notice"
              style={{ "--accent": NOTICE_COLORS[n.cor] }}
            >
              <header>
                <h3>{n.titulo}</h3>
                <div style={{ display: "flex", gap: 2 }}>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => open(n)}
                    aria-label={`Editar aviso ${n.titulo}`}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setRemoving(n)}
                    aria-label={`Excluir aviso ${n.titulo}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </header>
              <p>{n.texto}</p>
              <footer>Criado em {formatDateLong(n.criadoEm)}</footer>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing === "novo" ? "Novo aviso" : "Editar aviso"}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={save} noValidate>
          <TextField
            label="Título"
            value={form.titulo}
            maxLength={120}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            error={errors.titulo}
          />
          <div className="field">
            <label htmlFor="texto">Mensagem</label>
            <textarea
              id="texto"
              className="textarea"
              value={form.texto}
              maxLength={2000}
              aria-invalid={Boolean(errors.texto)}
              onChange={(e) =>
                setForm((f) => ({ ...f, texto: e.target.value }))
              }
            />
            {errors.texto && (
              <span className="field-error">{errors.texto}</span>
            )}
          </div>
          <div className="field">
            <span className="label">Cor de destaque</span>
            <div className="color-options" role="group">
              {Object.entries(NOTICE_COLORS).map(([key, color]) => (
                <button
                  key={key}
                  type="button"
                  style={{ background: color }}
                  aria-pressed={form.cor === key}
                  aria-label={COLOR_NAMES[key]}
                  onClick={() => setForm((f) => ({ ...f, cor: key }))}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline btn-md"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
            <SubmitButton loading={saving} className="btn btn-primary btn-md">
              {editing === "novo" ? "Publicar aviso" : "Salvar"}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(removing)}
        title="Excluir aviso"
        onClose={() => setRemoving(null)}
      >
        <p>
          Tem certeza que deseja excluir o aviso{" "}
          <strong>{removing?.titulo}</strong>?
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline btn-md"
            onClick={() => setRemoving(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger btn-md"
            onClick={remove}
          >
            Excluir
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "prestador",
  async (ctx, user) => ({
    props: { notices: await notice.listByProvider(user.id) },
  }),
);
