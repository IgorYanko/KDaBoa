import type { EventoDTO } from '../dtos';

/**
 * Edições e exclusões de eventos no modo mock, guardadas no navegador.
 * Valem também para os eventos do esboço (o admin de teste pode mexer em qualquer um).
 * No modo API quem guarda é o backend.
 */

const CHAVE_EDICOES = 'kdaboa:mock:eventos-editados';
const CHAVE_EXCLUIDOS = 'kdaboa:mock:eventos-excluidos';

function ler<T>(chave: string, padrao: T): T {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? 'null') ?? padrao;
  } catch {
    return padrao;
  }
}

/** Aplica as edições e tira os excluídos. */
export function comAlteracoes(eventos: EventoDTO[]): EventoDTO[] {
  const edicoes = ler<Record<string, Partial<EventoDTO>>>(CHAVE_EDICOES, {});
  const excluidos = new Set(ler<string[]>(CHAVE_EXCLUIDOS, []));
  return eventos.filter((e) => !excluidos.has(e.id)).map((e) => ({ ...e, ...edicoes[e.id] }));
}

export function salvarEdicao(id: string, dados: Partial<EventoDTO>): void {
  const edicoes = ler<Record<string, Partial<EventoDTO>>>(CHAVE_EDICOES, {});
  edicoes[id] = { ...edicoes[id], ...dados };
  localStorage.setItem(CHAVE_EDICOES, JSON.stringify(edicoes));
}

export function marcarExcluido(id: string): void {
  const excluidos = new Set(ler<string[]>(CHAVE_EXCLUIDOS, []));
  excluidos.add(id);
  localStorage.setItem(CHAVE_EXCLUIDOS, JSON.stringify([...excluidos]));
}
