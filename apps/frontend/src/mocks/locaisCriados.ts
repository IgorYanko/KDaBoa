import type { LocalDTO, NovoLocalDTO } from '../dtos';

/**
 * Locais novos informados no Divulgar no modo mock (com o endereço do ViaCEP),
 * guardados no navegador. No modo API quem vai criar é o backend (issue #44).
 */

const CHAVE = 'kdaboa:mock:locais-criados';
/** Ids a partir daqui, para não colidir com os locais do esboço. */
const PRIMEIRO_ID = 1000;

export function lerLocaisCriados(): LocalDTO[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as LocalDTO[];
  } catch {
    return [];
  }
}

/** Grava o local e devolve com o id novo. */
export function salvarLocalCriado(novo: NovoLocalDTO): LocalDTO {
  const atuais = lerLocaisCriados();
  const local: LocalDTO = {
    id: Math.max(PRIMEIRO_ID - 1, ...atuais.map((l) => l.id)) + 1,
    nome: novo.nome,
    endereco: novo.endereco,
    cep: novo.cep,
    bairro: novo.bairro,
    capacidade: 0,
  };
  localStorage.setItem(CHAVE, JSON.stringify([...atuais, local]));
  return local;
}
