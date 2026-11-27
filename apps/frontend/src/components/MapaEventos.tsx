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
}

const ZOOM_INICIAL = 16;

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const GOTA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6-7-11.3a7 7 0 0 1 14 0C19 15 12 21 12 21z"/><circle cx="12" cy="9.7" r="2.5"/></svg>`;

function iconeDoPino(pino: PinoMapa, destaque: boolean): L.DivIcon {
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
export function MapaEventos({ pinos, selecionadoId, usuario, onSelecionar, controle, folga = { topo: 80, base: 80 } }: Props) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadaPinos = useRef<L.LayerGroup | null>(null);
  const marcadorUsuario = useRef<L.Marker | null>(null);
  // Sempre a versão mais nova do callback, sem recriar os pinos a cada render.
  const aoSelecionar = useRef(onSelecionar);
  aoSelecionar.current = onSelecionar;

  const inicial = pinos.find((p) => p.id === selecionadoId)?.coordenadas ?? pinos[0]?.coordenadas;

  // Cria o mapa uma vez.
  // biome-ignore lint/correctness/useExhaustiveDependencies: o centro inicial só importa na criação.
  useEffect(() => {
    if (!elemento.current || !inicial) return;
    // Crédito do OpenStreetMap no alto: embaixo o cartão do evento cobriria.
    const novo = L.map(elemento.current, { zoomControl: false, attributionControl: false }).setView(inicial, ZOOM_INICIAL);
    L.control.attribution({ position: 'topright', prefix: false }).addTo(novo);
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
    };
  }, []);

  // Pinos (refeitos quando a lista ou o destaque mudam).
  useEffect(() => {
    const camada = camadaPinos.current;
    if (!camada) return;
    camada.clearLayers();
    for (const pino of pinos) {
      const destaque = pino.id === selecionadoId;
      L.marker(pino.coordenadas, {
        icon: iconeDoPino(pino, destaque),
        title: pino.titulo,
        alt: pino.titulo,
        keyboard: true,
        zIndexOffset: destaque ? 1000 : 0,
      })
        .on('click', () => aoSelecionar.current(pino.id))
        .addTo(camada);
    }
  }, [pinos, selecionadoId]);

  // Leva o mapa até o pino escolhido.
  // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o destaque muda (os pinos não mudam com a tela aberta).
  useEffect(() => {
    const alvo = pinos.find((p) => p.id === selecionadoId);
    if (alvo && mapa.current) mapa.current.flyTo(alvo.coordenadas, Math.max(mapa.current.getZoom(), 15), { duration: 0.6 });
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
    marcadorUsuario.current = L.marker(usuario, {
      icon: L.divIcon({ className: styles.marcador, html: `<span class="${styles.usuario}"></span>`, iconSize: [0, 0] }),
      title: 'Você está aqui',
      alt: 'Você está aqui',
      keyboard: false,
      zIndexOffset: 500,
    }).addTo(mapa.current);
  }, [usuario]);

  useImperativeHandle(
    controle,
    () => ({
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

  return <div ref={elemento} className={styles.mapa} />;
}
