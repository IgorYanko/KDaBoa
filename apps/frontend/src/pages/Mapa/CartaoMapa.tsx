import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { classesBotao } from '../../components/Botao';
import { BotaoIcone } from '../../components/BotaoIcone';
import { Icone } from '../../components/Icone';
import type { EventoCompleto } from '../../services/eventos';
import { corDaCategoria } from '../../utils/cores';
import { dia, diaEHora, mesCurto } from '../../utils/datas';
import { formatarDistancia, tempoAPe } from '../../utils/geo';
import styles from './Mapa.module.css';

interface Props {
  item: EventoCompleto;
  /** Distância até a pessoa, em km; null sem a posição dela. */
  distancia: number | null;
  onCompartilhar: () => void;
  /** Some quando não há outros eventos no mapa. */
  onVerPorPerto?: () => void;
}

/** Cartão de baixo do mapa: o evento escolhido, distância, tempo a pé e quem vai. */
export function CartaoMapa({ item, distancia, onCompartilhar, onVerPorPerto }: Props) {
  const { evento, categoria, local } = item;
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;
  const confirmados = evento.total_confirmados ?? 0;

  return (
    <section className={styles.cartao} style={estilo} aria-label={`Evento selecionado: ${evento.titulo}`}>
      <div className={styles.evento}>
        <time className={styles.data} dateTime={evento.data_inicio}>
          <span className={styles.dia}>{dia(evento.data_inicio)}</span>
          <span className={styles.mes}>{mesCurto(evento.data_inicio)}</span>
        </time>
        <div className={styles.textos}>
          {categoria && <p className={styles.categoria}>{categoria.nome}</p>}
          <h2 className={styles.titulo}>{evento.titulo}</h2>
          <p className={styles.meta}>
            {diaEHora(evento.data_inicio)}
            {local && ` · ${local.nome}`}
          </p>
        </div>
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
          Ver detalhes
        </Link>
        <BotaoIcone icone="compartilhar" rotulo="Compartilhar evento" variante="fantasma" onClick={onCompartilhar} />
      </div>

      {onVerPorPerto && (
        <button type="button" className={styles.porPerto} onClick={onVerPorPerto}>
          Ver o que tem por perto
          <Icone nome="mapa" tamanho={16} />
        </button>
      )}
    </section>
  );
}
