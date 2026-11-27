import { ErroApi } from '../api/client';
import { lerSessao } from '../api/sessao';
import type { CategoriaDTO, EventoDTO, LocalDTO } from '../dtos';
import { categoriasMock } from './categorias';
import { eventosMock } from './eventos';
import { comAlteracoes } from './eventosAlterados';
import { lerEventosCriados } from './eventosCriados';
import { locaisMock } from './locais';

/**
 * Locais e categorias do modo mock, editáveis pela área de admin e guardados no navegador.
 * Enquanto ninguém mexe, valem as listas do esboço. No modo API quem guarda é o backend.
 */

const CHAVE_LOCAIS = 'kdaboa:mock:locais';
const CHAVE_CATEGORIAS = 'kdaboa:mock:categorias';

function ler<T>(chave: string, padrao: T[]): T[] {
  try {
    const salvo = localStorage.getItem(chave);
    return salvo ? (JSON.parse(salvo) as T[]) : padrao;
  } catch {
    return padrao;
  }
}

export const lerLocaisMock = (): LocalDTO[] => ler(CHAVE_LOCAIS, locaisMock);
export const salvarLocaisMock = (lista: LocalDTO[]) => localStorage.setItem(CHAVE_LOCAIS, JSON.stringify(lista));
export const lerCategoriasMock = (): CategoriaDTO[] => ler(CHAVE_CATEGORIAS, categoriasMock);
export const salvarCategoriasMock = (lista: CategoriaDTO[]) =>
  localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(lista));

/** Como no backend: só ADMIN mexe em locais e categorias. */
export function garantirAdminNoMock(): void {
  if (lerSessao()?.usuario.perfil !== 'ADMIN') {
    throw new ErroApi('Só administradores podem alterar locais e categorias.', 403);
  }
}

/** Eventos do mock (para não excluir local ou categoria que ainda tem evento, como o banco faz). */
export function eventosDoMock(): EventoDTO[] {
  return comAlteracoes([...eventosMock, ...lerEventosCriados()]);
}

export function proximoId(lista: { id: number }[]): number {
  return Math.max(0, ...lista.map((item) => item.id)) + 1;
}
