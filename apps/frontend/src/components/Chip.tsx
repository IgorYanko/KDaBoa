import type { CSSProperties } from 'react';
import { estiloPeloNome } from '../utils/cores';
import styles from './Chip.module.css';
import { Icone, type NomeIcone } from './Icone';

interface Props {
  rotulo: string;
  selecionado: boolean;
  onAlternar: () => void;
  /** Cor de acento. Padrão: a cor da categoria com esse nome, ou o ultravioleta. */
  cor?: string;
  /** Ícone antes do texto. Padrão: o ícone da categoria com esse nome (se houver). */
  icone?: NomeIcone;
}

/**
 * Opção em formato de pílula que liga/desliga (ex.: interesses, filtros).
 * Quando o rótulo é o nome de uma categoria, já vem com o ícone e a cor dela.
 * Selecionado: fundo tingido com a cor e o ícone vira um "check".
 */
export function Chip({ rotulo, selecionado, onAlternar, cor, icone }: Props) {
  const daCategoria = estiloPeloNome(rotulo);
  const corFinal = cor ?? daCategoria?.cor ?? 'var(--cor-secundaria)';
  const iconeFinal = icone ?? daCategoria?.icone;
  const estilo = { '--cor-chip': corFinal } as CSSProperties;

  return (
    <button
      type="button"
      className={selecionado ? `${styles.chip} ${styles.selecionado}` : styles.chip}
      style={estilo}
      aria-pressed={selecionado}
      onClick={onAlternar}
    >
      {(iconeFinal || selecionado) && (
        <span className={styles.icone}>
          <Icone nome={selecionado ? 'check' : (iconeFinal ?? 'check')} tamanho={16} traco={selecionado ? 2.25 : 1.75} />
        </span>
      )}
      {rotulo}
    </button>
  );
}
