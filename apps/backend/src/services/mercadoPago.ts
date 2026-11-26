export interface PagamentoMp {
  id: number | string;
  status: string;
  external_reference?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
}

export interface ClienteMercadoPago {
  criarPagamento(corpo: Record<string, unknown>, idempotencia: string): Promise<PagamentoMp>;
  consultarPagamento(id: string): Promise<PagamentoMp>;
}

async function lerJson(resposta: Response): Promise<PagamentoMp> {
  const json = (await resposta.json()) as PagamentoMp & { message?: string };
  if (!resposta.ok) {
    throw new Error(json.message || 'Falha no Mercado Pago');
  }
  return json;
}

export const clienteHttpMercadoPago: ClienteMercadoPago = {
  async criarPagamento(corpo, idempotencia) {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error('Mercado Pago sem access token');

    const resposta = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencia,
      },
      body: JSON.stringify(corpo),
    });
    return lerJson(resposta);
  },

  async consultarPagamento(id) {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error('Mercado Pago sem access token');

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return lerJson(resposta);
  },
};

let clienteAtual: ClienteMercadoPago = clienteHttpMercadoPago;

/** Troca o cliente HTTP nos testes. `null` volta ao cliente real. */
export function definirClienteMercadoPago(cliente: ClienteMercadoPago | null): void {
  clienteAtual = cliente ?? clienteHttpMercadoPago;
}

export function clienteMercadoPago(): ClienteMercadoPago {
  return clienteAtual;
}

export function pagamentoConfigurado(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}
