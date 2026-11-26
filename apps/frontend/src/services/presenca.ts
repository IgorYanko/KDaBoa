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
// PENDENTE (issue #29): a API ainda não diz se o usuário logado vai (`eu_vou`).
// Até lá, o front lembra neste navegador em quais eventos ele confirmou,
// para o botão "Eu vou!" não voltar ao estado inicial ao recarregar.
// ---------------------------------------------------------------------------

function chaveLembradas(): string {
  return `kdaboa:presencas:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

/** Eventos em que o usuário confirmou presença pela API, neste navegador. */
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
    return;
  }
  await atraso(300);
  garantirEventoNoMock(eventoId);
  marcarPresenca(eventoId, false);
}
