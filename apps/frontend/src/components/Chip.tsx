import styles from './Chip.module.css';

interface Props {
  rotulo: string;
  selecionado: boolean;
  onAlternar: () => void;
}

/** Opção em formato de pílula que liga/desliga (ex.: interesses, filtros). */
export function Chip({ rotulo, selecionado, onAlternar }: Props) {
  return (
    <button
      type="button"
      className={selecionado ? `${styles.chip} ${styles.selecionado}` : styles.chip}
      aria-pressed={selecionado}
      onClick={onAlternar}
    >
      {rotulo}
    </button>
  );
}
