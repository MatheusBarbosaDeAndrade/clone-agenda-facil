import ChatPage from "pages/prestador/chat.js";
import DashboardLayout from "components/layout/DashboardLayout.jsx";

export default function ClienteChat() {
  return <ChatPage />;
}

ClienteChat.getLayout = (page) => (
  <DashboardLayout role="cliente">{page}</DashboardLayout>
);
