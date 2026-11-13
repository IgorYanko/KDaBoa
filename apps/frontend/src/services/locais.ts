import { requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { LocalDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { locaisMock } from '../mocks/locais';

/** GET /api/locais */
export async function listarLocais(): Promise<LocalDTO[]> {
  if (USAR_MOCK) {
    await atraso(200);
    return locaisMock;
  }
  return requisicao<LocalDTO[]>('/api/locais');
}
