import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { AtualizarPerfilRequestDTO, ContadoresPerfilDTO, UsuarioDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { lerPerfilMock, salvarPerfilMock } from '../mocks/perfil';
import { lerSeguindo } from '../mocks/seguindo';
import { listarAgenda } from './eventos';
import { quantosSigo } from './social';

/**
 * Perfil do usuário logado (issue #40). As rotas ainda não existem na API (issue #41);
 * os caminhos abaixo são a sugestão do front.
 */

// ---------------------------------------------------------------------------
// PENDENTE (issue #41): enquanto a API responde 404 nessas rotas, o perfil é montado com os
// dados da sessão e as escolhas da tela ficam guardadas neste navegador.
// ---------------------------------------------------------------------------

function rotaAusente(e: unknown): boolean {
  return e instanceof ErroApi && e.status === 404;
}

function chavePerfilLocal(id: string): string {
  return `kdaboa:perfil:${id}`;
}

function perfilLocal(): UsuarioDTO {
  const usuario = lerSessao()?.usuario;
  if (!usuario) throw new ErroApi('Entre na sua conta para ver o perfil.', 401);
  let escolhas: AtualizarPerfilRequestDTO = {};
  try {
    escolhas = JSON.parse(localStorage.getItem(chavePerfilLocal(usuario.id)) ?? '{}') as AtualizarPerfilRequestDTO;
  } catch {}
  return {
    ...usuario,
    email: '',
    data_nascimento: '',
    interesses: [],
    mostrar_presenca: false,
    receber_lembretes: true,
    ...escolhas,
  };
}

function salvarPerfilLocal(dados: AtualizarPerfilRequestDTO): UsuarioDTO {
  const atual = perfilLocal();
  const { id, email, data_nascimento, nome, apelido, foto_url, ...escolhas } = { ...atual, ...dados };
  localStorage.setItem(chavePerfilLocal(id), JSON.stringify(escolhas));
  return { id, email, data_nascimento, nome, apelido, foto_url, ...escolhas };
}

/** Seguidores do usuário de teste no mock (o mock não guarda quem segue quem do outro lado). */
const SEGUIDORES_MOCK = 9;

function perfilOuErro(perfil: UsuarioDTO | null): UsuarioDTO {
  if (!perfil) throw new ErroApi('Entre na sua conta para ver o perfil.', 401);
  return perfil;
}

/** GET /api/usuarios/me */
export async function buscarPerfil(): Promise<UsuarioDTO> {
  if (!USAR_MOCK) {
    try {
      return await requisicao<UsuarioDTO>('/api/usuarios/me');
    } catch (e) {
      if (rotaAusente(e)) return perfilLocal();
      throw e;
    }
  }
  await atraso(250);
  return perfilOuErro(lerPerfilMock());
}

/** PATCH /api/usuarios/me — grava só os campos enviados e devolve o perfil atualizado. */
export async function atualizarPerfil(dados: AtualizarPerfilRequestDTO): Promise<UsuarioDTO> {
  if (!USAR_MOCK) {
    try {
      return await requisicao<UsuarioDTO>('/api/usuarios/me', { metodo: 'PATCH', corpo: dados });
    } catch (e) {
      if (!rotaAusente(e)) throw e;
      if (dados.interesses?.length === 0) throw new ErroApi('Escolha pelo menos um interesse.', 400);
      return salvarPerfilLocal(dados);
    }
  }
  await atraso(350);
  if (dados.interesses?.length === 0) throw new ErroApi('Escolha pelo menos um interesse.', 400);
  return perfilOuErro(salvarPerfilMock(dados));
}

/** GET /api/usuarios/me/contadores — próximos eventos, quem ele segue e quem o segue. */
export async function buscarContadores(): Promise<ContadoresPerfilDTO> {
  if (!USAR_MOCK) {
    try {
      return await requisicao<ContadoresPerfilDTO>('/api/usuarios/me/contadores');
    } catch (e) {
      if (!rotaAusente(e)) throw e;
      // Seguidores só a API sabe; os outros números saem do que o front já conhece.
      return { proximos: (await listarAgenda()).proximos.length, seguindo: quantosSigo(), seguidores: 0 };
    }
  }
  const agenda = await listarAgenda();
  return { proximos: agenda.proximos.length, seguindo: lerSeguindo().size, seguidores: SEGUIDORES_MOCK };
}
