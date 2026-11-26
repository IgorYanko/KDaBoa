import { ErroApi, requisicao } from '../api/client';
import { USAR_MOCK } from '../config';
import type { IngressoDTO, PagamentoPedidoDTO } from '../dtos';

export interface DadosCartao {
  token: string;
  payment_method_id: string;
  installments?: number;
  issuer_id?: string;
  identification_type?: string;
  identification_number?: string;
}

const MENSAGEM_DESLIGADO =
  'O pagamento ainda não está ligado. Quando as credenciais de sandbox estiverem no ambiente, a compra por cartão e PIX passa a funcionar nesta tela.';

export function chavePublicaMercadoPago(): string {
  return import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY?.trim() ?? '';
}

/** A compra só abre com a chave pública no front e o access token na API. */
export async function pagamentoDisponivel(): Promise<boolean> {
  if (!chavePublicaMercadoPago()) return false;
  if (USAR_MOCK) return false;
  const resposta = await requisicao<{ disponivel: boolean }>('/api/pagamentos/disponivel');
  return resposta.disponivel;
}

export async function comprarIngresso(
  eventoId: string,
  quantidade: number,
  metodo: 'pix' | 'cartao',
  cartao?: DadosCartao,
): Promise<PagamentoPedidoDTO> {
  if (USAR_MOCK || !chavePublicaMercadoPago()) {
    throw new ErroApi(MENSAGEM_DESLIGADO, 503);
  }
  return requisicao<PagamentoPedidoDTO>(`/api/eventos/${encodeURIComponent(eventoId)}/pagamentos`, {
    metodo: 'POST',
    corpo: { quantidade, metodo, ...cartao },
  });
}

export async function listarMeusIngressos(): Promise<IngressoDTO[]> {
  if (USAR_MOCK) return [];
  return requisicao<IngressoDTO[]>('/api/ingressos');
}

let sdk: Promise<void> | null = null;

/** Carrega o JS v2 do Mercado Pago uma vez, para tokenizar o cartão no navegador. */
export function carregarSdkMercadoPago(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdk = null;
        reject(new Error('Não foi possível carregar o Mercado Pago.'));
      };
      document.body.appendChild(script);
    });
  }
  return sdk;
}
