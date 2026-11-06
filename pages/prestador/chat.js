import { useState, useEffect } from "react";
import DashboardLayout from "components/layout/DashboardLayout.jsx";
import Avatar from "components/ui/Avatar.jsx";
import { apiFetch } from "services/api.js";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    apiFetch("/conversations").then(setConversations).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    apiFetch(`/conversations/${activeConv.id}/messages`)
      .then(setMessages)
      .catch(console.error);
  }, [activeConv]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    try {
      const newMsg = await apiFetch(
        `/conversations/${activeConv.id}/messages`,
        {
          method: "POST",
          body: { texto: text },
        },
      );
      setMessages((prev) => [...prev, newMsg]);
      setText("");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-[calc(100vh-140px)] flex">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveConv(c)}
            className={`p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
              activeConv?.id === c.id ? "bg-slate-100" : ""
            }`}
          >
            <Avatar name={c.outro_nome} url={c.outro_avatar} size="md" />
            <div>
              <h4 className="font-bold text-sm text-gray-900">
                {c.outro_nome}
              </h4>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {c.ultima_mensagem || "Sem mensagens"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <Avatar
                name={activeConv.outro_nome}
                url={activeConv.outro_avatar}
                size="sm"
              />
              <span className="font-bold text-gray-900">
                {activeConv.outro_nome}
              </span>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.autor_id === activeConv.outro_id ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                      m.autor_id === activeConv.outro_id
                        ? "bg-white text-gray-800 border"
                        : "bg-[#1B2A4E] text-white"
                    }`}
                  >
                    {m.texto}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t flex gap-2 bg-white"
            >
              <input
                type="text"
                placeholder="Escreva uma mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B2A4E] text-white rounded-lg text-sm font-medium"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-gray-400 text-sm">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
}

ChatPage.getLayout = (page) => (
  <DashboardLayout role="prestador">{page}</DashboardLayout>
);
