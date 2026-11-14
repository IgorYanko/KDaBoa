import type { Request, Response } from 'express';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RequestComUsuario = Request & {
  usuario?: {
    id?: string;
  };
};

export const eventoController = {
  // READ - Lista todos os eventos
  listar: async (_req: Request, res: Response): Promise<void> => {
    try {
      const eventos = await prisma.evento.findMany({
        include: {
          categoria: true,
          local: true,
        },
        orderBy: { dataInicio: 'asc' },
      });
      res.json(eventos);
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

      const evento = await prisma.evento.findUnique({
        where: { id },
        include: {
          categoria: true,
          local: true,
        },
      });

      if (!evento) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      res.json(evento);
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

      const reqAuth = req as RequestComUsuario;
      const idCriador = reqAuth.usuario?.id || criadorId || criador_id;

      const novoEvento = await prisma.evento.create({
        data: {
          titulo,
          descricao,
          dataInicio: new Date(dataInicio || data_inicio),
          dataFim: (dataFim || data_fim) ? new Date(dataFim || data_fim) : null,
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
          ...((dataInicio || data_inicio) && { dataInicio: new Date(dataInicio || data_inicio) }),
          ...((dataFim || data_fim) && { dataFim: new Date(dataFim || data_fim) }),
          ...(preco !== undefined && { preco }),
          ...((classificacaoEtaria !== undefined || classificacao_etaria !== undefined) && {
            classificacaoEtaria: Number(classificacaoEtaria ?? classificacao_etaria),
          }),
          ...((imagemUrl !== undefined || imagem_url !== undefined) && {
            imagemUrl: imagemUrl ?? imagem_url,
          }),
          ...((categoriaId || categoria_id) && { categoriaId: Number(categoriaId || categoria_id) }),
          ...((localId || local_id) && { localId: Number(localId || local_id) }),
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
      await prisma.evento.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).json({ erro: 'Evento não encontrado ou erro ao deletar' });
    }
  },
};