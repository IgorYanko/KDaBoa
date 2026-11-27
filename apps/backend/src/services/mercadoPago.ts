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

interface CausaMercadoPago {
  code?: number | string;
  description?: string;
}

interface ErroJsonMercadoPago {
  message?: string;
  error?: string;
  cause?: CausaMercadoPago[];
}

/** Falha devolvida pela API do Mercado Pago, com status e causas originais. */
export class ErroMercadoPago extends Error {
  readonly httpStatus: number;
  readonly codigo?: string;
  readonly causas: CausaMercadoPago[];

  constructor(httpStatus: number, json: ErroJsonMercadoPago) {
    const causas = Array.isArray(json.cause) ? json.cause : [];
    super(mensagemDaFalha(json, causas));
    this.name = 'ErroMercadoPago';
    this.httpStatus = httpStatus;
    this.codigo = json.error;
    this.causas = causas.map((causa) => ({ code: causa.code, description: causa.description }));
  }
}

function mensagemDaFalha(json: ErroJsonMercadoPago, causas: CausaMercadoPago[]): string {
  const descricoes = [...new Set(causas.map((causa) => causa.description?.trim()).filter(Boolean))];
  if (descricoes.length > 0) return descricoes.join('; ');
  return json.message?.trim() || json.error?.trim() || 'Falha no Mercado Pago';
}

function registrarFalha(operacao: string, referencia: string, erro: ErroMercadoPago): void {
  console.error(
    JSON.stringify({
      nivel: 'error',
      evento: 'mercado_pago',
      operacao,
      referencia,
      http: erro.httpStatus,
      codigo: erro.codigo ?? null,
      mensagem: erro.message,
      causas: erro.causas,
    }),
  );
}

async function lerJson(resposta: Response, operacao: string, referencia: string): Promise<PagamentoMp> {
  const texto = await resposta.text();
  let json: (PagamentoMp & ErroJsonMercadoPago) | null = null;
  if (texto) {
    try {
      json = JSON.parse(texto) as PagamentoMp & ErroJsonMercadoPago;
    } catch {
      json = null;
    }
  }

  if (!resposta.ok || !json) {
    const erro = new ErroMercadoPago(resposta.status, json ?? { message: texto.slice(0, 300) || 'Resposta vazia do Mercado Pago' });
    registrarFalha(operacao, referencia, erro);
    throw erro;
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
    return lerJson(resposta, 'criar_pagamento', idempotencia);
  },

  async consultarPagamento(id) {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error('Mercado Pago sem access token');

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return lerJson(resposta, 'consultar_pagamento', id);
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
