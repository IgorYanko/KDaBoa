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


## Equipe

- João Pedro da Costa Figueiredo: Backend
- Igor Yanko: PO
- Luiz Otávio: Deploy
- Kayo Winicius: Front
- Rafael Manoel: Banco