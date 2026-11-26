import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { CategoriaDTO, CategoriaRequestDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import {
  eventosDoMock,
  garantirAdminNoMock,
  lerCategoriasMock,
  proximoId,
  salvarCategoriasMock,
} from '../mocks/cadastrosAdmin';

export const NOME_CATEGORIA_MAXIMO = 60;

/** GET /api/categorias */
export async function listarCategorias(): Promise<CategoriaDTO[]> {
  if (USAR_MOCK) {
    await atraso(200);
    return lerCategoriasMock();
  }
  return requisicao<CategoriaDTO[]>('/api/categorias');
}

function validarCategoria(dados: CategoriaRequestDTO): CategoriaRequestDTO {
  const nome = dados.nome.trim();
  if (!nome) throw new ErroApi('Dê um nome à categoria.', 400);
  if (nome.length > NOME_CATEGORIA_MAXIMO) {
    throw new ErroApi(`O nome pode ter até ${NOME_CATEGORIA_MAXIMO} caracteres.`, 400);
  }
  return { nome };
}

/** Como no banco (nome único): não deixa duas categorias com o mesmo nome. */
function garantirNomeLivre(nome: string, idAtual?: number): void {
  const repetida = lerCategoriasMock().some((c) => c.id !== idAtual && c.nome.toLowerCase() === nome.toLowerCase());
  if (repetida) throw new ErroApi('Já existe uma categoria com esse nome.', 409);
}

/** POST /api/categorias (só ADMIN; rota ainda não existe na API). */
export async function criarCategoria(dados: CategoriaRequestDTO): Promise<CategoriaDTO> {
  const limpo = validarCategoria(dados);
  if (!USAR_MOCK) return requisicao<CategoriaDTO>('/api/categorias', { metodo: 'POST', corpo: limpo });
  await atraso(400);
  garantirAdminNoMock();
  garantirNomeLivre(limpo.nome);
  const lista = lerCategoriasMock();
  const nova: CategoriaDTO = { id: proximoId(lista), nome: limpo.nome };
  salvarCategoriasMock([...lista, nova]);
  return nova;
}

/** PUT /api/categorias/:id (só ADMIN). */
export async function atualizarCategoria(id: number, dados: CategoriaRequestDTO): Promise<CategoriaDTO> {
  const limpo = validarCategoria(dados);
  if (!USAR_MOCK) return requisicao<CategoriaDTO>(`/api/categorias/${id}`, { metodo: 'PUT', corpo: limpo });
  await atraso(400);
  garantirAdminNoMock();
  garantirNomeLivre(limpo.nome, id);
  const lista = lerCategoriasMock();
  if (!lista.some((c) => c.id === id)) throw new ErroApi('Categoria não encontrada', 404);
  const alterada: CategoriaDTO = { id, nome: limpo.nome };
  salvarCategoriasMock(lista.map((c) => (c.id === id ? alterada : c)));
  return alterada;
}

/** DELETE /api/categorias/:id (só ADMIN). Categoria com eventos não pode ser excluída. */
export async function excluirCategoria(id: number): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/categorias/${id}`, { metodo: 'DELETE' });
    return;
  }
  await atraso(400);
  garantirAdminNoMock();
  const emUso = eventosDoMock().filter((e) => e.categoria_id === id).length;
  if (emUso > 0) {
    const eventos = emUso === 1 ? 'evento' : 'eventos';
    const deles = emUso === 1 ? 'dele' : 'deles';
    throw new ErroApi(`Esta categoria tem ${emUso} ${eventos}. Troque a categoria ${deles} antes de excluir.`, 409);
  }
  salvarCategoriasMock(lerCategoriasMock().filter((c) => c.id !== id));
}
