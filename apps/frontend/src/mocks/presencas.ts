import { lerSessao } from '../api/sessao';
import type { EventoDTO } from '../dtos';

/**
 * Presenças confirmadas no modo mock, guardadas no navegador por usuário,
 * para não sumirem ao recarregar a página. No modo API quem guarda é o backend.
 */

function chave(): string {
  return `kdaboa:mock:presencas:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

/**
 * Presenças iniciais do usuário de teste (kayo@email.com), para a Agenda já ter o que mostrar:
 * dois eventos que vêm aí e dois que já passaram. Depois da primeira mudança, vale o que ficou salvo.
 */
const PRESENCAS_INICIAIS: Record<string, string[]> = {
  '987fcdeb-51a2-43d7-9012-345678901234': [
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174005',
    '123e4567-e89b-12d3-a456-426614174006',
  ],
};

export function lerPresencas(): Set<string> {
  try {
    const salvas = localStorage.getItem(chave());
    if (salvas === null) return new Set(PRESENCAS_INICIAIS[lerSessao()?.usuario.id ?? ''] ?? []);
    return new Set(JSON.parse(salvas) as string[]);
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
