import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BoasVindas } from '../../components/BoasVindas';
import { EventoCard } from '../../components/EventoCard';
import { Icone, type NomeIcone } from '../../components/Icone';
import { type ControleMapaHoje, MapaEventos, type PinoMapa } from '../../components/MapaEventos';
import { type EventoCompleto, listarEventos } from '../../services/eventos';
import { corDaCategoria } from '../../utils/cores';
import { diaSemanaCurto, hora } from '../../utils/datas';
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
const RAIO_DA_CIDADE_KM = 20;
const LARGO = '(min-width: 1024px)';
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

function extrasDoCard(item: EventoCompleto, posicao: Coordenadas | null, agora: Date) {
  const extras: { icone: NomeIcone; texto: string; destaque?: boolean }[] = [];
  if (rolandoAgora(item, agora)) extras.push({ icone: 'brilho', texto: 'Rolando agora', destaque: true });
  extras.push({ icone: 'ingresso', texto: textoPreco(item.evento.preco) });
  const coordenadas = coordenadasDoEvento(item);
  if (posicao && coordenadas) {
    const km = distanciaKm(posicao, coordenadas);
    extras.push({ icone: 'rota', texto: `${formatarDistancia(km)} · ${tempoAPe(km)} a pé` });
  }
  return extras;
}

function useTelaLarga(): boolean {
  const [largo, setLargo] = useState(() => typeof window !== 'undefined' && window.matchMedia(LARGO).matches);
  useEffect(() => {
    const consulta = window.matchMedia(LARGO);
    const aoMudar = () => setLargo(consulta.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);
  return largo;
}

function semMovimento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Hoje() {
  const [hoje, setHoje] = useState<EventoCompleto[] | null>(null);
  const [proximos, setProximos] = useState<EventoCompleto[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('hoje');
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const { estado, posicao, iniciar } = useLocalizacao();
  const controle = useRef<ControleMapaHoje>(null);
  const trilho = useRef<HTMLUListElement>(null);
  const esperaRolagem = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centralizarAoAchar = useRef(false);
  const largo = useTelaLarga();

  useEffect(() => {
    let ativo = true;
    listarEventos({ periodo: 'hoje' })
      .then(async (lista) => {
        if (!ativo) return;
        if (lista.length === 0) {
          const todos = await listarEventos().catch(() => []);
          if (ativo) setProximos(todos.slice(0, 6));
        }
        if (ativo) setHoje(lista);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar os eventos de hoje.');
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  const jaEnquadrouVoce = useRef(false);
  useEffect(() => {
    if (!posicao || hoje === null) return;
    if (centralizarAoAchar.current) {
      centralizarAoAchar.current = false;
      jaEnquadrouVoce.current = true;
      controle.current?.centralizarEm(posicao);
      return;
    }
    if (jaEnquadrouVoce.current) return;
    jaEnquadrouVoce.current = true;
    if (selecionadoId || distanciaKm(posicao, CENTRO_POUSO_ALEGRE) > RAIO_DA_CIDADE_KM) return;
    const espera = setTimeout(() => controle.current?.enquadrar(true, posicao), 250);
    return () => clearTimeout(espera);
  }, [posicao, hoje, selecionadoId]);

  const carregado = hoje !== null;
  const nadaHoje = carregado && hoje.length === 0;

  const visiveis = useMemo(() => {
    if (nadaHoje) return proximos;
    const agora = new Date();
    const termo = semAcento(busca.trim());
    return (hoje ?? []).filter((item) => {
      if (!passaNoFiltro(item, filtro, agora)) return false;
      if (!termo) return true;
      return [item.evento.titulo, item.local?.nome, item.categoria?.nome].some((t) => t && semAcento(t).includes(termo));
    });
  }, [hoje, proximos, nadaHoje, filtro, busca]);

  const pinos = useMemo<PinoMapa[]>(() => {
    const grupos = new Map<string, { coordenadas: Coordenadas; itens: EventoCompleto[] }>();
    for (const item of visiveis) {
      const coordenadas = coordenadasDoEvento(item);
      if (!coordenadas) continue;
      const chave = coordenadas.map((n) => n.toFixed(5)).join(',');
      const grupo = grupos.get(chave) ?? { coordenadas, itens: [] };
      grupo.itens.push(item);
      grupos.set(chave, grupo);
    }
    return [...grupos.values()].map(({ coordenadas, itens }) => {
      const escolhido = itens.find((item) => item.evento.id === selecionadoId);
      const principal = escolhido ?? itens[0];
      const quantidade = itens.length;
      const quando = nadaHoje
        ? `${diaSemanaCurto(principal.evento.data_inicio)} ${hora(principal.evento.data_inicio)}`
        : hora(principal.evento.data_inicio);
      return {
        id: principal.evento.id,
        coordenadas,
        titulo:
          quantidade > 1
            ? `${quantidade} rolês em ${principal.local?.nome ?? 'um mesmo lugar'}`
            : `${principal.evento.titulo}, ${nadaHoje ? quando : `hoje às ${quando}`}`,
        rotulo: escolhido ? principal.evento.titulo : quantidade > 1 ? `${quantidade} rolês` : quando,
        cor: corDaCategoria(principal.categoria),
        quantidade,
        agora: !nadaHoje && itens.some((item) => rolandoAgora(item, new Date())),
      };
    });
  }, [visiveis, selecionadoId, nadaHoje]);

  const temAviso = estado === 'procurando' || estado === 'negada' || estado === 'indisponivel';
  const folga = largo ? { topo: 140, base: 300 } : { topo: temAviso ? 190 : 140, base: 290 };

  const filtroEnquadrado = useRef<string | null>(null);
  useEffect(() => {
    const chave = `${filtro}|${busca}`;
    if (filtroEnquadrado.current === null || filtroEnquadrado.current === chave) {
      filtroEnquadrado.current = chave;
      return;
    }
    filtroEnquadrado.current = chave;
    if (!selecionadoId) controle.current?.enquadrar(true);
    trilho.current?.scrollTo({ left: 0 });
  }, [filtro, busca, selecionadoId]);

  useEffect(() => {
    const lista = trilho.current;
    if (!selecionadoId || !lista) return;
    const card = lista.querySelector<HTMLElement>(`[data-id="${CSS.escape(selecionadoId)}"]`);
    if (!card) return;
    const destino = card.offsetLeft - (lista.clientWidth - card.offsetWidth) / 2;
    if (Math.abs(lista.scrollLeft - destino) < 4) return;
    lista.scrollTo({ left: destino, behavior: semMovimento() ? 'auto' : 'smooth' });
  }, [selecionadoId]);

  const selecionadoAtual = useRef(selecionadoId);
  selecionadoAtual.current = selecionadoId;

  function aoRolarTrilho() {
    if (largo) return;
    if (esperaRolagem.current) clearTimeout(esperaRolagem.current);
    esperaRolagem.current = setTimeout(() => {
      const lista = trilho.current;
      if (!lista) return;
      const meio = lista.scrollLeft + lista.clientWidth / 2;
      let maisPerto: HTMLElement | null = null;
      let menorDistancia = Number.POSITIVE_INFINITY;
      for (const card of lista.querySelectorAll<HTMLElement>('[data-id]')) {
        const distancia = Math.abs(card.offsetLeft + card.offsetWidth / 2 - meio);
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          maisPerto = card;
        }
      }
      const id = maisPerto?.dataset.id;
      if (id && id !== selecionadoAtual.current) setSelecionadoId(id);
    }, 140);
  }

  useEffect(
    () => () => {
      if (esperaRolagem.current) clearTimeout(esperaRolagem.current);
    },
    [],
  );

  function selecionar(id: string) {
    setSelecionadoId((atual) => (atual === id ? '' : id));
  }

  function trocarFiltro(novo: Filtro) {
    setFiltro(novo);
    setSelecionadoId('');
  }

  function limparFiltros() {
    setFiltro('hoje');
    setBusca('');
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

  const agora = new Date();
  const quantosAgora = nadaHoje ? 0 : (hoje ?? []).filter((item) => rolandoAgora(item, agora)).length;
  const distanciaDaCidade = posicao ? distanciaKm(posicao, CENTRO_POUSO_ALEGRE) : 0;
  let avisoLocal: string | null = null;
  if (estado === 'procurando') avisoLocal = 'Procurando você no mapa…';
  else if (estado === 'negada')
    avisoLocal = 'Localização bloqueada. Toque no cadeado ao lado do endereço do site, permita a localização e recarregue.';
  else if (estado === 'indisponivel') avisoLocal = 'Não deu para achar sua localização neste aparelho.';
  else if (distanciaDaCidade > RAIO_DA_CIDADE_KM)
    avisoLocal = `Você está a ${formatarDistancia(distanciaDaCidade)} de Pouso Alegre.`;

  let titulo = `${visiveis.length} ${visiveis.length === 1 ? 'rolê hoje' : 'rolês hoje'}`;
  if (nadaHoje) titulo = 'Nada hoje · olha o que vem aí';

  return (
    <main className={styles.tela}>
      <BoasVindas />

      <div className={styles.areaMapa}>
        {carregado && (
          <MapaEventos
            pinos={pinos}
            selecionadoId={selecionadoId}
            usuario={posicao}
            onSelecionar={selecionar}
            controle={controle}
            centro={CENTRO_POUSO_ALEGRE}
            folga={folga}
            visual="hoje"
          />
        )}
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
      </div>

      <div className={styles.cabecalho}>
        <div className={styles.linhaBusca}>
          <label className={styles.busca}>
            <Icone nome="busca" tamanho={18} />
            <span className={styles.somenteLeitor}>Buscar rolê de hoje</span>
            <input
              type="search"
              value={busca}
              disabled={nadaHoje}
              onChange={(e) => {
                setBusca(e.target.value);
                setSelecionadoId('');
              }}
              placeholder="Qual é a boa hoje?"
            />
          </label>
          <button type="button" className={styles.botaoIcone} onClick={localizar} aria-label="Centralizar na minha localização">
            <Icone nome="mira" tamanho={20} />
          </button>
        </div>
        {!nadaHoje && (
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
        )}
        {avisoLocal && (
          <p className={estado === 'procurando' ? styles.avisoLocal : `${styles.avisoLocal} ${styles.avisoLocalAtencao}`} role="status">
            <Icone nome="mira" tamanho={14} />
            {avisoLocal}
          </p>
        )}
      </div>

      {carregado && (
        <section className={styles.barra} aria-label="Rolês no mapa">
          <div className={styles.barraTopo}>
            <h1 className={styles.contador}>
              {titulo}
              {quantosAgora > 0 && (
                <span className={styles.agora}>
                  <span className={styles.pontoAgora} aria-hidden="true" />
                  {quantosAgora} rolando agora
                </span>
              )}
            </h1>
            <Link to="/explorar" className={styles.verTodos}>
              Ver todos
              <Icone nome="seta-direita" tamanho={14} />
            </Link>
          </div>

          {visiveis.length > 0 ? (
            <ul ref={trilho} className={styles.trilho} onScroll={aoRolarTrilho}>
              {visiveis.map((item) => (
                <li
                  key={item.evento.id}
                  data-id={item.evento.id}
                  className={styles.item}
                  onFocus={() => setSelecionadoId(item.evento.id)}
                >
                  <EventoCard
                    item={item}
                    compacto
                    ativo={item.evento.id === selecionadoId}
                    quando={nadaHoje ? undefined : `Hoje · ${hora(item.evento.data_inicio)}`}
                    extras={extrasDoCard(item, posicao, agora)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.semResultado}>
              <p>Nenhum rolê com esse filtro agora.</p>
              <button type="button" className={styles.limpar} onClick={limparFiltros}>
                Limpar filtros
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
