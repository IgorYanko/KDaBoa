import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BoasVindas } from '../../components/BoasVindas';
import { classesBotao } from '../../components/Botao';
import { Icone } from '../../components/Icone';
import { type ControleMapa, MapaEventos, type PinoMapa } from '../../components/MapaEventos';
import { type EventoCompleto, listarEventos } from '../../services/eventos';
import { corDaCategoria } from '../../utils/cores';
import { dia, diaEHora, hora, mesCurto } from '../../utils/datas';
import { type Coordenadas, coordenadasDoEvento, distanciaKm, formatarDistancia, tempoAPe } from '../../utils/geo';
import { useLocalizacao } from '../Mapa/useLocalizacao';
import styles from './Hoje.module.css';

type Filtro = 'hoje' | 'agora' | 'gratis' | 'barato';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'agora', rotulo: 'Rolando agora' },
  { valor: 'gratis', rotulo: 'De graça' },
  { valor: 'barato', rotulo: 'Até R$ 20' },
];

const CENTRO_POUSO_ALEGRE: Coordenadas = [-22.2306, -45.9363];
const TRES_HORAS = 3 * 60 * 60 * 1000;
const formatoPreco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function rolandoAgora({ evento }: EventoCompleto, agora: Date): boolean {
  const inicio = new Date(evento.data_inicio);
  const fim = evento.data_fim ? new Date(evento.data_fim) : new Date(inicio.getTime() + TRES_HORAS);
  return inicio <= agora && agora < fim;
}

function passaNoFiltro(item: EventoCompleto, filtro: Filtro, agora: Date): boolean {
  const preco = Number(item.evento.preco);
  if (filtro === 'agora') return rolandoAgora(item, agora);
  if (filtro === 'gratis') return preco === 0;
  if (filtro === 'barato') return preco <= 20;
  return true;
}

function textoPreco(preco: number): string {
  return Number(preco) > 0 ? formatoPreco.format(Number(preco)) : 'Grátis';
}

function semAcento(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function Hoje() {
  const [hoje, setHoje] = useState<EventoCompleto[] | null>(null);
  const [proximos, setProximos] = useState<EventoCompleto[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('hoje');
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const { estado, posicao, iniciar } = useLocalizacao();
  const controle = useRef<ControleMapa>(null);
  const centralizarAoAchar = useRef(false);

  useEffect(() => {
    let ativo = true;
    listarEventos({ periodo: 'hoje' })
      .then(async (lista) => {
        if (!ativo) return;
        setHoje(lista);
        if (lista.length === 0) {
          const todos = await listarEventos().catch(() => []);
          if (ativo) setProximos(todos.slice(0, 3));
        }
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar os eventos de hoje.');
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (posicao && centralizarAoAchar.current) {
      centralizarAoAchar.current = false;
      controle.current?.centralizarEm(posicao);
    }
  }, [posicao]);

  const visiveis = useMemo(() => {
    const agora = new Date();
    const termo = semAcento(busca.trim());
    return (hoje ?? []).filter((item) => {
      if (!passaNoFiltro(item, filtro, agora)) return false;
      if (!termo) return true;
      return [item.evento.titulo, item.local?.nome, item.categoria?.nome].some((t) => t && semAcento(t).includes(termo));
    });
  }, [hoje, filtro, busca]);

  const selecionado = visiveis.find((item) => item.evento.id === selecionadoId) ?? null;

  const pinos = useMemo<PinoMapa[]>(
    () =>
      visiveis.flatMap((item) => {
        const coordenadas = coordenadasDoEvento(item);
        if (!coordenadas) return [];
        const { evento } = item;
        const destaque = evento.id === selecionadoId;
        return [
          {
            id: evento.id,
            coordenadas,
            titulo: `${evento.titulo}, hoje às ${hora(evento.data_inicio)}`,
            rotulo: destaque ? evento.titulo : hora(evento.data_inicio),
            cor: corDaCategoria(item.categoria),
          },
        ];
      }),
    [visiveis, selecionadoId],
  );

  const largo = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const carregado = hoje !== null;

  useEffect(() => {
    if (!carregado || selecionadoId || pinos.length === 0) return;
    const espera = setTimeout(() => controle.current?.mostrarTudo(), 300);
    return () => clearTimeout(espera);
  }, [carregado, selecionadoId, pinos]);

  function selecionar(id: string) {
    setSelecionadoId((atual) => (atual === id ? '' : id));
  }

  function mover(passo: number) {
    if (visiveis.length === 0) return;
    const indice = visiveis.findIndex((item) => item.evento.id === selecionadoId);
    const base = Math.max(indice, 0);
    setSelecionadoId(visiveis[(base + passo + visiveis.length) % visiveis.length].evento.id);
  }

  function trocarFiltro(novo: Filtro) {
    setFiltro(novo);
    setSelecionadoId('');
  }

  function localizar() {
    if (estado === 'ativa' && posicao) {
      controle.current?.centralizarEm(posicao);
      return;
    }
    centralizarAoAchar.current = true;
    iniciar();
  }

  const nadaHoje = carregado && hoje.length === 0;
  const contador = `${visiveis.length} ${visiveis.length === 1 ? 'rolê hoje' : 'rolês hoje'}`;

  return (
    <main className={styles.tela}>
      <BoasVindas />
      {carregado && (
        <MapaEventos
          pinos={pinos}
          selecionadoId={selecionadoId}
          usuario={posicao}
          onSelecionar={selecionar}
          controle={controle}
          centro={CENTRO_POUSO_ALEGRE}
          folga={{ topo: 140, base: largo ? 48 : 200 }}
        />
      )}

      <div className={styles.topo}>
        <div className={styles.linhaBusca}>
          <label className={styles.busca}>
            <Icone nome="busca" tamanho={18} />
            <span className={styles.somenteLeitor}>Buscar rolê de hoje</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setSelecionadoId('');
              }}
              placeholder="Qual é a boa hoje?"
            />
          </label>
          <button
            type="button"
            className={styles.localizar}
            onClick={localizar}
            aria-label="Centralizar na minha localização"
          >
            <Icone nome="mira" tamanho={20} />
          </button>
        </div>
        <div className={styles.filtros}>
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              className={f.valor === filtro ? `${styles.filtro} ${styles.filtroAtivo}` : styles.filtro}
              aria-pressed={f.valor === filtro}
              onClick={() => trocarFiltro(f.valor)}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className={styles.centro}>
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}

      {!carregado && !erro && (
        <p className={styles.centro} role="status">
          Carregando o mapa de hoje…
        </p>
      )}

      {carregado && (
        <section className={styles.gaveta} aria-label="Rolês de hoje">
          {nadaHoje && (
            <div className={styles.vazio}>
              <h1 className={styles.gavetaTitulo}>Hoje está calmo por aqui</h1>
              <p className={styles.gavetaTexto}>Nenhum rolê marcado para hoje. Olha o que vem por aí:</p>
              {proximos.map((item) => (
                <Link key={item.evento.id} to={`/eventos/${item.evento.id}`} className={styles.proximo}>
                  <span className={styles.proximoData} style={{ '--cor-evento': corDaCategoria(item.categoria) } as CSSProperties}>
                    <span>{dia(item.evento.data_inicio)}</span>
                    <span>{mesCurto(item.evento.data_inicio)}</span>
                  </span>
                  <span className={styles.proximoTextos}>
                    <span className={styles.proximoTitulo}>{item.evento.titulo}</span>
                    <span className={styles.proximoMeta}>
                      {diaEHora(item.evento.data_inicio)} · {textoPreco(item.evento.preco)}
                    </span>
                  </span>
                </Link>
              ))}
              <Link to="/explorar" className={styles.linkExplorar}>
                Ver tudo em Explorar
              </Link>
            </div>
          )}

          {!nadaHoje && !selecionado && (
            <div className={styles.resumo}>
              <div className={styles.resumoTextos}>
                <h1 className={styles.gavetaTitulo}>{contador}</h1>
                <p className={styles.gavetaTexto}>
                  {visiveis.length > 0 ? 'Toque num alfinete para ver o rolê' : 'Nenhum rolê com esse filtro agora'}
                </p>
              </div>
              {visiveis.length > 0 && (
                <button
                  type="button"
                  className={classesBotao({ variante: 'secundario', tamanho: 'sm', larguraTotal: false })}
                  onClick={() => setSelecionadoId(visiveis[0].evento.id)}
                >
                  Ver
                </button>
              )}
            </div>
          )}

          {selecionado && (
            <CartaoHoje
              item={selecionado}
              posicao={posicao}
              onMinimizar={() => setSelecionadoId('')}
              onAnterior={() => mover(-1)}
              onProximo={() => mover(1)}
            />
          )}
        </section>
      )}
    </main>
  );
}

interface PropsCartao {
  item: EventoCompleto;
  posicao: Coordenadas | null;
  onMinimizar: () => void;
  onAnterior: () => void;
  onProximo: () => void;
}

function CartaoHoje({ item, posicao, onMinimizar, onAnterior, onProximo }: PropsCartao) {
  const { evento, categoria, local } = item;
  const coordenadas = coordenadasDoEvento(item);
  const distancia = posicao && coordenadas ? distanciaKm(posicao, coordenadas) : null;
  const confirmados = evento.total_confirmados ?? 0;
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <article className={styles.cartao} style={estilo} aria-label={`Rolê selecionado: ${evento.titulo}`}>
      <div className={styles.cartaoTopo}>
        {categoria && <span className={styles.categoria}>{categoria.nome}</span>}
        {rolandoAgora(item, new Date()) && <span className={styles.agora}>Rolando agora</span>}
        <button type="button" className={`${styles.botaoRedondo} ${styles.minimizar}`} onClick={onMinimizar} aria-label="Minimizar">
          <Icone nome="fechar" tamanho={16} />
        </button>
      </div>

      <div className={styles.cartaoCabecalho}>
        <div className={styles.cartaoTextos}>
          <h2 className={styles.cartaoTitulo}>{evento.titulo}</h2>
          <p className={styles.cartaoMeta}>
            Hoje · {hora(evento.data_inicio)}
            {local && ` · ${local.nome}`}
          </p>
        </div>
        <span className={styles.preco}>{textoPreco(evento.preco)}</span>
      </div>

      <dl className={styles.numeros}>
        <div className={styles.numero}>
          <dt>{distancia === null ? 'distância' : 'de você'}</dt>
          <dd>{distancia === null ? '–' : formatarDistancia(distancia)}</dd>
        </div>
        <div className={styles.numero}>
          <dt>a pé</dt>
          <dd>{distancia === null ? '–' : tempoAPe(distancia)}</dd>
        </div>
        <div className={styles.numero}>
          <dt>{confirmados === 1 ? 'vai' : 'vão'}</dt>
          <dd>{confirmados}</dd>
        </div>
      </dl>

      <div className={styles.acoes}>
        <Link to={`/eventos/${evento.id}`} className={classesBotao()}>
          Bora? Ver o rolê
        </Link>
        <button type="button" className={styles.botaoRedondo} onClick={onAnterior} aria-label="Rolê anterior">
          <Icone nome="voltar" tamanho={18} />
        </button>
        <button type="button" className={`${styles.botaoRedondo} ${styles.virado}`} onClick={onProximo} aria-label="Próximo rolê">
          <Icone nome="voltar" tamanho={18} />
        </button>
      </div>
    </article>
  );
}
