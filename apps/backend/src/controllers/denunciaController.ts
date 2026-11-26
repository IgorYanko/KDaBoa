import type { Request, Response } from 'express';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bigIntRegex = /^\d+$/;

interface RequisicaoAutenticada extends Request {
  usuario?: {
    id?: string;
    email?: string;
  };
}

export const denunciaController = {
  // POST /api/denuncias/:eventoId/:mensagemId - Registra denúncia de mensagem no chat do evento
  denunciar: async (req: Request, res: Response): Promise<void> => {
    try {
      const eventoId = String(req.params.eventoId);
      const mensagemIdBruto = String(req.params.mensagemId);
      const denuncianteId = (req as RequisicaoAutenticada).usuario?.id;

      if (!denuncianteId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(eventoId) || !bigIntRegex.test(mensagemIdBruto)) {
        res.status(404).json({ erro: 'Mensagem não encontrada neste evento' });
        return;
      }

      const presenca = await prisma.presenca.findUnique({
        where: {
          usuarioId_eventoId: {
            usuarioId: denuncianteId,
            eventoId,
          },
        },
      });

      if (!presenca) {
        res.status(403).json({
          erro: 'Apenas usuários com presença confirmada neste evento podem denunciar mensagens',
        });
        return;
      }

      const mensagemId = BigInt(mensagemIdBruto);
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
      });

      if (!mensagem || mensagem.eventoId !== eventoId) {
        res.status(404).json({ erro: 'Mensagem não encontrada neste evento' });
        return;
      }

      if (mensagem.usuarioId === denuncianteId) {
        res.status(400).json({ erro: 'Você não pode denunciar sua própria mensagem' });
        return;
      }

      const motivoBruto =
        typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
      const motivo = motivoBruto ? motivoBruto.slice(0, 255) : 'Conteúdo inadequado';

      const denuncia = await prisma.denuncia.upsert({
        where: {
          mensagemId_denuncianteId: {
            mensagemId,
            denuncianteId,
          },
        },
        update: {
          motivo,
        },
        create: {
          mensagemId,
          denuncianteId,
          motivo,
        },
      });

      res.status(201).json({
        mensagem: 'Denúncia registrada com sucesso',
        denuncia: {
          id: denuncia.id,
          mensagemId: String(denuncia.mensagemId),
          denuncianteId: denuncia.denuncianteId,
          autorMensagemId: mensagem.usuarioId,
          eventoId: mensagem.eventoId,
          motivo: denuncia.motivo,
          status: denuncia.status,
          criadoEm: denuncia.criadoEm,
        },
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao registrar denúncia' });
    }
  },
};