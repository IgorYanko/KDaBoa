import { type CSSProperties, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import iconeChat from '../../assets/icones/chat.svg';
import iconeCompartilhar from '../../assets/icones/compartilhar.svg';
import iconeIngresso from '../../assets/icones/ingresso.svg';
import iconeLocal from '../../assets/icones/local.svg';
import iconeRelogio from '../../assets/icones/relogio.svg';
import iconeSeta from '../../assets/icones/seta-direita.svg';
import iconeVoltar from '../../assets/icones/voltar.svg';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { PilhaAvatares } from '../../components/PilhaAvatares';
import { type EventoCompleto, buscarEvento } from '../../services/eventos';
import { cancelarPresenca, confirmarPresenca } from '../../services/presenca';
import { corDaCategoria } from '../../utils/cores';
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
  const [aviso, setAviso] = useState<string | null>(null);

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
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <main className={styles.tela} style={estilo}>
      <header className={styles.topo}>
        <div className={styles.acoesTopo}>
          <button type="button" className={styles.botaoTopo} onClick={voltar} aria-label="Voltar">
            <img src={iconeVoltar} alt="" width={20} height={20} />
          </button>
          <button type="button" className={styles.botaoTopo} onClick={compartilhar} aria-label="Compartilhar evento">
            <img src={iconeCompartilhar} alt="" width={20} height={20} />
          </button>
        </div>
        <div className={styles.dataGrande}>
          <p className={styles.data}>
            <span className={styles.dia}>{dia(evento.data_inicio)}</span>
            <span className={styles.mesSemana}>
              {mesCurto(evento.data_inicio)} · {diaSemanaCurto(evento.data_inicio)}
            </span>
          </p>
          {categoria && <span className={styles.etiqueta}>{categoria.nome}</span>}
        </div>
      </header>

      <div className={styles.conteudo}>
        {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}

        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>{evento.titulo}</h1>
          {evento.organizador && <p className={styles.organizador}>Organizado por {evento.organizador.nome}</p>}
        </div>

        <ul className={styles.infos}>
          <li className={styles.info}>
            <span className={styles.infoIcone}>
              <img src={iconeRelogio} alt="" width={20} height={20} />
            </span>
            <span className={styles.infoTextos}>
              <span className={styles.infoTitulo}>{dataLonga(evento.data_inicio)}</span>
              <span className={styles.infoDetalhe}>{intervaloHoras(evento.data_inicio, evento.data_fim)}</span>
            </span>
          </li>
          {lugar && (
            <li className={styles.info}>
              <span className={styles.infoIcone}>
                <img src={iconeLocal} alt="" width={20} height={20} />
              </span>
              <span className={styles.infoTextos}>
                <span className={styles.infoTitulo}>{lugar.nome}</span>
                <span className={styles.infoDetalhe}>{lugar.endereco}</span>
              </span>
              <Link to={`/eventos/${evento.id}/mapa`} className={styles.linkMapa}>
                Mapa
              </Link>
            </li>
          )}
          <li className={styles.info}>
            <span className={styles.infoIcone}>
              <img src={iconeIngresso} alt="" width={20} height={20} />
            </span>
            <span className={styles.infoTextos}>
              <span className={styles.infoTitulo}>{evento.preco > 0 ? formatoPreco.format(evento.preco) : 'Gratuito'}</span>
              <span className={styles.infoDetalhe}>
                {evento.preco > 0 ? 'Na portaria' : 'Entrada franca'}
                {evento.classificacao_etaria > 0 && ` · ${evento.classificacao_etaria}+`}
              </span>
            </span>
          </li>
        </ul>

        <section className={styles.sobre}>
          <h2 className={styles.sobreTitulo}>Sobre</h2>
          <p className={styles.sobreTexto}>{evento.descricao}</p>
        </section>

        <Link to={`/eventos/${evento.id}/quem-vai`} className={styles.cartao}>
          <PilhaAvatares pessoas={evento.participantes_amostra ?? []} tamanho={40} maximo={4} />
          <span className={styles.cartaoTextos}>
            <span className={styles.cartaoTitulo}>{textoPessoas(total)}</span>
            <span className={styles.cartaoDetalhe}>Ver quem vai</span>
          </span>
          <img src={iconeSeta} alt="" width={20} height={20} />
        </Link>

        {euVou ? (
          <Link to={`/eventos/${evento.id}/chat`} className={styles.cartao}>
            <span className={styles.chatIcone}>
              <img src={iconeChat} alt="" width={22} height={22} />
            </span>
            <span className={styles.cartaoTextos}>
              <span className={styles.cartaoTitulo}>Chat do evento</span>
              <span className={styles.cartaoDetalhe}>Converse com quem vai</span>
            </span>
            <img src={iconeSeta} alt="" width={20} height={20} />
          </Link>
        ) : (
          <div className={`${styles.cartao} ${styles.bloqueado}`}>
            <span className={styles.chatIcone}>
              <img src={iconeChat} alt="" width={22} height={22} />
            </span>
            <span className={styles.cartaoTextos}>
              <span className={styles.cartaoTitulo}>Chat do evento</span>
              <span className={styles.cartaoDetalhe}>Confirme presença para entrar na conversa</span>
            </span>
          </div>
        )}

        {erroPresenca && <Aviso tipo="erro">{erroPresenca}</Aviso>}
      </div>

      <div className={styles.rodape}>
        <p className={styles.confirmados}>
          <span className={styles.confirmadosRotulo}>Confirmados</span>
          <span className={styles.confirmadosNumero}>{total}</span>
        </p>
        <Botao
          className={euVou ? `${styles.botaoPresenca} ${styles.vou}` : styles.botaoPresenca}
          onClick={alternarPresenca}
          carregando={salvando}
          aria-pressed={euVou}
        >
          {euVou ? 'Você vai! · Cancelar' : 'Eu vou!'}
        </Botao>
      </div>
    </main>
  );
}
