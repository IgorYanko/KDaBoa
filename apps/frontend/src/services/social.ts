import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { ParticipanteDTO, Uuid } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { lerEventosCriados } from '../mocks/eventosCriados';
import { visiveisNoEvento } from '../mocks/participantes';
import { lerPerfilMock } from '../mocks/perfil';
import { lerPresencas } from '../mocks/presencas';
import { lerSeguindo, marcarSeguindo } from '../mocks/seguindo';

/**
 * Quem vai e seguir (issues #30 e #31). As rotas ainda não existem na API;
 * os caminhos abaixo são a sugestão do front.
 */

/**
 * GET /api/eventos/:id/participantes — confirmados com presença visível.
 * Quem escolheu ocultar a presença não vem na lista (o próprio usuário também segue essa regra).
 */
export async function listarParticipantes(eventoId: Uuid): Promise<ParticipanteDTO[]> {
  if (!USAR_MOCK) {
    return requisicao<ParticipanteDTO[]>(`/api/eventos/${encodeURIComponent(eventoId)}/participantes`);
  }
  await atraso(300);
  const evento = [...eventosMock, ...lerEventosCriados()].find((e) => e.id === eventoId);
  if (!evento) throw new ErroApi('Evento não encontrado', 404);

  const seguindo = lerSeguindo();
  const lista: ParticipanteDTO[] = visiveisNoEvento(evento).map((p) => ({ ...p, seguindo: seguindo.has(p.id) }));
  const eu = lerPerfilMock();
  if (eu && lerPresencas().has(eventoId) && eu.mostrar_presenca) {
    lista.unshift({ id: eu.id, nome: eu.nome, apelido: eu.apelido, foto_url: eu.foto_url, seguindo: false });
  }
  return lista;
}

/** POST /api/usuarios/:id/seguir — seguir de novo não duplica. */
export async function seguirUsuario(usuarioId: Uuid): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/usuarios/${encodeURIComponent(usuarioId)}/seguir`, { metodo: 'POST' });
    return;
  }
  await atraso(250);
  marcarSeguindo(usuarioId, true);
}

/** DELETE /api/usuarios/:id/seguir */
export async function deixarDeSeguir(usuarioId: Uuid): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/usuarios/${encodeURIComponent(usuarioId)}/seguir`, { metodo: 'DELETE' });
    return;
  }
  await atraso(250);
  marcarSeguindo(usuarioId, false);
}
