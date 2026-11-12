# Etapas do front — pedidos para o Claude Code

Como usar: deixe este arquivo em `docs/` junto com o `PLANO-FRONT.md`. Para cada etapa, faça o "Antes" no terminal, cole o pedido no Claude Code (ou só diga *"faça a Etapa N do docs/ETAPAS-CLAUDE-CODE.md"*), teste, e faça o "Depois".

Regras para o Claude Code em todas as etapas:
- Faça **só** a etapa pedida; não adiante arquivos de outras etapas.
- Siga `docs/PLANO-FRONT.md` e `frontend/CLAUDE.md`.
- Use os DTOs de `frontend/src/dtos/index.ts` sem mudar os campos.
- Ao terminar, liste o que criou/alterou, como testar, e revise o trabalho contra o plano e o CLAUDE.md.
- Não faça commit nem push sem eu pedir.

---

## Ciclo de git (todas as etapas)

**Antes**
```bash
git checkout main
git pull
git checkout -b <branch>
```

**Depois** (com tudo testado)
```bash
git status
git add docs frontend
git commit -m "<mensagem>"
git push -u origin <branch>
```
Abrir o PR no GitHub para a `main` e esperar a aprovação do Igor antes da próxima etapa.

---

## Etapa 1 — Base
- Branch: `feat/front-base`
- Antes de pedir: `docs/PLANO-FRONT.md`, `docs/ETAPAS-CLAUDE-CODE.md`, `frontend/CLAUDE.md` e `frontend/src/dtos/index.ts` já no lugar.
- Pedido:
  > Leia docs/PLANO-FRONT.md e frontend/CLAUDE.md. Faça só a Etapa 1. Crie o projeto Vite (React + TypeScript) dentro de frontend/ sem apagar o CLAUDE.md nem src/dtos/index.ts que já estão lá. No fim, me diga como rodar e o que criou.
- Pronto quando: `npm run dev` em `frontend/` abre o layout de celular com a barra inferior e as 10 rotas navegáveis (vazias).
- Commit: `feat(front): base do projeto com Vite, tokens e rotas`

## Etapa 2 — DTOs, cliente e services
- Branch: `feat/front-dtos-api`
- Pedido:
  > Faça a Etapa 2 do docs/PLANO-FRONT.md. Use os DTOs de frontend/src/dtos/index.ts sem mudar os campos. Crie o api/client.ts, os services, o AuthContext e o utils/datas.ts. Teste os services contra a API rodando em http://localhost:3333.
- Pronto quando: os services de eventos, categorias, locais e login respondem com dados da API, tipados.
- Commit: `feat(front): DTOs, cliente da API, services e AuthContext`

## Etapa 3 — Login e cadastro
- Branch: `feat/front-login-cadastro`
- Pedido:
  > Faça a Etapa 3 do plano: telas de Login e Cadastro iguais aos frames 1 e 2 do esboço, usando os services da etapa 2. Mostre na tela as mensagens de erro da API.
- Pronto quando: login com `kayo@email.com` entra no app; e-mail errado mostra o erro; cadastro mostra sucesso.
- Commit: `feat(front): telas de login e cadastro`

## Etapa 4 — Eventos
- Branch: `feat/front-eventos`
- Pedido:
  > Faça a Etapa 4 do plano: componente EventoCard, tela Início (frame 3) e Detalhe do evento (frame 4). Os eventos vêm da API; o contador de confirmados e o botão "Eu vou!" ficam em mocks atrás de um service.
- Pronto quando: a lista mostra os eventos da API com filtros funcionando, e o detalhe abre pelo id.
- Commit: `feat(front): lista e detalhe de eventos`

## Etapa 5 — Mapa
- Branch: `feat/front-mapa`
- Pedido:
  > Faça a Etapa 5 do plano: tela do Mapa (frame 3.1) com react-leaflet e OpenStreetMap. Use a geolocalização do navegador para o ponto do usuário e coordenadas mockadas para os locais.
- Pronto quando: tocar num card do Início abre o mapa com o evento em destaque; minimizar o painel mostra os eventos por perto; "Ver detalhes" leva ao detalhe.
- Commit: `feat(front): mapa do evento com eventos por perto`

## Etapa 6 — Quem vai, agenda e perfil
- Branch: `feat/front-social`
- Pedido:
  > Faça a Etapa 6 do plano: telas Quem vai, Minha agenda e Perfil (frames 5, 6 e 7), com os dados que a API ainda não tem em mocks atrás dos services.
- Pronto quando: as três telas funcionam e "Sair da conta" volta para o login.
- Commit: `feat(front): quem vai, agenda e perfil`

## Etapa 7 — Divulgar evento
- Branch: `feat/front-divulgar`
- Pedido:
  > Faça a Etapa 7 do plano: tela Divulgar evento (frame 8) com validação do formulário, prévia da capa, e categorias e locais vindos da API. O envio fica mockado.
- Pronto quando: o formulário valida os campos obrigatórios e mostra a prévia da imagem escolhida.
- Commit: `feat(front): tela de divulgar evento`

## Etapa 8 — Chat
- Branch: `feat/front-chat`
- Pedido:
  > Faça a Etapa 8 do plano: tela do Chat do evento (frame 4.1) com mensagens mockadas, enviar, "digitando", bloquear e denunciar. Crie services/chat.ts com uma interface que dê para trocar pelo Socket.IO depois.
- Pronto quando: o chat só abre depois de confirmar presença; enviar, bloquear e denunciar funcionam.
- Commit: `feat(front): chat do evento (mock)`

---

## Dicas
- Com o conector do Figma ligado, acrescente ao pedido o link do frame da tela; o layout sai mais fiel ao esboço.
- Se o resultado ficar diferente do esboço, peça o ajuste na mesma conversa antes de commitar.
- Confira sempre `git diff` antes do commit, mesmo que o Claude Code rode os comandos de git por você.
