import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { AtualizarPerfilRequestDTO, ContadoresPerfilDTO, UsuarioDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { lerPerfilMock, salvarPerfilMock } from '../mocks/perfil';
import { lerSeguindo } from '../mocks/seguindo';
import { listarAgenda } from './eventos';

/**
 * Perfil do usuário logado (issue #40). As rotas ainda não existem na API (issue #41);
 * os caminhos abaixo são a sugestão do front.
 */

/** Seguidores do usuário de teste no mock (o mock não guarda quem segue quem do outro lado). */
const SEGUIDORES_MOCK = 9;

function perfilOuErro(perfil: UsuarioDTO | null): UsuarioDTO {
  if (!perfil) throw new ErroApi('Entre na sua conta para ver o perfil.', 401);
  return perfil;
}

/** GET /api/usuarios/me */
export async function buscarPerfil(): Promise<UsuarioDTO> {
  if (!USAR_MOCK) return requisicao<UsuarioDTO>('/api/usuarios/me');
  await atraso(250);
  return perfilOuErro(lerPerfilMock());
}

/** PATCH /api/usuarios/me — grava só os campos enviados e devolve o perfil atualizado. */
export async function atualizarPerfil(dados: AtualizarPerfilRequestDTO): Promise<UsuarioDTO> {
  if (!USAR_MOCK) return requisicao<UsuarioDTO>('/api/usuarios/me', { metodo: 'PATCH', corpo: dados });
  await atraso(350);
  if (dados.interesses?.length === 0) throw new ErroApi('Escolha pelo menos um interesse.', 400);
  return perfilOuErro(salvarPerfilMock(dados));
}

/** GET /api/usuarios/me/contadores — próximos eventos, quem ele segue e quem o segue. */
export async function buscarContadores(): Promise<ContadoresPerfilDTO> {
  if (!USAR_MOCK) return requisicao<ContadoresPerfilDTO>('/api/usuarios/me/contadores');
  const agenda = await listarAgenda();
  return { proximos: agenda.proximos.length, seguindo: lerSeguindo().size, seguidores: SEGUIDORES_MOCK };
}
