import DashboardLayout from "components/DashboardLayout.jsx";
import ChatView from "components/ChatView.jsx";
import { withPageAuth } from "infra/page-auth.js";
import chat from "models/chat.js";

export default function PrestadorChat({ user, conversations, activeId }) {
  return (
    <DashboardLayout
      user={user}
      title="Mensagens"
      subtitle="Converse em tempo real com seus clientes."
    >
      <ChatView
        initialConversations={conversations}
        initialActiveId={activeId}
        emptyText="Nenhuma conversa ainda. Seus clientes podem enviar mensagens pela sua página."
      />
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "prestador",
  async (ctx, user) => {
    const conversations = await chat.listConversations(user);
    const requested = typeof ctx.query.c === "string" ? ctx.query.c : null;
    const activeId = conversations.some((c) => c.id === requested)
      ? requested
      : null;
    return { props: { conversations, activeId } };
  },
);
