# KdABoa — front

App web (React + TypeScript + Vite) pensado para celular.

## Rodar

```bash
cd frontend
npm install
npm run dev        # abre em http://localhost:5173
```

Para testar no celular na mesma rede Wi-Fi: `npm run dev -- --host` e abra o endereço "Network" que aparecer.

## Dados: mock ou API

Por padrão o front usa **dados mock** (`src/mocks/`), então não precisa da API rodando.
Para usar a API do backend, crie `frontend/.env.local` (veja `.env.example`):

```
VITE_USAR_MOCK=false
VITE_API_URL=http://localhost:3333
```

Usuário de teste: `kayo@email.com` com qualquer senha.

## Outros comandos

```bash
npm run build      # checa os tipos e gera a versão de produção em dist/
npm run lint       # Biome
```
