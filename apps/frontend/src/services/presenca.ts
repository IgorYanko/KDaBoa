import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { PresencaDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { lerEventosCriados } from '../mocks/eventosCriados';
import { marcarPresenca } from '../mocks/presencas';

/**
 * Confirmar e cancelar presença (issues #28 e #29).
 * Rotas da API (release 3): POST e DELETE /api/presencas/:eventoId.
 */

/** Resposta do POST na API: a presença vem do banco, em camelCase. */
interface RespostaConfirmar {
  mensagem: string;
  presenca: { usuarioId: string; eventoId: string; confirmadoEm: string };
}

// ---------------------------------------------------------------------------
// Em quais eventos o usuário logado vai. A lista do banco vem do GET /api/presencas/agenda
// (issue #39); a API de eventos ainda não manda `eu_vou` (issue #29). Se a agenda falhar,
// vale o que o front lembra neste navegador, como antes.
// ---------------------------------------------------------------------------

/** Item do GET /api/presencas/agenda: o evento como está no banco (camelCase) e alguns campos já em snake_case. */
export interface EventoDaAgenda {
  id: string;
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  preco: number | string;
  classificacaoEtaria?: number;
  categoriaId: number;
  localId: number;
  criadorId: string;
  capa_url?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  verificado?: boolean;
  vendaNoApp?: boolean;
  quantidadeIngressos?: number | null;
}

export interface AgendaDaApi {
  proximos: EventoDaAgenda[];
  passados: EventoDaAgenda[];
}

function chaveLembradas(): string {
  return `kdaboa:presencas:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

/** Eventos em que o usuário confirmou presença pela API, neste navegador (plano B). */
export function presencasLembradas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(chaveLembradas()) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function lembrar(eventoId: string, vou: boolean): void {
  const lembradas = presencasLembradas();
  if (vou) lembradas.add(eventoId);
  else lembradas.delete(eventoId);
  localStorage.setItem(chaveLembradas(), JSON.stringify([...lembradas]));
}

/** Presenças do banco, buscadas uma vez por sessão (e atualizadas ao confirmar ou cancelar). */
let cache: { usuario: string; ids: Promise<Set<string> | null> } | null = null;

const idsDaAgenda = ({ proximos, passados }: AgendaDaApi) => new Set([...proximos, ...passados].map((e) => e.id));

/** GET /api/presencas/agenda — e já guarda os ids para marcar o "Eu vou" nas outras telas. */
export async function buscarAgendaDaApi(): Promise<AgendaDaApi> {
  const agenda = await requisicao<AgendaDaApi>('/api/presencas/agenda');
  cache = { usuario: lerSessao()?.usuario.id ?? '', ids: Promise.resolve(idsDaAgenda(agenda)) };
  return agenda;
}

/** Ids dos eventos em que o usuário vai, segundo o banco; null se a API não respondeu. */
function presencasDoServidor(): Promise<Set<string> | null> {
  const usuario = lerSessao()?.usuario.id ?? '';
  if (!cache || cache.usuario !== usuario) {
    const ids = requisicao<AgendaDaApi>('/api/presencas/agenda')
      .then(idsDaAgenda)
      .catch(() => null);
    const atual = { usuario, ids };
    cache = atual;
    // Se falhou, tenta de novo na próxima tela em vez de ficar sem a lista do banco.
    void ids.then((r) => {
      if (r === null && cache === atual) cache = null;
    });
  }
  return cache.ids;
}

/** Em quais eventos o usuário vai: o banco quando responde, senão a memória deste navegador. */
export async function eventosQueVou(): Promise<Set<string>> {
  return (await presencasDoServidor()) ?? presencasLembradas();
}

/** Mantém a lista do banco igual ao que acabou de mudar (sem buscar tudo de novo). */
function atualizarCache(eventoId: string, vou: boolean): void {
  if (!cache) return;
  cache = {
    usuario: cache.usuario,
    ids: cache.ids.then((ids) => {
      if (!ids) return ids;
      const novo = new Set(ids);
      if (vou) novo.add(eventoId);
      else novo.delete(eventoId);
      return novo;
    }),
  };
}

function garantirEventoNoMock(eventoId: string): void {
  const existe = [...eventosMock, ...lerEventosCriados()].some((e) => e.id === eventoId);
  if (!existe) throw new ErroApi('Evento não encontrado', 404);
}

/** POST /api/presencas/:eventoId — confirmar de novo não duplica. */
export async function confirmarPresenca(eventoId: string): Promise<PresencaDTO> {
  if (!USAR_MOCK) {
    const { presenca } = await requisicao<RespostaConfirmar>(`/api/presencas/${encodeURIComponent(eventoId)}`, {
      metodo: 'POST',
    });
    lembrar(eventoId, true);
    atualizarCache(eventoId, true);
    return { evento_id: presenca.eventoId, usuario_id: presenca.usuarioId, criado_em: presenca.confirmadoEm };
  }
  await atraso(300);
  garantirEventoNoMock(eventoId);
  marcarPresenca(eventoId, true);
  return { evento_id: eventoId, usuario_id: lerSessao()?.usuario.id ?? '', criado_em: new Date().toISOString() };
}

/** DELETE /api/presencas/:eventoId */
export async function cancelarPresenca(eventoId: string): Promise<void> {
  if (!USAR_MOCK) {
    try {
      await requisicao<unknown>(`/api/presencas/${encodeURIComponent(eventoId)}`, { metodo: 'DELETE' });
    } catch (e) {
      // 404 = a API já não tinha essa presença: para a tela, o resultado é o mesmo.
      if (!(e instanceof ErroApi && e.status === 404 && e.message.startsWith('Presença'))) throw e;
    }
    lembrar(eventoId, false);
    atualizarCache(eventoId, false);
    return;
  }
  await atraso(300);
  garantirEventoNoMock(eventoId);
  marcarPresenca(eventoId, false);
}
