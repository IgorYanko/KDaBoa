import { useId } from 'react';
import { Icone } from './Icone';
import styles from './Interruptor.module.css';

interface Props {
  titulo: string;
  descricao?: string;
  ligado: boolean;
  onAlternar: (ligado: boolean) => void;
}

/**
 * Cartão com título, descrição e um switch (ex.: "Mostrar minha presença").
 * O cartão inteiro é o botão, para facilitar o toque.
 */
export function Interruptor({ titulo, descricao, ligado, onAlternar }: Props) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-labelledby={`${id}-titulo`}
      aria-describedby={descricao ? `${id}-descricao` : undefined}
      className={ligado ? `${styles.cartao} ${styles.ligado}` : styles.cartao}
      onClick={() => onAlternar(!ligado)}
    >
      <span className={styles.textos}>
        <span id={`${id}-titulo`} className={styles.titulo}>
          {titulo}
        </span>
        {descricao && (
          <span id={`${id}-descricao`} className={styles.descricao}>
            {descricao}
          </span>
        )}
      </span>
      <span className={styles.trilho} aria-hidden="true">
        <span className={styles.bolinha}>
          <Icone nome="check" tamanho={12} traco={3} className={styles.check} />
        </span>
      </span>
    </button>
  );
}
