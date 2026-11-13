import { lerSessao } from '../api/sessao';
import type { EventoDTO } from '../dtos';

/**
 * Presenças confirmadas no modo mock, guardadas no navegador por usuário,
 * para não sumirem ao recarregar a página. No modo API quem guarda é o backend.
 */

function chave(): string {
  return `kdaboa:mock:presencas:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

export function lerPresencas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(chave()) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function marcarPresenca(eventoId: string, vou: boolean): void {
  const presencas = lerPresencas();
  if (vou) presencas.add(eventoId);
  else presencas.delete(eventoId);
  localStorage.setItem(chave(), JSON.stringify([...presencas]));
}

/** Aplica a presença do usuário no evento do mock (o total do mock conta só as outras pessoas). */
export function comPresenca(evento: EventoDTO): EventoDTO {
  const euVou = lerPresencas().has(evento.id);
  return { ...evento, eu_vou: euVou, total_confirmados: (evento.total_confirmados ?? 0) + (euVou ? 1 : 0) };
}
