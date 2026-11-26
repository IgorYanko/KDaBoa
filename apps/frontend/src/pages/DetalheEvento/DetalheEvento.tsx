import { type CSSProperties, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { Botao, classesBotao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Icone } from '../../components/Icone';
import { PilhaAvatares } from '../../components/PilhaAvatares';
import { type EventoCompleto, buscarEvento } from '../../services/eventos';
import { cancelarPresenca, confirmarPresenca } from '../../services/presenca';
import { corDaCategoria, iconeDaCategoria, iniciais } from '../../utils/cores';
import { dataLonga, dia, diaSemanaCurto, intervaloHoras, mesCurto } from '../../utils/datas';
import styles from './DetalheEvento.module.css';

const formatoPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function textoPessoas(total: number): string {
  if (total === 0) return 'Ninguém confirmou ainda';
  return total === 1 ? '1 pessoa vai' : `${total} pessoas vão`;
}

/** Tela 4 · Detalhe do evento (issues #26 e #28). */
export function DetalheEvento() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const local = useLocation();

  const [item, setItem] = useState<EventoCompleto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroPresenca, setErroPresenca] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Vindo do Divulgar: avisa que o evento foi publicado.
  const [aviso, setAviso] = useState<string | null>(() =>
    (local.state as { publicado?: boolean } | null)?.publicado ? 'Evento publicado! Agora é só chamar a galera.' : null,
  );

  useEffect(() => {
    let ativo = true;
    setItem(null);
    setErro(null);
    buscarEvento(id)
      .then((resultado) => {
        if (ativo) setItem(resultado);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar o evento.');
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  function voltar() {
    // Se a pessoa abriu o link direto, não há tela anterior no app: vai para o Início.
    if (local.key === 'default') navegar('/inicio');
    else navegar(-1);
  }

  async function compartilhar() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item?.evento.titulo, url });
      } else {
        await navigator.clipboard.writeText(url);
        setAviso('Link copiado!');
        setTimeout(() => setAviso(null), 2500);
      }
    } catch {
      // A pessoa cancelou o compartilhamento: nada a fazer.
    }
  }

  async function alternarPresenca() {
    if (!item) return;
    const vou = !item.evento.eu_vou;
    setSalvando(true);
    setErroPresenca(null);
    try {
      if (vou) await confirmarPresenca(id);
      else await cancelarPresenca(id);
      const total = item.evento.total_confirmados ?? 0;
      setItem({
        ...item,
        evento: { ...item.evento, eu_vou: vou, total_confirmados: Math.max(0, total + (vou ? 1 : -1)) },
      });
    } catch (e) {
      setErroPresenca(e instanceof ErroApi ? e.message : 'Não foi possível salvar sua presença.');
    } finally {
      setSalvando(false);
    }
  }

  if (erro) {
    return (
      <main className={styles.estado}>
        <Aviso tipo="erro">{erro}</Aviso>
        <Link to="/inicio" className={styles.linkDestaque}>
          Voltar para o início
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className={styles.estado}>
        <p className={styles.carregando}>Carregando evento…</p>
      </main>
    );
  }

  const { evento, categoria, local: lugar } = item;
  const total = evento.total_confirmados ?? 0;
  const euVou = evento.eu_vou ?? false;
  const icone = iconeDaCategoria(categoria);
  const vendaNoApp = evento.venda_no_app === true;
  const preco = evento.preco > 0 ? formatoPreco.format(Number(evento.preco)) : 'Gratuito';
  const detalhePreco = vendaNoApp ? 'Compra no app' : evento.preco > 0 ? 'Na portaria' : 'Entrada franca';
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <main className={styles.tela} style={estilo}>
      {/* Capa: mais baixa que antes; degradê da categoria ou a imagem do evento. */}
      <header className={styles.capa}>
        {evento.capa_url ? (
          <img className={styles.imagem} src={evento.capa_url} alt="" />
        ) : (
          <span className={styles.marcaDagua} aria-hidden="true">
            <Icone nome={icone} tamanho={220} traco={1} />
          </span>
        )}
        <div className={styles.acoesTopo}>
          <BotaoIcone icone="voltar" rotulo="Voltar" variante="vidro" onClick={voltar} />
          <BotaoIcone
            icone="compartilhar"
            rotulo="Compartilhar evento"
            variante="fantasma"
            onClick={compartilhar}
            className={styles.compartilharTopo}
          />
        </div>
        <div className={styles.capaRodape}>
          <p className={styles.data}>
            <span className={styles.dia}>{dia(evento.data_inicio)}</span>
            <span className={styles.mesSemana}>
              {mesCurto(evento.data_inicio)} · {diaSemanaCurto(evento.data_inicio)}
            </span>
          </p>
          {categoria && (
            <span className={styles.etiqueta}>
              <span className={styles.etiquetaIcone}>
                <Icone nome={icone} tamanho={14} />
              </span>
              {categoria.nome}
            </span>
          )}
        </div>
      </header>

      <div className={styles.grade}>
        <div className={styles.conteudo}>
          {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}

          <div className={styles.cabecalho}>
            <h1 className={styles.titulo}>{evento.titulo}</h1>
            {evento.verificado && <p className={styles.selo}>Verificado</p>}
            {evento.organizador && (
              <p className={styles.organizador}>
                <span className={styles.organizadorAvatar} aria-hidden="true">
                  {iniciais(evento.organizador.nome)}
                </span>
                <span>
                  Organizado por <strong>{evento.organizador.nome}</strong>
                </span>
              </p>
            )}
          </div>

          <ul className={styles.infos}>
            <li className={styles.info}>
              <span className={styles.infoIcone}>
                <Icone nome="relogio" />
              </span>
              <span className={styles.infoTextos}>
                <span className={styles.infoTitulo}>{dataLonga(evento.data_inicio)}</span>
                <span className={styles.infoDetalhe}>{intervaloHoras(evento.data_inicio, evento.data_fim)}</span>
              </span>
            </li>
            {lugar && (
              <li className={styles.info}>
                <span className={styles.infoIcone}>
                  <Icone nome="local" />
                </span>
                <span className={styles.infoTextos}>
                  <span className={styles.infoTitulo}>{lugar.nome}</span>
                  <span className={styles.infoDetalhe}>{lugar.endereco}</span>
                </span>
                <Link
                  to={`/eventos/${evento.id}/mapa`}
                  className={`${classesBotao({ variante: 'fantasma', tamanho: 'sm', larguraTotal: false })} ${styles.linkMapa}`}
                >
                  <Icone nome="mapa" tamanho={16} />
                  Mapa
                </Link>
              </li>
            )}
            <li className={styles.info}>
              <span className={styles.infoIcone}>
                <Icone nome="ingresso" />
              </span>
              <span className={styles.infoTextos}>
                <span className={styles.infoTitulo}>{preco}</span>
                <span className={styles.infoDetalhe}>
                  {detalhePreco}
                  {evento.classificacao_etaria > 0 && ` · ${evento.classificacao_etaria}+`}
                </span>
              </span>
            </li>
          </ul>

          <section className={styles.sobre}>
            <h2 className={styles.secaoTitulo}>Sobre</h2>
            <p className={styles.sobreTexto}>{evento.descricao}</p>
          </section>

          <div className={styles.cartoes}>
            <Link to={`/eventos/${evento.id}/quem-vai`} className={styles.cartao}>
              {total > 0 ? (
                <PilhaAvatares pessoas={evento.participantes_amostra ?? []} tamanho={40} maximo={4} />
              ) : (
                <span className={styles.cartaoIcone}>
                  <Icone nome="pessoas" />
                </span>
              )}
              <span className={styles.cartaoTextos}>
                <span className={styles.cartaoTitulo}>{textoPessoas(total)}</span>
                <span className={styles.cartaoDetalhe}>Ver quem vai</span>
              </span>
              <span className={styles.seta}>
                <Icone nome="seta-direita" />
              </span>
            </Link>

            {euVou ? (
              <Link to={`/eventos/${evento.id}/chat`} className={styles.cartao}>
                <span className={`${styles.cartaoIcone} ${styles.chatAberto}`}>
                  <Icone nome="chat" />
                </span>
                <span className={styles.cartaoTextos}>
                  <span className={styles.cartaoTitulo}>Chat do evento</span>
                  <span className={styles.cartaoDetalhe}>Converse com quem vai</span>
                </span>
                <span className={styles.seta}>
                  <Icone nome="seta-direita" />
                </span>
              </Link>
            ) : (
              <div className={`${styles.cartao} ${styles.bloqueado}`}>
                <span className={styles.cartaoIcone}>
                  <Icone nome="cadeado" />
                </span>
                <span className={styles.cartaoTextos}>
                  <span className={styles.cartaoTitulo}>Chat do evento</span>
                  <span className={styles.cartaoDetalhe}>
                    {vendaNoApp ? 'Compre o ingresso para entrar na conversa' : 'Confirme presença para entrar na conversa'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {erroPresenca && <Aviso tipo="erro">{erroPresenca}</Aviso>}
        </div>

        {/* Presença: barra fixa embaixo no celular; cartão fixo na lateral no desktop. */}
        <aside className={styles.lateral} aria-label="Presença">
          <div className={styles.presenca}>
            <ul className={styles.resumo}>
              <li>
                <Icone nome="calendario" tamanho={18} />
                <span>
                  {dataLonga(evento.data_inicio)}
                  <small>{intervaloHoras(evento.data_inicio, evento.data_fim)}</small>
                </span>
              </li>
              <li>
                <Icone nome="ingresso" tamanho={18} />
                <span>
                  {preco}
                  <small>{detalhePreco}</small>
                </span>
              </li>
            </ul>
            <p className={styles.confirmados}>
              <span className={styles.confirmadosRotulo}>Confirmados</span>
              <span className={styles.confirmadosNumero}>{total}</span>
            </p>
            {vendaNoApp ? (
              <Link to={`/eventos/${evento.id}/checkout`} className={`${classesBotao()} ${styles.botaoPresenca}`}>
                Comprar ingresso
              </Link>
            ) : (
              <Botao
                className={styles.botaoPresenca}
                variante={euVou ? 'secundario' : 'primario'}
                icone={euVou ? 'check' : undefined}
                onClick={alternarPresenca}
                carregando={salvando}
                aria-pressed={euVou}
              >
                {euVou ? 'Você vai! · Cancelar' : 'Eu vou!'}
              </Botao>
            )}
            <Botao variante="fantasma" icone="compartilhar" className={styles.compartilharLateral} onClick={compartilhar}>
              Compartilhar
            </Botao>
          </div>
        </aside>
      </div>
    </main>
  );
}
