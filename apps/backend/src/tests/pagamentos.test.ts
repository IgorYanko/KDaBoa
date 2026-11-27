import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErroMercadoPago, definirClienteMercadoPago, type PagamentoMp } from '../services/mercadoPago';

const EVENTO_ID = '123e4567-e89b-12d3-a456-426614174000';
const USUARIO_ID = '987fcdeb-51a2-43d7-9012-345678901234';

const estado = vi.hoisted(() => ({
  estoque: 2,
  pedidos: [] as Array<Record<string, unknown>>,
  ingressos: [] as Array<Record<string, unknown>>,
}));

const prismaMock = vi.hoisted(() => ({
  evento: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  usuario: {
    findUnique: vi.fn(),
  },
  pedido: {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  ingresso: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  presenca: {
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: prismaMock,
}));

import app from '../app';

function authHeader() {
  const token = jwt.sign(
    { id: USUARIO_ID, email: 'joao@kdaboa.com', perfil: 'USUARIO' },
    'segredo_de_teste',
  );
  return `Bearer ${token}`;
}

describe('Checkout de ingresso', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'segredo_de_teste';
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'token-de-teste';
    estado.estoque = 2;
    estado.pedidos = [];
    estado.ingressos = [];

    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<void>) => {
      await fn(prismaMock);
    });
    prismaMock.evento.findUnique.mockImplementation(async () => ({
      id: EVENTO_ID,
      titulo: 'Show da casa',
      preco: 50,
      vendaNoApp: true,
      classificacaoEtaria: 0,
      quantidadeIngressos: estado.estoque,
    }));
    prismaMock.evento.updateMany.mockImplementation(
      async ({ where, data }: { where: { quantidadeIngressos?: { gte: number } }; data: { quantidadeIngressos: { decrement: number } } }) => {
        const minimo = where.quantidadeIngressos?.gte ?? 0;
        if (estado.estoque < minimo) return { count: 0 };
        estado.estoque -= data.quantidadeIngressos.decrement;
        return { count: 1 };
      },
    );
    prismaMock.evento.update.mockImplementation(
      async ({ data }: { data: { quantidadeIngressos: { increment: number } } }) => {
        estado.estoque += data.quantidadeIngressos.increment;
        return { quantidadeIngressos: estado.estoque };
      },
    );
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      email: 'comprador@teste.com',
      dataNascimento: new Date('2000-01-01'),
    });
    prismaMock.pedido.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      const pedido = {
        id: `123e4567-e89b-12d3-a456-42661417400${estado.pedidos.length + 1}`,
        qrCode: null,
        qrCodeBase64: null,
        ...data,
      };
      estado.pedidos.push(pedido);
      return pedido;
    });
    prismaMock.pedido.update.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const pedido = estado.pedidos.find((item) => item.id === where.id);
        Object.assign(pedido ?? {}, data);
        return pedido;
      },
    );
    prismaMock.pedido.updateMany.mockImplementation(
      async ({ where, data }: { where: { id: string; status?: string }; data: Record<string, unknown> }) => {
        const pedido = estado.pedidos.find(
          (item) => item.id === where.id && (!where.status || item.status === where.status),
        );
        if (!pedido) return { count: 0 };
        Object.assign(pedido, data);
        return { count: 1 };
      },
    );
    prismaMock.pedido.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      const pedido = estado.pedidos.find((item) => item.id === where.id);
      if (!pedido) return null;
      return {
        ...pedido,
        ingressos: estado.ingressos.filter((ingresso) => ingresso.pedidoId === pedido.id),
      };
    });
    prismaMock.pedido.findFirst.mockImplementation(
      async ({ where }: { where: { OR: Array<{ id?: string; pagamentoExternoId?: string }> } }) => {
        return (
          estado.pedidos.find((pedido) =>
            where.OR.some((filtro) => {
              if (filtro.pagamentoExternoId) return pedido.pagamentoExternoId === filtro.pagamentoExternoId;
              if (filtro.id) return pedido.id === filtro.id;
              return false;
            }),
          ) ?? null
        );
      },
    );
    prismaMock.pedido.findMany.mockResolvedValue([]);
    prismaMock.ingresso.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      const ingresso = { id: `ingresso-${estado.ingressos.length + 1}`, ...data };
      estado.ingressos.push(ingresso);
      return ingresso;
    });
    prismaMock.presenca.upsert.mockResolvedValue({});
    definirClienteMercadoPago(null);
  });

  it('pagamento aprovado emite os ingressos e esgota o estoque', async () => {
    const criarPagamento = vi.fn(async () => ({ id: 99, status: 'approved' }) as PagamentoMp);
    definirClienteMercadoPago({
      criarPagamento,
      consultarPagamento: vi.fn(),
    });

    const resposta = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 2, metodo: 'cartao', token: 'tok_teste', payment_method_id: 'visa' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.status).toBe('pago');
    expect(resposta.body.ingressos).toHaveLength(2);
    expect(estado.estoque).toBe(0);

    const semEstoque = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 1, metodo: 'cartao', token: 'tok_teste', payment_method_id: 'visa' });

    expect(semEstoque.status).toBe(409);
    expect(estado.ingressos).toHaveLength(2);
    expect(criarPagamento.mock.calls[0]?.[0].date_of_expiration).toBeUndefined();
  });

  it('cobrança recusada devolve a causa do Mercado Pago e libera o estoque', async () => {
    definirClienteMercadoPago({
      criarPagamento: vi.fn(async () => {
        throw new ErroMercadoPago(400, {
          message: 'bad_request',
          error: 'bad_request',
          cause: [{ code: 145, description: 'Invalid users involved' }],
        });
      }),
      consultarPagamento: vi.fn(),
    });

    const resposta = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 1, metodo: 'cartao', token: 'tok_teste', payment_method_id: 'master' });

    expect(resposta.status).toBe(502);
    expect(resposta.body.erro).toBe('Não foi possível cobrar no Mercado Pago: Invalid users involved');
    expect(estado.estoque).toBe(2);
    expect(estado.ingressos).toHaveLength(0);
  });

  it('webhook repetido não duplica ingresso', async () => {
    const pagamentoPendente: PagamentoMp = {
      id: 77,
      status: 'pending',
      external_reference: 'pedido-1',
      point_of_interaction: { transaction_data: { qr_code: '000201', qr_code_base64: 'aaaa' } },
    };
    const criarPagamento = vi.fn(async () => pagamentoPendente);
    definirClienteMercadoPago({
      criarPagamento,
      consultarPagamento: vi.fn(async () => ({ ...pagamentoPendente, status: 'approved' })),
    });

    const criado = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 1, metodo: 'pix' });

    expect(criado.status).toBe(201);
    expect(criado.body.status).toBe('pendente');
    expect(criado.body.qr_code).toBe('000201');
    expect(estado.estoque).toBe(1);

    const aviso = { type: 'payment', data: { id: '77' } };
    const primeiro = await request(app).post('/api/pagamentos/webhook').send(aviso);
    const segundo = await request(app).post('/api/pagamentos/webhook').send(aviso);

    expect(primeiro.status).toBe(200);
    expect(segundo.status).toBe(200);
    expect(estado.ingressos).toHaveLength(1);
    expect(estado.pedidos[0]?.status).toBe('pago');
    expect(estado.estoque).toBe(1);
    const expiraEm = estado.pedidos[0]?.expiraEm;
    expect(expiraEm).toBeInstanceOf(Date);
    expect(criarPagamento.mock.calls[0]?.[0].date_of_expiration).toBe((expiraEm as Date).toISOString());
  });

  it('falha no banco depois da cobrança mantém a reserva para o webhook', async () => {
    definirClienteMercadoPago({
      criarPagamento: vi.fn(async () => ({ id: 55, status: 'approved' }) as PagamentoMp),
      consultarPagamento: vi.fn(),
    });
    prismaMock.$transaction.mockRejectedValueOnce(new Error('banco fora'));

    const resposta = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 1, metodo: 'cartao', token: 'tok_teste', payment_method_id: 'visa' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.status).toBe('pendente');
    expect(estado.pedidos[0]?.status).toBe('pendente');
    expect(estado.estoque).toBe(1);
    expect(estado.ingressos).toHaveLength(0);
  });

  it('GET /api/pedidos/:id devolve o pedido só para quem comprou', async () => {
    definirClienteMercadoPago({
      criarPagamento: vi.fn(async () => ({
        id: 77,
        status: 'pending',
        external_reference: 'pedido-1',
        point_of_interaction: { transaction_data: { qr_code: '000201', qr_code_base64: 'aaaa' } },
      })),
      consultarPagamento: vi.fn(),
    });

    const criado = await request(app)
      .post(`/api/eventos/${EVENTO_ID}/pagamentos`)
      .set('Authorization', authHeader())
      .send({ quantidade: 1, metodo: 'pix' });

    const consulta = await request(app)
      .get(`/api/pedidos/${criado.body.id}`)
      .set('Authorization', authHeader());

    expect(consulta.status).toBe(200);
    expect(consulta.body.status).toBe('pendente');
    expect(consulta.body.qr_code).toBe('000201');

    const outro = jwt.sign(
      { id: 'outro-usuario', email: 'outro@kdaboa.com', perfil: 'USUARIO' },
      'segredo_de_teste',
    );
    const alheio = await request(app)
      .get(`/api/pedidos/${criado.body.id}`)
      .set('Authorization', `Bearer ${outro}`);

    expect(alheio.status).toBe(404);
  });
});
