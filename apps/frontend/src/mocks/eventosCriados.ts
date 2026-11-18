import type { EventoDTO } from '../dtos';

/**
 * Eventos criados na tela Divulgar no modo mock, guardados no navegador para
 * aparecerem no Início e no Detalhe depois de recarregar. No modo API quem guarda é o backend.
 */

const CHAVE = 'kdaboa:mock:eventos-criados';

export function lerEventosCriados(): EventoDTO[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as EventoDTO[];
  } catch {
    return [];
  }
}

export function salvarEventoCriado(evento: EventoDTO): void {
  localStorage.setItem(CHAVE, JSON.stringify([...lerEventosCriados(), evento]));
}
