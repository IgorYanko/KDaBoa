import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { EventoCompleto } from '../services/eventos';
import { corDaCategoria, iconeDaCategoria } from '../utils/cores';
import { dia, diaEHora, mesCurto } from '../utils/datas';
import styles from './EventoCard.module.css';
import { Icone, type NomeIcone } from './Icone';
import { PilhaAvatares } from './PilhaAvatares';

interface Props {
  item: EventoCompleto;
  /** Para onde o card leva. Padrão: detalhe do evento. */
  para?: string;
  compacto?: boolean;
  ativo?: boolean;
  quando?: string;
  extras?: { icone: NomeIcone; texto: string; destaque?: boolean }[];
}

/**
 * Card de evento (Início; depois Agenda e Mapa).
 * O card inteiro é clicável pelo link do título, que se estende sobre ele.
 */
export function EventoCard({ item, para, compacto = false, ativo = false, quando, extras = [] }: Props) {
  const { evento, categoria, local } = item;
  const confirmados = evento.total_confirmados ?? 0;
  const icone = iconeDaCategoria(categoria);
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <article
      className={[styles.card, compacto && styles.compacto, ativo && styles.ativo].filter(Boolean).join(' ')}
      style={estilo}
    >
      <div className={styles.capa}>
        {evento.capa_url ? (
          <img className={styles.imagem} src={evento.capa_url} alt="" loading="lazy" />
        ) : (
          <span className={styles.marcaDagua} aria-hidden="true">
            <Icone nome={icone} tamanho={132} traco={1.1} />
          </span>
        )}
        <span className={styles.data}>
          <span className={styles.dia}>{dia(evento.data_inicio)}</span>
          <span className={styles.mes}>{mesCurto(evento.data_inicio)}</span>
        </span>
        {categoria && (
          <span className={styles.etiqueta}>
            <span className={styles.etiquetaIcone}>
              <Icone nome={icone} tamanho={14} />
            </span>
            {categoria.nome}
          </span>
        )}
      </div>

      <div className={styles.corpo}>
        <h3 className={styles.titulo}>
          <Link to={para ?? `/eventos/${evento.id}`} className={styles.link}>
            {evento.titulo}
          </Link>
        </h3>
        <ul className={styles.meta}>
          <li>
            <Icone nome="relogio" tamanho={15} />
            {quando ?? diaEHora(evento.data_inicio)}
          </li>
          {local && (
            <li>
              <Icone nome="local" tamanho={15} />
              <span className={styles.metaTexto}>{local.nome}</span>
            </li>
          )}
          {extras.map((extra) => (
            <li key={extra.texto} className={extra.destaque ? styles.metaDestaque : undefined}>
              <Icone nome={extra.icone} tamanho={15} />
              <span className={styles.metaTexto}>{extra.texto}</span>
            </li>
          ))}
        </ul>
        <div className={styles.rodape}>
          <span className={styles.quemVai}>
            <PilhaAvatares pessoas={evento.participantes_amostra ?? []} />
            <span className={styles.total}>
              <strong>{confirmados}</strong> {confirmados === 1 ? 'vai' : 'vão'}
            </span>
          </span>
          <span className={styles.ver} aria-hidden="true">
            Ver detalhes
            <Icone nome="seta-direita" tamanho={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
