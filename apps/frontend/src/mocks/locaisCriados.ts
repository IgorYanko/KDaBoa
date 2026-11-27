import type { LocalDTO, NovoLocalDTO } from '../dtos';
import { lerLocaisMock, salvarLocaisMock } from './cadastrosAdmin';

/**
 * Local novo informado no Divulgar no modo mock (com o endereço do ViaCEP).
 * Vai para a mesma lista que a área de admin edita, então dá para corrigir ou excluir depois.
 * No modo API quem vai criar é o backend (issue #44).
 */

/** Ids a partir daqui, para não colidir com os locais do esboço. */
const PRIMEIRO_ID = 1000;

/** Grava o local e devolve com o id novo. */
export function salvarLocalCriado(novo: NovoLocalDTO): LocalDTO {
  const atuais = lerLocaisMock();
  const local: LocalDTO = {
    id: Math.max(PRIMEIRO_ID - 1, ...atuais.map((l) => l.id)) + 1,
    nome: novo.nome,
    endereco: novo.endereco,
    cep: novo.cep,
    bairro: novo.bairro,
    capacidade: 0,
  };
  salvarLocaisMock([...atuais, local]);
  return local;
}
