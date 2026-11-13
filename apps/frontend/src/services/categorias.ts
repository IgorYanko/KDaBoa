import { requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { CategoriaDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { categoriasMock } from '../mocks/categorias';

/** GET /api/categorias */
export async function listarCategorias(): Promise<CategoriaDTO[]> {
  if (USAR_MOCK) {
    await atraso(200);
    return categoriasMock;
  }
  return requisicao<CategoriaDTO[]>('/api/categorias');
}
