import type { InputHTMLAttributes } from 'react';
import iconeBusca from '../assets/icones/busca.svg';
import styles from './CampoBusca.module.css';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Nome lido pelos leitores de tela (o campo não tem rótulo visível). */
  rotulo: string;
}

/** Campo de busca com lupa (tela Início). */
export function CampoBusca({ rotulo, className, ...props }: Props) {
  return (
    <div className={className ? `${styles.caixa} ${className}` : styles.caixa}>
      <img src={iconeBusca} alt="" width={18} height={18} className={styles.lupa} />
      <input type="search" aria-label={rotulo} className={styles.input} {...props} />
    </div>
  );
}
