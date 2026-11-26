import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo } from '../../components/Campo';
import { Segmentos } from '../../components/Segmentos';
import type { PagamentoPedidoDTO } from '../../dtos';
import { buscarEvento, type EventoCompleto } from '../../services/eventos';
import {
  carregarSdkMercadoPago,
  chavePublicaMercadoPago,
  comprarIngresso,
  pagamentoDisponivel,
} from '../../services/pagamentos';
import styles from './Checkout.module.css';

const formatoPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Checkout do ingresso no próprio site: cartão (token do Mercado Pago) ou PIX. */
export function Checkout() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<EventoCompleto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [quantidade, setQuantidade] = useState('1');
  const [metodo, setMetodo] = useState<'cartao' | 'pix'>('cartao');
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState<PagamentoPedidoDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarEvento(id)
      .then((resultado) => {
        if (ativo) setItem(resultado);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar o evento.');
      });
    pagamentoDisponivel()
      .then((ligado) => {
        if (ativo) setDisponivel(ligado);
      })
      .catch(() => {
        if (ativo) setDisponivel(false);
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  const qtd = Number(quantidade);
  const preco = item?.evento.preco ?? 0;
  const total = Number.isInteger(qtd) && qtd > 0 ? preco * qtd : 0;

  const concluir = useCallback(
    async (
      forma: 'pix' | 'cartao',
      cartao?: {
        token: string;
        payment_method_id: string;
        installments?: number;
        issuer_id?: string;
        identification_type?: string;
        identification_number?: string;
      },
    ) => {
      if (!Number.isInteger(qtd) || qtd < 1) {
        setErro('Informe a quantidade de ingressos.');
        return;
      }
      setEnviando(true);
      setErro(null);
      try {
        const resposta = await comprarIngresso(id, qtd, forma, cartao);
        setPedido(resposta);
        if (resposta.status === 'recusado' || resposta.status === 'cancelado') {
          setErro('O pagamento não foi aprovado.');
        }
      } catch (e) {
        setErro(e instanceof ErroApi ? e.message : 'Não foi possível concluir a compra.');
      } finally {
        setEnviando(false);
      }
    },
    [id, qtd],
  );

  useEffect(() => {
    if (metodo !== 'cartao' || !disponivel || !item || pedido) return;
    let cancelado = false;
    let formulario: {
      unmount?: () => void;
      getCardFormData?: () => {
        token: string;
        paymentMethodId: string;
        issuerId?: string;
        installments: number | string;
        identificationNumber?: string;
        identificationType?: string;
      };
    } | null = null;

    carregarSdkMercadoPago()
      .then(() => {
        if (cancelado || !window.MercadoPago) return;
        const mp = new window.MercadoPago(chavePublicaMercadoPago(), { locale: 'pt-BR' });
        formulario = mp.cardForm({
          amount: total.toFixed(2),
          iframe: true,
          form: {
            id: 'form-checkout',
            cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
            expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
            securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
            cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Titular' },
            issuer: { id: 'form-checkout__issuer', placeholder: 'Banco' },
            installments: { id: 'form-checkout__installments', placeholder: 'Parcelas' },
            identificationType: { id: 'form-checkout__identificationType' },
            identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'Documento' },
            cardholderEmail: { id: 'form-checkout__cardholderEmail', placeholder: 'E-mail do pagador' },
          },
          callbacks: {
            onFormMounted: (falha) => {
              if (falha) setErro('Não foi possível abrir o formulário do cartão.');
            },
            onSubmit: (evento) => {
              evento.preventDefault();
              const dados = formulario?.getCardFormData?.();
              if (!dados?.token) {
                setErro('Não foi possível tokenizar o cartão.');
                return;
              }
              void concluir('cartao', {
                token: dados.token,
                payment_method_id: dados.paymentMethodId,
                installments: Number(dados.installments) || 1,
                issuer_id: dados.issuerId,
                identification_type: dados.identificationType,
                identification_number: dados.identificationNumber,
              });
            },
          },
        });
      })
      .catch((e: unknown) => {
        if (!cancelado) setErro(e instanceof Error ? e.message : 'Não foi possível carregar o Mercado Pago.');
      });

    return () => {
      cancelado = true;
      formulario?.unmount?.();
    };
  }, [metodo, disponivel, item, pedido, total, concluir]);

  function pagarPix(evento: FormEvent) {
    evento.preventDefault();
    void concluir('pix');
  }

  if (erro && !item) {
    return (
      <main className={styles.tela}>
        <Aviso tipo="erro">{erro}</Aviso>
        <Link to="/inicio">Voltar para o início</Link>
      </main>
    );
  }

  if (!item || disponivel === null) {
    return (
      <main className={styles.tela}>
        <p className={styles.carregando}>Carregando checkout…</p>
      </main>
    );
  }

  if (!item.evento.venda_no_app) {
    return (
      <main className={styles.tela}>
        <Aviso tipo="erro">Este evento não vende ingresso por aqui.</Aviso>
        <Link to={`/eventos/${id}`}>Voltar ao evento</Link>
      </main>
    );
  }

  return (
    <main className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Comprar ingresso</h1>
        <p className={styles.subtitulo}>{item.evento.titulo}</p>
      </header>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {pedido?.status === 'pago' && (
        <Aviso tipo="sucesso">{`Pagamento aprovado. Seus códigos: ${pedido.ingressos.map((ingresso) => ingresso.codigo).join(', ')}.`}</Aviso>
      )}

      {pedido?.status === 'pendente' && pedido.qr_code && (
        <section className={styles.pix}>
          <p>Pague o PIX para liberar o ingresso. A confirmação chega pelo webhook.</p>
          {pedido.qr_code_base64 && (
            <img
              className={styles.qr}
              alt="QR Code do PIX"
              src={`data:image/jpeg;base64,${pedido.qr_code_base64}`}
            />
          )}
          <p className={styles.copia}>{pedido.qr_code}</p>
        </section>
      )}

      {pedido?.status === 'pago' ? (
        <Link to="/agenda">Ver meus ingressos</Link>
      ) : (
        <>
          <Campo
            rotulo="Quantidade"
            name="quantidade"
            inputMode="numeric"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, '').slice(0, 2))}
          />
          <p className={styles.total}>
            Total <strong>{formatoPreco.format(total)}</strong>
          </p>

          {!disponivel ? (
            <p className={styles.subtitulo}>
              O pagamento ainda não está ligado. Quando as credenciais de sandbox estiverem no ambiente, a compra por
              cartão e PIX passa a funcionar nesta tela.
            </p>
          ) : (
            <>
              <Segmentos
                rotulo="Forma de pagamento"
                opcoes={[
                  { valor: 'cartao', rotulo: 'Cartão' },
                  { valor: 'pix', rotulo: 'PIX' },
                ]}
                selecionado={metodo}
                onMudar={(valor) => {
                  if (valor) setMetodo(valor);
                }}
              />

              {metodo === 'pix' ? (
                <form className={styles.formulario} onSubmit={pagarPix}>
                  <Botao type="submit" carregando={enviando}>
                    Gerar PIX
                  </Botao>
                </form>
              ) : (
                <form id="form-checkout" className={styles.formulario}>
                  <div id="form-checkout__cardNumber" className={styles.campoSeguro} />
                  <div id="form-checkout__expirationDate" className={styles.campoSeguro} />
                  <div id="form-checkout__securityCode" className={styles.campoSeguro} />
                  <input id="form-checkout__cardholderName" className={styles.campo} placeholder="Nome do titular" />
                  <select id="form-checkout__issuer" className={styles.campo} />
                  <select id="form-checkout__installments" className={styles.campo} />
                  <select id="form-checkout__identificationType" className={styles.campo} />
                  <input id="form-checkout__identificationNumber" className={styles.campo} placeholder="Documento" />
                  <input
                    id="form-checkout__cardholderEmail"
                    className={styles.campo}
                    type="email"
                    placeholder="E-mail do pagador de teste"
                  />
                  <button type="submit" className={styles.enviar} disabled={enviando}>
                    {enviando ? 'Processando…' : 'Pagar com cartão'}
                  </button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
