import http from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../app';
import { configurarSocket } from '../socket';

const estadoMock = {
  presencas: [
    { usuarioId: 'user-confirmado-1', eventoId: 'evento-1' },
    { usuarioId: 'user-confirmado-2', eventoId: 'evento-1' },
    { usuarioId: 'user-confirmado-3', eventoId: 'evento-1' },
    { usuarioId: 'user-outro-evento', eventoId: 'evento-2' },
  ],
  bloqueios: [] as Array<{ bloqueadorId: string; bloqueadoId: string }>,
  mensagens: [
    {
      id: BigInt(1),
      eventoId: 'evento-1',
      usuarioId: 'user-confirmado-1',
      conteudo: 'Mensagem antiga do histórico',
      criadoEm: new Date('2026-11-13T20:00:00Z'),
      usuario: { id: 'user-confirmado-1', nome: 'João Pedro', fotoUrl: null },
    },
  ],
};

vi.mock('../prisma', () => ({
  prisma: {
    presenca: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const chave = where?.usuarioId_eventoId;
        const achou = estadoMock.presencas.find(
          (p) => p.usuarioId === chave?.usuarioId && p.eventoId === chave?.eventoId,
        );
        return Promise.resolve(achou || null);
      }),
    },
    bloqueio: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const lista = estadoMock.bloqueios.filter((b) => {
          if (where?.bloqueadorId && b.bloqueadorId !== where.bloqueadorId) return false;
          if (where?.bloqueadoId && b.bloqueadoId !== where.bloqueadoId) return false;
          return true;
        });
        return Promise.resolve(lista);
      }),
    },
    mensagem: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const ignorados: string[] = where?.usuarioId?.notIn ?? [];
        const lista = estadoMock.mensagens.filter(
          (m) => m.eventoId === where?.eventoId && !ignorados.includes(m.usuarioId),
        );
        return Promise.resolve(lista);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const nova = {
          id: BigInt(estadoMock.mensagens.length + 1),
          eventoId: data.eventoId,
          usuarioId: data.usuarioId,
          conteudo: data.conteudo,
          criadoEm: new Date(),
          usuario: {
            id: data.usuarioId,
            nome: 'Usuário Confirmado',
            fotoUrl: null,
          },
        };
        estadoMock.mensagens.push(nova);
        return Promise.resolve(nova);
      }),
    },
  },
}));

describe('Chat por evento com Socket.IO (Cards 30 e 32)', () => {
  let httpServer: http.Server;
  let baseUrl: string;
  const clientesAtivos: ClientSocket[] = [];

  function conectarCliente(opcoes?: { token?: string; usuarioId?: string }): ClientSocket {
    const cliente = Client(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
      auth: opcoes,
    });
    clientesAtivos.push(cliente);
    return cliente;
  }

  beforeAll(async () => {
    httpServer = http.createServer(app);
    configurarSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const { port } = httpServer.address() as AddressInfo;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const c of clientesAtivos) {
      c.disconnect();
    }
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('1. Recusa entrada na sala se faltar evento/usuário ou se não confirmou presença', async () => {
    const cliente = conectarCliente({ token: 'token_invalido' });

    const erroSemDados = await new Promise<{ erro: string }>((resolve) => {
      cliente.once('erro_sala', (dados) => resolve(dados));
      cliente.emit('entrar_sala', {});
    });
    expect(erroSemDados.erro).toContain('obrigatórios');

    const erroSemPresenca = await new Promise<{ erro: string }>((resolve) => {
      cliente.once('erro_sala', (dados) => resolve(dados));
      cliente.emit('entrar_sala', {
        evento_id: 'evento-1',
        usuario_id: 'user-nao-confirmado',
      });
    });
    expect(erroSemPresenca.erro).toContain('presença confirmada');
  });

  it('2. Permite entrar na sala quando tem presença confirmada (via JWT) e recebe o histórico', async () => {
    const secret = process.env.JWT_SECRET || 'kdaboa_chave_secreta_teste';
    const tokenValido = jwt.sign({ id: 'user-confirmado-1' }, secret);
    const cliente = conectarCliente({ token: tokenValido });

    const historico = await new Promise<
      Array<{ texto: string; evento_id: string; autor: { nome: string } }>
    >((resolve) => {
      cliente.once('historico_mensagens', (dados) => resolve(dados));
      cliente.emit('entrar_sala', {
        evento_id: 'evento-1',
      });
    });

    expect(historico).toHaveLength(1);
    expect(historico[0].texto).toBe('Mensagem antiga do histórico');
    expect(historico[0].evento_id).toBe('evento-1');
    expect(historico[0].autor.nome).toBe('João Pedro');
  });

  it('3. Grava mensagem no PostgreSQL, entrega na mesma sala e não entrega em outra sala', async () => {
    const clienteSala1A = conectarCliente();
    const clienteSala1B = conectarCliente();
    const clienteSala2 = conectarCliente();

    await Promise.all([
      new Promise((resolve) => {
        clienteSala1A.once('historico_mensagens', resolve);
        clienteSala1A.emit('entrar_sala', {
          eventoId: 'evento-1',
          usuarioId: 'user-confirmado-1',
        });
      }),
      new Promise((resolve) => {
        clienteSala1B.once('historico_mensagens', resolve);
        clienteSala1B.emit('entrar_sala', {
          eventoId: 'evento-1',
          usuarioId: 'user-confirmado-2',
        });
      }),
      new Promise((resolve) => {
        clienteSala2.once('historico_mensagens', resolve);
        clienteSala2.emit('entrar_sala', {
          eventoId: 'evento-2',
          usuarioId: 'user-outro-evento',
        });
      }),
    ]);

    let vazouParaSala2 = false;
    clienteSala2.on('nova_mensagem', () => {
      vazouParaSala2 = true;
    });

    const promessaRecebimentoSala1B = new Promise<{
      texto: string;
      usuario_id: string;
      evento_id: string;
      criado_em: string;
    }>((resolve) => {
      clienteSala1B.once('nova_mensagem', (msg) => resolve(msg));
    });

    clienteSala1A.emit('enviar_mensagem', {
      evento_id: 'evento-1',
      usuario_id: 'user-confirmado-1',
      texto: 'Bora encontrar na frente do palco!',
    });

    const msgRecebida = await promessaRecebimentoSala1B;

    expect(msgRecebida.texto).toBe('Bora encontrar na frente do palco!');
    expect(msgRecebida.usuario_id).toBe('user-confirmado-1');
    expect(msgRecebida.evento_id).toBe('evento-1');
    expect(msgRecebida.criado_em).toBeDefined();
    expect(estadoMock.mensagens).toHaveLength(2);
    expect(vazouParaSala2).toBe(false);
  });

  it('4. Valida envio de mensagem vazia ou por usuário não confirmado fora da sala', async () => {
    const cliente = conectarCliente({ usuarioId: 'user-nao-confirmado' });

    const erroVazia = await new Promise<{ erro: string }>((resolve) => {
      cliente.once('erro_mensagem', (dados) => resolve(dados));
      cliente.emit('enviar_mensagem', { eventoId: 'evento-1', texto: '   ' });
    });
    expect(erroVazia.erro).toContain('obrigatórios');

    const erroSemPresenca = await new Promise<{ erro: string }>((resolve) => {
      cliente.once('erro_mensagem', (dados) => resolve(dados));
      cliente.emit('enviar_mensagem', {
        eventoId: 'evento-1',
        usuarioId: 'user-nao-confirmado',
        texto: 'Tentando invadir o chat',
      });
    });
    expect(erroSemPresenca.erro).toContain('presença confirmada');
  });

  it('5. Oculta histórico e novas mensagens do autor bloqueado apenas para quem bloqueou', async () => {
    estadoMock.bloqueios.push({
      bloqueadorId: 'user-confirmado-2',
      bloqueadoId: 'user-confirmado-1',
    });

    const autor = conectarCliente();
    const quemBloqueou = conectarCliente();
    const outroConfirmado = conectarCliente();

    const [_, historicoQuemBloqueou, historicoOutro] = await Promise.all([
      new Promise<Array<{ usuario_id: string }>>((resolve) => {
        autor.once('historico_mensagens', resolve);
        autor.emit('entrar_sala', {
          eventoId: 'evento-1',
          usuarioId: 'user-confirmado-1',
        });
      }),
      new Promise<Array<{ usuario_id: string }>>((resolve) => {
        quemBloqueou.once('historico_mensagens', resolve);
        quemBloqueou.emit('entrar_sala', {
          eventoId: 'evento-1',
          usuarioId: 'user-confirmado-2',
        });
      }),
      new Promise<Array<{ usuario_id: string }>>((resolve) => {
        outroConfirmado.once('historico_mensagens', resolve);
        outroConfirmado.emit('entrar_sala', {
          eventoId: 'evento-1',
          usuarioId: 'user-confirmado-3',
        });
      }),
    ]);

    // Histórico oculto para quem bloqueou e visível para o outro confirmado
    expect(historicoQuemBloqueou.some((m) => m.usuario_id === 'user-confirmado-1')).toBe(false);
    expect(historicoOutro.some((m) => m.usuario_id === 'user-confirmado-1')).toBe(true);

    let vazouParaQuemBloqueou = false;
    quemBloqueou.on('nova_mensagem', (msg: { usuario_id: string }) => {
      if (msg.usuario_id === 'user-confirmado-1') {
        vazouParaQuemBloqueou = true;
      }
    });

    const promessaOutroRecebe = new Promise<{ texto: string; usuario_id: string }>((resolve) => {
      outroConfirmado.once('nova_mensagem', resolve);
    });

    autor.emit('enviar_mensagem', {
      eventoId: 'evento-1',
      usuarioId: 'user-confirmado-1',
      texto: 'Mensagem que não deve chegar para quem me bloqueou',
    });

    const recebidaPeloOutro = await promessaOutroRecebe;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(recebidaPeloOutro.texto).toBe('Mensagem que não deve chegar para quem me bloqueou');
    expect(recebidaPeloOutro.usuario_id).toBe('user-confirmado-1');
    expect(vazouParaQuemBloqueou).toBe(false);
  });
});