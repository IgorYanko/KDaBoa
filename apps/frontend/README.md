# KdABoa — front

App web (React + TypeScript + Vite) pensado para celular. Plano completo em [`docs/PLANO-FRONT.md`](../../docs/PLANO-FRONT.md).

## Rodar

Na raiz do monorepo:

```bash
pnpm install
pnpm dev:frontend   # abre em http://localhost:5173
```

Para testar no celular na mesma rede Wi-Fi: `pnpm --filter kdaboa-frontend dev --host` e abra o endereço "Network" que aparecer.

## Outros comandos

```bash
pnpm --filter kdaboa-frontend build   # checa os tipos e gera a versão de produção em dist/
pnpm --filter kdaboa-frontend lint    # Biome
```
