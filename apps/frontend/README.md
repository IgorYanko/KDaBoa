# KdABoa — front

App web (React + TypeScript + Vite) pensado para celular.

## Rodar

Na raiz do monorepo:

```bash
pnpm install
pnpm dev:frontend   # abre em http://localhost:5173
```

Para testar no celular na mesma rede Wi-Fi: `pnpm --filter kdaboa-frontend dev --host` e abra o endereço "Network" que aparecer.

## Dados: mock ou API

No `pnpm dev:frontend` o front usa **dados mock** (`src/mocks/`), então não precisa da API rodando.
Para usar a API do backend, crie `apps/frontend/.env.local` (veja `.env.example`):

```
VITE_USAR_MOCK=false
VITE_API_URL=http://localhost:3333
```

Usuário de teste: `kayo@email.com` com qualquer senha.

## Outros comandos

```bash
pnpm --filter kdaboa-frontend build   # checa os tipos e gera a versão de produção em dist/
pnpm --filter kdaboa-frontend lint    # Biome
```
