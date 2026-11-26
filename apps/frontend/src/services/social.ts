import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
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
 * Quem vai e seguir (issues #30 e #31). Rotas da API (#90):
 * GET /api/presencas/:eventoId e POST/DELETE /api/seguidores/:usuarioId.
 */

/** Resposta do GET /api/presencas/:eventoId (só quem deixou a presença visível, em camelCase). */
interface RespostaPresencas {
  total: number;
  confirmados: { id: string; nome: string; fotoUrl?: string | null; confirmadoEm: string }[];
}

// ---------------------------------------------------------------------------
// PENDENTE (issue #31): a API ainda não diz quem o usuário logado segue.
// Até lá, o front lembra neste navegador quem ele seguiu, para o botão não voltar a "Seguir".
// ---------------------------------------------------------------------------

function chaveSeguindo(): string {
  return `kdaboa:seguindo:${lerSessao()?.usuario.id ?? 'anonimo'}`;
}

function seguindoLembrados(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(chaveSeguindo()) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function lembrarSeguindo(usuarioId: string, seguindo: boolean): void {
  const lembrados = seguindoLembrados();
  if (seguindo) lembrados.add(usuarioId);
  else lembrados.delete(usuarioId);
  localStorage.setItem(chaveSeguindo(), JSON.stringify([...lembrados]));
}

/** Quantas pessoas o usuário seguiu pela API neste navegador (até a API informar, issue #31). */
export function quantosSigo(): number {
  return seguindoLembrados().size;
}

/**
 * GET /api/presencas/:eventoId — confirmados com presença visível.
 * Quem escolheu ocultar a presença não vem na lista (o próprio usuário também segue essa regra).
 */
export async function listarParticipantes(eventoId: Uuid): Promise<ParticipanteDTO[]> {
  if (!USAR_MOCK) {
    const { confirmados } = await requisicao<RespostaPresencas>(`/api/presencas/${encodeURIComponent(eventoId)}`);
    const lembrados = seguindoLembrados();
    return confirmados.map((p) => ({ id: p.id, nome: p.nome, foto_url: p.fotoUrl ?? null, seguindo: lembrados.has(p.id) }));
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

/** POST /api/seguidores/:usuarioId — seguir de novo não duplica. */
export async function seguirUsuario(usuarioId: Uuid): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/seguidores/${encodeURIComponent(usuarioId)}`, { metodo: 'POST' });
    lembrarSeguindo(usuarioId, true);
    return;
  }
  await atraso(250);
  marcarSeguindo(usuarioId, true);
}

/** DELETE /api/seguidores/:usuarioId */
export async function deixarDeSeguir(usuarioId: Uuid): Promise<void> {
  if (!USAR_MOCK) {
    try {
      await requisicao<unknown>(`/api/seguidores/${encodeURIComponent(usuarioId)}`, { metodo: 'DELETE' });
    } catch (e) {
      // 404 = já não seguia: para a tela, o resultado é o mesmo.
      if (!(e instanceof ErroApi && e.status === 404 && e.message.startsWith('Relação'))) throw e;
    }
    lembrarSeguindo(usuarioId, false);
    return;
  }
  await atraso(250);
  marcarSeguindo(usuarioId, false);
}
