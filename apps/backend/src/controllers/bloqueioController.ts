import type { Request, Response } from 'express';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequisicaoAutenticada extends Request {
  usuario?: {
    id?: string;
    email?: string;
  };
}

export const bloqueioController = {
  // GET /api/bloqueios - Lista usuários bloqueados pelo usuário logado
  listar: async (req: Request, res: Response): Promise<void> => {
    try {
      const bloqueadorId = (req as RequisicaoAutenticada).usuario?.id;

      if (!bloqueadorId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const bloqueios = await prisma.bloqueio.findMany({
        where: { bloqueadorId },
        include: {
          bloqueado: {
            select: {
              id: true,
              nome: true,
              fotoUrl: true,
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
      });

      const bloqueados = bloqueios.map((b) => ({
        id: b.bloqueado.id,
        nome: b.bloqueado.nome,
        fotoUrl: b.bloqueado.fotoUrl,
        criadoEm: b.criadoEm,
      }));

      res.json({ bloqueados });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao listar usuários bloqueados' });
    }
  },

  // POST /api/bloqueios/:usuarioId - Bloqueia um usuário sem duplicar (valida presença se vier eventoId do chat)
  bloquear: async (req: Request, res: Response): Promise<void> => {
    try {
      const bloqueadoId = String(req.params.usuarioId);
      const bloqueadorId = (req as RequisicaoAutenticada).usuario?.id;

      if (!bloqueadorId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(bloqueadoId)) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      if (bloqueadorId === bloqueadoId) {
        res.status(400).json({ erro: 'Você não pode bloquear a si mesmo' });
        return;
      }

      const eventoIdBruto =
        req.body?.eventoId ??
        req.body?.evento_id ??
        req.query?.eventoId ??
        req.query?.evento_id;

      if (
        eventoIdBruto !== undefined &&
        eventoIdBruto !== null &&
        String(eventoIdBruto).trim() !== ''
      ) {
        const eventoId = String(eventoIdBruto).trim();

        if (!uuidRegex.test(eventoId)) {
          res.status(404).json({ erro: 'Evento não encontrado' });
          return;
        }

        const presenca = await prisma.presenca.findUnique({
          where: {
            usuarioId_eventoId: {
              usuarioId: bloqueadorId,
              eventoId,
            },
          },
        });

        if (!presenca) {
          res.status(403).json({
            erro: 'Apenas usuários com presença confirmada neste evento podem bloquear pelo chat',
          });
          return;
        }
      }

      const usuarioAlvo = await prisma.usuario.findUnique({
        where: { id: bloqueadoId },
      });

      if (!usuarioAlvo) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      const bloqueio = await prisma.bloqueio.upsert({
        where: {
          bloqueadorId_bloqueadoId: {
            bloqueadorId,
            bloqueadoId,
          },
        },
        update: {},
        create: {
          bloqueadorId,
          bloqueadoId,
        },
      });

      res.status(201).json({
        mensagem: 'Usuário bloqueado com sucesso',
        bloqueio,
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao bloquear usuário' });
    }
  },

  // DELETE /api/bloqueios/:usuarioId - Desbloqueia um usuário
  desbloquear: async (req: Request, res: Response): Promise<void> => {
    try {
      const bloqueadoId = String(req.params.usuarioId);
      const bloqueadorId = (req as RequisicaoAutenticada).usuario?.id;

      if (!bloqueadorId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(bloqueadoId)) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      await prisma.bloqueio.delete({
        where: {
          bloqueadorId_bloqueadoId: {
            bloqueadorId,
            bloqueadoId,
          },
        },
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).json({ erro: 'Bloqueio não encontrado' });
    }
  },
};