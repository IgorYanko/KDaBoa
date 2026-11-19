import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import type { EventoDTO, Uuid } from '../dtos';
import type { EventoCompleto } from '../services/eventos';
import { corDaCategoria } from '../utils/cores';
import { dia, diaEHora, mesCurto } from '../utils/datas';
import styles from './EventoLinha.module.css';
import { Icone } from './Icone';

interface Props {
  item: EventoCompleto;
  /** Evento que já aconteceu: aparência apagada e texto no passado. */
  passado?: boolean;
}

/** "Ana e mais 22 vão", "Bruno também vai", "Você e mais 63 foram"... */
function textoQuemVai(evento: EventoDTO, passado: boolean, meuId?: Uuid): string {
  const outros = Math.max(0, (evento.total_confirmados ?? 0) - (evento.eu_vou ? 1 : 0));
  if (passado) {
    if (outros === 0) return 'Só você foi';
    return `Você e mais ${outros} ${outros === 1 ? 'pessoa foram' : 'pessoas foram'}`;
  }
  if (outros === 0) return 'Ninguém mais confirmou ainda';
  const primeiro = evento.participantes_amostra?.find((p) => p.id !== meuId)?.nome.split(' ')[0];
  if (!primeiro) return `${outros} ${outros === 1 ? 'pessoa também vai' : 'pessoas também vão'}`;
  if (outros === 1) return `${primeiro} também vai`;
  return `${primeiro} e mais ${outros - 1} vão`;
}

/**
 * Evento em uma linha compacta (Agenda). A linha inteira é clicável pelo link do título,
 * que se estende sobre ela, e leva ao detalhe.
 */
export function EventoLinha({ item, passado = false }: Props) {
  const { usuario } = useAuth();
  const { evento, categoria, local } = item;
  const estilo = { '--cor-evento': corDaCategoria(categoria) } as CSSProperties;

  return (
    <article className={passado ? `${styles.linha} ${styles.passado}` : styles.linha} style={estilo}>
      <time className={styles.data} dateTime={evento.data_inicio}>
        <span className={styles.dia}>{dia(evento.data_inicio)}</span>
        <span className={styles.mes}>{mesCurto(evento.data_inicio)}</span>
      </time>

      <div className={styles.corpo}>
        <h3 className={styles.titulo}>
          <Link to={`/eventos/${evento.id}`} className={styles.link}>
            {evento.titulo}
          </Link>
        </h3>
        <p className={styles.meta}>
          {diaEHora(evento.data_inicio)}
          {local && ` · ${local.nome}`}
        </p>
        <p className={styles.quemVai}>{textoQuemVai(evento, passado, usuario?.id)}</p>
      </div>

      <Icone nome="seta-direita" tamanho={18} className={styles.seta} />
    </article>
  );
}
