import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import Avatar from "components/Avatar.jsx";
import { api } from "lib/api.js";
import { formatRelativeShort, formatTime } from "lib/format.js";
import { useToast } from "components/Toast.jsx";

const MESSAGE_POLL_MS = 4000;
const LIST_POLL_MS = 12000;

function usePolling(callback, delay, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (!enabled) return;
    const tick = () =>
      document.visibilityState === "visible" && saved.current();
    const id = setInterval(tick, delay);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [delay, enabled]);
}

export default function ChatView({
  initialConversations,
  initialActiveId,
  emptyText,
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialActiveId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  const active = conversations.find((c) => c.id === activeId);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await api("/api/v1/conversations"));
    } catch {}
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    try {
      const data = await api(`/api/v1/conversations/${activeId}/messages`);
      setMessages((current) =>
        current.length === data.length && current.at(-1)?.id === data.at(-1)?.id
          ? current
          : data,
      );
    } catch {}
  }, [activeId]);

  useEffect(() => {
    setMessages([]);
    stickToBottom.current = true;
    loadMessages().then(() => {
      setConversations((list) =>
        list.map((c) => (c.id === activeId ? { ...c, naoLidas: 0 } : c)),
      );
    });
  }, [activeId, loadMessages]);

  usePolling(loadMessages, MESSAGE_POLL_MS, Boolean(activeId));
  usePolling(loadConversations, LIST_POLL_MS);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function select(id) {
    setActiveId(id);
    router.replace(
      { pathname: router.pathname, query: id ? { c: id } : {} },
      undefined,
      { shallow: true },
    );
  }

  async function send(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value || !activeId) return;
    setSending(true);
    try {
      const message = await api(`/api/v1/conversations/${activeId}/messages`, {
        method: "POST",
        body: { texto: value },
      });
      setText("");
      stickToBottom.current = true;
      setMessages((list) => [...list, message]);
      setConversations((list) =>
        [
          ...list.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  ultimaMensagem: value.slice(0, 60),
                  ultimaEm: message.criadoEm,
                  ultimaMensagemMinha: true,
                }
              : c,
          ),
        ].sort((a, b) => new Date(b.ultimaEm) - new Date(a.ultimaEm)),
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`card chat ${activeId ? "has-active" : ""}`}>
      <div className="chat-list" aria-label="Conversas">
        {conversations.length === 0 && (
          <div className="chat-empty" style={{ height: "100%" }}>
            <MessageCircle size={32} />
            <span>{emptyText}</span>
          </div>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chat-item ${c.naoLidas > 0 ? "unread" : ""}`}
            aria-current={c.id === activeId ? "true" : undefined}
            onClick={() => select(c.id)}
          >
            <Avatar name={c.outro.nome} src={c.outro.avatarUrl} size={40} />
            <span className="meta">
              <span className="row">
                <strong>{c.outro.nome}</strong>
                <time>{formatRelativeShort(c.ultimaEm)}</time>
              </span>
              <span className="row">
                <span className="preview">
                  {c.ultimaMensagem
                    ? `${c.ultimaMensagemMinha ? "Você: " : ""}${c.ultimaMensagem}`
                    : "Nenhuma mensagem ainda"}
                </span>
                {c.naoLidas > 0 && (
                  <span
                    className="count-badge"
                    aria-label={`${c.naoLidas} não lidas`}
                  >
                    {c.naoLidas}
                  </span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>

      <section className="chat-pane" aria-label="Mensagens">
        {!active ? (
          <div className="chat-empty">
            <MessageCircle size={36} />
            <span>Selecione uma conversa para começar.</span>
          </div>
        ) : (
          <>
            <header className="chat-head">
              <button
                type="button"
                className="icon-btn chat-back"
                onClick={() => select(null)}
                aria-label="Voltar para conversas"
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar
                name={active.outro.nome}
                src={active.outro.avatarUrl}
                size={36}
              />
              <div>
                <strong>{active.outro.nome}</strong>
                <span
                  className={`status-dot ${active.outro.online ? "online" : ""}`}
                >
                  {active.outro.online
                    ? "Online"
                    : active.outro.subtitulo || "Offline"}
                </span>
              </div>
            </header>
            <div
              className="chat-messages"
              ref={listRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                stickToBottom.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="chat-empty">Envie a primeira mensagem.</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`bubble ${m.minha ? "mine" : ""}`}>
                  {m.texto}
                  <time dateTime={m.criadoEm}>{formatTime(m.criadoEm)}</time>
                </div>
              ))}
            </div>
            <form className="chat-compose" onSubmit={send}>
              <label htmlFor="chat-input" className="sr-only">
                Mensagem
              </label>
              <input
                id="chat-input"
                className="input"
                placeholder="Escreva sua mensagem..."
                value={text}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                className="send"
                disabled={sending || !text.trim()}
                aria-label="Enviar mensagem"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

/** Abre (ou cria) a conversa com um usuário e navega para o chat. */
export async function openChatWith(usuarioId, base, notify) {
  try {
    const { id } = await api("/api/v1/conversations", {
      method: "POST",
      body: { usuarioId },
    });
    window.location.href = `${base}/chat?c=${id}`;
  } catch (error) {
    notify?.(error.message, "error");
  }
}
