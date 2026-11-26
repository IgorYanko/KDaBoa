import { lerSessao } from '../api/sessao';
import type { AtualizarPerfilRequestDTO, UsuarioDTO } from '../dtos';
import { usuariosMock } from './usuarios';

/**
 * Perfil do usuário logado no modo mock: os dados de mocks/usuarios.ts mais as escolhas
 * feitas na tela Perfil (interesses, presença visível, lembretes), guardadas no navegador.
 * No modo API quem guarda é o backend (issue #41).
 */

function chave(id: string): string {
  return `kdaboa:mock:perfil:${id}`;
}

function lerAlteracoes(id: string): AtualizarPerfilRequestDTO {
  try {
    return JSON.parse(localStorage.getItem(chave(id)) ?? '{}') as AtualizarPerfilRequestDTO;
  } catch {
    return {};
  }
}

/** Perfil de quem está logado; null se a sessão não é de um usuário do mock. */
export function lerPerfilMock(): UsuarioDTO | null {
  const id = lerSessao()?.usuario.id;
  const base = usuariosMock.find((u) => u.id === id);
  return id && base ? { ...base, ...lerAlteracoes(id) } : null;
}

/** Grava as alterações e devolve o perfil atualizado. */
export function salvarPerfilMock(dados: AtualizarPerfilRequestDTO): UsuarioDTO | null {
  const id = lerSessao()?.usuario.id;
  if (!id) return null;
  localStorage.setItem(chave(id), JSON.stringify({ ...lerAlteracoes(id), ...dados }));
  return lerPerfilMock();
}
