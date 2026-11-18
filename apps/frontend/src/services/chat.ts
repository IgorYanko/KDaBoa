import { ErroApi } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { MensagemChatDTO } from '../dtos';
import { lerMensagens, pessoasDoChatMock, respostasMock, salvarMensagem } from '../mocks/mensagens';

/**
 * Chat de um evento (issues #32, #33 e #34), em tempo real.
 *
 * Contrato do servidor (socket.io, branch `chat-websocket` do backend):
 *   - conectar com `auth: { token }` (o mesmo token da sessão);
 *   - emitir `entrar_sala` { evento_id }  → recebe `historico_mensagens` MensagemChatDTO[];
 *   - emitir `enviar_mensagem` { evento_id, texto } → todos na sala recebem `nova_mensagem` MensagemChatDTO;
 *   - erros chegam em `erro_sala` e `erro_mensagem` como { erro }.
 *   Só entra quem confirmou presença no evento.
 *
 * O modo API depende do pacote `socket.io-client`, que entra junto com o servidor de chat.
 * Até lá, ele avisa que o chat em tempo real ainda não está ligado.
 */

export const TEXTO_MAXIMO = 1000;

export interface OuvintesChat {
  aoReceberHistorico: (mensagens: MensagemChatDTO[]) => void;
  aoReceberMensagem: (mensagem: MensagemChatDTO) => void;
  aoErrar: (mensagem: string) => void;
}

export interface ConexaoChat {
  /** Envia uma mensagem (a própria mensagem volta por `aoReceberMensagem`). Lança ErroApi se falhar. */
  enviar: (texto: string) => Promise<void>;
  /** Sai da sala (chame ao desmontar a tela). */
  sair: () => void;
}

/** Entra na sala do chat do evento. */
export function conectarChat(eventoId: string, ouvintes: OuvintesChat): ConexaoChat {
  if (!USAR_MOCK) return conectarApi(ouvintes);
  return conectarMock(eventoId, ouvintes);
}

function conectarApi(ouvintes: OuvintesChat): ConexaoChat {
  const aviso = 'O chat em tempo real ainda não está ligado nesta versão. Ele chega junto com o servidor de chat (issue #34).';
  const espera = setTimeout(() => ouvintes.aoErrar(aviso), 0);
  return {
    enviar: async () => {
      throw new ErroApi(aviso, 503);
    },
    sair: () => clearTimeout(espera),
  };
}

function conectarMock(eventoId: string, ouvintes: OuvintesChat): ConexaoChat {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let respondeu = false;

  timers.push(setTimeout(() => ouvintes.aoReceberHistorico(lerMensagens(eventoId)), 350));

  return {
    enviar: async (texto: string) => {
      const limpo = texto.trim();
      if (!limpo) throw new ErroApi('Escreva uma mensagem.', 400);
      if (limpo.length > TEXTO_MAXIMO) throw new ErroApi(`A mensagem pode ter até ${TEXTO_MAXIMO} caracteres.`, 400);
      const autor = lerSessao()?.usuario;
      if (!autor) throw new ErroApi('Entre na sua conta para conversar.', 401);

      const mensagem: MensagemChatDTO = {
        id: crypto.randomUUID(),
        evento_id: eventoId,
        autor,
        texto: limpo,
        criado_em: new Date().toISOString(),
      };
      salvarMensagem(mensagem);
      timers.push(setTimeout(() => ouvintes.aoReceberMensagem(mensagem), 120));

      // Simula alguém da galera respondendo (uma vez por visita), para dar vida ao mock.
      if (!respondeu) {
        respondeu = true;
        timers.push(
          setTimeout(() => {
            const resposta: MensagemChatDTO = {
              id: crypto.randomUUID(),
              evento_id: eventoId,
              autor: pessoasDoChatMock[Math.floor(Math.random() * pessoasDoChatMock.length)],
              texto: respostasMock[Math.floor(Math.random() * respostasMock.length)],
              criado_em: new Date().toISOString(),
            };
            salvarMensagem(resposta);
            ouvintes.aoReceberMensagem(resposta);
          }, 2200),
        );
      }
    },
    sair: () => {
      for (const timer of timers) clearTimeout(timer);
    },
  };
}
