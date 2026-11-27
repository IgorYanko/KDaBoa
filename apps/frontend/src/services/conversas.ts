import { io } from 'socket.io-client';
import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { API_URL, USAR_MOCK } from '../config';
import type { ConversaAbertaDTO, ConversaDTO, MensagemDiretaDTO, Uuid } from '../dtos';
import { atraso } from '../mocks/atraso';
import { lerDiretas, ME_SEGUEM_MOCK, pessoaDoMock, RESPOSTAS_DIRETAS_MOCK, salvarDireta } from '../mocks/conversas';
import { lerSeguindo } from '../mocks/seguindo';
import { TEXTO_MAXIMO } from './chat';

/**
 * Chat mútuo: conversa entre duas pessoas que se seguem nos dois sentidos.
 *
 * Contrato da API (apps/backend/src/controllers/conversaController.ts):
 *   - GET  /api/conversas            → ConversaDTO[] (quem segue de volta + conversas existentes)
 *   - GET  /api/conversas/:usuarioId → ConversaAbertaDTO (403 sem seguir mútuo e sem histórico, ou com bloqueio)
 *   - POST /api/conversas/:usuarioId { texto } → MensagemDiretaDTO (403 se um deixou de seguir: só leitura)
 *   - socket.io (conectado com o token): evento `nova_direta` MensagemDiretaDTO para os dois.
 */

function validarTexto(texto: string): string {
  const limpo = texto.trim();
  if (!limpo) throw new ErroApi('Escreva uma mensagem.', 400);
  if (limpo.length > TEXTO_MAXIMO) throw new ErroApi(`A mensagem pode ter até ${TEXTO_MAXIMO} caracteres.`, 400);
  return limpo;
}

/** No mock: os dois se seguem = eu sigo e a pessoa está entre as que me seguem. */
function mutuoNoMock(id: string): boolean {
  return lerSeguindo().has(id) && ME_SEGUEM_MOCK.has(id);
}

/** GET /api/conversas */
export async function listarConversas(): Promise<ConversaDTO[]> {
  if (!USAR_MOCK) return requisicao<ConversaDTO[]>('/api/conversas');
  await atraso(250);
  const diretas = lerDiretas();
  const ids = new Set([...[...lerSeguindo()].filter((id) => ME_SEGUEM_MOCK.has(id)), ...Object.keys(diretas)]);
  return [...ids]
    .flatMap((id) => {
      const usuario = pessoaDoMock(id);
      if (!usuario) return [];
      return [{ usuario, pode_enviar: mutuoNoMock(id), ultima_mensagem: diretas[id]?.at(-1) ?? null }];
    })
    .sort((a, b) => {
      const da = a.ultima_mensagem?.criado_em ?? '';
      const db = b.ultima_mensagem?.criado_em ?? '';
      return da !== db ? db.localeCompare(da) : a.usuario.nome.localeCompare(b.usuario.nome);
    });
}

/** Ids de quem dá para chamar no chat agora (para mostrar "Conversar" em outras telas). */
export async function idsQuePossoChamar(): Promise<Set<string>> {
  const conversas = await listarConversas();
  return new Set(conversas.filter((c) => c.pode_enviar).map((c) => c.usuario.id));
}

/** GET /api/conversas/:usuarioId */
export async function abrirConversa(usuarioId: Uuid): Promise<ConversaAbertaDTO> {
  if (!USAR_MOCK) return requisicao<ConversaAbertaDTO>(`/api/conversas/${encodeURIComponent(usuarioId)}`);
  await atraso(250);
  const usuario = pessoaDoMock(usuarioId);
  if (!usuario) throw new ErroApi('Usuário não encontrado', 404);
  const mensagens = lerDiretas()[usuarioId] ?? [];
  const podeEnviar = mutuoNoMock(usuarioId);
  if (!podeEnviar && mensagens.length === 0) throw new ErroApi('Vocês precisam se seguir para conversar.', 403);
  return { usuario, pode_enviar: podeEnviar, mensagens };
}

/** Quem está ouvindo as mensagens novas no modo mock (a resposta automática chega por aqui). */
const ouvintesMock = new Set<(mensagem: MensagemDiretaDTO) => void>();

/** POST /api/conversas/:usuarioId — a mensagem também chega pelo `ouvirDiretas`. */
export async function enviarDireta(usuarioId: Uuid, texto: string): Promise<MensagemDiretaDTO> {
  const limpo = validarTexto(texto);
  if (!USAR_MOCK) {
    return requisicao<MensagemDiretaDTO>(`/api/conversas/${encodeURIComponent(usuarioId)}`, {
      metodo: 'POST',
      corpo: { texto: limpo },
    });
  }
  await atraso(200);
  if (!mutuoNoMock(usuarioId)) throw new ErroApi('Vocês precisam se seguir para conversar.', 403);
  const eu = lerSessao()?.usuario.id ?? 'anonimo';
  const minha: MensagemDiretaDTO = {
    id: crypto.randomUUID(),
    remetente_id: eu,
    destinatario_id: usuarioId,
    texto: limpo,
    criado_em: new Date().toISOString(),
  };
  salvarDireta(usuarioId, minha);
  for (const ouvir of ouvintesMock) ouvir(minha);
  // A outra pessoa "responde" depois de um tempinho, para dar para ver o tempo real no mock.
  setTimeout(() => {
    const resposta: MensagemDiretaDTO = {
      id: crypto.randomUUID(),
      remetente_id: usuarioId,
      destinatario_id: eu,
      texto: RESPOSTAS_DIRETAS_MOCK[Math.floor(Math.random() * RESPOSTAS_DIRETAS_MOCK.length)],
      criado_em: new Date().toISOString(),
    };
    salvarDireta(usuarioId, resposta);
    for (const ouvir of ouvintesMock) ouvir(resposta);
  }, 1500);
  return minha;
}

/**
 * Escuta as mensagens novas em tempo real (enviadas e recebidas). Devolve a função que para de escutar.
 * No modo API abre uma conexão socket.io com o token da sessão.
 */
export function ouvirDiretas(aoReceber: (mensagem: MensagemDiretaDTO) => void): () => void {
  if (USAR_MOCK) {
    ouvintesMock.add(aoReceber);
    return () => ouvintesMock.delete(aoReceber);
  }
  const socket = io(API_URL, { auth: { token: lerSessao()?.token } });
  socket.on('nova_direta', aoReceber);
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
