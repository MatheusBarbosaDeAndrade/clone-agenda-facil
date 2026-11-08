import DashboardLayout from "components/DashboardLayout.jsx";
import ProfileView from "components/ProfileView.jsx";
import { withPageAuth } from "infra/page-auth.js";
import privacy from "models/privacy.js";

export default function ClientePerfil({ user, consents }) {
  return (
    <DashboardLayout
      user={user}
      title="Perfil"
      subtitle="Gerencie seus dados, sua segurança e sua privacidade."
    >
      <ProfileView user={user} consents={consents} />
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuth(
  "cliente",
  async (ctx, user) => ({
    props: { consents: await privacy.listConsents(user.id) },
  }),
);
