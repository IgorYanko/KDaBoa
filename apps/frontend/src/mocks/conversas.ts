import { lerSessao } from '../api/sessao';
import type { MensagemDiretaDTO, PessoaConversaDTO } from '../dtos';
import { pessoasVisiveisMock } from './participantes';

/**
 * Chat mútuo no modo mock. Quem segue o usuário de volta é fixo (as quatro pessoas das
 * bolinhas dos cards); quem ele segue vem de mocks/seguindo.ts. As mensagens ficam no navegador.
 */

/** Pessoas do mock que seguem o usuário logado. Se ele seguir uma delas, viram contato mútuo. */
export const ME_SEGUEM_MOCK = new Set(['u-ana', 'u-bruno', 'u-carla', 'u-diego']);

export function pessoaDoMock(id: string): PessoaConversaDTO | null {
  const pessoa = pessoasVisiveisMock.find((p) => p.id === id);
  return pessoa ? { id: pessoa.id, nome: pessoa.nome, foto_url: pessoa.foto_url ?? null } : null;
}

function meuId(): string {
  return lerSessao()?.usuario.id ?? 'anonimo';
}

function chave(): string {
  return `kdaboa:mock:diretas:${meuId()}`;
}

/** Conversa inicial com o Bruno (o usuário de teste já começa seguindo ele). */
function conversaInicial(): Record<string, MensagemDiretaDTO[]> {
  const eu = meuId();
  const ontem = Date.now() - 86_400_000;
  return {
    'u-bruno': [
      {
        id: 'd-1',
        remetente_id: 'u-bruno',
        destinatario_id: eu,
        texto: 'E aí! Vi que você vai no Rock na Praça também 🎸',
        criado_em: new Date(ontem).toISOString(),
      },
      {
        id: 'd-2',
        remetente_id: eu,
        destinatario_id: 'u-bruno',
        texto: 'Vou sim! Chego umas 20h.',
        criado_em: new Date(ontem + 4 * 60_000).toISOString(),
      },
    ],
  };
}

export function lerDiretas(): Record<string, MensagemDiretaDTO[]> {
  try {
    const salvo = localStorage.getItem(chave());
    return salvo === null ? conversaInicial() : (JSON.parse(salvo) as Record<string, MensagemDiretaDTO[]>);
  } catch {
    return {};
  }
}

export function salvarDireta(outroId: string, mensagem: MensagemDiretaDTO): void {
  const todas = lerDiretas();
  todas[outroId] = [...(todas[outroId] ?? []), mensagem];
  localStorage.setItem(chave(), JSON.stringify(todas));
}

export const RESPOSTAS_DIRETAS_MOCK = ['Fechado! 🙌', 'Boa, te vejo lá.', 'Kkkk demais', 'Bora!'];
