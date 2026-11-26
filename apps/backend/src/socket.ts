import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import { prisma } from './prisma';

interface PayloadEntrarSala {
  eventoId?: string;
  evento_id?: string;
  usuarioId?: string;
  usuario_id?: string;
}

interface PayloadEnviarMensagem {
  eventoId?: string;
  evento_id?: string;
  usuarioId?: string;
  usuario_id?: string;
  texto?: string;
  conteudo?: string;
}

interface MensagemComUsuario {
  id: bigint | number | string;
  eventoId: string;
  usuarioId: string;
  conteudo: string;
  criadoEm: Date;
  usuario?: {
    id: string;
    nome: string;
    fotoUrl?: string | null;
  };
}

function formatarMensagem(msg: MensagemComUsuario) {
  return {
    id: String(msg.id),
    evento_id: msg.eventoId,
    usuario_id: msg.usuarioId,
    texto: msg.conteudo,
    criado_em: msg.criadoEm.toISOString(),
    autor: {
      id: msg.usuario?.id ?? msg.usuarioId,
      nome: msg.usuario?.nome ?? 'Usuário',
      foto_url: msg.usuario?.fotoUrl ?? null,
    },
  };
}

function extrairUsuarioDoSocket(socket: Socket): string | undefined {
  const auth = socket.handshake.auth as { token?: string; usuarioId?: string } | undefined;
  if (auth?.usuarioId) {
    return auth.usuarioId;
  }

  const headerAuth = socket.handshake.headers.authorization;
  const token =
    auth?.token ||
    (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
      ? headerAuth.split(' ')[1]
      : undefined);

  if (!token) {
    return undefined;
  }

  try {
    const secret = process.env.JWT_SECRET || 'kdaboa_chave_secreta_teste';
    const decodificado = jwt.verify(token, secret) as { id?: string };
    return decodificado.id;
  } catch (_error) {
    return undefined;
  }
}

export function configurarSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    const usuarioAutenticado = extrairUsuarioDoSocket(socket);

    socket.on('entrar_sala', async (payload: PayloadEntrarSala) => {
      try {
        const eventoId = payload?.eventoId || payload?.evento_id;
        const usuarioId = payload?.usuarioId || payload?.usuario_id || usuarioAutenticado;

        if (!eventoId || !usuarioId) {
          socket.emit('erro_sala', {
            erro: 'Evento e usuário são obrigatórios para entrar na sala.',
          });
          return;
        }

        const presenca = await prisma.presenca.findUnique({
          where: {
            usuarioId_eventoId: {
              usuarioId,
              eventoId,
            },
          },
        });

        if (!presenca) {
          socket.emit('erro_sala', {
            erro: 'Apenas usuários com presença confirmada podem entrar na sala deste evento.',
          });
          return;
        }

        const nomeSala = `evento:${eventoId}`;
        await socket.join(nomeSala);
        socket.data.usuarioId = usuarioId;
        socket.data.eventoId = eventoId;

        const bloqueios = await prisma.bloqueio.findMany({
          where: { bloqueadorId: usuarioId },
          select: { bloqueadoId: true },
        });
        const idsBloqueados = bloqueios.map((b) => b.bloqueadoId);
        const conjuntoBloqueados = new Set(idsBloqueados);

        const historico = await prisma.mensagem.findMany({
          where: {
            eventoId,
            ...(idsBloqueados.length > 0 ? { usuarioId: { notIn: idsBloqueados } } : {}),
          },
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                fotoUrl: true,
              },
            },
          },
          orderBy: { criadoEm: 'asc' },
        });

        const historicoFiltrado = historico.filter((m) => !conjuntoBloqueados.has(m.usuarioId));

        socket.emit(
          'historico_mensagens',
          historicoFiltrado.map((m) => formatarMensagem(m)),
        );
      } catch (_error) {
        socket.emit('erro_sala', {
          erro: 'Erro ao entrar na sala do evento.',
        });
      }
    });

    socket.on('enviar_mensagem', async (payload: PayloadEnviarMensagem) => {
      try {
        const eventoId =
          payload?.eventoId || payload?.evento_id || (socket.data.eventoId as string | undefined);
        const usuarioId =
          payload?.usuarioId ||
          payload?.usuario_id ||
          (socket.data.usuarioId as string | undefined) ||
          usuarioAutenticado;
        const conteudo = (payload?.texto || payload?.conteudo)?.trim();

        if (!eventoId || !usuarioId || !conteudo) {
          socket.emit('erro_mensagem', {
            erro: 'Evento, usuário e texto são obrigatórios.',
          });
          return;
        }

        const nomeSala = `evento:${eventoId}`;

        if (!socket.rooms.has(nomeSala)) {
          const presenca = await prisma.presenca.findUnique({
            where: {
              usuarioId_eventoId: {
                usuarioId,
                eventoId,
              },
            },
          });

          if (!presenca) {
            socket.emit('erro_mensagem', {
              erro: 'Apenas usuários com presença confirmada podem enviar mensagens.',
            });
            return;
          }

          await socket.join(nomeSala);
          socket.data.usuarioId = usuarioId;
          socket.data.eventoId = eventoId;
        }

        const novaMensagem = await prisma.mensagem.create({
          data: {
            eventoId,
            usuarioId,
            conteudo,
          },
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                fotoUrl: true,
              },
            },
          },
        });

        const bloqueiosDoAutor = await prisma.bloqueio.findMany({
          where: { bloqueadoId: usuarioId },
          select: { bloqueadorId: true },
        });
        const quemBloqueou = new Set(bloqueiosDoAutor.map((b) => b.bloqueadorId));

        const mensagemFormatada = formatarMensagem(novaMensagem);
        const socketsNaSala = await io.in(nomeSala).fetchSockets();

        for (const destinatario of socketsNaSala) {
          const destinatarioId = destinatario.data.usuarioId as string | undefined;
          if (destinatarioId && quemBloqueou.has(destinatarioId)) {
            continue;
          }
          destinatario.emit('nova_mensagem', mensagemFormatada);
        }
      } catch (_error) {
        socket.emit('erro_mensagem', {
          erro: 'Erro ao salvar ou enviar a mensagem.',
        });
      }
    });
  });

  return io;
}