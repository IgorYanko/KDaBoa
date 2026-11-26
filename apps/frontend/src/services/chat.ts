import { io } from 'socket.io-client';
import { ErroApi } from '../api/client';
import { lerSessao } from '../api/sessao';
import { API_URL, USAR_MOCK } from '../config';
import type { MensagemChatDTO } from '../dtos';
import { lerMensagens, pessoasDoChatMock, respostasMock, salvarMensagem } from '../mocks/mensagens';

/**
 * Chat de um evento (issues #32 e #33), em tempo real.
 *
 * Contrato do servidor (socket.io, apps/backend/src/socket.ts):
 *   - conectar com `auth: { token }` (o mesmo token da sessão);
 *   - emitir `entrar_sala` { evento_id }  → recebe `historico_mensagens` MensagemChatDTO[];
 *   - emitir `enviar_mensagem` { evento_id, texto } → todos na sala recebem `nova_mensagem` MensagemChatDTO;
 *   - erros chegam em `erro_sala` e `erro_mensagem` como { erro }.
 *   Só entra quem confirmou presença no evento.
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
  if (!USAR_MOCK) return conectarApi(eventoId, ouvintes);
  return conectarMock(eventoId, ouvintes);
}

/** Texto digitado, sem espaços nas pontas; lança ErroApi se estiver vazio ou grande demais. */
function validarTexto(texto: string): string {
  const limpo = texto.trim();
  if (!limpo) throw new ErroApi('Escreva uma mensagem.', 400);
  if (limpo.length > TEXTO_MAXIMO) throw new ErroApi(`A mensagem pode ter até ${TEXTO_MAXIMO} caracteres.`, 400);
  return limpo;
}

/** Conexão de verdade com o servidor de chat (socket.io). */
function conectarApi(eventoId: string, ouvintes: OuvintesChat): ConexaoChat {
  const socket = io(API_URL, { auth: { token: lerSessao()?.token } });

  // A cada conexão (inclusive depois de cair e voltar) entra de novo na sala e recebe o histórico.
  socket.on('connect', () => socket.emit('entrar_sala', { evento_id: eventoId }));
  socket.on('connect_error', () => ouvintes.aoErrar('Sem conexão com o chat. Tentando de novo…'));
  socket.on('historico_mensagens', (mensagens: MensagemChatDTO[]) => ouvintes.aoReceberHistorico(mensagens));
  socket.on('nova_mensagem', (mensagem: MensagemChatDTO) => ouvintes.aoReceberMensagem(mensagem));
  socket.on('erro_sala', ({ erro }: { erro: string }) => ouvintes.aoErrar(erro));
  socket.on('erro_mensagem', ({ erro }: { erro: string }) => ouvintes.aoErrar(erro));

  return {
    enviar: async (texto: string) => {
      const limpo = validarTexto(texto);
      if (!socket.connected) throw new ErroApi('Sem conexão com o chat. Tente de novo em instantes.', 0);
      socket.emit('enviar_mensagem', { evento_id: eventoId, texto: limpo });
    },
    sair: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}

function conectarMock(eventoId: string, ouvintes: OuvintesChat): ConexaoChat {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let respondeu = false;

  timers.push(setTimeout(() => ouvintes.aoReceberHistorico(lerMensagens(eventoId)), 350));

  return {
    enviar: async (texto: string) => {
      const limpo = validarTexto(texto);
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
