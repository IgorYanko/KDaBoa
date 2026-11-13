import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { PresencaDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { marcarPresenca } from '../mocks/presencas';

/**
 * Confirmar e cancelar presença (issues #28 e #29).
 * A API ainda não tem essas rotas: no modo API, chama as rotas previstas
 * POST e DELETE /api/eventos/:id/presenca.
 */

function garantirEventoNoMock(eventoId: string): void {
  if (!eventosMock.some((e) => e.id === eventoId)) throw new ErroApi('Evento não encontrado', 404);
}

/** POST /api/eventos/:id/presenca */
export async function confirmarPresenca(eventoId: string): Promise<PresencaDTO> {
  if (!USAR_MOCK) {
    return requisicao<PresencaDTO>(`/api/eventos/${encodeURIComponent(eventoId)}/presenca`, { metodo: 'POST' });
  }
  await atraso(300);
  garantirEventoNoMock(eventoId);
  marcarPresenca(eventoId, true);
  return { evento_id: eventoId, usuario_id: lerSessao()?.usuario.id ?? '', criado_em: new Date().toISOString() };
}

/** DELETE /api/eventos/:id/presenca */
export async function cancelarPresenca(eventoId: string): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/eventos/${encodeURIComponent(eventoId)}/presenca`, { metodo: 'DELETE' });
    return;
  }
  await atraso(300);
  garantirEventoNoMock(eventoId);
  marcarPresenca(eventoId, false);
}
