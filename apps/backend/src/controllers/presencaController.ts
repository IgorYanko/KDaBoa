import type { Request, Response } from 'express';
import type { RequisicaoAutenticada } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function calcularIdade(dataNascimento: Date, referencia = new Date()): number {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const mes = referencia.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

export const presencaController = {
  // POST /api/presencas/:eventoId - Confirma presença respeitando classificação etária
  confirmar: async (req: Request, res: Response): Promise<void> => {
    try {
      const eventoId = String(req.params.eventoId);
      const usuarioId = (req as RequisicaoAutenticada).usuario?.id;

      if (!usuarioId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(eventoId)) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      const [evento, usuario] = await Promise.all([
        prisma.evento.findUnique({ where: { id: eventoId } }),
        prisma.usuario.findUnique({ where: { id: usuarioId } }),
      ]);

      if (!evento) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      if (evento.classificacaoEtaria > 0) {
        const idade = calcularIdade(new Date(usuario.dataNascimento));
        if (idade < evento.classificacaoEtaria) {
          res.status(403).json({
            erro: `Evento restrito para maiores de ${evento.classificacaoEtaria} anos`,
          });
          return;
        }
      }

      const presenca = await prisma.presenca.upsert({
        where: {
          usuarioId_eventoId: {
            usuarioId,
            eventoId,
          },
        },
        update: {},
        create: {
          usuarioId,
          eventoId,
        },
      });

      res.status(201).json({
        mensagem: 'Presença confirmada com sucesso',
        presenca,
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao confirmar presença' });
    }
  },

  // DELETE /api/presencas/:eventoId - Cancela presença do usuário logado
  cancelar: async (req: Request, res: Response): Promise<void> => {
    try {
      const eventoId = String(req.params.eventoId);
      const usuarioId = (req as RequisicaoAutenticada).usuario?.id;

      if (!usuarioId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      if (!uuidRegex.test(eventoId)) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      await prisma.presenca.delete({
        where: {
          usuarioId_eventoId: {
            usuarioId,
            eventoId,
          },
        },
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).json({ erro: 'Presença não encontrada para este evento' });
    }
  },

  // GET /api/presencas/:eventoId - Lista confirmados respeitando mostrarPresenca
  listarPorEvento: async (req: Request, res: Response): Promise<void> => {
    try {
      const eventoId = String(req.params.eventoId);

      if (!uuidRegex.test(eventoId)) {
        res.status(404).json({ erro: 'Evento não encontrado' });
        return;
      }

      const presencas = await prisma.presenca.findMany({
        where: { eventoId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              fotoUrl: true,
              mostrarPresenca: true,
            },
          },
        },
        orderBy: { confirmadoEm: 'desc' },
      });

      const confirmadosPublicos = presencas
        .filter((p) => p.usuario.mostrarPresenca)
        .map((p) => ({
          id: p.usuario.id,
          nome: p.usuario.nome,
          fotoUrl: p.usuario.fotoUrl,
          confirmadoEm: p.confirmadoEm,
        }));

      res.json({
        total: presencas.length,
        confirmados: confirmadosPublicos,
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao listar presenças' });
    }
  },
};