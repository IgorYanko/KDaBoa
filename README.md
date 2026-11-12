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

## Equipe

- João Pedro da Costa Figueiredo: Backend
- Igor Yanko: PO
- Luiz Otávio: Deploy
- Kayo Winicius: Front
- Rafael Manoel: Banco