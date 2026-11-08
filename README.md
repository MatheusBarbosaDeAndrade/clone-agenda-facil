# AgendaFácil

Plataforma de agendamentos que conecta **clientes** a **prestadores de serviços**. Desenvolvida por Matheus Barbosa como Trabalho de Conclusão de Curso.

- **Cliente:** busca prestadores, agenda horários livres, acompanha agendamentos e histórico, avalia atendimentos e conversa por chat.
- **Prestador:** painel com indicadores, gestão de disponibilidade semanal, gestão de agendamentos (confirmar, concluir, cancelar, não compareceu), quadro de avisos e chat.

O layout segue o protótipo em [`referencia_imagens/`](referencia_imagens/).

## Stack

| Camada         | Tecnologia                                                     |
| -------------- | -------------------------------------------------------------- |
| Front + API    | Next.js 16 (Pages Router) · React 19                           |
| Banco de dados | PostgreSQL + migrações com `node-pg-migrate`                   |
| Validação      | Zod (mesmos esquemas no cliente e no servidor)                 |
| Testes         | Jest (unitários e de integração contra a API real)             |
| Deploy         | Vercel (região São Paulo) + Neon Postgres · alternativa Docker |

## Rodando localmente

Pré-requisitos: **Node.js 24** (`nvm use`) e **Docker**.

```bash
npm install
npm run dev          # sobe o Postgres no Docker, aplica migrações e inicia em http://localhost:3000
```

Em outro terminal, para popular com dados de demonstração (apenas desenvolvimento):

```bash
npm run dev:seed
```

Contas criadas (senha `senha1234`): cliente `joao@agendafacil.dev`; prestadores `maria@agendafacil.dev` e `ana@agendafacil.dev`.

Sem SMTP configurado, os e-mails de recuperação de senha aparecem no terminal do `npm run dev`.

### Scripts

| Comando                                     | Descrição                                                 |
| ------------------------------------------- | --------------------------------------------------------- |
| `npm run dev`                               | Ambiente de desenvolvimento completo                      |
| `npm test`                                  | Testes (requer `npm run dev` rodando em outro terminal)   |
| `npm run build` / `npm start`               | Build e servidor de produção                              |
| `npm run migrations:up` / `migrations:down` | Aplica / reverte migrações (dev)                          |
| `npm run migrations:create -- nome`         | Cria nova migração                                        |
| `npm run secrets:generate`                  | Gera chave de criptografia e senha do banco para produção |
| `npm run maintenance`                       | Executa manualmente a rotina de retenção de dados         |
| `npm run lint:check` / `lint:fix`           | Prettier                                                  |

## Estrutura

```
components/   componentes React (layouts, chat, perfil, modais...)
infra/        banco, criptografia, sessão/controller, e-mail, OAuth, migrações, scripts, deploy
lib/          código compartilhado cliente/servidor (constantes, formatação, validação, cliente HTTP)
models/       regras de negócio e acesso a dados
pages/        páginas (cliente/, prestador/, autenticação, legais) e API em pages/api/v1
public/       imagens e favicon
tests/        testes unitários e de integração
```

## Segurança e LGPD

**Proteção de dados**

- Senhas com **scrypt** (parâmetros OWASP), comparação em tempo constante e proteção contra enumeração de usuários.
- **Telefone** e **mensagens do chat** criptografados em repouso com **AES-256-GCM**; login por telefone via índice cego (HMAC).
- Sessões opacas guardadas apenas como hash, revogáveis, em cookie `HttpOnly` + `Secure` + `SameSite=Lax` com prefixo `__Host-`. Troca/redefinição de senha encerra as demais sessões.
- Tokens de recuperação de uso único, válidos por 30 minutos, guardados como hash.
- Fotos de perfil redimensionadas no navegador, validadas pela assinatura binária e servidas só para usuários autenticados.

**Proteção da aplicação**

- Content-Security-Policy estrita (sem scripts inline), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- CSRF: verificação de `Origin` + exigência de JSON + `SameSite`.
- Rate limit persistido no banco (login, cadastro, recuperação, mensagens, agendamentos).
- Autorização em todas as rotas (papel + dono do recurso). Consultas parametrizadas; buscas com `LIKE` escapadas.
- Agendamentos sem dupla reserva: lock transacional + índice único parcial.
- Banco sem porta exposta em produção; conexão com TLS quando o banco é externo.

**LGPD (Lei 13.709/2018)**

- Aceite dos Termos e da Política no cadastro, **registrado com versão e data** (art. 8º).
- [Política de Privacidade](pages/privacidade.js) com finalidades, bases legais, compartilhamento, retenção, segurança e canal do encarregado.
- Direitos do titular (art. 18) em **Perfil → Privacidade e dados**: acesso e **portabilidade** (download JSON), **correção** e **eliminação** da conta (com anonimização do histórico da outra parte).
- Minimização: apenas cookies essenciais, sem rastreadores/analytics, fontes servidas do próprio domínio.
- Retenção automática (rotina horária): sessões e tokens expirados apagados; registros de acesso (IP) mantidos por **6 meses** (Marco Civil, art. 15) e então eliminados.
- Telefone do cliente visível apenas ao prestador com quem ele agendou.

## Deploy

Veja **[DEPLOY.md](DEPLOY.md)**.
