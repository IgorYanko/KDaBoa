# Plano do front — KdABoa

Front do KdABoa: app web pensado para celular que mostra eventos de Pouso Alegre e quem vai a eles.
Responsável: Kayo. Esboço das telas: [Figma — KdABoa, esboço das telas](https://www.figma.com/design/C6H7RBIO8569Sm1bRODrVJ/KdABoa-%E2%80%94-Esbo%C3%A7o-das-telas?node-id=1-2).

## Situação da API e do banco

- A API (backend, João Pedro) ainda devolve **dados mock**. O banco (Rafael, issues #4 e #54) ainda não está no repositório.
- Por isso o front fala com a API **sempre através de `services/`**. Cada service tem duas implementações:
  - **mock**: dados locais em `src/mocks/`, usados enquanto a API/banco não estão prontos;
  - **api**: requisições reais via `api/client.ts`.
- A escolha é feita pela variável `VITE_USAR_MOCK` (`true` = mock, `false` = API em `VITE_API_URL`).
  Quando o banco estiver funcionando, basta trocar para `false`; as telas não mudam.
- Os formatos dos dados ficam em `src/dtos/index.ts`. Campos marcados como **PENDENTE** ainda não existem na API.

## Stack

- Vite + React + TypeScript
- React Router para as rotas
- CSS Modules + variáveis CSS (tokens) — sem Tailwind
- Fontes Space Grotesk (títulos) e Inter (texto), via `@fontsource` (sem depender de CDN)

## Tokens visuais (do Figma)

| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#111014` | fundo das telas |
| `--cor-superficie` | `#1c1b22` | inputs, cards, botões secundários |
| `--cor-borda` | `#2e2c35` | borda de inputs e chips |
| `--cor-texto` | `#f4f3f7` | títulos e texto principal |
| `--cor-texto-suave` | `#a3a1ab` | subtítulos e textos de apoio |
| `--cor-rotulo` | `#c9c7d0` | rótulos de campo, chips não selecionados |
| `--cor-placeholder` | `#7d7b86` | placeholder dos inputs |
| `--cor-destaque` | `#d4ff3a` | botão principal, links, chips selecionados |
| `--cor-sobre-destaque` | `#111014` | texto em cima do destaque |

Raios: input 14px, botão 16px, logo 18px, chip/switch 999px. Largura de referência: 390px (celular), conteúdo com 28px de margem lateral.

## Rotas

| Rota | Tela (frame do Figma) | Issue | Acesso |
|---|---|---|---|
| `/login` | 1 · Login | #14 | pública |
| `/cadastro` | 2 · Cadastro | #16 | pública |
| `/redefinir-senha` | Redefinir senha | #19 | pública |
| `/inicio` | 3 · Início | #22 | privada, com barra inferior |
| `/eventos/:id` | 4 · Detalhe do evento | #26 | privada |
| `/eventos/:id/mapa` | 3.1 · Mapa do evento | #24 | privada |
| `/eventos/:id/chat` | 4.1 · Chat do evento | #32 | privada |
| `/eventos/:id/quem-vai` | 5 · Quem vai | #30 | privada |
| `/agenda` | 6 · Minha agenda | #38 | privada, com barra inferior |
| `/perfil` | 7 · Perfil | #40 | privada, com barra inferior |
| `/divulgar` | 8 · Divulgar evento | #43 | privada |

Rotas privadas (#21): sem sessão, redirecionam para `/login`. Barra inferior: Início, Agenda, Perfil.

## Estrutura de pastas

```
frontend/src/
├── api/client.ts         # fetch com base URL, token e erros padronizados
├── components/           # Campo, CampoSenha, Botao, Chip, Switch, BarraInferior...
├── contexts/AuthContext.tsx
├── dtos/index.ts         # formatos dos dados (não mudar sem combinar com o back)
├── mocks/                # dados falsos usados pelos services em modo mock
├── pages/                # uma pasta por tela
├── services/             # única porta de entrada para dados (mock ou api)
├── styles/               # tokens.css e global.css
└── App.tsx               # rotas
```

## Etapas

Uma branch e um PR por etapa. Cada branch nasce da anterior; depois que um PR entra na `main`, a próxima branch é atualizada a partir da `main`.

1. **Base (#5, #47)** — branch `feat/front-base`: este plano, `src/dtos/index.ts`, projeto Vite, tokens, fontes, as 11 rotas (telas ainda vazias) e barra inferior.
2. **DTOs, cliente e services (#21)** — branch `feat/front-dtos-api`: `api/client.ts`, services com modo mock, AuthContext, rotas privadas e "Sair da conta" provisório no Perfil.
3. **Login e Cadastro (#14, #16)** — branch `feat/front-login-cadastro`: telas fiéis aos frames 1 e 2, usando `services/auth.ts` e `services/categorias.ts` (mock por padrão).
   - Login: e-mail inválido mostra o erro e fica na tela; sucesso vai para `/inicio`; "Esqueci minha senha" vai para `/redefinir-senha`; "Criar conta" vai para `/cadastro`.
   - Cadastro: nome, e-mail, nascimento, senha (mín. 8), interesses (categorias) e "Mostrar minha presença"; e-mail já cadastrado mostra o erro vindo da API; voltar leva ao login.

Próximas fases (depois, uma de cada vez): Início e Detalhe (#22, #26, #28), Mapa (#24), Quem vai / Agenda / Perfil (#30, #38, #40), Divulgar evento (#43, #44), Chat (#32, #34, #36), Redefinir senha (#19).

## Como trocar o mock pela API

1. O backend implementa a rota com os campos do DTO correspondente.
2. Em `frontend/.env.local`, definir `VITE_USAR_MOCK=false` (e `VITE_API_URL` se não for `http://localhost:3333`).
3. Testar a tela. Se algum campo vier diferente, combinar com o back antes de mudar o DTO.
