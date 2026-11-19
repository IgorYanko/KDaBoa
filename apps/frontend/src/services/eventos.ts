import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type { AgendaDTO, CategoriaDTO, CriarEventoRequestDTO, EventoDTO, FiltroEventosDTO, LocalDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { lerEventosCriados, salvarEventoCriado } from '../mocks/eventosCriados';
import { salvarLocalCriado } from '../mocks/locaisCriados';
import { comPresenca } from '../mocks/presencas';
import { intervaloDoPeriodo } from '../utils/datas';
import { reduzirImagem } from '../utils/imagem';
import { listarCategorias } from './categorias';
import { listarLocais } from './locais';

/** Evento com a categoria e o local já resolvidos, pronto para as telas. */
export interface EventoCompleto {
  evento: EventoDTO;
  categoria?: CategoriaDTO;
  local?: LocalDTO;
}

function semAcento(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Aplica busca e período. Roda também no modo API, porque a rota ainda não
 * filtra (issue #23); quando filtrar, isto só confirma o que veio.
 */
function filtrar(lista: EventoCompleto[], filtro: FiltroEventosDTO): EventoCompleto[] {
  const agora = new Date();
  let resultado = lista.filter(({ evento }) => new Date(evento.data_fim ?? evento.data_inicio) >= agora);

  if (filtro.periodo) {
    const [inicio, fim] = intervaloDoPeriodo(filtro.periodo, agora);
    resultado = resultado.filter(({ evento }) => {
      const data = new Date(evento.data_inicio);
      return data >= inicio && data < fim;
    });
  }

  const busca = semAcento(filtro.busca?.trim() ?? '');
  if (busca) {
    resultado = resultado.filter(({ evento, categoria, local }) =>
      [evento.titulo, evento.descricao, categoria?.nome, local?.nome].some((t) => t && semAcento(t).includes(busca)),
    );
  }

  if (filtro.categoria_id) {
    resultado = resultado.filter(({ evento }) => evento.categoria_id === filtro.categoria_id);
  }

  return resultado.sort((a, b) => a.evento.data_inicio.localeCompare(b.evento.data_inicio));
}

function montarQuery(filtro: FiltroEventosDTO): string {
  const params = new URLSearchParams();
  if (filtro.busca) params.set('busca', filtro.busca);
  if (filtro.periodo) params.set('periodo', filtro.periodo);
  if (filtro.categoria_id) params.set('categoria_id', String(filtro.categoria_id));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

/** Eventos do mock: os do esboço + os criados na tela Divulgar neste navegador. */
function todosEventosMock(): EventoDTO[] {
  return [...eventosMock, ...lerEventosCriados()];
}

async function buscarListaEventos(filtro: FiltroEventosDTO): Promise<EventoDTO[]> {
  if (USAR_MOCK) {
    await atraso(300);
    return todosEventosMock().map(comPresenca);
  }
  return requisicao<EventoDTO[]>(`/api/eventos${montarQuery(filtro)}`);
}

async function completar(eventos: EventoDTO[]): Promise<EventoCompleto[]> {
  const [categorias, locais] = await Promise.all([listarCategorias(), listarLocais()]);
  return eventos.map((evento) => ({
    evento,
    categoria: categorias.find((c) => c.id === evento.categoria_id),
    local: locais.find((l) => l.id === evento.local_id),
  }));
}

/** GET /api/eventos — próximos eventos, já com categoria e local. */
export async function listarEventos(filtro: FiltroEventosDTO = {}): Promise<EventoCompleto[]> {
  const eventos = await buscarListaEventos(filtro);
  return filtrar(await completar(eventos), filtro);
}

/** Agenda já com categoria e local em cada evento. */
export interface AgendaCompleta {
  proximos: EventoCompleto[];
  passados: EventoCompleto[];
}

/** Um evento ainda não acabou (sem término, vale o horário de início). */
function aindaNaoAcabou(evento: EventoDTO, agora: Date): boolean {
  return new Date(evento.data_fim ?? evento.data_inicio) >= agora;
}

/**
 * GET /api/usuarios/me/agenda (issue #39, rota ainda não existe) — eventos em que o
 * usuário confirmou presença, separados em próximos e passados.
 */
export async function listarAgenda(): Promise<AgendaCompleta> {
  let proximos: EventoDTO[];
  let passados: EventoDTO[];
  if (USAR_MOCK) {
    await atraso(300);
    const agora = new Date();
    const confirmados = todosEventosMock()
      .map(comPresenca)
      .filter((e) => e.eu_vou);
    proximos = confirmados.filter((e) => aindaNaoAcabou(e, agora));
    passados = confirmados.filter((e) => !aindaNaoAcabou(e, agora));
  } else {
    ({ proximos, passados } = await requisicao<AgendaDTO>('/api/usuarios/me/agenda'));
  }
  const [proximosCompletos, passadosCompletos] = await Promise.all([completar(proximos), completar(passados)]);
  return {
    proximos: proximosCompletos.sort((a, b) => a.evento.data_inicio.localeCompare(b.evento.data_inicio)),
    passados: passadosCompletos.sort((a, b) => b.evento.data_inicio.localeCompare(a.evento.data_inicio)),
  };
}

/** GET /api/eventos/:id — um evento, já com categoria e local. */
export async function buscarEvento(id: string): Promise<EventoCompleto> {
  let evento: EventoDTO;
  if (USAR_MOCK) {
    await atraso(250);
    const encontrado = todosEventosMock().find((e) => e.id === id);
    if (!encontrado) throw new ErroApi('Evento não encontrado', 404);
    evento = comPresenca(encontrado);
  } else {
    evento = await requisicao<EventoDTO>(`/api/eventos/${encodeURIComponent(id)}`);
  }
  const [completo] = await completar([evento]);
  return completo;
}

/**
 * POST /api/eventos — publica um evento (tela Divulgar, issues #43 e #45).
 * A capa ainda não vai para a API (upload pendente, issue #46); no mock ela fica guardada no navegador.
 */
export async function criarEvento(dados: CriarEventoRequestDTO, capa?: File | null): Promise<EventoDTO> {
  if (!USAR_MOCK) {
    try {
      return await requisicao<EventoDTO>('/api/eventos', { metodo: 'POST', corpo: dados });
    } catch (e) {
      // A API ainda não cria o local junto com o evento (issue #44): explica em vez do erro genérico.
      if (dados.novo_local && e instanceof ErroApi && e.status === 400) {
        throw new ErroApi('A API ainda não cadastra locais novos. Por enquanto, escolha um local da lista.', 400);
      }
      throw e;
    }
  }
  await atraso(600);
  const autor = lerSessao()?.usuario;
  if (!autor) throw new ErroApi('Entre na sua conta para divulgar um evento.', 401);
  const { novo_local: novoLocal, ...resto } = dados;
  const localId = novoLocal ? salvarLocalCriado(novoLocal).id : (dados.local_id ?? 0);
  const evento: EventoDTO = {
    ...resto,
    local_id: localId,
    id: crypto.randomUUID(),
    data_fim: null,
    criador_id: autor.id,
    organizador: autor,
    capa_url: capa ? await reduzirImagem(capa) : null,
    total_confirmados: 0,
    eu_vou: false,
    participantes_amostra: [],
  };
  try {
    salvarEventoCriado(evento);
  } catch {
    throw new ErroApi('Não foi possível guardar o evento neste navegador (imagem grande demais?).', 413);
  }
  return evento;
}
