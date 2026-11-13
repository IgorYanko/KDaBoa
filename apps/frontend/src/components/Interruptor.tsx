import { useId } from 'react';
import styles from './Interruptor.module.css';

interface Props {
  titulo: string;
  descricao?: string;
  ligado: boolean;
  onAlternar: (ligado: boolean) => void;
}

/** Cartão com título, descrição e um switch (ex.: "Mostrar minha presença"). */
export function Interruptor({ titulo, descricao, ligado, onAlternar }: Props) {
  const id = useId();
  return (
    <div className={styles.cartao}>
      <div className={styles.textos}>
        <span id={`${id}-titulo`} className={styles.titulo}>
          {titulo}
        </span>
        {descricao && (
          <span id={`${id}-descricao`} className={styles.descricao}>
            {descricao}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={descricao ? `${id}-descricao` : undefined}
        className={ligado ? `${styles.switch} ${styles.ligado}` : styles.switch}
        onClick={() => onAlternar(!ligado)}
      >
        <span className={styles.bolinha} />
      </button>
    </div>
  );
}
