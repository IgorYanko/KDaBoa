import type { Request, Response } from 'express';
import type { RequisicaoAutenticada } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';
import { ErroMercadoPago, clienteMercadoPago, pagamentoConfigurado, type PagamentoMp } from '../services/mercadoPago';
import {
  aplicarPagamento,
  carregarPedido,
  cobrarNoMercadoPago,
  expirarPedidosPendentes,
  formatarPedido,
  prazoDoPedido,
  reais,
} from '../services/pedidos';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function calcularIdade(dataNascimento: Date, referencia = new Date()): number {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const mes = referencia.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

function idDoWebhook(req: Request): string | null {
  const doCorpo = req.body?.data?.id ?? (req.body?.type === 'payment' ? req.body?.id : undefined);
  if (doCorpo !== undefined && doCorpo !== null && String(doCorpo).trim() !== '') {
    return String(doCorpo);
  }

  const consulta = req.query;
  if (typeof consulta['data.id'] === 'string' && consulta['data.id']) return consulta['data.id'];
  if (consulta.data && typeof consulta.data === 'object' && 'id' in consulta.data) {
    return String((consulta.data as { id: unknown }).id);
  }
  if (typeof consulta.id === 'string' && (consulta.topic === 'payment' || consulta.type === 'payment')) {
    return consulta.id;
  }
  return null;
}

async function cancelarReserva(pedidoId: string, eventoId: string, quantidade: number): Promise<void> {
  const ganhou = await prisma.pedido.updateMany({
    where: { id: pedidoId, status: 'pendente' },
    data: { status: 'cancelado' },
  });
  if (ganhou.count === 1) {
    await prisma.evento.update({
      where: { id: eventoId },
      data: { quantidadeIngressos: { increment: quantidade } },
    });
  }
}

export const pagamentoController = {
  disponivel: async (_req: Request, res: Response): Promise<void> => {
    res.json({ disponivel: pagamentoConfigurado() });
  },

  criar: async (req: Request, res: Response): Promise<void> => {
    const eventoId = String(req.params.id);
    const usuarioId = (req as RequisicaoAutenticada).usuario?.id;

    if (!usuarioId) {
      res.status(401).json({ erro: 'Usuário não autenticado' });
      return;
    }

    if (!pagamentoConfigurado()) {
      res.status(503).json({
        erro: 'O pagamento ainda não está ligado. Configure o access token do Mercado Pago.',
      });
      return;
    }

    if (!uuidRegex.test(eventoId)) {
      res.status(404).json({ erro: 'Evento não encontrado' });
      return;
    }

    const quantidade = Number(req.body?.quantidade ?? 1);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
      res.status(400).json({ erro: 'Informe uma quantidade de ingressos entre 1 e 20.' });
      return;
    }

    const metodo = req.body?.metodo === 'pix' ? 'pix' : 'cartao';
    if (metodo === 'cartao' && !req.body?.token) {
      res.status(400).json({ erro: 'Token do cartão ausente.' });
      return;
    }
    if (metodo === 'cartao' && !req.body?.payment_method_id) {
      res.status(400).json({ erro: 'Meio de pagamento do cartão ausente.' });
      return;
    }

    try {
      await expirarPedidosPendentes();

      const [evento, usuario] = await Promise.all([
        prisma.evento.findUnique({ where: { id: eventoId } }),
        prisma.usuario.findUnique({ where: { id: usuarioId } }),
      ]);

      if (!evento?.vendaNoApp) {
        res.status(evento ? 400 : 404).json({
          erro: evento ? 'Este evento não vende ingresso no app.' : 'Evento não encontrado',
        });
        return;
      }

      if (!usuario) {
        res.status(404).json({ erro: 'Usuário não encontrado' });
        return;
      }

      if (evento.classificacaoEtaria > 0) {
        if (!usuario.dataNascimento) {
          res.status(403).json({
            erro: `Evento restrito para maiores de ${evento.classificacaoEtaria} anos`,
          });
          return;
        }
        const idade = calcularIdade(new Date(usuario.dataNascimento));
        if (idade < evento.classificacaoEtaria) {
          res.status(403).json({
            erro: `Evento restrito para maiores de ${evento.classificacaoEtaria} anos`,
          });
          return;
        }
      }

      const valorUnitario = reais(evento.preco);
      if (!(valorUnitario > 0)) {
        res.status(400).json({ erro: 'Evento sem preço para venda no app.' });
        return;
      }
      const valorTotal = Math.round(valorUnitario * quantidade * 100) / 100;

      const reservado = await prisma.evento.updateMany({
        where: {
          id: eventoId,
          vendaNoApp: true,
          quantidadeIngressos: { gte: quantidade },
        },
        data: { quantidadeIngressos: { decrement: quantidade } },
      });

      if (reservado.count !== 1) {
        res.status(409).json({ erro: 'Não há ingressos suficientes.' });
        return;
      }

      const pedido = await prisma.pedido.create({
        data: {
          usuarioId,
          eventoId,
          quantidade,
          valorTotal,
          status: 'pendente',
          expiraEm: prazoDoPedido(),
        },
      });

      let pagamento: PagamentoMp;
      try {
        pagamento = await cobrarNoMercadoPago({
          pedidoId: pedido.id,
          tituloEvento: evento.titulo,
          valorTotal,
          email: usuario.email,
          metodo,
          token: req.body?.token,
          paymentMethodId: req.body?.payment_method_id,
          installments: Number(req.body?.installments) || 1,
          issuerId: req.body?.issuer_id ? Number(req.body.issuer_id) : undefined,
          identificationType: req.body?.identification_type,
          identificationNumber: req.body?.identification_number,
          expiraEm: pedido.expiraEm,
        });
      } catch (erro) {
        if (!(erro instanceof ErroMercadoPago)) {
          console.error(
            JSON.stringify({
              nivel: 'error',
              evento: 'mercado_pago',
              operacao: 'criar_pagamento',
              referencia: pedido.id,
              mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
            }),
          );
        }
        await cancelarReserva(pedido.id, eventoId, quantidade);
        const causa = erro instanceof ErroMercadoPago ? `: ${erro.message}` : '.';
        res.status(502).json({ erro: `Não foi possível cobrar no Mercado Pago${causa}` });
        return;
      }

      try {
        await aplicarPagamento(pedido, pagamento);
      } catch (erro) {
        console.error(
          JSON.stringify({
            nivel: 'error',
            evento: 'mercado_pago',
            operacao: 'gravar_pagamento',
            referencia: pedido.id,
            pagamentoId: String(pagamento.id),
            mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
          }),
        );
      }

      const completo = await carregarPedido(pedido.id);
      const resposta = formatarPedido(completo ?? pedido);
      const qr = pagamento.point_of_interaction?.transaction_data;
      if (!resposta.qr_code && qr?.qr_code) {
        resposta.qr_code = qr.qr_code;
        resposta.qr_code_base64 = qr.qr_code_base64 ?? null;
      }
      res.status(201).json(resposta);
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao iniciar o pagamento' });
    }
  },

  webhook: async (req: Request, res: Response): Promise<void> => {
    const tipo = req.body?.type ?? req.query.type ?? req.query.topic;
    if (tipo && tipo !== 'payment') {
      res.status(200).json({ ok: true });
      return;
    }

    const id = idDoWebhook(req);
    if (!id) {
      res.status(200).json({ ok: true });
      return;
    }

    if (!pagamentoConfigurado()) {
      res.status(503).json({ erro: 'O pagamento ainda não está ligado.' });
      return;
    }

    try {
      const pagamento = await clienteMercadoPago().consultarPagamento(id);
      const pedido = await prisma.pedido.findFirst({
        where: {
          OR: [
            { pagamentoExternoId: String(pagamento.id) },
            ...(pagamento.external_reference ? [{ id: pagamento.external_reference }] : []),
          ],
        },
      });

      if (pedido) {
        await aplicarPagamento(pedido, pagamento);
      }

      await expirarPedidosPendentes();
      res.status(200).json({ ok: true });
    } catch (erro) {
      if (!(erro instanceof ErroMercadoPago)) {
        console.error(
          JSON.stringify({
            nivel: 'error',
            evento: 'mercado_pago',
            operacao: 'webhook',
            referencia: id,
            mensagem: erro instanceof Error ? erro.message : 'erro desconhecido',
          }),
        );
      }
      res.status(500).json({ erro: 'Erro ao processar o webhook' });
    }
  },

  buscar: async (req: Request, res: Response): Promise<void> => {
    const usuarioId = (req as RequisicaoAutenticada).usuario?.id;
    if (!usuarioId) {
      res.status(401).json({ erro: 'Usuário não autenticado' });
      return;
    }

    const id = String(req.params.id);
    if (!uuidRegex.test(id)) {
      res.status(404).json({ erro: 'Pedido não encontrado' });
      return;
    }

    try {
      await expirarPedidosPendentes();
      const pedido = await carregarPedido(id);
      if (!pedido || pedido.usuarioId !== usuarioId) {
        res.status(404).json({ erro: 'Pedido não encontrado' });
        return;
      }
      res.json(formatarPedido(pedido));
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao consultar o pedido' });
    }
  },

  meusIngressos: async (req: Request, res: Response): Promise<void> => {
    const usuarioId = (req as RequisicaoAutenticada).usuario?.id;
    if (!usuarioId) {
      res.status(401).json({ erro: 'Usuário não autenticado' });
      return;
    }

    try {
      const ingressos = await prisma.ingresso.findMany({
        where: { pedido: { usuarioId, status: 'pago' }, status: 'valido' },
        include: { pedido: { include: { evento: { include: { local: true } } } } },
        orderBy: { criadoEm: 'desc' },
      });

      res.json(
        ingressos.map((ingresso) => ({
          id: ingresso.id,
          codigo: ingresso.codigo,
          status: ingresso.status,
          evento_id: ingresso.pedido.eventoId,
          evento_titulo: ingresso.pedido.evento.titulo,
          data_inicio: ingresso.pedido.evento.dataInicio.toISOString(),
          capa_url: ingresso.pedido.evento.imagemUrl ?? null,
          local_nome: ingresso.pedido.evento.local.nome,
        })),
      );
    } catch (_error) {
      res.status(500).json({ erro: 'Erro ao listar ingressos' });
    }
  },
};
