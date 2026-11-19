import type { Request, Response } from 'express';
import type { RequisicaoAutenticada } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PeriodoFiltro = 'hoje' | 'fim-de-semana' | 'este-mes';

interface EventoBanco {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: Date;
  dataFim?: Date | null;
  preco: unknown;
  classificacaoEtaria: number;
  imagemUrl?: string | null;
  latitude?: unknown;
  longitude?: unknown;
  categoriaId: number;
  localId: number;
  criadorId: string;
  categoria?: { id: number; nome: string; icone?: string | null } | null;
  local?: { id: number; nome: string; endereco?: string | null } | null;
  _count?: { presencas: number };
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function intervaloDoPeriodo(
  periodo: PeriodoFiltro,
  agora = new Date(),
): [Date, Date] {
  const hoje = inicioDoDia(agora);
  if (periodo === 'hoje') {
    return [hoje, new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)];
  }
  if (periodo === 'este-mes') {
    return [hoje, new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)];
  }
  const diaSemana = hoje.getDay();
  const diasAteSexta = diaSemana === 0 ? -2 : 5 - diaSemana;
  const sexta = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasAteSexta);
  const segunda = new Date(sexta.getFullYear(), sexta.getMonth(), sexta.getDate() + 3);
  return [sexta < hoje ? hoje : sexta, segunda];
}

function semAcento(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatarEventoParaResposta(ev: EventoBanco) {
  const dataInicioIso =
    ev.dataInicio instanceof Date ? ev.dataInicio.toISOString() : String(ev.dataInicio);
  const dataFimIso =
    ev.dataFim instanceof Date ? ev.dataFim.toISOString() : (ev.dataFim ?? null);
  const capa = ev.imagemUrl ?? null;

  return {
    ...ev,
    data_inicio: dataInicioIso,
    data_fim: dataFimIso,
    classificacao_etaria: ev.classificacaoEtaria,
    imagem_url: capa,
    capa_url: capa,
    categoria_id: ev.categoriaId,
    local_id: ev.localId,
    criador_id: ev.criadorId,
    confirmados: ev._count?.presencas ?? 0,
  };
}

export const eventoController = {
  // READ - Lista próximos eventos com filtros opcionais e paginação
  listar: async (req: Request, res: Response): Promise<void> => {
    try {
      const { periodo, categoria_id, categoriaId, busca, page, pagina, limit, limite } =
        req.query;
      const agora = new Date();

      const where: Record<string, unknown> = {};

      const catBruta = categoria_id ?? categoriaId;
      if (catBruta !== undefined && String(catBruta).trim() !== '') {
        const catNum = Number(catBruta);
        if (!Number.isNaN(catNum)) {
          where.categoriaId = catNum;
        }
      }

      const periodoStr = typeof periodo === 'string' ? periodo.trim() : '';
      if (
        periodoStr === 'hoje' ||
        periodoStr === 'fim-de-semana' ||
        periodoStr === 'este-mes'
      ) {
        const [inicio, fim] = intervaloDoPeriodo(periodoStr, agora);
        where.dataInicio = {
          gte: inicio,
          lt: fim,
        };
      } else {
        where.dataInicio = {
          gte: agora,
        };
      }

      const eventos = (await prisma.evento.findMany({
        where,
        include: {
          categoria: true,
          local: true,
          _count: { select: { presencas: true } },
        },
        orderBy: { dataInicio: 'asc' },
      })) as unknown as EventoBanco[];

      const termoBusca = typeof busca === 'string' ? semAcento(busca.trim()) : '';
      const filtrados = termoBusca
        ? eventos.filter((ev) =>
            [ev.titulo, ev.descricao, ev.categoria?.nome, ev.local?.nome].some(
              (campo) => campo && semAcento(campo).includes(termoBusca),
            ),
          )
        : eventos;

      const temPaginacao =
        page !== undefined ||
        pagina !== undefined ||
        limit !== undefined ||
        limite !== undefined;

      if (temPaginacao) {
        const paginaAtual = Math.max(1, Number(page ?? pagina) || 1);
        const limitePorPagina = Math.min(100, Math.max(1, Number(limit ?? limite) || 10));
        const inicio = (paginaAtual - 1) * limitePorPagina;
        const paginados = filtrados.slice(inicio, inicio + limitePorPagina);

        res.json({
          dados: paginados.map(formatarEventoParaResposta),
          paginacao: {
            total: filtrados.length,
            pagina: paginaAtual,
            limite: limitePorPagina,
            totalPaginas: Math.ceil(filtrados.length / limitePorPagina),
          },
        });
        return;
      }

      res.json(filtrados.map(formatarEventoParaResposta));
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao listar eventos' });
    }
  },

  // READ - Busca um evento por ID
  buscarPorId: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);

      if (!uuidRegex.test(id)) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      const evento = (await prisma.evento.findUnique({
        where: { id },
        include: {
          categoria: true,
          local: true,
          _count: { select: { presencas: true } },
        },
      })) as unknown as EventoBanco | null;

      if (!evento) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      res.json(formatarEventoParaResposta(evento));
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao buscar evento' });
    }
  },

  // CREATE - Cria um novo evento
  criar: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        titulo,
        descricao,
        data_inicio,
        dataInicio,
        data_fim,
        dataFim,
        preco,
        classificacao_etaria,
        classificacaoEtaria,
        imagem_url,
        imagemUrl,
        latitude,
        longitude,
        categoria_id,
        categoriaId,
        local_id,
        localId,
        criador_id,
        criadorId,
      } = req.body;

      const reqAuth = req as RequisicaoAutenticada;
      const idCriador = reqAuth.usuario?.id || criadorId || criador_id;

      const novoEvento = await prisma.evento.create({
        data: {
          titulo,
          descricao,
          dataInicio: new Date(dataInicio || data_inicio),
          dataFim: dataFim || data_fim ? new Date(dataFim || data_fim) : null,
          preco: preco ?? 0,
          classificacaoEtaria: Number(classificacaoEtaria ?? classificacao_etaria ?? 0),
          imagemUrl: imagemUrl || imagem_url,
          latitude,
          longitude,
          categoriaId: Number(categoriaId || categoria_id),
          localId: Number(localId || local_id),
          criadorId: idCriador,
        },
      });

      res.status(201).json(novoEvento);
    } catch (error) {
      res.status(400).json({ erro: 'Erro ao criar evento', detalhes: error });
    }
  },

  // UPDATE - Atualiza um evento por ID
  atualizar: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const reqAuth = req as RequisicaoAutenticada;

      const eventoExistente = await prisma.evento.findUnique({ where: { id } });

      if (!eventoExistente) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      if (
        eventoExistente.criadorId !== reqAuth.usuario?.id &&
        reqAuth.usuario?.perfil !== 'ADMIN'
      ) {
        res.status(403).json({ erro: 'Você não tem permissão para alterar este evento' });
        return;
      }

      const {
        titulo,
        descricao,
        data_inicio,
        dataInicio,
        data_fim,
        dataFim,
        preco,
        classificacao_etaria,
        classificacaoEtaria,
        imagem_url,
        imagemUrl,
        categoria_id,
        categoriaId,
        local_id,
        localId,
      } = req.body;

      const eventoAtualizado = await prisma.evento.update({
        where: { id },
        data: {
          ...(titulo !== undefined && { titulo }),
          ...(descricao !== undefined && { descricao }),
          ...((dataInicio || data_inicio) && {
            dataInicio: new Date(dataInicio || data_inicio),
          }),
          ...((dataFim || data_fim) && {
            dataFim: new Date(dataFim || data_fim),
          }),
          ...(preco !== undefined && { preco }),
          ...((classificacaoEtaria !== undefined ||
            classificacao_etaria !== undefined) && {
            classificacaoEtaria: Number(classificacaoEtaria ?? classificacao_etaria),
          }),
          ...((imagemUrl !== undefined || imagem_url !== undefined) && {
            imagemUrl: imagemUrl ?? imagem_url,
          }),
          ...((categoriaId || categoria_id) && {
            categoriaId: Number(categoriaId || categoria_id),
          }),
          ...((localId || local_id) && {
            localId: Number(localId || local_id),
          }),
        },
      });

      res.json(eventoAtualizado);
    } catch (_error) {
      res.status(404).json({ erro: 'Evento não encontrado ou erro ao atualizar' });
    }
  },

  // DELETE - Remove um evento por ID
  deletar: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const reqAuth = req as RequisicaoAutenticada;

      const eventoExistente = await prisma.evento.findUnique({ where: { id } });

      if (!eventoExistente) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      if (
        eventoExistente.criadorId !== reqAuth.usuario?.id &&
        reqAuth.usuario?.perfil !== 'ADMIN'
      ) {
        res.status(403).json({ erro: 'Você não tem permissão para deletar este evento' });
        return;
      }

      await prisma.evento.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).json({ erro: 'Evento não encontrado ou erro ao deletar' });
    }
  },
};