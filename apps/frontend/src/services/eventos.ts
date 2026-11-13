import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { CategoriaDTO, EventoDTO, FiltroEventosDTO, LocalDTO } from '../dtos';
import { atraso } from '../mocks/atraso';
import { eventosMock } from '../mocks/eventos';
import { comPresenca } from '../mocks/presencas';
import { intervaloDoPeriodo } from '../utils/datas';
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

async function buscarListaEventos(filtro: FiltroEventosDTO): Promise<EventoDTO[]> {
  if (USAR_MOCK) {
    await atraso(300);
    return eventosMock.map(comPresenca);
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

/** GET /api/eventos/:id — um evento, já com categoria e local. */
export async function buscarEvento(id: string): Promise<EventoCompleto> {
  let evento: EventoDTO;
  if (USAR_MOCK) {
    await atraso(250);
    const encontrado = eventosMock.find((e) => e.id === id);
    if (!encontrado) throw new ErroApi('Evento não encontrado', 404);
    evento = comPresenca(encontrado);
  } else {
    evento = await requisicao<EventoDTO>(`/api/eventos/${encodeURIComponent(id)}`);
  }
  const [completo] = await completar([evento]);
  return completo;
}
