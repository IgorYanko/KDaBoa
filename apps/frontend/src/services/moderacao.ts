import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { BloquearUsuarioRequestDTO, DenunciarMensagemRequestDTO, Uuid } from '../dtos';
import { atraso } from '../mocks/atraso';

/**
 * Bloquear (issue #34) e denunciar (issue #36) no chat.
 * As rotas ainda não existem na API (issues #35 e #37); os caminhos abaixo são a sugestão do front.
 * Sem a rota, a API responde erro e a tela mostra o erro, sem fingir que deu certo.
 */

export const MOTIVO_MAXIMO = 255;

function chave(nome: 'bloqueios' | 'denuncias'): string {
  return `kdaboa:${USAR_MOCK ? 'mock:' : ''}${nome}:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

function lerLista(nome: 'bloqueios' | 'denuncias'): string[] {
  try {
    return JSON.parse(localStorage.getItem(chave(nome)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function adicionar(nome: 'bloqueios' | 'denuncias', id: string): void {
  const lista = new Set(lerLista(nome));
  lista.add(id);
  localStorage.setItem(chave(nome), JSON.stringify([...lista]));
}

/**
 * Quem o usuário bloqueou (neste navegador). O chat já esconde as mensagens dessas pessoas
 * na hora, sem esperar o servidor filtrar.
 */
export function bloqueados(): Set<string> {
  return new Set(lerLista('bloqueios'));
}

/** POST /api/bloqueios */
export async function bloquearUsuario(usuarioId: Uuid): Promise<void> {
  const corpo: BloquearUsuarioRequestDTO = { usuario_id: usuarioId };
  if (!USAR_MOCK) {
    await requisicao<unknown>('/api/bloqueios', { metodo: 'POST', corpo });
  } else {
    await atraso(400);
    if (usuarioId === lerSessao()?.usuario.id) throw new ErroApi('Você não pode bloquear a si mesmo.', 400);
  }
  adicionar('bloqueios', usuarioId);
}

/** POST /api/denuncias */
export async function denunciarMensagem(dados: DenunciarMensagemRequestDTO): Promise<void> {
  const motivo = dados.motivo.trim();
  if (!motivo) throw new ErroApi('Escolha o motivo da denúncia.', 400);
  if (motivo.length > MOTIVO_MAXIMO) throw new ErroApi(`O motivo pode ter até ${MOTIVO_MAXIMO} caracteres.`, 400);
  if (!USAR_MOCK) {
    await requisicao<unknown>('/api/denuncias', { metodo: 'POST', corpo: { ...dados, motivo } });
    return;
  }
  await atraso(500);
  // Como no banco: uma denúncia por pessoa e mensagem.
  if (lerLista('denuncias').includes(dados.mensagem_id)) {
    throw new ErroApi('Você já denunciou esta mensagem.', 409);
  }
  adicionar('denuncias', dados.mensagem_id);
}
