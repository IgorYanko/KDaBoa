import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { EventoCompleto } from '../services/eventos';
import { corDaCategoria } from '../utils/cores';
import { dia, diaEHora, mesCurto } from '../utils/datas';
import styles from './EventoCard.module.css';
import { PilhaAvatares } from './PilhaAvatares';

interface Props {
  item: EventoCompleto;
  /** Para onde o card leva. Padrão: detalhe do evento. */
  para?: string;
}

/** Card de evento da tela Início (frame 3). Reutilizado depois na Agenda e no Mapa. */
export function EventoCard({ item, para }: Props) {
  const { evento, categoria, local } = item;
  const confirmados = evento.total_confirmados ?? 0;
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <Link to={para ?? `/eventos/${evento.id}`} className={styles.card} style={estilo}>
      <div className={styles.faixa}>
        <span className={styles.data}>
          <span className={styles.dia}>{dia(evento.data_inicio)}</span>
          <span className={styles.mes}>{mesCurto(evento.data_inicio)}</span>
        </span>
        {categoria && <span className={styles.etiqueta}>{categoria.nome}</span>}
      </div>
      <div className={styles.corpo}>
        <h3 className={styles.titulo}>{evento.titulo}</h3>
        <p className={styles.quando}>
          {diaEHora(evento.data_inicio)}
          {local && ` · ${local.nome}`}
        </p>
        <div className={styles.quemVai}>
          <PilhaAvatares pessoas={evento.participantes_amostra ?? []} />
          <span className={styles.total}>
            <strong>{confirmados}</strong> {confirmados === 1 ? 'vai' : 'vão'}
          </span>
        </div>
      </div>
    </Link>
  );
}
