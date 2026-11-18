import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ErroApi } from '../../api/client';
import { Aviso } from '../../components/Aviso';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Icone } from '../../components/Icone';
import { type ControleMapa, MapaEventos, type PinoMapa } from '../../components/MapaEventos';
import { buscarEvento, type EventoCompleto, listarEventos } from '../../services/eventos';
import { corDaCategoria } from '../../utils/cores';
import { dataLonga } from '../../utils/datas';
import { coordenadasDoEvento, distanciaKm } from '../../utils/geo';
import { CartaoMapa } from './CartaoMapa';
import styles from './Mapa.module.css';
import { type EstadoLocalizacao, useLocalizacao } from './useLocalizacao';

const TEXTO_LOCALIZACAO: Record<Exclude<EstadoLocalizacao, 'parada'>, string> = {
  procurando: 'Procurando você…',
  ativa: 'Sua localização ao vivo',
  negada: 'Localização bloqueada',
  indisponivel: 'Localização indisponível',
};

/**
 * Tela 3.1 · Mapa do evento (issue #24): o local do evento em destaque, a posição ao vivo
 * da pessoa (com permissão) e os outros eventos por perto. Tocar em outro evento mostra ele no cartão.
 */
export function Mapa() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const local = useLocation();
  const [atual, setAtual] = useState<EventoCompleto | null>(null);
  const [outros, setOutros] = useState<EventoCompleto[]>([]);
  const [selecionadoId, setSelecionadoId] = useState(id);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { estado, posicao, iniciar } = useLocalizacao();
  const controle = useRef<ControleMapa>(null);
  const centralizarAoAchar = useRef(false);

  useEffect(() => {
    let ativo = true;
    setSelecionadoId(id);
    Promise.all([buscarEvento(id), listarEventos().catch(() => [])])
      .then(([evento, lista]) => {
        if (!ativo) return;
        setAtual(evento);
        setOutros(lista.filter((item) => item.evento.id !== id));
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar o mapa.');
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  // Quando a pessoa pediu a localização, leva o mapa até ela assim que o GPS responder.
  useEffect(() => {
    if (posicao && centralizarAoAchar.current) {
      centralizarAoAchar.current = false;
      controle.current?.centralizarEm(posicao);
    }
  }, [posicao]);

  const itens = useMemo(() => (atual ? [atual, ...outros] : []), [atual, outros]);
  const pinos = useMemo<PinoMapa[]>(
    () =>
      itens.flatMap((item) => {
        const coordenadas = coordenadasDoEvento(item);
        if (!coordenadas) return [];
        const { evento } = item;
        const destaque = evento.id === selecionadoId;
        return [
          {
            id: evento.id,
            coordenadas,
            titulo: `${evento.titulo}, ${dataLonga(evento.data_inicio)}`,
            rotulo: destaque ? (item.local?.nome ?? evento.titulo) : String(new Date(evento.data_inicio).getDate()),
            cor: corDaCategoria(item.categoria),
          },
        ];
      }),
    [itens, selecionadoId],
  );

  const selecionado = itens.find((item) => item.evento.id === selecionadoId) ?? atual;
  const coordenadasSelecionado = selecionado ? coordenadasDoEvento(selecionado) : null;
  const distancia = posicao && coordenadasSelecionado ? distanciaKm(posicao, coordenadasSelecionado) : null;
  const temMapa = Boolean(atual && coordenadasDoEvento(atual));
  // No desktop o cartão fica ao lado, sem cobrir a parte de baixo do mapa.
  const largo = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  function voltar() {
    if (local.key === 'default') navegar(`/eventos/${id}`);
    else navegar(-1);
  }

  function localizar() {
    if (estado === 'ativa' && posicao) {
      controle.current?.centralizarEm(posicao);
      return;
    }
    centralizarAoAchar.current = true;
    iniciar();
  }

  async function compartilhar() {
    if (!selecionado) return;
    const url = `${window.location.origin}/eventos/${selecionado.evento.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selecionado.evento.titulo, url });
      } else {
        await navigator.clipboard.writeText(url);
        setAviso('Link copiado!');
        setTimeout(() => setAviso(null), 2500);
      }
    } catch {
      // A pessoa cancelou o compartilhamento: nada a fazer.
    }
  }

  return (
    <main className={styles.tela}>
      {temMapa && (
        <MapaEventos
          pinos={pinos}
          selecionadoId={selecionadoId}
          usuario={posicao}
          onSelecionar={setSelecionadoId}
          controle={controle}
          folga={{ topo: 96, base: largo ? 48 : 340 }}
        />
      )}

      <div className={styles.topo}>
        <BotaoIcone icone="voltar" rotulo="Voltar" variante="vidro" onClick={voltar} />
        {temMapa &&
          (estado === 'parada' ? (
            <button type="button" className={styles.pilula} onClick={localizar} aria-label="Mostrar minha localização">
              <Icone nome="mira" tamanho={16} />
              <span className={styles.pilulaTexto}>Minha localização</span>
            </button>
          ) : (
            <p className={styles.pilula} role="status">
              <span className={estado === 'ativa' ? `${styles.sinal} ${styles.sinalAtivo}` : styles.sinal} />
              <span className={styles.pilulaTexto}>{TEXTO_LOCALIZACAO[estado]}</span>
            </p>
          ))}
        {temMapa && <BotaoIcone icone="mira" rotulo="Centralizar na minha localização" variante="vidro" onClick={localizar} />}
      </div>

      {aviso && (
        <p className={styles.toast} role="status">
          {aviso}
        </p>
      )}

      {erro && (
        <div className={styles.centro}>
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}

      {!atual && !erro && (
        <p className={styles.centro} role="status">
          Carregando mapa…
        </p>
      )}

      {atual && !temMapa && (
        <div className={styles.centro}>
          <div className={styles.semMapa}>
            <span className={styles.semMapaIcone}>
              <Icone nome="mapa" tamanho={22} />
            </span>
            <p className={styles.semMapaTitulo}>Este evento ainda não está no mapa</p>
            {atual.local && <p className={styles.semMapaTexto}>{atual.local.endereco}</p>}
            {atual.local && (
              <a
                className={styles.semMapaLink}
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${atual.local.endereco}, Pouso Alegre`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Procurar o endereço no OpenStreetMap
                <Icone nome="link" tamanho={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {selecionado && (
        <CartaoMapa
          item={selecionado}
          distancia={distancia}
          onCompartilhar={compartilhar}
          onVerPorPerto={pinos.length > 1 ? () => controle.current?.mostrarTudo() : undefined}
        />
      )}
    </main>
  );
}
