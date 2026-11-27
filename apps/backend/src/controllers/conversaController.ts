import type { Request, Response } from 'express';
import type { RequisicaoAutenticada } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';
import { avisarUsuario } from '../realtime';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TEXTO_MAXIMO_DIRETA = 1000;
const HISTORICO_LIMITE = 100;

interface MensagemDiretaBanco {
  id: bigint | number | string;
  remetenteId: string;
  destinatarioId: string;
  conteudo: string;
  criadoEm: Date;
}

interface UsuarioResumoBanco {
  id: string;
  nome: string;
  fotoUrl?: string | null;
}

function formatarDireta(msg: MensagemDiretaBanco) {
  return {
    id: String(msg.id),
    remetente_id: msg.remetenteId,
    destinatario_id: msg.destinatarioId,
    texto: msg.conteudo,
    criado_em: msg.criadoEm.toISOString(),
  };
}

function formatarUsuario(u: UsuarioResumoBanco) {
  return { id: u.id, nome: u.nome, foto_url: u.fotoUrl ?? null };
}

/** Os dois se seguem (nos dois sentidos) e nenhum bloqueou o outro. */
async function situacaoDoPar(eu: string, outro: string) {
  const [seguidas, bloqueios] = await Promise.all([
    prisma.seguidor.findMany({
      where: {
        OR: [
          { seguidorId: eu, seguidoId: outro },
          { seguidorId: outro, seguidoId: eu },
        ],
      },
    }),
    prisma.bloqueio.findMany({
      where: {
        OR: [
          { bloqueadorId: eu, bloqueadoId: outro },
          { bloqueadorId: outro, bloqueadoId: eu },
        ],
      },
    }),
  ]);
  return { mutuo: seguidas.length === 2, bloqueado: bloqueios.length > 0 };
}

/** Valida o id do outro usuário; responde o erro e devolve null quando não serve. */
function outroUsuarioValido(req: Request, res: Response): { eu: string; outro: string } | null {
  const eu = (req as RequisicaoAutenticada).usuario?.id;
  const outro = String(req.params.usuarioId);
  if (!eu) {
    res.status(401).json({ erro: 'Usuário não autenticado' });
    return null;
  }
  if (!uuidRegex.test(outro)) {
    res.status(404).json({ erro: 'Usuário não encontrado' });
    return null;
  }
  if (outro === eu) {
    res.status(400).json({ erro: 'Você não pode conversar com você mesmo' });
    return null;
  }
  return { eu, outro };
}

export const conversaController = {
  /**
   * GET /api/conversas — quem segue de volta (pode conversar) e as conversas que já existem.
   * Conversa com quem deixou de seguir aparece só para leitura; com bloqueio, some.
   */
  listar: async (req: Request, res: Response): Promise<void> => {
    const eu = (req as RequisicaoAutenticada).usuario?.id;
    if (!eu) {
      res.status(401).json({ erro: 'Usuário não autenticado' });
      return;
    }
    try {
      const [sigo, meSeguem, bloqueios, mensagens] = await Promise.all([
        prisma.seguidor.findMany({ where: { seguidorId: eu }, select: { seguidoId: true } }),
        prisma.seguidor.findMany({ where: { seguidoId: eu }, select: { seguidorId: true } }),
        prisma.bloqueio.findMany({
          where: { OR: [{ bloqueadorId: eu }, { bloqueadoId: eu }] },
          select: { bloqueadorId: true, bloqueadoId: true },
        }),
        prisma.mensagemDireta.findMany({
          where: { OR: [{ remetenteId: eu }, { destinatarioId: eu }] },
          orderBy: { criadoEm: 'desc' },
        }),
      ]);

      const seguidosPorMim = new Set(sigo.map((s) => s.seguidoId));
      const mutuos = new Set(meSeguem.map((s) => s.seguidorId).filter((id) => seguidosPorMim.has(id)));
      const bloqueados = new Set(bloqueios.map((b) => (b.bloqueadorId === eu ? b.bloqueadoId : b.bloqueadorId)));

      // Última mensagem de cada par (a lista já vem da mais nova para a mais antiga).
      const ultima = new Map<string, MensagemDiretaBanco>();
      for (const m of mensagens) {
        const outro = m.remetenteId === eu ? m.destinatarioId : m.remetenteId;
        if (!ultima.has(outro)) ultima.set(outro, m);
      }

      const ids = [...new Set([...mutuos, ...ultima.keys()])].filter((id) => !bloqueados.has(id));
      const usuarios = await prisma.usuario.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true, fotoUrl: true },
      });

      const conversas = usuarios
        .map((u) => {
          const m = ultima.get(u.id);
          return {
            usuario: formatarUsuario(u),
            pode_enviar: mutuos.has(u.id),
            ultima_mensagem: m ? formatarDireta(m) : null,
          };
        })
        // Conversas com mensagem primeiro (mais recentes no topo), depois quem ainda não tem conversa.
        .sort((a, b) => {
          const da = a.ultima_mensagem?.criado_em ?? '';
          const db = b.ultima_mensagem?.criado_em ?? '';
          if (da !== db) return db.localeCompare(da);
          return a.usuario.nome.localeCompare(b.usuario.nome);
        });

      res.json(conversas);
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao listar as conversas' });
    }
  },

  /** GET /api/conversas/:usuarioId — histórico com uma pessoa (as 100 últimas mensagens). */
  abrir: async (req: Request, res: Response): Promise<void> => {
    const par = outroUsuarioValido(req, res);
    if (!par) return;
    const { eu, outro } = par;
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: outro },
        select: { id: true, nome: true, fotoUrl: true },
      });
      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }
      const { mutuo, bloqueado } = await situacaoDoPar(eu, outro);
      if (bloqueado) {
        res.status(403).json({ erro: 'Não é possível conversar com este usuário.' });
        return;
      }
      const recentes = await prisma.mensagemDireta.findMany({
        where: {
          OR: [
            { remetenteId: eu, destinatarioId: outro },
            { remetenteId: outro, destinatarioId: eu },
          ],
        },
        orderBy: { criadoEm: 'desc' },
        take: HISTORICO_LIMITE,
      });
      if (!mutuo && recentes.length === 0) {
        res.status(403).json({ erro: 'Vocês precisam se seguir para conversar.' });
        return;
      }
      res.json({
        usuario: formatarUsuario(usuario),
        pode_enviar: mutuo,
        mensagens: recentes.reverse().map(formatarDireta),
      });
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao abrir a conversa' });
    }
  },

  /** POST /api/conversas/:usuarioId — manda uma mensagem e avisa os dois em tempo real. */
  enviar: async (req: Request, res: Response): Promise<void> => {
    const par = outroUsuarioValido(req, res);
    if (!par) return;
    const { eu, outro } = par;
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto) {
      res.status(400).json({ erro: 'Escreva uma mensagem.' });
      return;
    }
    if (texto.length > TEXTO_MAXIMO_DIRETA) {
      res.status(400).json({ erro: `A mensagem pode ter até ${TEXTO_MAXIMO_DIRETA} caracteres.` });
      return;
    }
    try {
      const { mutuo, bloqueado } = await situacaoDoPar(eu, outro);
      if (bloqueado) {
        res.status(403).json({ erro: 'Não é possível conversar com este usuário.' });
        return;
      }
      if (!mutuo) {
        res.status(403).json({ erro: 'Vocês precisam se seguir para conversar.' });
        return;
      }
      const nova = await prisma.mensagemDireta.create({
        data: { remetenteId: eu, destinatarioId: outro, conteudo: texto },
      });
      const formatada = formatarDireta(nova);
      avisarUsuario(outro, 'nova_direta', formatada);
      avisarUsuario(eu, 'nova_direta', formatada);
      res.status(201).json(formatada);
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao enviar a mensagem' });
    }
  },
};
