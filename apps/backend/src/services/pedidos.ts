import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { type PagamentoMp, clienteMercadoPago, pagamentoConfigurado } from './mercadoPago';

const EXPIRA_MS = 30 * 60 * 1000;

type StatusPedido = 'pendente' | 'pago' | 'recusado' | 'cancelado';

interface PedidoGravado {
  id: string;
  usuarioId: string;
  eventoId: string;
  quantidade: number;
  valorTotal: unknown;
  status: StatusPedido;
  pagamentoExternoId?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  ingressos?: { id: string; codigo: string; status: string }[];
}

export function reais(valor: unknown): number {
  return Math.round(Number(valor) * 100) / 100;
}

function mapearStatus(statusMp: string): StatusPedido {
  if (statusMp === 'approved') return 'pago';
  if (statusMp === 'rejected') return 'recusado';
  if (statusMp === 'cancelled' || statusMp === 'refunded' || statusMp === 'charged_back') {
    return 'cancelado';
  }
  return 'pendente';
}

function codigoIngresso(): string {
  return crypto.randomBytes(4).toString('hex');
}

export function formatarPedido(pedido: PedidoGravado) {
  return {
    id: pedido.id,
    evento_id: pedido.eventoId,
    quantidade: pedido.quantidade,
    valor_total: reais(pedido.valorTotal),
    status: pedido.status,
    qr_code: pedido.qrCode ?? null,
    qr_code_base64: pedido.qrCodeBase64 ?? null,
    ingressos: (pedido.ingressos ?? []).map((ingresso) => ({
      id: ingresso.id,
      codigo: ingresso.codigo,
      status: ingresso.status,
    })),
  };
}

async function devolverEstoque(eventoId: string, quantidade: number): Promise<void> {
  await prisma.evento.update({
    where: { id: eventoId },
    data: { quantidadeIngressos: { increment: quantidade } },
  });
}

/** Cancela pedidos PIX que passaram da validade e devolve o estoque uma única vez. */
export async function expirarPedidosPendentes(agora = new Date()): Promise<void> {
  const vencidos = await prisma.pedido.findMany({
    where: { status: 'pendente', expiraEm: { lt: agora } },
  });

  for (const pedido of vencidos) {
    const ganhou = await prisma.pedido.updateMany({
      where: { id: pedido.id, status: 'pendente' },
      data: { status: 'cancelado' },
    });
    if (ganhou.count === 1) {
      await devolverEstoque(pedido.eventoId, pedido.quantidade);
    }
  }
}

/** Aplica o status consultado no Mercado Pago. Repetir a mesma confirmação não gera outro ingresso. */
export async function aplicarPagamento(pedido: PedidoGravado, pagamento: PagamentoMp): Promise<void> {
  const status = mapearStatus(pagamento.status);
  const pagamentoExternoId = String(pagamento.id);
  const qrCode = pagamento.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrCodeBase64 = pagamento.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

  if (status === 'pendente') {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { pagamentoExternoId, qrCode, qrCodeBase64 },
    });
    return;
  }

  if (status === 'pago') {
    await prisma.$transaction(async (tx) => {
      const ganhou = await tx.pedido.updateMany({
        where: { id: pedido.id, status: 'pendente' },
        data: { status: 'pago', pagamentoExternoId, qrCode: null, qrCodeBase64: null },
      });
      if (ganhou.count !== 1) return;

      for (let i = 0; i < pedido.quantidade; i++) {
        await tx.ingresso.create({
          data: {
            pedidoId: pedido.id,
            codigo: codigoIngresso(),
            status: 'valido',
          },
        });
      }

      await tx.presenca.upsert({
        where: { usuarioId_eventoId: { usuarioId: pedido.usuarioId, eventoId: pedido.eventoId } },
        update: {},
        create: { usuarioId: pedido.usuarioId, eventoId: pedido.eventoId },
      });
    });
    return;
  }

  const ganhou = await prisma.pedido.updateMany({
    where: { id: pedido.id, status: 'pendente' },
    data: { status, pagamentoExternoId },
  });
  if (ganhou.count === 1) {
    await devolverEstoque(pedido.eventoId, pedido.quantidade);
  }
}

export async function carregarPedido(id: string) {
  return prisma.pedido.findUnique({
    where: { id },
    include: { ingressos: true },
  });
}

interface CobrarEntrada {
  pedidoId: string;
  tituloEvento: string;
  valorTotal: number;
  email: string;
  metodo: 'pix' | 'cartao';
  token?: string;
  paymentMethodId?: string;
  installments?: number;
  issuerId?: number;
  identificationType?: string;
  identificationNumber?: string;
}

export async function cobrarNoMercadoPago(entrada: CobrarEntrada): Promise<PagamentoMp> {
  if (!pagamentoConfigurado()) {
    throw new Error('Mercado Pago sem access token');
  }

  const corpo: Record<string, unknown> = {
    transaction_amount: entrada.valorTotal,
    description: `Ingresso: ${entrada.tituloEvento}`.slice(0, 256),
    payment_method_id: entrada.metodo === 'pix' ? 'pix' : entrada.paymentMethodId,
    external_reference: entrada.pedidoId,
    payer: {
      email: entrada.email,
      ...(entrada.identificationNumber
        ? {
            identification: {
              type: entrada.identificationType || 'CPF',
              number: entrada.identificationNumber.replace(/\D/g, ''),
            },
          }
        : {}),
    },
  };

  if (entrada.metodo === 'cartao') {
    corpo.token = entrada.token;
    corpo.installments = entrada.installments || 1;
    if (entrada.issuerId) corpo.issuer_id = entrada.issuerId;
  }

  if (process.env.MERCADO_PAGO_NOTIFICATION_URL) {
    corpo.notification_url = process.env.MERCADO_PAGO_NOTIFICATION_URL;
  }

  return clienteMercadoPago().criarPagamento(corpo, entrada.pedidoId);
}

export function prazoDoPedido(agora = new Date()): Date {
  return new Date(agora.getTime() + EXPIRA_MS);
}
