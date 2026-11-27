import { afterEach, describe, expect, it, vi } from 'vitest';
import { clienteHttpMercadoPago } from '../services/mercadoPago';

describe('cliente do Mercado Pago', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registra status, código e causa quando a cobrança é recusada', async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'token-de-teste';
    const erroLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            message: 'bad_request',
            error: 'bad_request',
            status: 400,
            cause: [{ code: 145, description: 'Invalid users involved' }],
          },
          { status: 400 },
        ),
      ),
    );

    await expect(clienteHttpMercadoPago.criarPagamento({ transaction_amount: 10 }, 'pedido-1')).rejects.toMatchObject({
      message: 'Invalid users involved',
      httpStatus: 400,
      codigo: 'bad_request',
    });

    const log = JSON.parse(String(erroLog.mock.calls[0]?.[0]));
    expect(log).toMatchObject({
      nivel: 'error',
      evento: 'mercado_pago',
      operacao: 'criar_pagamento',
      referencia: 'pedido-1',
      http: 400,
      codigo: 'bad_request',
      mensagem: 'Invalid users involved',
      causas: [{ code: 145, description: 'Invalid users involved' }],
    });
    expect(JSON.stringify(log)).not.toContain('token-de-teste');
  });
});
