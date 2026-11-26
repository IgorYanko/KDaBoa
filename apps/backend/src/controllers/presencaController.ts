import type { Request, Response } from 'express';
import { prisma } from '../prisma';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequisicaoAutenticada extends Request {
  usuario?: {
    id?: string;
    email?: string;
  };
}

function calcularIdade(dataNascimento: Date, referencia = new Date()): number {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const mes = referencia.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

export const presencaController = {
  // GET /api/presencas/agenda - Lista eventos confirmados do usuário separados em próximos e passados
  minhaAgenda: async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioId = (req as RequisicaoAutenticada).usuario?.id;

      if (!usuarioId) {
        res.status(401).json({ erro: 'Usuário não autenticado' });
        return;
      }

      const presencas = await prisma.presenca.findMany({
        where: { usuarioId },
        include: {
          evento: {
            include: {
              categoria: true,
              local: true,
            },
          },
        },
        orderBy: {
          evento: {
            dataInicio: 'asc',
          },
        },
      });

      const agora = new Date();
      const proximos: unknown[] = [];
      const passados: unknown[] = [];

      for (const presenca of presencas) {
        const ev = presenca.evento;
        const dataInicio = new Date(ev.dataInicio);
        const item = {
          ...ev,
          data_inicio: dataInicio.toISOString(),
          data_fim: ev.dataFim ? new Date(ev.dataFim).toISOString() : null,
          capa_url: ev.imagemUrl ?? null,
          imagem_url: ev.imagemUrl ?? null,
          confirmadoEm: presenca.confirmadoEm,
        };

        if (dataInicio >= agora) {
          proximos.push(item);
        } else {
          passados.push(item);
        }
      }

      passados.reverse();

      res.json({ proximos, passados });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao buscar agenda do usuário' });
    }
  },

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

      if (evento.vendaNoApp) {
        res.status(403).json({
          erro: 'Este evento vende ingresso no app. A presença vem com o pagamento.',
        });
        return;
      }

      if (evento.classificacaoEtaria > 0) {
        if (!usuario.dataNascimento) {
          res.status(403).json({
            erro: `Evento restrito para maiores de ${evento.classificacaoEtaria} anos`,
          });
          return;
        }
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