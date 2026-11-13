import type { CSSProperties } from 'react';
import styles from './IconeMascara.module.css';

interface Props {
  /** URL do SVG (import de src/assets). */
  src: string;
  /** Tamanho em px (o mesmo do SVG no Figma). */
  tamanho: number;
}

/**
 * Mostra um ícone SVG pintado com a cor do texto (currentColor).
 * Serve para ícones que mudam de cor conforme o estado, como os da barra inferior.
 */
export function IconeMascara({ src, tamanho }: Props) {
  const estilo = {
    '--icone-url': `url("${src}")`,
    width: tamanho,
    height: tamanho,
  } as CSSProperties;
  return <span className={styles.icone} style={estilo} aria-hidden="true" />;
}
