# KdABoa — front

App web do KdABoa, pensado primeiro para o celular e adaptado para tablet e desktop.
Mostra os eventos de Pouso Alegre, deixa confirmar presença, ver quem vai e conversar no chat do evento.

## Tecnologias

| Para quê | O que usamos | Por quê |
|---|---|---|
| Interface | React 19 + TypeScript | Componentes reaproveitáveis e erros de tipo pegos antes de rodar |
| Build e servidor de desenvolvimento | Vite | Rápido e simples de configurar |
| Rotas | React Router | Telas públicas, privadas (exigem login) e de admin |
| Estilo | CSS Modules + variáveis em `src/styles/tokens.css` | Estilo isolado por componente e um só lugar para cores, fontes e espaços |
| Mapa | Leaflet + OpenStreetMap | Mapa gratuito, sem chave de API |
| Chat em tempo real | socket.io-client | Conversa ao vivo com o servidor de chat do backend |
| Endereço pelo CEP | ViaCEP | API pública e gratuita |
| Qualidade | Biome (lint) e `tsc` (tipos) | Rodam no CI a cada PR |

## Rodar

Na raiz do monorepo:

```bash
pnpm install
pnpm dev:frontend   # abre em http://localhost:5173
```

Para testar no celular na mesma rede Wi-Fi: `pnpm --filter kdaboa-frontend dev --host` e abra o endereço "Network" que aparecer.

Outros comandos:

```bash
pnpm --filter kdaboa-frontend build   # checa os tipos e gera a versão de produção em dist/
pnpm --filter kdaboa-frontend lint    # Biome
```

## Dados: mock ou API

No `pnpm dev:frontend` o front usa **dados de exemplo** (`src/mocks/`), então não precisa da API rodando.
Para usar a API do backend, crie `apps/frontend/.env.local` (veja `.env.example`):

```
VITE_USAR_MOCK=false
VITE_API_URL=http://localhost:3333
```

No build de produção o mock vem desligado, a menos que `VITE_USAR_MOCK=true` seja definido de propósito.

**Usuários de teste do modo mock (um por perfil):**

| Perfil | E-mail | Senha | O que pode |
|---|---|---|---|
| Usuário | `kayo@email.com` | `senha123` | Ver e divulgar eventos, confirmar presença, chat, seguir, agenda e perfil |
| Admin | `admin@email.com` | `admin123` | Tudo do usuário, mais editar e excluir qualquer evento e cadastrar locais e categorias |

## Telas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` · `/cadastro` | Login e cadastro (com interesses) | Pública |
| `/redefinir-senha` | Pedir o link por e-mail e criar a nova senha pelo token | Pública |
| `/inicio` | Eventos com busca, filtros por período e categoria, e paginação | Logado |
| `/eventos/:id` | Detalhe, confirmar presença, editar e excluir (criador ou admin) | Logado |
| `/eventos/:id/mapa` | Mapa com o local, eventos por perto e a sua posição | Logado |
| `/eventos/:id/quem-vai` | Quem confirmou (só presença visível), busca e seguir | Logado |
| `/eventos/:id/chat` | Chat em tempo real, denunciar mensagem e bloquear usuário | Quem confirmou presença |
| `/agenda` | Eventos confirmados, em próximos e passados | Logado |
| `/perfil` | Interesses, presença visível, lembretes e sair da conta | Logado |
| `/divulgar` · `/eventos/:id/editar` | Criar e editar evento (com novo local pelo CEP) | Logado |
| `/admin` | Cadastro de locais e categorias | Só admin |

## Arquitetura do front

```
pages/        uma pasta por tela (a tela só desenha e reage ao usuário)
  │
  ▼
services/     o que a tela pode pedir: listarEventos, confirmarPresenca, criarLocal...
  │   └──▶ mocks/        dados de exemplo (quando VITE_USAR_MOCK está ligado)
  ▼
api/client.ts uma função só para falar com a API: põe o token, trata erros e lentidão
  │
  ▼
API (Express)  ←─  dtos/index.ts descreve o formato de tudo que vai e volta
```

- **Regra principal:** tela nunca chama `fetch` direto. Sempre passa por um service, e é por isso que o mesmo código funciona com o mock e com a API real.
- **`dtos/index.ts`:** o contrato com o backend. Campos marcados como PENDENTE são os que a tela já usa, mas a API ainda não manda.
- **`contexts/AuthContext`:** guarda a sessão (token e usuário, com o perfil) e faz login e logout. Se a API responder 401, a sessão é encerrada.
- **`components/RotaPrivada`:** sem login, manda para `/login`.
- **Permissões:** o front esconde o que a pessoa não pode fazer (ex.: "Editar" só para o criador ou admin), mas **quem decide é o backend**, que responde 403.
- **Erros:** mensagens da API aparecem como vieram; erro 500 vira uma frase clara; se o servidor gratuito estiver "acordando", aparece um aviso; se uma tela quebrar, aparece uma tela amigável em vez da tela branca.
- **`components/`:** peças reaproveitadas pelas telas (botões, campos, cards, janela, mapa, barra de navegação).

## Uso de IA (front)

**Ferramentas e para quê.** Usamos o **Claude Code** como par de programação no front:
transformar os frames do Figma em telas, escrever os services e os mocks, revisar os PRs antes de enviar,
achar a causa de erros de integração e escrever testes que abrem as telas num navegador e conferem o resultado.

**O que funcionou bem.**
- Telas novas saindo rápido e já no padrão do projeto (mesmos componentes, tokens e nomes em português).
- Testes de ponta a ponta no navegador (celular de 320px a desktop) rodando contra o mock e contra a API real, com um banco PostgreSQL de teste no Docker.
- Achar problemas que não eram do front: a migration do campo `perfil` que faltou no release 3 (login dava 500 em produção), a falta de locais no banco e a diferença entre as rotas de presença que o front chamava e as que o backend criou.

**Onde a IA errou.**
- Supôs rotas da API antes de o backend existir (`/api/eventos/:id/presenca`); quando o João fez `/api/presencas/:eventoId`, foi preciso ajustar.
- Testou um CEP que não existe (37550-000) achando que era o CEP geral de Pouso Alegre; o próprio teste mostrou o engano.
- Alguns testes automáticos falharam por erro no teste, não no app (procuravam um texto antes de a tela carregar ou pegavam um elemento escondido da barra do desktop).
- Juntou branches em sequência (PRs empilhados), o que fez PRs aparecerem com arquivos repetidos até a base ser atualizada.

**Como validamos o que a IA gerou.**
- Todo código passa por `build` (tipos) e `lint` no CI antes do merge, e o PO revisa cada PR.
- Cada tela foi testada no navegador, nos modos mock e API, e em larguras de celular (320px a 430px) e desktop.
- Os critérios de aceite de cada issue foram conferidos um a um, e o que ainda depende do backend ficou marcado como PENDENTE no código.
- Quem é do front sabe explicar o código: a IA escreve junto, mas as decisões e a revisão são da equipe.
