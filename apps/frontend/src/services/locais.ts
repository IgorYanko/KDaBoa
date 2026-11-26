import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { LocalDTO, LocalRequestDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosDoMock, garantirAdminNoMock, lerLocaisMock, proximoId, salvarLocaisMock } from '../mocks/cadastrosAdmin';

/** GET /api/locais */
export async function listarLocais(): Promise<LocalDTO[]> {
  if (USAR_MOCK) {
    await atraso(200);
    return lerLocaisMock();
  }
  return requisicao<LocalDTO[]>('/api/locais');
}

/** Campos obrigatórios (o backend também deve validar). */
function validarLocal(dados: LocalRequestDTO): LocalRequestDTO {
  const nome = dados.nome.trim();
  const endereco = dados.endereco.trim();
  if (!nome) throw new ErroApi('Dê um nome ao local.', 400);
  if (!endereco) throw new ErroApi('Informe o endereço.', 400);
  return { ...dados, nome, endereco, bairro: dados.bairro?.trim() || undefined, cep: dados.cep?.trim() || undefined };
}

/** POST /api/locais (só ADMIN; rota ainda não existe na API). */
export async function criarLocal(dados: LocalRequestDTO): Promise<LocalDTO> {
  const limpo = validarLocal(dados);
  if (!USAR_MOCK) return requisicao<LocalDTO>('/api/locais', { metodo: 'POST', corpo: limpo });
  await atraso(400);
  garantirAdminNoMock();
  const lista = lerLocaisMock();
  const novo: LocalDTO = { ...limpo, id: proximoId(lista), capacidade: 0 };
  salvarLocaisMock([...lista, novo]);
  return novo;
}

/** PUT /api/locais/:id (só ADMIN). */
export async function atualizarLocal(id: number, dados: LocalRequestDTO): Promise<LocalDTO> {
  const limpo = validarLocal(dados);
  if (!USAR_MOCK) return requisicao<LocalDTO>(`/api/locais/${id}`, { metodo: 'PUT', corpo: limpo });
  await atraso(400);
  garantirAdminNoMock();
  const lista = lerLocaisMock();
  const atual = lista.find((l) => l.id === id);
  if (!atual) throw new ErroApi('Local não encontrado', 404);
  const alterado: LocalDTO = { ...atual, ...limpo };
  salvarLocaisMock(lista.map((l) => (l.id === id ? alterado : l)));
  return alterado;
}

/** DELETE /api/locais/:id (só ADMIN). Local com eventos não pode ser excluído. */
export async function excluirLocal(id: number): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/locais/${id}`, { metodo: 'DELETE' });
    return;
  }
  await atraso(400);
  garantirAdminNoMock();
  const emUso = eventosDoMock().filter((e) => e.local_id === id).length;
  if (emUso > 0) {
    const eventos = emUso === 1 ? 'evento' : 'eventos';
    const deles = emUso === 1 ? 'dele' : 'deles';
    throw new ErroApi(`Este local tem ${emUso} ${eventos}. Troque o local ${deles} antes de excluir.`, 409);
  }
  salvarLocaisMock(lerLocaisMock().filter((l) => l.id !== id));
}
