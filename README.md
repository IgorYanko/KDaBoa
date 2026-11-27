# KdABoa

Sistema que conecta jovens a eventos da sua cidade.

## Problema

Faltam opções de lazer e cultura para jovens, e muitas pessoas não sabem o que acontece por perto.

## Público-alvo

Jovens entre 17 e 25 anos que procuram se divertir.

## Proposta

- Mostrar os eventos próximos para que as pessoas saibam o que vai acontecer.
- Permitir que as pessoas confirmem presença em eventos.
- Permitir que os usuários vejam quem confirmou presença.

## No ar

- App: https://kdaboa-five.vercel.app
- API: https://kdaboa.onrender.com (documentação Swagger em `/docs`)

## Funcionalidades

- Cadastro de pessoa ou de empresa (CNPJ validado), login com token JWT e recuperação de senha por e-mail.
- Início com busca, filtros por categoria e período e paginação.
- Detalhe do evento, "Eu vou", Quem vai e seguir pessoas.
- Chat do evento em tempo real (WebSocket), com denúncia de mensagem e bloqueio de usuário.
- Chat mútuo: conversa privada entre quem se segue nos dois sentidos.
- Divulgar, editar e excluir evento (só quem criou ou um administrador); foto da capa e novo local pelo CEP (ViaCEP).
- Mapa dos eventos (Leaflet + OpenStreetMap) com "o que tem por perto".
- Venda de ingresso no app para eventos verificados (Mercado Pago, cartão e PIX).
- Agenda (próximos e passados, ingressos comprados) e Perfil.
- Área de admin: cadastro de locais e categorias.
- Lembrete de evento por e-mail.

## Arquitetura

Monorepo com pnpm workspaces:

| Pasta | O que é | Tecnologias | Onde roda |
| --- | --- | --- | --- |
| `apps/frontend` | App web pensado para celular | React 19, TypeScript, Vite, CSS Modules | Vercel |
| `apps/backend` | API REST e chat em tempo real | Node, Express, TypeScript, socket.io, Prisma | Render (Docker) |
| `apps/db` | Schema e migrations | PostgreSQL, Prisma | Neon |

No front, as telas não chamam a API direto: passam por `src/services/`, que escolhe entre os dados de exemplo (`src/mocks/`) e a API, conforme `VITE_USAR_MOCK`. Os formatos combinados com o backend ficam em `src/dtos/`. Mais detalhes em [`apps/frontend/README.md`](apps/frontend/README.md).

A cada pull request, o GitHub Actions roda build, lint e testes. Depois do merge na `main`, a Vercel publica o front e o Render publica a API.

## Como rodar

Na raiz do repositório, com o pnpm 10:

```bash
pnpm install
pnpm dev            # API em http://localhost:3333 e app em http://localhost:5173
pnpm dev:backend    # só a API
pnpm dev:frontend   # só o app
pnpm lint
pnpm build
```

O código fica em `apps/backend` e `apps/frontend`. A API lê `JWT_SECRET` de `apps/backend/.env` (modelo em `apps/backend/.env.example`).
## Banco de dados

O banco é PostgreSQL, e o schema é versionado com migrations do Prisma em `apps/db/prisma/migrations/`.

1. Copie `apps/backend/.env.example` para `apps/backend/.env` e preencha o `DATABASE_URL` com os dados do seu PostgreSQL.
2. Aplique as migrations:

```bash
pnpm --filter kdaboa-backend db:migrate
```

Num banco vazio, o comando cria todas as tabelas. Rodar de novo num banco já migrado não recria nada: só as migrations pendentes são aplicadas.

Para alterar o schema, edite `apps/db/prisma/schema.prisma` e gere uma nova migration com `pnpm --filter kdaboa-backend db:dev -- --name descricao_da_mudanca`.

## Usuários de teste

O seed (`pnpm --filter kdaboa-backend db:seed`) cria usuários e 21 eventos de Pouso Alegre, e pode rodar mais de uma vez sem duplicar. Senha de todos: `kdaboa123`.

| E-mail | Perfil |
| --- | --- |
| `usuario@kdaboa.com` | Usuário comum |
| `organizador@kdaboa.com` | Empresa (CNPJ), vende ingresso no app |
| `admin@kdaboa.com` | Administrador |

## Pagamento de ingresso

Conta com CNPJ (`perfil` `ORGANIZADOR`) cria evento verificado. Só esse evento pode ligar a venda de ingresso no app. O checkout é no próprio site (cartão tokenizado no navegador e PIX) e o valor cai na conta Mercado Pago da plataforma.

No sandbox, preencha `MERCADO_PAGO_ACCESS_TOKEN` em `apps/backend/.env` e `VITE_MERCADO_PAGO_PUBLIC_KEY` no frontend. Enquanto um dos dois estiver vazio, a tela de checkout explica que o pagamento ainda não está ligado. Cartões e usuários de teste ficam no painel do Mercado Pago (credenciais de teste da aplicação). O e-mail de quem compra precisa ser o e-mail do usuário de teste, porque a cobrança usa o e-mail da conta no KdABoa.

O webhook é `POST /api/pagamentos/webhook`. Em desenvolvimento ele só recebe aviso se `MERCADO_PAGO_NOTIFICATION_URL` for uma URL pública (por exemplo um túnel) apontando para essa rota. Cartão aprovado na hora já emite o ingresso sem esperar o webhook. O webhook repetido não gera outro ingresso.


## Equipe

- Igor Yanko: PO
- João Pedro da Costa Figueiredo: backend
- Kayo Winicius: front
- Rafael: banco de dados
- Luiz Otávio: deploy e CI

## Pontos de complexidade

| Item | Onde está |
| --- | --- |
| WebSocket | Chat do evento e chat mútuo (`apps/backend/src/socket.ts`) |
| CI/CD | GitHub Actions (build, lint, testes) e deploy automático na Vercel e no Render |
| Pagamento | Mercado Pago: cartão tokenizado, PIX e webhook |
| Testes automatizados | Testes da API com Vitest e Supertest (`apps/backend/src/tests`) |
| API externa | ViaCEP (endereço pelo CEP) e OpenStreetMap (mapa) |
| Recuperação de senha | Link por e-mail com token de uso único e validade |
| Documentação da API | Swagger em `/docs` |
| Design responsivo | Telas de 320 px a desktop |

## Uso de IA

**Ferramentas.** No front usamos o **Claude Code** como par de programação: transformar os frames do Figma em telas, escrever services e mocks, revisar os PRs antes de enviar, investigar erros de integração com a API e escrever testes que abrem as telas num navegador e conferem o resultado. Ele também ajudou em partes do backend ligadas a essas telas (capa do evento, chat mútuo e rotas da área de admin), sempre revisadas pelo responsável do backend antes do merge. O relato detalhado do front está em [`apps/frontend/README.md`](apps/frontend/README.md#uso-de-ia-front).

**O que funcionou bem.** Telas saindo rápido e no padrão do projeto; testes de ponta a ponta contra o mock e contra a API com um PostgreSQL de teste; achar problemas fora do front, como migrations que faltavam em produção e diferenças entre as rotas que o front chamava e as que o backend criou.

**Onde a IA errou.** Supôs rotas antes de o backend existir e foi preciso ajustar; alguns testes automáticos falharam por erro no próprio teste; PRs empilhados apareceram com arquivos repetidos até a base ser juntada.

**Como validamos.** Todo PR passa por build, lint e testes no CI e pela revisão do PO; cada tela foi testada no navegador, no modo mock e no modo API, em celular e desktop; o que dependia do backend ficou marcado como PENDENTE no código. Cada integrante sabe explicar o código da sua parte.
