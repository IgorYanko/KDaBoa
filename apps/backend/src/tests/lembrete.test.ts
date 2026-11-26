import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() =>
  vi.fn(() => ({
    sendMail: sendMailMock,
  })),
);

const prismaMock = vi.hoisted(() => ({
  presenca: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import { enviarLembretesEventosDoDia } from '../services/lembreteService';

describe('Serviço de Lembrete de Evento por E-mail (Card 39)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.teste.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'naoresponda@kdaboa.com';
    process.env.SMTP_PASS = 'segredo';
    sendMailMock.mockResolvedValue({ messageId: 'msg-123' });
  });

  it('envia e-mail via Nodemailer no dia do evento e marca lembreteEnviadoEm', async () => {
    const agora = new Date(2026, 10, 26, 9, 0, 0);

    prismaMock.presenca.findMany.mockResolvedValue([
      {
        usuarioId: 'user-1',
        eventoId: 'ev-1',
        usuario: {
          id: 'user-1',
          nome: 'João',
          email: 'joao@kdaboa.com',
          lembretesEmail: true,
        },
        evento: {
          id: 'ev-1',
          titulo: 'Noite de Rock',
          dataInicio: new Date(2026, 10, 26, 21, 0, 0),
          local: { nome: 'Bar do Rock' },
        },
      },
    ]);
    prismaMock.presenca.update.mockResolvedValue({});

    const resultado = await enviarLembretesEventosDoDia(agora);

    expect(resultado).toEqual({ enviados: 1, erros: 0 });
    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joao@kdaboa.com',
        subject: expect.stringContaining('Noite de Rock'),
      }),
    );
    expect(prismaMock.presenca.update).toHaveBeenCalledWith({
      where: {
        usuarioId_eventoId: {
          usuarioId: 'user-1',
          eventoId: 'ev-1',
        },
      },
      data: {
        lembreteEnviadoEm: agora,
      },
    });
  });

  it('consulta apenas presenças ativas, com lembretesEmail = true e sem envio prévio', async () => {
    const agora = new Date(2026, 10, 26, 9, 0, 0);
    prismaMock.presenca.findMany.mockResolvedValue([]);

    const resultado = await enviarLembretesEventosDoDia(agora);

    expect(resultado).toEqual({ enviados: 0, erros: 0 });
    expect(sendMailMock).not.toHaveBeenCalled();

    const filtro = prismaMock.presenca.findMany.mock.calls[0][0].where;
    expect(filtro.lembreteEnviadoEm).toBeNull();
    expect(filtro.usuario).toEqual({ lembretesEmail: true });
    expect(filtro.evento.dataInicio.gte).toEqual(new Date(2026, 10, 26, 0, 0, 0));
    expect(filtro.evento.dataInicio.lt).toEqual(new Date(2026, 10, 27, 0, 0, 0));
  });

  it('contabiliza erro sem derrubar o lote quando o envio falha', async () => {
    const agora = new Date(2026, 10, 26, 9, 0, 0);
    sendMailMock.mockRejectedValueOnce(new Error('Falha SMTP'));

    prismaMock.presenca.findMany.mockResolvedValue([
      {
        usuarioId: 'user-1',
        eventoId: 'ev-1',
        usuario: {
          id: 'user-1',
          nome: 'João',
          email: 'joao@kdaboa.com',
          lembretesEmail: true,
        },
        evento: {
          id: 'ev-1',
          titulo: 'Noite de Rock',
          dataInicio: new Date(2026, 10, 26, 21, 0, 0),
          local: null,
        },
      },
    ]);

    const resultado = await enviarLembretesEventosDoDia(agora);

    expect(resultado).toEqual({ enviados: 0, erros: 1 });
    expect(prismaMock.presenca.update).not.toHaveBeenCalled();
  });
});