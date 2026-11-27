import { ErroApi, requisicao } from '../api/client';
import { lerSessao } from '../api/sessao';
import { USAR_MOCK } from '../config';
import type {
  AtualizarEventoRequestDTO,
  CategoriaDTO,
  CriarEventoRequestDTO,
  EventoDTO,
  FiltroEventosDTO,
  LocalDTO,
} from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { comAlteracoes, marcarExcluido, salvarEdicao } from '../mocks/eventosAlterados';
import { lerEventosCriados, salvarEventoCriado } from '../mocks/eventosCriados';
import { salvarLocalCriado } from '../mocks/locaisCriados';
import { comPresenca } from '../mocks/presencas';
import { intervaloDoPeriodo } from '../utils/datas';
import { reduzirImagem } from '../utils/imagem';
import { listarCategorias } from './categorias';
import { listarLocais } from './locais';
import { buscarAgendaDaApi, type EventoDaAgenda, eventosQueVou } from './presenca';

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

function montarQuery(filtro: FiltroEventosDTO, pagina?: { pagina: number; limite: number }): string {
  const params = new URLSearchParams();
  if (pagina) {
    params.set('page', String(pagina.pagina));
    params.set('limit', String(pagina.limite));
  }
  if (filtro.busca) params.set('busca', filtro.busca);
  if (filtro.periodo) params.set('periodo', filtro.periodo);
  if (filtro.categoria_id) params.set('categoria_id', String(filtro.categoria_id));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

/** Eventos do mock: os do esboço + os criados na tela Divulgar neste navegador. */
function todosEventosMock(): EventoDTO[] {
  return comAlteracoes([...eventosMock, ...lerEventosCriados()]);
}

/** No mock, a mesma regra do backend: só quem criou ou um ADMIN altera o evento. */
function garantirPermissaoNoMock(id: string): void {
  const evento = todosEventosMock().find((e) => e.id === id);
  if (!evento) throw new ErroApi('Evento não encontrado', 404);
  const usuario = lerSessao()?.usuario;
  if (!usuario || (evento.criador_id !== usuario.id && usuario.perfil !== 'ADMIN')) {
    throw new ErroApi('Você não tem permissão para alterar este evento', 403);
  }
}

/** Evento como a API manda hoje (release 3): o total vem em `confirmados`. */
type EventoDaApi = EventoDTO & { confirmados?: number };

/**
 * Ajusta o evento da API ao formato do front: o total de confirmados vem como `confirmados`,
 * o preço (Decimal no banco) pode chegar como texto e `eu_vou` ainda não vem (issue #29):
 * ele sai da lista de presenças do banco (`eventosQueVou`).
 */
function doFormatoDaApi(evento: EventoDaApi, vou: Set<string>): EventoDTO {
  return {
    ...evento,
    preco: Number(evento.preco) || 0,
    total_confirmados: evento.total_confirmados ?? evento.confirmados ?? 0,
    eu_vou: evento.eu_vou ?? vou.has(evento.id),
  };
}

/** Coordenada que pode chegar como texto (Decimal do banco). */
function numeroOuNada(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

/** Evento do GET /api/presencas/agenda (camelCase do banco) no formato do front. */
function doFormatoDaAgenda(evento: EventoDaAgenda): EventoDTO {
  return {
    id: evento.id,
    titulo: evento.titulo,
    descricao: evento.descricao ?? '',
    data_inicio: evento.data_inicio,
    data_fim: evento.data_fim ?? null,
    preco: Number(evento.preco) || 0,
    classificacao_etaria: evento.classificacaoEtaria ?? 0,
    categoria_id: evento.categoriaId,
    local_id: evento.localId,
    criador_id: evento.criadorId,
    capa_url: evento.capa_url ?? null,
    latitude: numeroOuNada(evento.latitude),
    longitude: numeroOuNada(evento.longitude),
    verificado: evento.verificado ?? false,
    venda_no_app: evento.vendaNoApp ?? false,
    quantidade_ingressos: evento.quantidadeIngressos ?? null,
    eu_vou: true,
  };
}

async function buscarListaEventos(filtro: FiltroEventosDTO): Promise<EventoDTO[]> {
  if (USAR_MOCK) {
    await atraso(300);
    return todosEventosMock().map(comPresenca);
  }
  const [lista, vou] = await Promise.all([
    requisicao<EventoDaApi[]>(`/api/eventos${montarQuery(filtro)}`),
    eventosQueVou(),
  ]);
  return lista.map((evento) => doFormatoDaApi(evento, vou));
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

/** Uma página da lista de eventos. */
export interface PaginaEventos {
  itens: EventoCompleto[];
  /** Total de eventos com esses filtros (em todas as páginas). */
  total: number;
  temMais: boolean;
}

/** Resposta do GET /api/eventos com page e limit. */
interface RespostaPaginada {
  dados: EventoDaApi[];
  paginacao: { total: number; pagina: number; limite: number; totalPaginas: number };
}

/** GET /api/eventos?page=&limit= — uma página dos próximos eventos, já com categoria e local. */
export async function listarEventosPaginados(
  filtro: FiltroEventosDTO,
  pagina: number,
  limite: number,
): Promise<PaginaEventos> {
  if (USAR_MOCK) {
    const todos = await listarEventos(filtro);
    const inicio = (pagina - 1) * limite;
    return { itens: todos.slice(inicio, inicio + limite), total: todos.length, temMais: inicio + limite < todos.length };
  }
  const [{ dados, paginacao }, vou] = await Promise.all([
    requisicao<RespostaPaginada>(`/api/eventos${montarQuery(filtro, { pagina, limite })}`),
    eventosQueVou(),
  ]);
  // A API já filtrou e paginou: a página vai como veio. Filtrar de novo aqui deixaria
  // `total` e `temMais` diferentes do que aparece na tela (o `filtrar` fica só no mock).
  const itens = await completar(dados.map((e) => doFormatoDaApi(e, vou)));
  return { itens, total: paginacao.total, temMais: paginacao.pagina < paginacao.totalPaginas };
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
 * GET /api/presencas/agenda (issue #39) — eventos em que o usuário confirmou presença,
 * separados em próximos e passados pelo banco.
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
    const agenda = await buscarAgendaDaApi();
    proximos = agenda.proximos.map(doFormatoDaAgenda);
    passados = agenda.passados.map(doFormatoDaAgenda);
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
    const [bruto, vou] = await Promise.all([
      requisicao<EventoDaApi>(`/api/eventos/${encodeURIComponent(id)}`),
      eventosQueVou(),
    ]);
    evento = doFormatoDaApi(bruto, vou);
  }
  const [completo] = await completar([evento]);
  return completo;
}

/**
 * Põe a foto escolhida no corpo como `imagem_url`, reduzida (960 px, JPEG) para caber
 * no limite da API. Sem foto nova, o corpo vai como está (a edição mantém a capa atual).
 */
async function comCapa<T extends object>(dados: T, capa?: File | null): Promise<T & { imagem_url?: string }> {
  if (!capa) return dados;
  return { ...dados, imagem_url: await reduzirImagem(capa, 960, 0.75) };
}

/**
 * POST /api/eventos — publica um evento (tela Divulgar, issues #43 e #45).
 * A capa vai junto, reduzida no navegador (issue #46); no mock ela fica guardada no navegador.
 */
export async function criarEvento(dados: CriarEventoRequestDTO, capa?: File | null): Promise<EventoDTO> {
  if (!USAR_MOCK) {
    try {
      return await requisicao<EventoDTO>('/api/eventos', { metodo: 'POST', corpo: await comCapa(dados, capa) });
    } catch (e) {
      // A API ainda não cria o local junto com o evento (issue #44): explica em vez do erro genérico.
      // Outros erros de validação (título, preço...) aparecem como a API mandou.
      if (dados.novo_local && e instanceof ErroApi && e.status === 400 && /local|erro ao criar evento/i.test(e.message)) {
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
    verificado: autor.perfil === 'ORGANIZADOR',
    venda_no_app: autor.perfil === 'ORGANIZADOR' && dados.venda_no_app === true,
    quantidade_ingressos:
      autor.perfil === 'ORGANIZADOR' && dados.venda_no_app ? (dados.quantidade_ingressos ?? null) : null,
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

/** PUT /api/eventos/:id — só o criador ou um ADMIN (a API responde 403 para os outros). */
export async function atualizarEvento(id: string, dados: AtualizarEventoRequestDTO, capa?: File | null): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/eventos/${encodeURIComponent(id)}`, {
      metodo: 'PUT',
      corpo: await comCapa(dados, capa),
    });
    return;
  }
  await atraso(500);
  garantirPermissaoNoMock(id);
  salvarEdicao(id, { ...dados, ...(capa ? { capa_url: await reduzirImagem(capa) } : {}) });
}

/** DELETE /api/eventos/:id — apaga também as presenças e o chat do evento. */
export async function excluirEvento(id: string): Promise<void> {
  if (!USAR_MOCK) {
    await requisicao<unknown>(`/api/eventos/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
    return;
  }
  await atraso(400);
  garantirPermissaoNoMock(id);
  marcarExcluido(id);
}
