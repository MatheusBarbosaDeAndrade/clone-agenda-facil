import LegalLayout, { getLegalInfo } from "components/LegalLayout.jsx";
import { LEGAL_VERSIONS } from "lib/constants.js";

export default function Privacidade({ info }) {
  return (
    <LegalLayout
      title="Política de Privacidade"
      updated={LEGAL_VERSIONS.politica_de_privacidade}
    >
      <p>
        Esta Política explica como o AgendaFácil trata os dados pessoais de
        clientes e prestadores de serviço, em conformidade com a Lei Geral de
        Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e o Marco Civil
        da Internet (Lei nº 12.965/2014).
      </p>

      <h2>1. Quem é o controlador</h2>
      <p>
        O controlador dos dados é <strong>{info.controlador}</strong>
        {info.documento && <>, inscrito(a) sob o nº {info.documento}</>}
        {info.endereco && <>, com endereço em {info.endereco}</>}.{" "}
        {info.encarregado ? (
          <>
            O(A) encarregado(a) pelo tratamento de dados pessoais (DPO) é{" "}
            <strong>{info.encarregado}</strong>, que pode ser contatado(a) pelo
            e-mail <a href={`mailto:${info.email}`}>{info.email}</a>.
          </>
        ) : (
          <>
            Para assuntos de privacidade, fale com o nosso canal do encarregado:{" "}
            <a href={`mailto:${info.email}`}>{info.email}</a>.
          </>
        )}
      </p>

      <h2>2. Quais dados coletamos e por quê</h2>
      <table>
        <thead>
          <tr>
            <th>Dado</th>
            <th>Finalidade</th>
            <th>Base legal (LGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome, e-mail e senha</td>
            <td>
              Criar e proteger sua conta, permitir o login e enviar comunicações
              essenciais (ex.: recuperação de senha).
            </td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Telefone</td>
            <td>
              Login alternativo e contato do prestador com o cliente sobre um
              agendamento.
            </td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>
              Local de atendimento, tipo de serviço e descrição (prestadores)
            </td>
            <td>
              Exibir o perfil profissional para que clientes possam agendar.
            </td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Foto de perfil (opcional)</td>
            <td>
              Identificação visual dentro da plataforma, visível apenas para
              usuários autenticados.
            </td>
            <td>
              Consentimento (art. 7º, I) — você pode removê-la a qualquer
              momento
            </td>
          </tr>
          <tr>
            <td>Agendamentos, avaliações, avisos e mensagens do chat</td>
            <td>
              Prestar o serviço de agendamento e comunicação entre as partes.
            </td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Endereço IP e data/hora de acesso</td>
            <td>
              Segurança, prevenção a fraudes e cumprimento da guarda de
              registros de acesso.
            </td>
            <td>
              Obrigação legal (art. 7º, II — Marco Civil, art. 15) e legítimo
              interesse (art. 7º, IX)
            </td>
          </tr>
          <tr>
            <td>Registro de aceite destes termos</td>
            <td>Comprovar o aceite dos Termos de Uso e desta Política.</td>
            <td>Cumprimento de obrigação legal (art. 8º, §2º)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Não coletamos dados pessoais sensíveis (art. 5º, II) de forma
        intencional. Recomendamos que você <strong>não</strong> compartilhe
        informações de saúde, religião, biometria ou similares no chat. O
        AgendaFácil não vende, aluga nem usa seus dados para publicidade.
      </p>

      <h2>3. Com quem compartilhamos</h2>
      <ul>
        <li>
          <strong>Entre as partes de um agendamento:</strong> o prestador vê o
          nome, a foto e o telefone do cliente que agendou com ele; o cliente vê
          o perfil profissional do prestador.
        </li>
        <li>
          <strong>Operadores de infraestrutura:</strong> provedores de
          hospedagem, banco de dados e envio de e-mails, que tratam dados apenas
          conforme nossas instruções e sob obrigações de confidencialidade.
        </li>
        <li>
          <strong>Hospedagem:</strong> a aplicação roda na Vercel e o banco de
          dados no Neon, configurados em servidores localizados no Brasil (São
          Paulo). Como são empresas estrangeiras, pode haver transferência
          internacional de dados, realizada com cláusulas contratuais de
          proteção de dados e medidas de segurança adequadas (LGPD, art. 33).
        </li>
        <li>
          <strong>Google</strong>, somente se você optar por “Entrar com o
          Google” — recebemos seu nome, e-mail e um identificador da conta.
        </li>
        <li>
          <strong>Autoridades</strong>, quando houver obrigação legal ou ordem
          judicial.
        </li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        Usamos apenas cookies <strong>estritamente necessários</strong>: um
        cookie de sessão (para manter você conectado) e, durante o login com
        Google, um cookie temporário de segurança. Eles são protegidos
        (HttpOnly, Secure, SameSite) e não servem para rastreamento ou
        publicidade. Não utilizamos ferramentas de análise de terceiros. As
        fontes do site são servidas do nosso próprio domínio.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <ul>
        <li>
          Dados da conta, agendamentos e mensagens: enquanto a conta existir.
        </li>
        <li>Sessões: até 12 horas, ou 30 dias se você marcar “Lembrar-me”.</li>
        <li>Links de recuperação de senha: 30 minutos.</li>
        <li>
          Registros de acesso (IP e data/hora): 6 meses, conforme o Marco Civil
          da Internet, sendo eliminados automaticamente após esse prazo.
        </li>
      </ul>
      <p>
        Ao excluir sua conta, seus dados pessoais são apagados. Agendamentos
        passados permanecem no histórico da outra parte sem identificar você
        (“Usuário removido”).
      </p>

      <h2>6. Como protegemos seus dados</h2>
      <ul>
        <li>Conexão criptografada (HTTPS/TLS) em todo o site.</li>
        <li>
          Senhas armazenadas com hash forte (scrypt) — nem a equipe tem acesso a
          elas.
        </li>
        <li>
          Telefone e mensagens do chat criptografados no banco de dados
          (AES-256-GCM).
        </li>
        <li>
          Sessões revogáveis, limite de tentativas de login e proteção contra
          ataques comuns da web (CSRF, XSS, clickjacking).
        </li>
        <li>
          Acesso às informações restrito às partes envolvidas em cada
          agendamento ou conversa.
        </li>
      </ul>
      <p>
        Em caso de incidente de segurança que possa gerar risco ou dano
        relevante, comunicaremos os titulares afetados e a Autoridade Nacional
        de Proteção de Dados (ANPD), nos termos do art. 48 da LGPD.
      </p>

      <h2>7. Seus direitos</h2>
      <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>
          <strong>Confirmar e acessar</strong> seus dados e{" "}
          <strong>obter uma cópia (portabilidade)</strong> — em Perfil → “Baixar
          meus dados”.
        </li>
        <li>
          <strong>Corrigir</strong> dados incompletos ou desatualizados — em
          Perfil.
        </li>
        <li>
          <strong>Eliminar</strong> seus dados e{" "}
          <strong>revogar o consentimento</strong> — em Perfil → “Excluir minha
          conta”.
        </li>
        <li>
          Obter informações sobre com quem seus dados são compartilhados (seção
          3).
        </li>
        <li>Opor-se a tratamentos e peticionar à ANPD.</li>
      </ul>
      <p>
        Para qualquer solicitação, escreva para{" "}
        <a href={`mailto:${info.email}`}>{info.email}</a>. Responderemos em até
        15 dias.
      </p>

      <h2>8. Crianças e adolescentes</h2>
      <p>
        O AgendaFácil é destinado a maiores de 18 anos. Não coletamos
        intencionalmente dados de menores de idade.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar esta Política. Mudanças relevantes serão comunicadas
        na plataforma e, quando necessário, pediremos um novo aceite. A versão
        vigente é sempre a publicada nesta página.
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
