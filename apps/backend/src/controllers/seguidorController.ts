import type { Request, Response } from 'express';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequisicaoAutenticada extends Request {
  usuario?: {
    id?: string;
    email?: string;
  };
}

export const seguidorController = {
  // POST /api/seguidores/:usuarioId - Segue um usuário sem duplicar
  seguir: async (req: Request, res: Response): Promise<void> => {
    try {
      const seguidoId = String(req.params.usuarioId);
      const seguidorId = (req as RequisicaoAutenticada).usuario?.id;

      if (!seguidorId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(seguidoId)) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      if (seguidorId === seguidoId) {
        res.status(400).json({ erro: 'Você não pode seguir a si mesmo' });
        return;
      }

      const usuarioAlvo = await prisma.usuario.findUnique({
        where: { id: seguidoId },
      });

      if (!usuarioAlvo) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      const relacao = await prisma.seguidor.upsert({
        where: {
          seguidorId_seguidoId: {
            seguidorId,
            seguidoId,
          },
        },
        update: {},
        create: {
          seguidorId,
          seguidoId,
        },
      });

      res.status(201).json({
        mensagem: 'Usuário seguido com sucesso',
        seguidor: relacao,
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao seguir usuário' });
    }
  },

  // DELETE /api/seguidores/:usuarioId - Deixa de seguir um usuário
  deixarDeSeguir: async (req: Request, res: Response): Promise<void> => {
    try {
      const seguidoId = String(req.params.usuarioId);
      const seguidorId = (req as RequisicaoAutenticada).usuario?.id;

      if (!seguidorId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(seguidoId)) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      await prisma.seguidor.delete({
        where: {
          seguidorId_seguidoId: {
            seguidorId,
            seguidoId,
          },
        },
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).json({ erro: 'Relação de seguidor não encontrada' });
    }
  },
};