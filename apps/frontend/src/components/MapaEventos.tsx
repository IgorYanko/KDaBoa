import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import type { Coordenadas } from '../utils/geo';
import styles from './MapaEventos.module.css';

/** Um evento no mapa. */
export interface PinoMapa {
  id: string;
  coordenadas: Coordenadas;
  /** Nome lido pelos leitores de tela e mostrado ao passar o mouse. */
  titulo: string;
  /** Texto no pino: nome do local (destaque) ou o dia (demais). */
  rotulo: string;
  /** Cor da categoria (variável CSS). */
  cor: string;
  /** Quantos eventos este pino junta (mesmo lugar). */
  quantidade?: number;
  agora?: boolean;
}

/** Ações que a tela pode pedir ao mapa. */
export interface ControleMapa {
  centralizarEm: (coordenadas: Coordenadas) => void;
  /** Enquadra todos os pinos (e a pessoa, se a posição for conhecida). */
  mostrarTudo: () => void;
}

interface Props {
  pinos: PinoMapa[];
  /** Pino em destaque (o evento aberto ou o que a pessoa tocou). */
  selecionadoId: string;
  /** Posição ao vivo da pessoa; null sem permissão. */
  usuario: Coordenadas | null;
  onSelecionar: (id: string) => void;
  controle?: Ref<ControleMapa>;
  /** Espaço coberto por cima do mapa (botões no topo, cartão embaixo), para enquadrar sem esconder pinos. */
  folga?: { topo: number; base: number };
  /** Onde o mapa abre quando ainda não há pinos (ex.: nenhum evento hoje). */
  centro?: Coordenadas;
  /** hoje = mapa apagado, alfinetes na cor da categoria, abre enquadrado e sem voo. */
  visual?: 'padrao' | 'hoje';
}

export interface ControleMapaHoje extends ControleMapa {
  enquadrar: (animar: boolean, extra?: Coordenadas) => void;
}

const ZOOM_INICIAL = 16;

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const GOTA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6-7-11.3a7 7 0 0 1 14 0C19 15 12 21 12 21z"/><circle cx="12" cy="9.7" r="2.5"/></svg>`;

const ALFINETE = `<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M17 1.5C8.4 1.5 1.5 8.3 1.5 16.7 1.5 28 17 40.5 17 40.5S32.5 28 32.5 16.7C32.5 8.3 25.6 1.5 17 1.5z" fill="var(--cor-pino)" stroke="#0d0c12" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#0d0c12"/><circle cx="17" cy="16.5" r="2.6" fill="var(--cor-pino)"/></svg>`;

function iconeAlfinete(pino: PinoMapa, destaque: boolean, atraso: number | null): L.DivIcon {
  const classes = [styles.alfinete];
  if (destaque) classes.push(styles.alfineteDestaque);
  if (pino.agora) classes.push(styles.alfineteAgora);
  if (atraso !== null) classes.push(styles.alfineteCaindo);
  const classe = classes.join(' ');
  const estilo = `--cor-pino:${pino.cor}${atraso !== null ? `;--atraso:${atraso}ms` : ''}`;
  const selo = pino.quantidade && pino.quantidade > 1 ? `<span class="${styles.selo}">${pino.quantidade}</span>` : '';
  return L.divIcon({
    className: styles.marcador,
    html: `<span class="${classe}" style="${estilo}"><span class="${styles.rotuloAlfinete}">${escapar(pino.rotulo)}</span><span class="${styles.corpoAlfinete}">${ALFINETE}${selo}</span></span>`,
    iconSize: [0, 0],
  });
}

function iconeDoPino(pino: PinoMapa, destaque: boolean, visual: 'padrao' | 'hoje', atraso: number | null): L.DivIcon {
  if (visual === 'hoje') return iconeAlfinete(pino, destaque, atraso);
  const estilo = `--cor-pino:${pino.cor}`;
  if (destaque) {
    return L.divIcon({
      className: styles.marcador,
      html: `<span class="${styles.destaque}" style="${estilo}"><span class="${styles.etiqueta}">${escapar(pino.rotulo)}</span><span class="${styles.gota}">${GOTA}</span></span>`,
      iconSize: [0, 0],
    });
  }
  return L.divIcon({
    className: styles.marcador,
    html: `<span class="${styles.ponto}" style="${estilo}">${escapar(pino.rotulo)}</span>`,
    iconSize: [0, 0],
  });
}

/**
 * Mapa do Leaflet com OpenStreetMap (issue #24): eventos como pinos, um deles em destaque,
 * e a posição da pessoa como um ponto azul. Os pinos são focáveis pelo teclado (Enter seleciona).
 */
export function MapaEventos({
  pinos,
  selecionadoId,
  usuario,
  onSelecionar,
  controle,
  folga = { topo: 80, base: 80 },
  centro,
  visual = 'padrao',
}: Props) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadaPinos = useRef<L.LayerGroup | null>(null);
  const marcadorUsuario = useRef<L.Marker | null>(null);
  const pinosJaMostrados = useRef(new Set<string>());
  // Sempre a versão mais nova do callback, sem recriar os pinos a cada render.
  const aoSelecionar = useRef(onSelecionar);
  aoSelecionar.current = onSelecionar;

  const inicial = pinos.find((p) => p.id === selecionadoId)?.coordenadas ?? pinos[0]?.coordenadas ?? centro;

  // Cria o mapa uma vez.
  // biome-ignore lint/correctness/useExhaustiveDependencies: o centro inicial só importa na criação.
  useEffect(() => {
    if (!elemento.current || !inicial) return;
    // Crédito do OpenStreetMap no alto: embaixo o cartão do evento cobriria.
    const novo = L.map(elemento.current, { zoomControl: false, attributionControl: false });
    if (visual === 'hoje' && pinos.length > 1) {
      novo.fitBounds(L.latLngBounds(pinos.map((p) => p.coordenadas)), {
        paddingTopLeft: [48, folga.topo],
        paddingBottomRight: [48, folga.base],
        maxZoom: 16,
        animate: false,
      });
    } else if (visual === 'hoje') {
      novo.setView(inicial, pinos.length === 1 ? 15 : 14, { animate: false });
    } else {
      novo.setView(inicial, ZOOM_INICIAL);
    }
    L.control.attribution({ position: visual === 'hoje' ? 'bottomright' : 'topright', prefix: false }).addTo(novo);
    if (visual === 'hoje') L.control.zoom({ position: 'topright', zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(novo);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(novo);
    camadaPinos.current = L.layerGroup().addTo(novo);
    mapa.current = novo;
    return () => {
      novo.remove();
      mapa.current = null;
      camadaPinos.current = null;
      // O ponto da pessoa pertencia a este mapa: o próximo cria o dele.
      marcadorUsuario.current = null;
      pinosJaMostrados.current = new Set();
    };
  }, []);

  // Pinos (refeitos quando a lista ou o destaque mudam).
  useEffect(() => {
    const camada = camadaPinos.current;
    if (!camada) return;
    camada.clearLayers();
    let novos = 0;
    for (const pino of pinos) {
      const destaque = pino.id === selecionadoId;
      const chave = pino.coordenadas.join(',');
      const atraso = pinosJaMostrados.current.has(chave) ? null : Math.min(novos++ * 70, 700);
      pinosJaMostrados.current.add(chave);
      L.marker(pino.coordenadas, {
        icon: iconeDoPino(pino, destaque, visual, atraso),
        title: pino.titulo,
        alt: pino.titulo,
        keyboard: true,
        zIndexOffset: destaque ? 1000 : 0,
      })
        .on('click', () => aoSelecionar.current(pino.id))
        .addTo(camada);
    }
  }, [pinos, selecionadoId, visual]);

  // Leva o mapa até o pino escolhido.
  // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o destaque muda (os pinos não mudam com a tela aberta).
  useEffect(() => {
    const alvo = pinos.find((p) => p.id === selecionadoId);
    const atual = mapa.current;
    if (!alvo || !atual) return;
    if (visual === 'hoje') {
      const zoom = Math.max(atual.getZoom(), 15);
      const ponto = atual.project(alvo.coordenadas, zoom).add([0, (folga.base - folga.topo) / 2]);
      atual.setView(atual.unproject(ponto, zoom), zoom, { animate: true, duration: 0.35 });
      return;
    }
    atual.flyTo(alvo.coordenadas, Math.max(atual.getZoom(), 15), { duration: 0.6 });
  }, [selecionadoId]);

  // Ponto azul da pessoa.
  useEffect(() => {
    if (!mapa.current) return;
    if (!usuario) {
      marcadorUsuario.current?.remove();
      marcadorUsuario.current = null;
      return;
    }
    if (marcadorUsuario.current) {
      marcadorUsuario.current.setLatLng(usuario);
      return;
    }
    const htmlUsuario =
      visual === 'hoje'
        ? `<span class="${styles.voce}"><span class="${styles.voceOnda}"></span><span class="${styles.voceOnda} ${styles.voceOndaAtrasada}"></span><span class="${styles.vocePonto}"></span><span class="${styles.voceRotulo}">Você</span></span>`
        : `<span class="${styles.usuario}"></span>`;
    marcadorUsuario.current = L.marker(usuario, {
      icon: L.divIcon({ className: styles.marcador, html: htmlUsuario, iconSize: [0, 0] }),
      title: 'Você está aqui',
      alt: 'Você está aqui',
      keyboard: false,
      zIndexOffset: 2000,
    }).addTo(mapa.current);
  }, [usuario, visual]);

  useImperativeHandle(
    controle,
    () => ({
      enquadrar(animar: boolean, extra?: Coordenadas) {
        const atual = mapa.current;
        const pontos = [...pinos.map((p) => p.coordenadas), ...(extra ? [extra] : [])];
        if (!atual || pontos.length === 0) return;
        if (pontos.length === 1) {
          atual.setView(pontos[0], Math.max(atual.getZoom(), 15), { animate: animar });
          return;
        }
        atual.fitBounds(L.latLngBounds(pontos), {
          paddingTopLeft: [48, folga.topo],
          paddingBottomRight: [48, folga.base],
          maxZoom: 16,
          animate: animar,
          duration: 0.35,
        });
      },
      centralizarEm(coordenadas) {
        mapa.current?.flyTo(coordenadas, Math.max(mapa.current.getZoom(), 16), { duration: 0.6 });
      },
      mostrarTudo() {
        const pontos = [...pinos.map((p) => p.coordenadas), ...(usuario ? [usuario] : [])];
        if (!mapa.current || pontos.length === 0) return;
        mapa.current.flyToBounds(L.latLngBounds(pontos), {
          paddingTopLeft: [32, folga.topo],
          paddingBottomRight: [32, folga.base],
          maxZoom: 16,
          duration: 0.6,
        });
      },
    }),
    [pinos, usuario, folga.topo, folga.base],
  );

  return <div ref={elemento} className={visual === 'hoje' ? `${styles.mapa} ${styles.mapaSuave}` : styles.mapa} />;
}
