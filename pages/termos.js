import Link from "next/link";
import LegalLayout, { getLegalInfo } from "components/LegalLayout.jsx";
import { LEGAL_VERSIONS } from "lib/constants.js";

export default function Termos({ info }) {
  return (
    <LegalLayout title="Termos de Uso" updated={LEGAL_VERSIONS.termos_de_uso}>
      <p>
        Bem-vindo ao AgendaFácil. Ao criar uma conta você concorda com estes
        Termos de Uso e com a nossa{" "}
        <Link href="/privacidade">Política de Privacidade</Link>. Leia com
        atenção.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O AgendaFácil é uma plataforma que conecta clientes a prestadores de
        serviços, permitindo a busca de profissionais, o agendamento de
        horários, a comunicação por chat e a publicação de avisos. O AgendaFácil
        não presta os serviços anunciados e não é parte da relação entre cliente
        e prestador.
      </p>

      <h2>2. Cadastro e conta</h2>
      <ul>
        <li>
          Você deve ter 18 anos ou mais e fornecer informações verdadeiras e
          atualizadas.
        </li>
        <li>
          Você é responsável por manter sua senha em sigilo e por todas as
          atividades realizadas na sua conta.
        </li>
        <li>
          Avise-nos imediatamente em caso de uso não autorizado da sua conta.
        </li>
      </ul>

      <h2>3. Responsabilidades do prestador</h2>
      <ul>
        <li>
          Manter a disponibilidade da agenda atualizada e comparecer aos
          atendimentos confirmados.
        </li>
        <li>
          Possuir as habilitações legais exigidas para a atividade que oferece.
        </li>
        <li>
          Utilizar os dados dos clientes exclusivamente para a realização do
          atendimento agendado, respeitando a LGPD.
        </li>
      </ul>

      <h2>4. Responsabilidades do cliente</h2>
      <ul>
        <li>
          Comparecer aos horários agendados ou cancelá-los com antecedência pela
          plataforma.
        </li>
        <li>
          Tratar os prestadores com respeito e avaliar os atendimentos de forma
          honesta.
        </li>
      </ul>

      <h2>5. Condutas proibidas</h2>
      <ul>
        <li>
          Publicar conteúdo ilegal, ofensivo, discriminatório ou que viole
          direitos de terceiros.
        </li>
        <li>
          Enviar spam, tentar acessar contas de terceiros ou explorar falhas de
          segurança.
        </li>
        <li>Usar a plataforma para coletar dados de outros usuários.</li>
      </ul>
      <p>
        O descumprimento destes Termos pode levar à suspensão ou exclusão da
        conta.
      </p>

      <h2>6. Disponibilidade e limitação de responsabilidade</h2>
      <p>
        Empregamos esforços razoáveis para manter a plataforma disponível e
        segura, mas não garantimos funcionamento ininterrupto. O AgendaFácil não
        se responsabiliza pela qualidade, execução ou pagamento dos serviços
        contratados entre cliente e prestador.
      </p>

      <h2>7. Encerramento</h2>
      <p>
        Você pode encerrar sua conta a qualquer momento em Perfil → “Excluir
        minha conta”. Os dados serão tratados conforme a Política de
        Privacidade.
      </p>

      <h2>8. Alterações e legislação</h2>
      <p>
        Estes Termos podem ser atualizados, e mudanças relevantes serão
        comunicadas. Aplica-se a legislação brasileira, incluindo o Código de
        Defesa do Consumidor quando cabível.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas? Escreva para <a href={`mailto:${info.email}`}>{info.email}</a>.
      </p>
    </LegalLayout>
  );
}

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  return { props: { info: getLegalInfo() } };
}
